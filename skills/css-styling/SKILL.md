---
name: css-styling
description: >-
  Use when writing CSS/SCSS for Elektra pages or plugins, working with Bootstrap
  theming, applying Tailwind utility classes, integrating Juno UI components,
  understanding the monsoon theme overrides, or debugging style conflicts between
  the four CSS layers (Bootstrap → monsoon theme → Tailwind → Juno).
---

# CSS Styling Stack

Elektra runs **four CSS layers** that coexist without conflict through careful
scoping. Two build pipelines deliver them — Sprockets for the traditional stack and
esbuild for the modern stack.

```
Layer 1: Bootstrap 3.4.1      (Sprockets → application.css)
Layer 2: monsoon theme         (Sprockets → application.css, on top of Bootstrap)
Layer 3: Tailwind CSS 3.4.15   (esbuild → tailwind.css, tw- prefix)
Layer 4: Juno UI Components 4.0.1  (esbuild → per-widget ?inline, scoped to shadow DOM)
```

---

## Layer 1: Bootstrap 3.4.1

**Package:** `"bootstrap": "3.4.1"` (`package.json`)  
**Pipeline:** Sprockets  
**Entry:** `app/assets/stylesheets/application.scss.erb`

Bootstrap 3 (not 4, not 5) is the page-level grid and component library. It
provides the navbar, grid, forms, tables, modals, buttons, alerts, panels, and all
other traditional HTML/HAML templates.

The Sprockets pipeline compiles SCSS via `sass-rails`. Full import order in
`application.scss.erb`:

```scss
@import "variables";          // Brand colors + Bootstrap variable overrides (MUST come first)
@import "spinners";
@import "bootstrap-sprockets";
@import "bootstrap";
@import "bootstrap/theme";    // Bootstrap's optional theme (gradients, shadows)
@import "bootstrap-multiselect";
@import "font-awesome-sprockets";
@import "font-awesome";
@import "mixins";             // Custom SCSS mixins (button-variant-outline, spinner, etc.)
@import "monsoon_theme";      // Bootstrap-derived variables + full monsoon theme
@import "react_css_transitions";
@import "login";
@import "snippets"; @import "forms"; @import "datatable"; @import "tables";
@import "pagination_spinner"; @import "visualization"; @import "nv.d3";
@import "bootstrap-slider"; @import "bootstrap-select"; @import "bootstrap-datetimepicker";
@import "topology";
@import "rules_for_resources_plugin";
@import "generals";
@import "aurora_migration";
// ERB loop: .plugin_name { @import "plugin_name/application"; }
```

The ERB loop at the bottom scopes each plugin's `application.scss` under a
`.plugin_name` CSS class — plugin styles cannot leak out. The plugin wrapper
class is added to the `<body>` or plugin container in HAML views.

**Important:** `_variables.scss` must be imported before `bootstrap` because it
overrides Bootstrap SCSS variables (e.g. `$btn-primary-bg`, `$brand-primary`). Any
file that needs Bootstrap-derived values (like `$font-size-base`) must be imported
after `bootstrap`.

---

## Layer 2: The monsoon theme (`_variables.scss` + `_monsoon_theme.scss`)

### `_variables.scss` — two concerns in one file

**File:** `app/assets/stylesheets/_variables.scss`

This file serves two purposes — it is loaded before Bootstrap to override its
variables, and it defines Elektra's brand palette as SCSS variables.

**Brand color palette:**
```scss
$sapgold: #f0ab00;  $light-sapgold: #fcb913;  $dark-sapgold: #fc8613;
$bright-blue: #008fcc;  $medium-blue: #226ca9;  $deep-blue: #2b3f7b;
$bright-purple: #9c277b;  $medium-purple: #6b2982;  $deep-purple: #522a67;
$bright-orange: #de8a2e;  $medium-orange: #d4652d;  $deep-orange: #b34a2a;
$bright-green: #b4ca48;  $medium-green: #8ab54e;  $deep-green: #2a7b44;
// + misc: $hover-blue, $alarm-red, $dark-gray, $medium-gray, $light-gray
```

**SAP fonts:**
```scss
$font-family-sap-light:   "BentonSans Light";
$font-family-sap-regular: "BentonSans Regular";
$font-family-sap-medium:  "BentonSans Medium";
```

These are used as the first entry in the `$font-family-sans-serif` stack:
```scss
$font-family-sans-serif: $font-family-sap-regular, "Segoe UI", Roboto, ...
```

**Bootstrap variable overrides** (in `_variables.scss`):
```scss
$btn-primary-border: $medium-blue;  $btn-primary-bg: $medium-blue;
$btn-info-border:    lighten($bright-blue, 10%);
$btn-success-border: $medium-green;
$btn-warning-border: lighten($bright-orange, 5%);
$btn-danger-border:  #e22;
$brand-primary:      $medium-blue;   // set in _monsoon_theme.scss
$list-group-hover-bg: $medium-blue;
```

Layoutvariables defined here (used in `_monsoon_theme.scss`):
```scss
$context-breadcrumb-height: 42px;
$footer-height: 60px;
$footer-margin-top: 100px;
$login-max-width: 360px;
```

### `_monsoon_theme.scss` — the main theme file

**File:** `app/assets/stylesheets/_monsoon_theme.scss`

Imported after Bootstrap. This file:

1. **Declares bootstrap-derived variables** (needs `$font-size-base` etc. from Bootstrap):
   ```scss
   $font-size-medium: ceil(($font-size-base * 1.125));
   $brand-primary: $medium-blue;
   // state colors: $state-info-bg, $state-warning-bg, $state-success-bg, $state-danger-bg
   ```

2. **Registers custom fonts** via `@font-face`:
   - `MonsoonIcons-Regular` (eot/woff/ttf/svg) — custom icon font for `.icon-monsoon`
   - BentonSans fonts are referenced here but loaded separately (see Fonts section)

3. **Provides the full UI** — every HAML view relies on classes defined here:
   - Layout: `body`, `html`, `html.flex-layout`, `.flex-body`, sticky footer
   - Navigation: `.navbar-sap`, `.context-breadcrumb`, `.context-list`, `.fancy-nav`
   - Components: `.toolbar`, `.toolbar-fancy`, `.bs-callout`, `.infobox`, `.jumbotron-fancy`
   - Tables: `.table-fancy`, `.table-select`, `.virtualized-table-*`, row state classes
   - Icons: FA icon mixins, `.moo-cloud`, `.moo-cloud-white` (inline SVG)
   - Utilities: `.u-flex-container`, `.u-text-monospace`, `.u-text-break-word`, etc.
   - Plugin release states: `.release-state-experimental`, `.release-state-tech_preview`

4. **Juno Badge compatibility layer** — `.juno-badge` in Bootstrap context:
   ```scss
   .juno-badge {
     display: flex; align-items: center; gap: 0.25rem;
     border-radius: 0.25rem; padding: 0.125rem 0.5rem;
     &.juno-badge-info { color: rgb(76,76,76); background: rgba(67,162,208,0.25); }
   }
   ```

---

## Layer 3: Tailwind CSS 3.4.15

**Package:** `"tailwindcss": "3.4.15"` (`package.json`)  
**Pipeline:** esbuild via PostCSS  
**Entry:** `app/javascript/tailwind.scss`  
**Output:** `app/javascript/tailwind.css` (in the esbuild bundle)

### Why a `tw-` prefix?

Bootstrap 3 uses many of the same utility names (`text-center`, `hidden`,
`flex`, `p-4`, etc.). The prefix makes every Tailwind class unambiguous:
`tw-text-center`, `tw-hidden`, `tw-flex`, `tw-p-4`.

### Configuration

**`tailwind.config.js`:**
```js
import uiComponentsConfig from "@cloudoperators/juno-ui-components/tailwind.config.js"
module.exports = {
  presets: [uiComponentsConfig],   // inherits Juno's color tokens as Tailwind colors
  prefix: "tw-",
  content: [
    "./plugins/**/*.{js,jsx,ts,tsx,html,haml}",
    "./app/javascript/**/*.{js,jsx,ts,tsx,haml}",
    "./app/views/**/*.{haml,html}",
  ],
  theme: { extend: {} },
  corePlugins: { preflight: false },  // never touch <body> defaults — Bootstrap owns them
  plugins: [],
  darkMode: "class",
}
```

`preflight: false` is essential — Tailwind's CSS reset would override Bootstrap's
base styles. Tailwind only provides utilities, never base resets.

`presets: [uiComponentsConfig]` means Juno's design tokens (colors, spacing) are
available as Tailwind color/spacing utilities with the `tw-` prefix — e.g.
`tw-text-theme-default`, `tw-bg-juno-grey-blue-3`.

### Entry file

**`app/javascript/tailwind.scss`:**
```scss
@import "./variables"; // workaround: variables.css was removed from juno-ui-components in v2.35.0
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
```

The `variables` import re-injects Juno CSS custom properties into the document.
These were bundled in `juno-ui-components` through v2.34.0 but dropped in v2.35.0
(`app/javascript/variables.css` is the local copy).

### Juno CSS custom properties (`variables.css`)

**File:** `app/javascript/variables.css`

This is Juno's design token sheet. It defines CSS custom properties (CSS variables)
in `:root` and `:host` for use in both normal DOM and shadow DOM contexts:

- **Palette variables**: `--color-sap-blue-3`, `--color-juno-grey-blue-3`,
  `--color-sap-gold`, etc. (100+ color tokens)
- **Theme variables**: `.theme-light` and `.theme-dark` classes define semantic
  variables referencing palette vars:
  ```css
  .theme-light { --color-accent: #0076cb; --color-background-lvl-0: var(--color-white); ... }
  .theme-dark  { --color-accent: #15d0e0; --color-background-lvl-0: var(--color-juno-grey-blue-9); ... }
  ```
- **Grid variables**: `--grid-columns: 12`, `--grid-column-default-width: 8.333333%`

Juno components reference `var(--color-accent)` etc., so they adapt to the active
theme class without any JS. The default theme is `theme-light`.

---

## Layer 4: Juno UI Components 4.0.1

**Package:** `"@cloudoperators/juno-ui-components": "4.0.1"` (`package.json`)  
**Source:** GitHub Package Registry (`@cloudoperators` scope, needs `GITHUB_TOKEN`)

Juno is SAP Cloud Operators' design system — a React component library that
provides a full set of UI primitives (Button, Input, Select, DataGrid, Modal,
Panel, Message, etc.) styled with its own CSS variables.

### How Juno CSS is delivered

Juno does **not** inject into the global `application.css`. Each widget bundles
its own Juno CSS via the `?inline` esbuild feature:

```ts
// kubernetes_ng App.tsx:5 — inline import
import styles from "./styles.scss?inline"

// Inside the component:
<AppShellProvider theme="theme-light">
  <style>{styles}</style>   {/* injected as a <style> tag inside the component */}
  {children}
</AppShellProvider>
```

`?inline` causes esbuild to compile the SCSS and return its CSS as a JavaScript
string rather than a URL. The component then injects it as a `<style>` element.

This keeps Juno styles scoped to the widget — they cannot leak into Bootstrap's
page context and Bootstrap styles cannot interfere with Juno components.

### `AppShellProvider`

```tsx
import { AppShellProvider } from "@cloudoperators/juno-ui-components"

<AppShellProvider theme="theme-light">
  {/* All Juno components inside get .theme-light CSS variables */}
</AppShellProvider>
```

`AppShellProvider` wraps children with the theme class and injects Juno's CSS
variable sheet. `theme="theme-light"` is the standard choice for Elektra widgets;
`theme="theme-dark"` is available but not used in production pages.

### `AppShell embedded`

For widgets embedded in the Bootstrap page layout (not full-screen), use
`AppShell embedded`:
```tsx
<AppShellProvider theme="theme-light">
  <AppShell embedded>
    {/* widget content */}
  </AppShell>
</AppShellProvider>
```

`embedded` removes the full-page layout constraints that `AppShell` normally adds
(no `min-h-screen`, no standalone viewport management).

### `MessagesProvider`

From `@cloudoperators/juno-messages-provider` — provides Juno's toast/message
system for widgets. Wraps the app inside `AppShellProvider`:
```tsx
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"

<AppShellProvider theme="theme-light">
  <MessagesProvider>
    {/* components can now call useMessages() to show toasts */}
  </MessagesProvider>
</AppShellProvider>
```

### Plugin-level styles.scss

Each Juno-based plugin provides its own `styles.scss` that is imported as `?inline`.
This file typically just imports the Tailwind CSS:
```scss
// plugins/kubernetes_ng/.../styles.scss
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
```

The widget's specific SCSS overrides go into the same file below the Tailwind imports.

---

## Font loading

### BentonSans (SAP corporate font)

BentonSans is loaded from the SAP CDN — it is not bundled in the repo. The font
families (`BentonSans Light`, `BentonSans Regular`, `BentonSans Medium`) are
referenced in `_variables.scss` and fall back to system fonts if the CDN is
unavailable. Loading is configured in the HTML layout template (`app/views/layouts/`).

### MonsoonIcons

Custom icon font defined in `_monsoon_theme.scss`:
```scss
@font-face {
  font-family: "MonsoonIcons";
  src: font-url("MonsoonIcons-Regular.eot"), ...;
}
.icon-monsoon { font-family: "MonsoonIcons"; }
.icon-monsoon-cloud:before { content: "\E000"; }
```

Files: `MonsoonIcons-Regular.{eot,woff,ttf,svg}` — served via Sprockets from
`app/assets/fonts/`.

### Font Awesome 4.x

Loaded via Sprockets:
```scss
@import "font-awesome-sprockets";
@import "font-awesome";
```

Used extensively in HAML views and the icon class helpers in `_monsoon_theme.scss`
(`.services-icon`, `.compute-icon`, `.storage-icon`, etc.).

---

## `_aurora_migration.scss` — Switcher UI elements

**File:** `app/assets/stylesheets/_aurora_migration.scss`

This file contains UI elements used during the Aurora (the replacement dashboard)
migration period — specifically the visual components that invite users to switch
from Elektra to Aurora:

- `.switcher-border-gradient` — pill/card with purple gradient border
- `.switcher-btn` — IBM Plex Mono button with purple gradient background
- `.switcher-banner` — notification banner prompting switch
- `.switcher-pill` — compact indicator badge
- `.aurora::after` — inline rocket icon pseudo-element for Aurora links

These are Bootstrap-context components, not Juno components. They use IBM Plex Mono
as their font family for a "developer" aesthetic distinct from the BentonSans corporate
look of the rest of Elektra.

---

## Conflict avoidance rules

| Problem | Solution |
|---------|----------|
| Bootstrap and Tailwind both have `.flex` | Tailwind uses `tw-flex` prefix |
| Tailwind reset would break Bootstrap `body` styles | `preflight: false` in `tailwind.config.js` |
| Juno CSS variables would pollute global document | `variables.css` imported via `tailwind.scss`; Juno components use `AppShellProvider` |
| Juno component styles leak into Bootstrap page | `?inline` import + `<style>` injection scoped inside `AppShellProvider` |
| Plugin SCSS affects other plugins | Sprockets ERB loop wraps each plugin under `.plugin_name {}` |
| Bootstrap button variables wrong color | Override in `_variables.scss` before `@import "bootstrap"` |

---

## Key files

- `app/assets/stylesheets/application.scss.erb` — Sprockets entry; import order matters
- `app/assets/stylesheets/_variables.scss` — Brand palette + Bootstrap variable overrides
- `app/assets/stylesheets/_monsoon_theme.scss` — Main theme (layout, nav, components, icons)
- `app/assets/stylesheets/_aurora_migration.scss` — Aurora switcher UI components
- `app/javascript/tailwind.scss` — Tailwind entry: imports variables.css + Tailwind layers
- `app/javascript/variables.css` — Juno CSS custom properties (design tokens, themes)
- `tailwind.config.js` — Tailwind config: `tw-` prefix, `preflight:false`, Juno preset
- `postcss.config.js` — PostCSS: `tailwindcss` + `autoprefixer`
- `plugins/kubernetes_ng/app/javascript/widgets/app/App.tsx` — canonical `AppShellProvider` + `?inline` usage
- `plugins/keymanagerng/app/javascript/widgets/app/components/Application.jsx` — `AppShell embedded` example
