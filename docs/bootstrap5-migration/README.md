# Bootstrap 3 → 5 Migration

Reference document for migrating elektra from Bootstrap 3 + react-bootstrap 0.33
to Bootstrap 5 + react-bootstrap 2.x, without regressions, while the project
keeps shipping weekly bugfixes and features.

> Status: **Planning complete, implementation not started.**
> This document is the single source of truth for the migration. Update it as
> phases are completed.

---

## 1. Goal & constraints

- **Goal:** Replace Bootstrap 3.4.1 with Bootstrap 5.3 and react-bootstrap 0.33.1
  with react-bootstrap 2.x, closing the known Bootstrap and jQuery security
  advisories.
- **Hard constraint:** No visual or behavioural regressions.
- **Context:** Active project with weekly releases. Each phase must be
  independently reviewable and (where possible) independently releasable, so the
  migration does not block ongoing feature work.

---

## 2. Decisions (locked)

| #   | Decision                                                                              | Rationale                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Direct BS3 → BS5** (no BS4 intermediate step)                                       | CSS is migrated "all at once" and a shim layer already exists; a BS4 stop would double the CSS + react-bootstrap work without removing anything we must touch anyway.                 |
| D2  | **Upgrade jQuery 1.12.4 → 3.7, otherwise leave jQuery untouched**                     | Closes the jQuery CVEs cheaply. jQuery is NOT removed in this project — the legacy DOM/AJAX/UJS code (pillars A/B/C/E below) stays. BS5 needs jQuery ≥ 3 for the plugin replacements. |
| D3  | **CSS migrated globally in one pass** (no `bs5-bridge.scss`)                          | Chosen explicitly. Cleaner end state, no leftover legacy classes. Risk (one large merge) is mitigated by decoupling phases 2–4 first and a strict Playwright visual gate.             |
| D4  | **Rewrite all ~40 Bootstrap JS call-sites to native BS5 API** (no jQuery-compat shim) | BS5 has no jQuery plugin API. We go straight to `new bootstrap.Modal()` etc. instead of maintaining a Moodle-style `$().modal()` compatibility layer.                                 |
| D5  | **Do not touch Juno** (`@cloudoperators/juno-ui-components`)                          | Managed externally; changing it causes problems with the manager. The 32 files already on Juno are out of scope.                                                                      |
| D6  | **jQuery removal is a separate, later project**                                       | Removing jQuery entirely is a bigger effort than BS5 and is coupled to the Rails backend (`.js.erb`, UJS). It is explicitly decoupled from this migration.                            |

---

## 3. Verified inventory

Numbers below were produced by exhaustive `grep`/agent scans. `node_modules`
and `app/assets/builds` (generated bundles) are excluded throughout.

### 3.1 Build & styling architecture

- **JS build:** esbuild — `config/esbuild/build.js` (not Vite).
- **Bootstrap CSS source:** Ruby gem **`bootstrap-sass 3.4.1`** via Sprockets,
  imported in `app/assets/stylesheets/application.scss.erb`
  (`@import "bootstrap-sprockets"; @import "bootstrap"; @import "bootstrap/theme";`).
  → Must move to npm `bootstrap@5.3` SCSS.
- **Bootstrap JS source:** npm `bootstrap@3.4.1`, imported in
  `app/javascript/essentials.js:5` (`import "bootstrap"`), alongside global
  jQuery (`app/javascript/core/jquery.js` → `window.$ = window.jQuery = jquery`).
- **Popper:** `@popperjs/core@2` is already a dependency (BS5 tooltips/popovers
  need exactly this).
- **React:** 19.2.8 → compatible with react-bootstrap 2.x (≥ 2.10).
- **Existing shim layer (key enabler):**
  - `app/javascript/lib/components/Modal.tsx` — React-19 drop-in for
    react-bootstrap@0.33 Modal; currently emits BS3 markup (`.in`, `.close`).
  - `app/javascript/lib/components/Tabs.tsx` — drop-in for Tabs/Tab; BS3
    `.nav-tabs` markup.
  - `app/javascript/lib/components/Overlay.jsx` — Tooltip/Popover via jQuery
    (`window.$(…).tooltip()`).
  - `app/javascript/react-bootstrap.d.ts` — ambient module declaration.

### 3.2 react-bootstrap usage

- **142 import lines across 133 files.**
- Component frequency: `Button` 92, `Alert` 18, `Collapse` 10, `Table` 5,
  `Popover` 3, `Overlay` 3, `Modal` 3, `Form` 2, `Tooltip` 1, `Label` 1,
  `FormControl` 1, `Carousel` 1.
- **Button detail (113 JSX tags / 92 files):** only BS3-era style props present
  are `bsStyle` (13× `primary`, 1× `link`) and one `bsClass`. **No** `bsSize`,
  `block`, `active`, `href`, `componentClass`, no DropdownButton/SplitButton/
  ButtonGroup/ButtonToolbar. 99/113 are default-styled. Two chokepoints:
  `app/javascript/lib/elektra-form/components/submit_button.jsx` and
  `app/javascript/lib/dialogs/dialog.jsx`.
- **Harder cases (react-bootstrap 2.x Overlay/Popover API changed a lot):**
  `plugins/lbaas2/.../shared/PopoverInfo.jsx`,
  `.../shared/CopyPastePopover.jsx`, `.../shared/FloatingFlashMessages.jsx`.
  `<Label>` (removed in 2.x → `<Badge>`): `.../shared/StateLabel.jsx`.
- One deep import to fix: `plugins/tools/.../castellum/components/error_row.jsx`
  → `import Button from "react-bootstrap/lib/Button"` (breaks in v1+).
- **Do not touch:** 32 files already using `@cloudoperators/juno-ui-components`.

### 3.3 jQuery usage (6 separable pillars)

Total raw jQuery: **945 occurrences / 134 files**.

| Pillar | Content                                                     | Scale                                     | Backend-coupled?  |
| ------ | ----------------------------------------------------------- | ----------------------------------------- | ----------------- |
| A      | Core DOM (`$()`)                                            | 945× / 134 files                          | No                |
| B      | Rails UJS (`$.rails`, `data-confirm`, `method:`, `remote:`) | ~200 sites                                | Yes (helpers)     |
| C      | `.js.erb` server responses                                  | **69 files + 14 `format.js` controllers** | **Yes, strongly** |
| D      | Own plugins + jQuery UI + BS3-only plugins                  | 8 defs + call-sites                       | No                |
| E      | jQuery AJAX (`$.ajax`/`$.get`)                              | 13 + 3 sites                              | Partly            |
| F      | jQuery inside React                                         | 7 files / 23×                             | No                |

**For this migration only pillar D's Bootstrap part is in scope** (the
`.modal()`/`.tooltip()`/`.popover()`/`.tab()` calls). Pillars A/B/C/E and the
non-Bootstrap parts of D stay (jQuery removal = separate project, D6).

### 3.4 Bootstrap JS call-sites to rewrite (native BS5)

- `.modal(` — **19× / 7 files**: `core/modal.js` (8), `core/dialogs.js` (5),
  `core/init.js` (1), `core/stateful_links.js` (1), `feedback/create.js.erb` (1),
  `networking/.../topology.js` (1), `kubernetes/.../lib/modal.jsx` (2).
- `.tooltip(` — **12× / 8 files**: `init.js` (3), `snippets.js` (2),
  `Overlay.jsx` (2), `jquery.ajax_paginate.js` (1), `identity.js` (1),
  `_wizard_steps.html.haml` (1), `subnets.js` (1), `webconsole/init.js` (1).
- `.popover(` — **7× / 4 files**: `init.js` (1), `Overlay.jsx` (2),
  masterdata_cockpit `_maintain_masterdata.html.haml` (2),
  `_renew_popover.html.haml` (2).
- `.tab("show")` — **2×**: dns_service + networking wizard HAML.
- `.in` → `.show` active sites: `dialogs.js:104` (`#mainModal.modal.in`),
  `Modal.tsx` (emits `.in`).

### 3.5 Bootstrap 5 data-attribute renames

- `data-toggle` → `data-bs-toggle`: ~57 Bootstrap lines (3 custom lines
  `data-toggle="help"` / `"show-error-details"` must NOT change).
- `data-target` → `data-bs-target`: **only 13 Bootstrap lines**. **29 React
  `data-target` test-ids must NOT change** (heuristic: Bootstrap value is a `#id`
  selector; test-id is a plain string).
- `data-dismiss` → `data-bs-dismiss`: 11 lines. `data-backdrop`/`data-keyboard`:
  1 / 3 lines.

### 3.6 BS3-only jQuery plugins (no BS5 equivalent → replace)

Imported in `application.js:14-18` + `application.scss.erb`:
`bootstrap-multiselect` (2 call-sites), `bootstrap-select` (auto-init),
`bootstrap-3-typeahead`, `bootstrap-slider`, `bootstrap-datetimepicker`
(**vendored** 1860-line file, not an npm dep). Plus jQuery-UI `autocomplete`
(9 call-sites: compute/fixed_ip, networking/rbacs, networking access view).

---

## 4. Security rationale (CVEs)

From `pnpm audit`:

- **jQuery 1.12.4** — CVE-2015-9251 (XSS, CVSS 6.1), CVE-2019-11358 (prototype
  pollution), CVE-2020-11022 / 11023 (XSS). Fixed by **jQuery ≥ 3.5** → D2.
- **Bootstrap 3.4.1** — advisories `1108098`, `1109533` (XSS in tooltip/popover
  `data-template` and `data-target`; CVE-2019-8331, CVE-2018-14041/14042/14040).
  BS3 is EOL — no further patches. Fixed by **BS5**.
- **bootstrap-multiselect 0.9.15** — advisory `1113537` (XSS).

Both jQuery CVEs (via D2) and Bootstrap CVEs (via BS5) are closed by this plan.

---

## 4b. Empirical findings from the `bs5-spike` (reality-check)

A colleague ran a hands-on spike on branch `bs5-spike` (see `SPIKE-NOTES.md`).
It validated some assumptions and **overturned others**. These findings take
precedence over earlier estimates where they conflict.

### Corrected facts

- **CSS is compiled by Sprockets + the `bootstrap-sass` gem — NOT esbuild.**
  `application.scss.erb` is `.erb`, so esbuild's `inline-styles` plugin
  (filter `/.*\.(css|scss)$/`) never matches it. Sprockets renders the ERB and
  compiles the SCSS; `@import "bootstrap"` resolves via the gem's load path.
  esbuild only compiles Tailwind + a few widget styles. There is intentionally
  **no `application.css` in `app/assets/builds/`** — its absence is not a bug.
  → Moving Bootstrap SCSS to BS5 means adding `node_modules` to the Sprockets
  asset paths (`config/initializers/assets.rb`,
  `config.assets.paths << Rails.root.join("node_modules")`), then importing
  `bootstrap/scss/bootstrap`. (SPIKE #1, #2, #3a, #14a)
- **npm `bootstrap` 3.4.1→5.3.8 and react-bootstrap 0.33→2.10 both install and
  BUILD green.** The conflict is **runtime/visual, not build-time**. esbuild does
  not typecheck props, and all react-bootstrap imports are named-barrel imports,
  so only _removed/renamed symbols_ break compilation. (SPIKE #5, #8)

### Revised risk ranking (the big correction)

The earlier plan called SCSS the "highest-risk, biggest block." The spike shows
the opposite order. There are **four independent surfaces**, none caught by the
build:

| #   | Surface                                                                 | Real cost                                                                                                                                                                                                                                                                                                                                                                                              | Risk                                           |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 1   | **SCSS vars/mixins**                                                    | ~100-line compat prelude + ~2 hand edits in `_monsoon_theme.scss` (2842 lines). `$line-height-computed` alone = 51 refs. BS5 core compiles instantly. px/rem unit math is the only non-shimmable part, solved by pinning bridge vars to px.                                                                                                                                                            | **LOW–MEDIUM, mechanical** (SPIKE #4, #5, #13) |
| 2   | **react-bootstrap props/API**                                           | Build breaks at only **2 sites** (`<Label>`→`Badge` in `StateLabel.jsx`; deep import in `error_row.jsx`). The real work = **~354 prop renames across 107 files** (`bsStyle`→`variant` 83/26, `bsSize`→`size` 186/85 **with value remap** small→sm/large→lg, `bsClass`→`bsPrefix` 85/30) + non-grep-able API changes (Modal/Overlay/Panel→Card, controlled Form). Codemod-able + per-file render check. | **MEDIUM** (SPIKE #8)                          |
| 3   | **jQuery behavioral JS** (modal lifecycle / backdrop timing / dropdown) | `$(...).modal is not a function` breaks the project list immediately. Fixing the _symbol_ is a shim; fixing the _behavior_ (init-vs-init+show, async backdrop teardown, event order) is per-call-site rewrite of `MoModal`/`InfoDialog`/`stateful_links`/`dialogs.js`. **THE dominant, app-breaking surface.**                                                                                         | **HIGH** (SPIKE #6, #7, #12)                   |
| 4   | **View-layer BS3 classes + `data-*`**                                   | Thousands of class refs (`.panel*` ~1200, `.btn-default` ~466, `.well` ~395, `.help-block` ~413, `.label-*` ~346, `.caret` ~185, `.pull-*` ~113) + ~169 `data-toggle`/`data-dismiss` renames in HAML/ERB/JSX. This is what makes the UI look "totally broken" even when it compiles and boots.                                                                                                         | **MEDIUM–HIGH by volume** (SPIKE #9)           |

**Governing reality:** "compiles ≠ looks right." The build and boot go green long
before the app is correct; every real break is runtime/visual. (SPIKE #14d)

### Concrete JS traps to design around (not in the original plan)

- **BS5's `defineJQueryPlugin` fights any hand-rolled bridge.** BS5 ships an
  _optional_ jQuery integration that, on `DOMContentLoaded`, overwrites
  `$.fn.modal` etc. with an **init-only** interface (bare `.modal()` does NOT
  show). Because `core/jquery.js` sets `window.jQuery`, BS5's guard is always
  true. Mitigation: set `document.body` attribute `data-bs-no-jquery` early
  **and** re-install any bridge on `DOMContentLoaded`. BS3 `.modal()` = init+show;
  BS5 bare = init-only. (SPIKE #12, #14e)
- **Multi-entrypoint multiple-jQuery trap.** Each esbuild entrypoint bundles its
  own `jquery` copy; plugins read `$.fn` off the **global** `window.jQuery`. Any
  jQuery-API patch must target `window.jQuery`, not the bundled import, or it
  silently misses. (SPIKE #11)
- **`bootstrap-select` breaks at runtime under BS5** (version-sniffs
  `$.fn.dropdown.Constructor.VERSION`) and its throw **cascades**, killing the
  whole `application.js` DOM-ready chain. It has **0 call-sites** → delete it.
  (SPIKE #11)
- **`data-toggle`→`data-bs-toggle` is NOT a safe blanket rename.** The breadcrumb
  "mega" dropdown (`_breadcrumb.html.haml`) uses custom `render_navigation` markup
  with **no `.dropdown-menu`**; BS5's dropdown JS crashes on it. Custom
  BS3-dependent widgets need per-case handling, not attribute mirroring. (SPIKE #10)
- **Detached-modal pattern breaks.** `dialogs.js` builds detached `$ajaxLoader`/
  `$dialog`; BS3 auto-appended them on `.modal("show")`, BS5 does not, and tears
  down the shared backdrop asynchronously, racing the content modal. Loader must
  become a plain synchronous overlay; dialogs must be appended to `<body>` before
  showing. (SPIKE #12)

### Impact on our locked decisions

- **D3 (no compat-shim, CSS global in one pass)** is challenged by the spike: a
  ~100-line SCSS compat prelude is cheap and lets the stylesheet move to BS5
  **ahead of the views** (shim `@extend` aliases keep BS3 markup rendering),
  decoupling the large CSS migration from the even larger view migration. This is
  worth reconsidering — see Open Question OQ1 below.
- **D4 (rewrite all BS JS calls natively, no jQuery-compat shim)** is validated as
  the correct _end state_, but the spike shows a **temporary** jQuery bridge is a
  valuable _staging_ unblock to get the app interactive while surfaces 2/4 are
  migrated — provided the `data-bs-no-jquery` + `window.jQuery` traps are handled.
- **Phase ordering** should reflect the new risk ranking: surface 3 (JS
  behavioral) is the first thing that blocks an authenticated page, so it needs a
  working story (bridge or native) very early, not late.

### Open questions raised by the spike

- **OQ1 — Reconsider D3?** Adopt the cheap SCSS compat prelude + "CSS migrates
  ahead of views" sequencing (shim deleted at the end), instead of a single global
  class rename? The spike strongly suggests yes.
- **OQ2 — Temporary jQuery bridge yes/no?** As a staging tool only, deleted once
  all BS JS calls are native (D4)?

---

## 5. Phase plan

Guiding principle: **decouple before switching.** Hide react-bootstrap behind
wrappers (`lib/components/*`) and Bootstrap JS behind one engine, so the large
Phase-5 switch touches a handful of files instead of 133+ call-sites.

### Phase 0 — Foundation & safety net (invisible)

- Establish Playwright `ui` baseline (see §7). Add smoke/visual specs for the
  BS-critical flows that lack them: modal, dropdown, tooltip, popover, tab,
  multiselect, slider, datetimepicker, wizards.
- This document.

### Phase 1 — jQuery 1.12.4 → 3.7 (separate release, CVE fix)

- Bump `jquery` → 3.7; `jquery-ujs` → jQuery-3-compatible version; check
  `jquery.cookie`.
- Fix breaking changes: `$.get().error/.complete` → `.fail/.always`
  (`modal.js:161,184`), `$.type`/`jQuery.type` (`modal.js:130`), `.hide()`
  animation deprecations.
- jQuery-UI 1.13 is already jQuery-3 compatible.
- **Release 1** → jQuery CVEs closed, Bootstrap still 3.

### Phase 2 — Bundle react-bootstrap behind wrappers (invisible)

- `lib/components/Button.tsx` for 113 call-sites (maps `bsStyle`→`variant`,
  handles the one `bsClass`). Migrate 92 files to the wrapper import.
- Wrappers for `Alert` (18), `Collapse` (10), `Table` (5); handle single-use
  `Carousel`/`Form`/`FormControl` directly.
- Mark Overlay/Popover special cases (PopoverInfo, CopyPastePopover,
  FloatingFlashMessages) and `<Label>`→`<Badge>` (StateLabel).
- Internally still react-bootstrap 0.33 — no visible change.

### Phase 3 — Native BS JS engine (rewrite the ~40 call-sites)

- Central TS engine wrapping `import { Modal, Tooltip, Popover, Tab } from "bootstrap"`.
- Rewrite all call-sites in §3.4 to native API. `#mainModal.modal.in` → `.show`.
- `.js.erb` modals call the engine API; the rest of the `.js.erb`/DOM stays
  (backend untouched).
- Positioning via `@popperjs/core@2`.
- Watch event delegation for AJAX-loaded modals (`MoModal`,
  `$(document).on(...)`) and the `MutationObserver` in `init.js:160`.

### Phase 4 — Replace BS3-only jQuery plugins

- `multiselect` → native `<select multiple>` + light TS component.
- `select`/`selectpicker` → native `<select>`.
- `slider` → noUiSlider or `<input type=range>`.
- `datetimepicker` (vendored) → flatpickr.
- `bootstrap-3-typeahead` → existing `react-bootstrap-typeahead` / native datalist.
- jQuery-UI `autocomplete` → native datalist + fetch.
- Each behind a wrapper, individually testable.

### Phase 5 — The global BS5 switch (one merge, visual gate armed)

- CSS source: drop gem `bootstrap-sass` → npm `bootstrap@5.3` SCSS
  (`loadPaths: node_modules` already supported); update
  `application.scss.erb` + Gemfile; check `font-awesome-sass`.
- npm: `bootstrap` 3.4.1→5.3; `react-bootstrap` 0.33→2.x; remove
  `@types/react-bootstrap` and `react-bootstrap.d.ts`.
- CSS classes app-wide (see §6).
- `data-*` → `data-bs-*` via targeted script (exclude the 29 React test-ids).
- Shim components: `Modal.tsx` (`.in`→`.show`, `.close`→`.btn-close`),
  `Tabs.tsx` (BS5 nav/ARIA).
- Flip wrappers to react-bootstrap 2.x and engine to native BS5 (both prepared
  in phases 2–3).
- Modal markup in ~110 views: `.close`→`.btn-close`, header structure.
- **Release 2** → BS5 live.

### Phase 6 — Cleanup & re-audit

- Remove dead shims/comments (`Overlay.jsx` Tooltip2).
- `pnpm audit` → confirm Bootstrap and jQuery CVEs gone.
- Finalise docs.

---

## 6. BS3 → BS5 class mapping

Applies app-wide in Phase 5. References: Bootstrap 5 migration guide + Moodle
BS5 migration notes.

| BS3 / BS4                          | BS5                                              |
| ---------------------------------- | ------------------------------------------------ |
| `.panel`, `.panel-*`               | `.card`, `.card-*`                               |
| `.btn-default`                     | `.btn-secondary`                                 |
| `.img-responsive`                  | `.img-fluid`                                     |
| `.hidden`, `.hidden-xs`            | `.d-none` (+ responsive variants)                |
| `.pull-left` / `.pull-right`       | `.float-start` / `.float-end`                    |
| `.col-xs-*`                        | `.col-*`                                         |
| `.ml-*` / `.mr-*`                  | `.ms-*` / `.me-*`                                |
| `.pl-*` / `.pr-*`                  | `.ps-*` / `.pe-*`                                |
| `.text-left` / `.text-right`       | `.text-start` / `.text-end`                      |
| `.form-group`                      | margins (`.mb-3`)                                |
| `.form-inline`                     | `.d-flex` + utilities                            |
| `.control-label`, `.help-block`    | `.form-label`, `.form-text`                      |
| `.custom-select`                   | `.form-select`                                   |
| `.input-group-append` / `-prepend` | direct children of `.input-group`                |
| `.sr-only`, `.sr-only-focusable`   | `.visually-hidden`, `.visually-hidden-focusable` |
| `.font-weight-*`                   | `.fw-*`                                          |
| `.font-italic`                     | `.fst-italic`                                    |
| `.badge-*`                         | `.text-bg-*`                                     |
| `.badge-pill`                      | `.rounded-pill`                                  |
| `.media`                           | `.d-flex` + flex utilities                       |
| `.in` (modal/collapse)             | `.show`                                          |
| `.close`                           | `.btn-close` (no `×` content)                    |
| `.dropdown-menu-right`             | `.dropdown-menu-end`                             |
| `.no-gutters`                      | `.g-0`                                           |
| `.rounded-sm` / `.rounded-lg`      | `.rounded-1` / `.rounded-3`                      |
| `.well`, `.page-header`            | removed — replace with cards/utilities           |
| Glyphicons                         | removed — use Font Awesome / remove              |

Also: `data-toggle`→`data-bs-toggle`, `data-target`→`data-bs-target`,
`data-dismiss`→`data-bs-dismiss` (Bootstrap sites only; see §3.5).

---

## 7. Test & regression strategy

**Snapshots run against a local e2e instance, NOT against QA/SSO.**

- Why not QA (`dashboard.qa-de-1.cloud.sap`): it is behind SSO (SAML/OIDC +
  likely MFA), which cannot be scripted, and uses live, changing data that would
  make visual snapshots flaky. The agent cannot and must not use a personal SSO
  session.
- The repo's `e2e/playwright/helpers/auth.ts` performs a plain username/password
  login (`#username`/`#password`) against **`RAILS_ENV=e2e`** with mock
  OpenStack and test credentials — not SSO.

### Running the e2e environment

- `bin/workspace` runs a Docker dev container (`elektra-dev`, `docker/Dockerfile.dev`),
  mounts the repo at `/app`, exposes **port 4001**.
  - `bin/workspace` → interactive shell
  - `bin/workspace rebuild` / `cleanup`
  - `bin/workspace <cmd>` → run command in container
- Start Rails in e2e mode (`RAILS_ENV=e2e ... -p 4001`) + `pnpm build --watch`.
- Configure `.env`: `TEST_DOMAIN=cc3test`, `TEST_ADMIN_USER/PASSWORD`,
  `TEST_MEMBER_USER/PASSWORD`.

### Playwright

- Config: `playwright.config.ts` (`testDir: ./e2e/playwright`, default
  `baseURL http://localhost:3000`). From macOS use
  `--host http://host.docker.internal:4001`.
- Commands: `pnpm e2e:smoke` (no auth), `pnpm e2e:ui` (auth + e2e mode).
- Existing baselines: `e2e/playwright/smoke/landing-visual.spec.ts-snapshots/`
  and many `e2e/playwright/ui/*-visual.spec.ts-snapshots/`.
- Update snapshots: `pnpm e2e:ui -- --host <host> --update-snapshots <test>`.

### Workflow per phase

1. Before touching BS/jQuery: freeze/extend the visual baseline.
2. After each phase: re-run `pnpm e2e:ui`; diffs = regressions.
3. The engineer runs Playwright; the agent writes specs but does not run against QA/SSO.

---

## 8. Risks & mitigations

| Risk                                                               | Mitigation                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Phase 5 is one large merge (D3) → conflicts with weekly features   | Merge phases 2–4 first; keep Phase 5 short; use a quiet release window. |
| CSS regressions (grid/forms/utilities) — most likely failure class | Playwright visual gate is mandatory before/after Phase 5.               |
| Rewriting all BS JS calls natively (D4) increases Phase-3 surface  | Centralise in one engine; test event delegation in AJAX-loaded modals.  |
| react-bootstrap 2.x Overlay/Popover API changes (3–4 lbaas2 files) | Treat as real rework, not prop rename; cover with specs.                |
| `data-target` test-ids wrongly renamed                             | Script excludes values not starting with `#`.                           |
| BS3-only plugins break under BS5 CSS                               | Replaced in Phase 4 before the switch.                                  |

---

## 9. Progress log

| Phase | Status      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | In progress | Document created; §4b added from `bs5-spike` SPIKE-NOTES. Baseline specs pending.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1     | Done        | jQuery 1.12.4→3.7.1; `.error/.complete/.success` AJAX calls fixed (4 sites); multiselect jQuery override → all jQuery CVEs cleared; build green.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2     | In progress | react-bootstrap 0.33→2.10.10; 2 build-breakers fixed (Label→Badge, deep import); `bsStyle`→`variant`, `bsSize`→`size`, `bsClass` handled; PopoverInfo/CopyPastePopover/FloatingFlashMessages → rb2 Popover.Body. Build+typecheck green. **Remaining: runtime render verification per component (manual), findDOMNode shim removal, Modal/Form API edge cases.**                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3     | In progress | **Native BS JS.** Added `core/bs3_jquery_bridge.js` re-exposing `$.fn.modal/.tooltip/.popover/.collapse/.tab/.dropdown` on `window.jQuery` → BS5 classes with BS3 init+show semantics; guards both spike traps (`data-bs-no-jquery`, window.jQuery patch) + defensive `data-toggle`/`-dismiss`→`data-bs-*` mirror (skips the mega-dropdown). Fixed detached-modal append + `.modal.in`→`.show` + backdrop-guard in `dialogs.js`/`modal.js`; `Modal.tsx` shim `.in`→`.show`, `.close`→`.btn-close`. Build+typecheck green. **Deviation from D4:** a jQuery bridge is used as a staging unblock rather than rewriting every call-site natively (spike #6/#7/#12 show pure-native modal-lifecycle rewrite is highest-risk); bridge is removable later. **Manual browser verification pending.** |
| 4     | In progress | View markup: `btn-default`→`btn-secondary` (156 files), `pull-*`→`float-*` (52), `sr-only`→`visually-hidden` (10); app-owned `.hidden` + `.caret` utilities re-added. **Remaining: `.panel`→`.card` (structural), form system (`form-group`/`control-label`/`help-block`), `input-group-addon`, `label-*`→`badge`.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | In progress | **SCSS pipeline → Bootstrap 5.** npm `bootstrap` 3.4.1→5.3.8; removed `bootstrap-sass` gem; `node_modules` added to Sprockets asset paths (`assets.rb`); import chain → `bootstrap/scss/bootstrap`. `application.css` compiles green (861 KB, contains `--bs-*` + `.btn-close`). JS build green. **Deviation from D3:** a ~230-line `_bs5_compat_shim.scss` was required (BS3 vars/mixins the custom theme still references — `$line-height-computed` etc., px-pinned); this matches spike FINDING #4/#5. Shim is temporary, to be removed once views/theme use native BS5. **View markup (classes/`data-*`) NOT yet migrated → UI will look broken until Phase 4.**                                                                                                                         |
| 6     | Not started |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

---

## 10. Related documents

- **`SPIKE-NOTES.md`** (branch `bs5-spike`) — empirical experience report; source
  of §4b. Read FINDING #14 before touching anything.
- **`docs/bootstrap5-migration.md`** (branch `docs/bootstrap5-migration-plan`) —
  the team's official plan (dungeon-campaign framing, Phase 0–6, Tier A/B/C plugin
  tables, compat-shim strategy, "touch it, type it" TS rule, `_monsoon_theme.scss`
  2842-line theme, `bootstrap-kaminari-views` pagination). Our document and that
  one agree on the core inventory; they differ on D3 (shim vs. global — see OQ1)
  and on where native BS-JS rewriting happens. Reconcile before implementation.
