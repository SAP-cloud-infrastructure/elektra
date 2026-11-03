---
name: plugin-architecture
description: >-
  Use when creating a new plugin, adding a widget to an existing plugin,
  understanding why a plugin has both HAML views and a React widget, or
  choosing the right frontend pattern for new work. Covers the Rails Engine
  structure, how widgets are built and mounted, and every frontend pattern
  in use across Elektra's 27 plugins.
---

# Plugin Architecture

Elektra's 27 plugins live under `plugins/` and are each a **Ruby gem** that
loads as a **Rails Engine**. From the Ruby side they all look the same
(`isolate_namespace`, routes, controllers, services, models). The variety is
entirely on the frontend: a plugin may have no React at all, one full-page
React app, several small React widgets embedded in HAML, or a modern Juno
design-system app with an isolated shadow DOM.

## Rails Engine structure

Every plugin's `lib/<name>/engine.rb` defines:

```ruby
module Compute
  class Engine < ::Rails::Engine
    isolate_namespace Compute
  end
end
```

`isolate_namespace` namespaces routes, helpers, and URL helpers so plugins
don't collide. The engine is **mounted** by `config/routes.rb:84`:

```ruby
Core::PluginsManager.mountable_plugins.each do |plugin|
  mount plugin.engine_class => "/#{plugin.mount_point}", as: "#{plugin.name}_plugin"
end
```

`Core::PluginsManager` (`lib/core/plugins_manager.rb`) discovers plugins from
`Gem.loaded_specs` where `full_gem_path` starts with `ROOT/plugins/`. A plugin
is **mountable** if `<Name>::Engine` can be constantized. This produces the
`<name>_plugin` route helper used by navigation guards and URL helpers.

### Standard plugin directory layout

```
plugins/<name>/
├── app/
│   ├── controllers/<name>/          # namespaced controllers (< DashboardController)
│   ├── models/<name>/               # domain models (< Core::ServiceLayer::Model)
│   ├── services/service_layer/      # service classes (< Core::ServiceLayer::Service)
│   ├── views/<name>/                # HAML templates
│   ├── javascript/
│   │   ├── plugin.js                # loaded on every page of this plugin (jQuery glue)
│   │   ├── global.js                # loaded globally, on every page of Elektra
│   │   └── widgets/
│   │       └── <widget>/
│   │           └── init.{js,ts}     # esbuild entry point → bundle
│   └── assets/stylesheets/<name>/
├── config/
│   ├── routes.rb
│   └── policy.json                  # RBAC policy rules
├── lib/<name>/engine.rb
└── <name>.gemspec
```

## JavaScript build system

`pnpm build` runs `config/esbuild/build.js` which bundles three patterns of
entry point into `app/assets/builds/`:

| Entry glob | Output filename | Purpose |
|------------|-----------------|---------|
| `app/javascript/*.{js,tsx}` | `<name>.js` | Core JS (application.js, etc.) |
| `plugins/*/app/javascript/plugin.{js,jsx,ts,tsx}` | `<plugin>_plugin.js` | Per-page plugin glue |
| `plugins/*/app/javascript/widgets/*/init.{js,jsx,ts,tsx}` | `<plugin>_<widget>_widget.js` | Self-contained React widget bundle |

Path aliases configured in `build.js` (and mirrored in `vitest.config.ts`):

| Alias | Resolves to |
|-------|-------------|
| `lib/...` | `app/javascript/lib/` |
| `core/...` | `app/javascript/core/` |
| `plugins/...` | `plugins/` |

CSS/SCSS imported with `?inline` suffix is compiled by Sass + PostCSS (Tailwind,
autoprefixer, url-inline) and returned as a text string — used by Juno apps to
inject styles into shadow roots. Without `?inline` the CSS is copied as a
separate file.

Plugins that need custom esbuild configuration (e.g. TanStack Router code
generation) provide `plugins/<name>/esbuild.plugin.js`; `build.js` collects
them all via `collectPluginConfigsSync()`.

## How `plugin.js` is loaded

The main layout (`app/views/layouts/application.html.haml`) loads `plugin.js`
once per page request:

```haml
- plugin = Core::PluginsManager.plugin(plugin_name)
- if plugin and plugin.has_plugin_js?
  = javascript_include_tag "#{plugin.name}_plugin"
```

`plugin_name` comes from `ApplicationController#plugin_name` which derives it
from the controller class name. So `Compute::InstancesController` → `plugin_name
= "compute"` → loads `compute_plugin.js`.

`global.js` (if present) is loaded on every page regardless of the current
plugin. Only `webconsole` currently uses this.

## How React widgets are embedded in HAML

A widget is a self-contained JavaScript bundle. The HAML view embeds it via:

```haml
= javascript_include_tag "kubernetes_ng_app_widget",
    data: { basepath: plugin("kubernetes_ng").service_path(...), projectid: @scoped_project_id }
```

`javascript_include_tag` emits a `<script>` tag with `data-*` attributes. The
widget's `init.js` calls `createWidget()` from `lib/widget.jsx` which:

1. Finds the current `<script>` tag (by `src` matching the widget name).
2. Reads `dataset` from it as `scriptParams`.
3. Replaces the `<script>` tag with a `<div class="react-widget-content">`.
4. Returns a `Widget` instance wrapping that div as the React root.

The `Widget` object exposes:
- `widget.config.scriptParams` — the `data-*` values from the script tag
- `widget.configureAjaxHelper(opts)` — sets the shared `ajaxHelper` base URL
- `widget.setPolicy(policy)` — installs the RBAC policy from `window.policy`
- `widget.createStore(reducers)` — creates a Redux store (legacy widgets)
- `widget.render(App)` — mounts `App` with `createRoot` (optionally wrapped in `<Provider>`)

---

## Frontend patterns — the zoo

There are six distinct frontend patterns across Elektra's plugins. They exist
because the codebase evolved over many years without a single migration effort.

### Pattern 1: Pure HAML + jQuery (no React widget)

**Plugins:** `dns_service`, `inquiry`, `masterdata_cockpit`, `metrics`, `webconsole`

No `widgets/` directory. The controller renders HAML; `plugin.js` (and
occasionally inline `:javascript` blocks in HAML) adds jQuery behaviour.

`dns_service/plugin.js`:
```js
import "./recordsets"
import "./transfer_requests"
window.dns_service = window.dns_service || {}
$(document).ready(function() { /* jQuery glue */ })
```

This is the oldest pattern. New features should not use it.

### Pattern 2: HAML + React widget (Redux + React Router v5)

**Plugins:** `audit`, `block_storage`, `cloudops`, `keppel`, `kubernetes` (legacy),
`lbaas2`, `networking` (most widgets), `object_storage`, `reports`, `shared_filesystem_storage`,
`tools` (universal_search, castellum, limes widgets)

The HAML view contains `javascript_include_tag "..._widget"`. The widget uses
`createWidget()` + `widget.createStore(reducers)` (Redux) + `widget.render(App)`.
State management is Redux + Redux Thunk. Routing is `react-router-dom` v5
(`<HashRouter>` or `<BrowserRouter>`) or no routing at all.

`audit/app/javascript/widgets/app/init.js`:
```js
import { createWidget } from "lib/widget"
import * as reducers from "./reducers"
import App from "./containers/app"

createWidget().then(async (widget) => {
  const token = await globalThis[widget.config.scriptParams.getTokenFunc]()
  widget.configureAjaxHelper({ baseURL: scriptParams.eventsApi, headers: { "X-Auth-Token": token.authToken } })
  widget.setPolicy()
  widget.createStore(reducers)
  widget.render(App)
})
```

Juno components may appear **individually** (e.g. `<JsonViewer>`, `<Spinner>`
from `@cloudoperators/juno-ui-components`) without using `AppShellProvider` —
so the Juno design system is used à la carte, not as a full shell.

### Pattern 3: HAML + React widget (TanStack Query, no Redux, Juno AppShellProvider, no shadow DOM)

**Plugins:** `email_service`, `identity` (app_credentials, prodel widgets),
`keymanagerng`, `smartops`

Uses `createWidget({ pluginName, widgetName })` but **no** `widget.createStore`.
State management is TanStack Query (server state) + Zustand or context
(client state). The root component wraps everything in Juno's
`<AppShellProvider theme="theme-light">` which provides the design-system CSS
variables and theming — but **without** a shadow DOM.

Styles are imported with `?inline` and injected via `<style>{styles}</style>`
inside the component tree. This avoids global CSS leakage while not fully
isolating from the page DOM.

`keymanagerng/app/javascript/widgets/app/init.js`:
```js
import { createWidget } from "lib/widget"
import App from "./components/Application"

createWidget({ pluginName: "keymanagerng", widgetName: "app" }).then((widget) => {
  widget.setPolicy()
  widget.render(App)
})
```

`keymanagerng/components/Application.jsx`:
```jsx
import { AppShellProvider, AppShell } from "@cloudoperators/juno-ui-components"
import styles from "../styles.scss?inline"

const Application = () => (
  <AppShellProvider theme="theme-light">
    <QueryClientProvider client={queryClient}>
      <style>{styles} {dayPickerStyle}</style>
      <AppShell embedded>
        <AppRouter />
      </AppShell>
    </QueryClientProvider>
  </AppShellProvider>
)
```

### Pattern 4: HAML + React widget (TanStack Router + TanStack Query + Juno AppShellProvider, no shadow DOM)

**Plugins:** `kubernetes_ng`, `smartops`

The most modern pattern. Adds **TanStack Router** on top of Pattern 3. Routes
are type-safe and file-based. The `basepath` is passed as a prop from the
script tag's `data-basepath` and fed into `<RouterProvider basepath={...}>`.

`kubernetes_ng/app/javascript/widgets/app/App.tsx`:
```tsx
export default function App({ basepath, region, projectid }: AppProps) {
  const router = createAppRouter(basepath, region, projectid)
  return (
    <div id="kubernetes-ng-app">
      <AppShellProvider theme="theme-light">
        <style>{styles}</style>
        <ErrorBoundary fallback={<InlineError />}>
          <StrictMode>
            <MessagesProvider>
              <QueryClientProvider client={queryClient}>
                <RouterProvider basepath={basepath} router={router} />
              </QueryClientProvider>
            </MessagesProvider>
          </StrictMode>
        </ErrorBoundary>
      </AppShellProvider>
    </div>
  )
}
```

TanStack Router requires a custom esbuild plugin for route code generation
(`plugins/kubernetes_ng/esbuild.plugin.js`).

### Pattern 5: HAML + React widget (Juno StyleProvider + shadow DOM — legacy Juno)

**Plugins:** `testikus`

An older Juno integration using `<StyleProvider stylesWrapper="shadowRoot">`.
Juno's `StyleProvider` calls `attachShadow({ mode: "open" })` on the host
element and portals the component tree into it. Styles (`?inline`) are injected
inside the shadow root, fully isolated from the page CSS.

This pattern predates `AppShellProvider`. It still works but `AppShellProvider`
is the current Juno recommendation.

`testikus/components/Application.jsx`:
```jsx
import { StyleProvider, AppShell } from "@cloudoperators/juno-ui-components"
import styles from "../styles.css?inline"

const Application = () => (
  <StateProvider>
    <StyleProvider theme="theme-light" stylesWrapper="shadowRoot">
      <style>{styles.toString()}</style>
      <AppShell embedded>
        <BrowserRouter basename={baseName}>
          ...
        </BrowserRouter>
      </AppShell>
    </StyleProvider>
  </StateProvider>
)
```

### Pattern 6: External Juno app via `mount()` (limes-ui package)

**Plugin:** `resources` (widgets `limes-ui` and `usage`)

The widget is a pre-built external package (`@sapcc/limes-ui`) that exports a
`mount(element, { props })` function — the Juno "app interface". Elektra just
creates a `<div>`, calls `mount(div, { props })`, and the package handles the
entire lifecycle internally (including its own Juno shell and shadow DOM).

`resources/widgets/limes-ui/init.js`:
```js
import { mount } from "@sapcc/limes-ui"

const wrapper = document.createElement("div")
document.currentScript.replaceWith(wrapper)
mount(wrapper, { props: JSON.parse(dataset?.props) })
```

---

## Multi-widget plugins

Several plugins have **multiple independent widgets** on different views:

| Plugin | Widgets |
|--------|---------|
| `identity` | `role_assignments`, `prodel`, `prodel_cloud_admin`, `app_credentials`, `auth_projects` |
| `networking` | `network_usage_stats`, `bgp_vpns`, `asr`, `security_groups`, `ports` |
| `tools` | `universal_search`, `castellum`, `limes` |
| `resources` | `limes-ui`, `usage` |

Each widget is its own esbuild entry point and bundle. The HAML view for each
feature page includes only the relevant widget's `javascript_include_tag`.

Widgets within a plugin can import from each other — `tools/universal_search`
directly imports components from `networking/asr` and `identity/role_assignments`
using the `plugins/` path alias:

```tsx
import NetworkUsageStats from "plugins/networking/app/javascript/widgets/network_usage_stats/containers/application"
import Asr from "plugins/networking/app/javascript/widgets/asr/application"
```

---

## Pattern summary table

| Pattern | State mgmt | Router | Juno | Shadow DOM | Plugins |
|---------|-----------|--------|------|-----------|---------|
| 1 — Pure HAML + jQuery | — | — | — | — | dns_service, inquiry, masterdata_cockpit, metrics, webconsole |
| 2 — Redux + React Router v5 | Redux + Thunk | react-router v5 | à la carte | — | audit, block_storage, cloudops, keppel, kubernetes, lbaas2, networking, object_storage, reports, shared_filesystem_storage, tools |
| 3 — TanStack Query + Juno AppShellProvider | TanStack Query + Zustand/context | react-router v5 or none | AppShellProvider | — | email_service, identity (some widgets), keymanagerng, smartops |
| 4 — TanStack Router + TanStack Query + Juno | TanStack Query | TanStack Router | AppShellProvider | — | kubernetes_ng, smartops |
| 5 — Juno StyleProvider + shadow DOM (legacy) | Redux / context | react-router v5 | StyleProvider | yes | testikus |
| 6 — External Juno app (`mount()`) | internal | internal | internal | yes | resources |

**Guidance for new plugins:** use Pattern 4 (TanStack Router + TanStack Query +
Juno `AppShellProvider`) — it is the most recent, used in `kubernetes_ng` and
`smartops`. Generate a scaffold with `bin/generate <name> --react --mountable`.

---

## Generating a new plugin

```bash
bin/generate PLUGIN_NAME                       # lib plugin (no app tree)
bin/generate PLUGIN_NAME --service_layer       # service layer only
bin/generate PLUGIN_NAME --mountable           # full Rails Engine
bin/generate PLUGIN_NAME --mountable --react   # full Engine + React widget scaffold
```

The `--react` template in `lib/generators/templates/react/esbuild.plugin.js`
uses the TanStack Router esbuild plugin.

---

## Key files

- `lib/core/plugins_manager.rb` — discovers plugins, classifies mountable / has_plugin_js / has_global_js
- `config/routes.rb:84` — mounts all mountable plugins as `<name>_plugin` route helpers
- `app/javascript/lib/widget.jsx` — `createWidget`, `Widget` class, `getContainerFromCurrentScript`, `widgetBasePath`
- `config/esbuild/build.js` — entry point discovery, SCSS inline handling, SVG loader, plugin config collection
- `app/views/layouts/application.html.haml` — loads `<plugin>_plugin.js` per page
- `lib/generators/templates/react/` — scaffold for new React plugins
