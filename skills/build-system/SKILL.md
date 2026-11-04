---
name: build-system
description: >-
  Use when adding a new widget or plugin JS entry point, debugging why a
  bundle is not picked up, understanding how CSS reaches the browser, or
  figuring out what runs differently in dev vs. production. Covers the
  esbuild pipeline, Sprockets CSS pipeline, dev watch mode, production
  asset precompile, and the Vitest test setup.
---

# Build System

Elektra uses **two parallel asset pipelines** that feed into Sprockets:

| Pipeline | Tool | Output | What it covers |
|----------|------|--------|----------------|
| JavaScript | esbuild (via `jsbundling-rails`) | `app/assets/builds/*.js` | All JS/TS/JSX/TSX + inlined SCSS |
| CSS | Sprockets (with SCSS ERB) | `public/assets/application-<digest>.css` | Bootstrap, Font Awesome, plugin SCSS |

---

## JavaScript pipeline (esbuild)

### Entry point discovery

`config/esbuild/build.js` uses `config/esbuild/entrypoints.js` to glob three
patterns and derive output filenames by joining path tokens with `_`:

| Glob | Output name | Example |
|------|-------------|---------|
| `app/javascript/*.{js,jsx,ts,tsx}` | `<stem>.js` | `application.js` → `application.js` |
| `plugins/*/app/javascript/plugin.{js,jsx,ts,tsx}` | `<plugin>_plugin.js` | `compute/…/plugin.js` → `compute_plugin.js` |
| `plugins/*/app/javascript/widgets/*/init.{js,jsx,ts,tsx}` | `<plugin>_<widget>_widget.js` | `kubernetes_ng/…/widgets/app/init.js` → `kubernetes_ng_app_widget.js` |

All bundles land in `app/assets/builds/`. Sprockets picks them up via the
manifest (`app/assets/config/manifest.js`: `//= link_tree ../builds`).

### Path aliases

Defined in `config/esbuild/build.js` via `paths_resolver_plugin` and mirrored
in `vitest.config.ts` and `tsconfig.json`:

| Import alias | Resolves to |
|-------------|-------------|
| `lib/...` | `app/javascript/lib/` |
| `core/...` | `app/javascript/core/` |
| `plugins/...` | `plugins/` |
| `config/...` | `config/` |

### esbuild plugins

| Plugin | File | Purpose |
|--------|------|---------|
| `pathsResolverPlugin` | `config/esbuild/paths_resolver_plugin.js` | Resolves `lib/`, `core/`, `plugins/`, `config/` aliases |
| `globImportPlugin` | `config/esbuild/glob_import_plugin.js` | Enables `import "**/*.js"` glob patterns (used in `plugins.js`) |
| `envFilePlugin` | `config/esbuild/esbuild-plugin-env.js` | Makes `import "env"` return `process.env` merged with `.env` file |
| `svg-loader` | inline in `build.js` | `.svg` files → React component (jsx) or data URL (`?url` suffix) |
| `inline-styles` | inline in `build.js` | `.scss` / `.css` → Sass compile + PostCSS (Tailwind, autoprefixer, url-inline). Returns string when imported with `?inline`, copies file otherwise |
| Per-plugin configs | `plugins/*/esbuild.plugin.js` | Collected by `collectPluginConfigsSync()` at startup; currently only `kubernetes_ng` and `smartops` add the TanStack Router code-generation plugin |

### CSS import modes

SCSS/CSS files have two import modes controlled by the query suffix:

```ts
import styles from "./styles.scss?inline"  // → string (for <style>{styles}</style> in shadow root)
import "./styles.scss"                      // → file copy to builds/ (global stylesheet)
```

The `?inline` pattern is used by all Juno-based widgets to inject scoped
styles into their component tree without polluting the global page CSS.

### Tailwind CSS

`tailwind.config.js` uses the Juno UI component library's Tailwind preset as a
base and adds Elektra-specific content paths:

```js
module.exports = {
  presets: [uiComponentsConfig],   // Juno's Tailwind config
  prefix: "tw-",                   // all Tailwind classes need the tw- prefix
  content: [
    "./plugins/**/*.{js,jsx,ts,tsx,html,haml}",
    "./app/javascript/**/*.{js,jsx,ts,tsx,haml}",
    "./app/views/**/*.{haml,html}",
  ],
  corePlugins: { preflight: false }, // don't override Bootstrap's base reset
}
```

`app/javascript/tailwind.scss` imports Tailwind's layers and is included via
`essentials.js` as an `?inline` import injected into `document.head`:

```js
// essentials.js
import essentialStyles from "./tailwind.scss?inline"
const styles = document.createElement("style")
styles.textContent = essentialStyles
document.head.appendChild(styles)
```

### TanStack Router code generation

Plugins with file-based routing (`kubernetes_ng`, `smartops`) provide
`plugins/<name>/esbuild.plugin.js` using the shared factory:

```js
// plugins/kubernetes_ng/esbuild.plugin.js
import { createTanstackRouterPlugin } from "../../config/esbuild/esbuild-tanstack-router-plugin.js"

export default [
  createTanstackRouterPlugin({
    routesDirectory: "./plugins/kubernetes_ng/app/javascript/widgets/app/routes",
    generatedRouteTree: "./plugins/kubernetes_ng/app/javascript/widgets/app/routeTree.gen.ts",
    autoCodeSplitting: true,
  }),
]
```

On every build (including watch mode) TanStack Router scans `routesDirectory`
and regenerates `routeTree.gen.ts`. This file is committed — do not edit it
manually.

---

## CSS pipeline (Sprockets)

The global stylesheet `application.css` is compiled by Sprockets from
`app/assets/stylesheets/application.scss.erb`. This is a **Sprockets manifest**
(not an esbuild entry) — Sprockets concatenates and compiles it.

Key imports in `application.scss.erb`:

```scss
@import "variables";
@import "bootstrap-sprockets";
@import "bootstrap";           // Bootstrap 3.4
@import "font-awesome";
@import "monsoon_theme";       // Elektra custom theme on top of Bootstrap
/* … other global partials … */

// Plugin-specific CSS (scoped under .plugin_name { ... }):
// dynamically generated via ERB from Core::PluginsManager
```

The ERB at the bottom of `application.scss.erb` iterates all plugins that have
`app/assets/stylesheets/<name>/application.*` and wraps each in a CSS scope:

```erb
<% Core::PluginsManager.plugins_with_application_css.each do |plugin| %>
  <%= ".#{plugin.name} { @import \"#{plugin.name}/application\"; }" %>
<% end %>
```

This scopes plugin CSS under a class matching the plugin name, preventing
cross-plugin style leakage. Juno-based widgets (which use `?inline` SCSS) are
**not** included here — they inject styles directly into the DOM.

### Non-digest widget assets

A Sprockets postprocessor (`config/initializers/sprockets_processor.rb`)
copies every `*_widget.js` file to `public/assets/` **without** the content
digest in the filename:

```ruby
# sprockets_processor.rb
if filename.end_with?('_widget.js')
  FileUtils.cp(filename, File.join(Rails.public_path, 'assets', File.basename(filename)))
end
```

This ensures `javascript_include_tag "kubernetes_ng_app_widget"` works with
a predictable filename rather than a digest-based one. The digest version also
exists in `public/assets/` for cache busting, but the non-digest copy is what
the HAML tag references.

---

## What loads on every page

The main layout (`app/views/layouts/application.html.haml`) loads assets in
this order:

```haml
= stylesheet_link_tag 'application'               # Sprockets CSS (Bootstrap, FA, plugin CSS)
= javascript_include_tag 'policy_engine'          # RBAC policy object
= javascript_include_tag 'essentials'             # jQuery, Bootstrap JS, Tailwind CSS injected into head
= javascript_include_tag 'application'            # jQuery plugins, polling, modals, Ajax
= javascript_include_tag 'plugins'                # global.js from all plugins (webconsole, etc.)
- if plugin.has_plugin_js?
  = javascript_include_tag "#{plugin.name}_plugin"  # current plugin's plugin.js (only this plugin)
```

Widget bundles (`*_widget.js`) are **not** loaded here — each individual HAML
view includes them via `javascript_include_tag "..._widget"` where needed.

### `essentials.js` — bootstrap sequence

```js
import essentialStyles from "./tailwind.scss?inline"  // Tailwind → inject into <head>
import "./core/jquery"
import "jquery-ujs"
import "bootstrap"
import "./core/dialogs"
import "./core/global_notifications"
```

### `application.js` — jQuery plugins and core features

```js
import "./core/jquery-ui"
import "./core/jquery.bbq"          // URL hash state (used by React Router hash mode)
import "./core/jquery.searchable"
import "./core/polling_service"
import "./core/flash"
import "./core/modal"
import "./core/update"              // Turbolinks-style partial page updates
import "./core/current_user_token"  // window._getCurrentToken() for widget auth
```

### `plugins.js` — global plugin JS

```js
import "../../plugins/**/app/javascript/**/global.{js,jsx}"  // glob import
```

Uses `globImportPlugin` to auto-discover every `global.js` across all plugins.
Only `webconsole` currently has one.

---

## Dev vs. production

### Development

```
Procfile.dev:
  web: bin/rails server -p 3000
  js:  pnpm build --watch
```

`pnpm build --watch` starts esbuild in watch mode with `chokidar` watching
`app/javascript/**` and `plugins/*/app/javascript/**`. Any file change
triggers a full re-bundle (all entry points). **Important:** the watch
process does not hot-reload the browser — a manual page refresh is needed.

`bin/workspace start-js` (inside the `elektra-dev` container) runs
`pnpm build --watch`.

Sprockets CSS is compiled on-demand by the Rails dev server (no separate
watch process needed).

Known issue: in watch mode, esbuild sometimes misses changes to files that
were not modified since the last full build. Running `pnpm build` manually
forces a complete rebuild. See the
[project memory](../../../../.config/claude/projects/-workspace-elektra/memory/)
for the note on stale JS watch builds.

### Production

`docker build -f docker/Dockerfile` runs (inside the container):

```
RAILS_ENV=production bundle exec rails assets:precompile
```

`jsbundling-rails` hooks `javascript:build` as a prerequisite of
`assets:precompile`:

```
assets:precompile
  → javascript:build     (jsbundling-rails rake task)
      → pnpm install     (unless SKIP_YARN_INSTALL)
      → pnpm build       (runs config/esbuild/build.js with --production flag)
  → Sprockets compiles application.scss.erb → application-<digest>.css
  → NonDigestAssets postprocessor copies *_widget.js without digest
```

Production esbuild flags (triggered by `--production` or `RAILS_ENV=production`):
- `minify: true` — minifies JS output
- `sourcemap: false` — no source maps
- PostCSS minification enabled for inlined CSS

After `assets:precompile`, `node_modules` is deleted from the image to reduce
size. The `.npmrc` (containing the GitHub token for `@sapcc/*` packages) is
also removed for security.

---

## TypeScript

`tsconfig.json` is **type-check only** (`"noEmit": true`) — esbuild handles
transpilation. TSC is run separately via `pnpm typecheck`.

Key settings:

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "Bundler",
  "strict": true,
  "jsx": "react-jsx",          // automatic JSX transform (no React import needed)
  "paths": { "lib/*": ["app/javascript/lib/*"] }
}
```

Note: `tsconfig.json` only includes `app/javascript/lib` and a few support
files. Plugin `.tsx` files are checked via esbuild's built-in TypeScript
handling, not via `tsc`. `pnpm typecheck` catches type errors in the `lib/`
directory; plugin-level type errors are caught by the IDE or CI lint.

---

## Tests (Vitest)

`vitest.config.ts` mirrors esbuild's path aliases for test resolution:

```ts
resolve: {
  alias: {
    lib:     "app/javascript/lib",
    core:    "app/javascript/core",
    plugins: "plugins",
    config:  "config",
  }
}
```

Setup files run before every test suite:

| File | Purpose |
|------|---------|
| `setupVitestMock.js` | Mocks `global.fetch` with a configurable response (ok: true, status: 200, JSON body) |
| `vitest.setup.ts` | Extends `expect` with `@testing-library/jest-dom` matchers; mocks jQuery; installs the React 19 `findDOMNode` shim |

Test environment: `jsdom`. Globals enabled (no `import { describe, it }` needed).

---

## Key files

- `config/esbuild/build.js` — main esbuild config, entry point discovery, all inline plugins
- `config/esbuild/entrypoints.js` — glob → output name mapping
- `config/esbuild/paths_resolver_plugin.js` — `lib/`, `core/`, `plugins/`, `config/` aliases
- `config/esbuild/glob_import_plugin.js` — `import "**/*.js"` glob support
- `config/esbuild/esbuild-plugin-env.js` — `import "env"` → `process.env` + `.env` file
- `config/esbuild/esbuild-tanstack-router-plugin.js` — shared factory for TanStack Router codegen
- `plugins/kubernetes_ng/esbuild.plugin.js` — TanStack Router config for kubernetes_ng
- `plugins/smartops/esbuild.plugin.js` — TanStack Router config for smartops
- `app/javascript/tailwind.scss` — Tailwind entry (imported `?inline` by `essentials.js`)
- `tailwind.config.js` — Tailwind config with Juno preset and `tw-` prefix
- `app/assets/stylesheets/application.scss.erb` — Sprockets CSS manifest (Bootstrap, FA, plugin CSS)
- `app/assets/config/manifest.js` — links `application.css` and `app/assets/builds/` tree
- `config/initializers/sprockets_processor.rb` — non-digest copy of `*_widget.js` files
- `config/initializers/assets.rb` — extra Sprockets precompile entries (d3.v3.min.js)
- `vitest.config.ts` — Vitest config (jsdom, path aliases, setup files)
- `tsconfig.json` — TypeScript config (type-check only, no emit)
- `docker/Dockerfile` — production image; runs `assets:precompile`, removes node_modules
