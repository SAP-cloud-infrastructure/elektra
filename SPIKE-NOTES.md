# Bootstrap 5 Spike — Experience Report (scratch notes)

> Throwaway notes written during the spike in worktree `bs5-spike`.
> Maps each doc assumption to observed reality. NOT committed to master/doc branch.
>
> **Companion document:** the migration *plan* lives in `docs/bootstrap5-migration.md` on branch
> `docs/bootstrap5-migration-plan` (its Phase 0–6 roadmap). This file is the empirical
> reality-check of that plan's assumptions. When picking the spike back up, read the plan's phases
> first, then jump to the matching FINDING below:
> - Plan "Phase 1 — SCSS pipeline" → FINDING #1 (two pipelines; **CSS is Sprockets, not esbuild**)
> - Plan "Phase 2 — react-bootstrap" → FINDING #8, #6/#7 (build barely breaks; runtime/visual is the risk)
> - Plan "Phase 3 — jQuery plugins" → FINDING #7, #11, #12 (bridge works, but behavior/overwrite traps)
> - Plan "Phase 4 — View markup" → FINDING #9, #13, #14 (removed classes; theme vs. views; end-to-end example)
> - Operational gotchas for any future session → **FINDING #14** (read this before touching anything).

## Environment

- git ops: ws-ide shell, worktree at `/workspace/elektra/.claude/worktrees/bs5-spike`
- build/start: `elektra` container, worktree visible at `/app/.claude/worktrees/bs5-spike`
- node v22.23.0, pnpm 8.15.0 (both correct per .nvmrc / CLAUDE.md)
- Had to copy `.npmrc` into worktree + `pnpm install` (worktree has no own node_modules).

## Step 0 — Baseline ✅

- `pnpm build` (unchanged BS3) → **green**. Only pre-existing warnings (Sass @import
  deprecation, browserslist stale, import.meta in smartops). None Bootstrap-related.

## FINDING #1 (biggest so far) — The SCSS pipeline: there are TWO, and the doc was right

Prior session concluded "SCSS is compiled by esbuild via sass.compile → doc's Sprockets claim is
wrong." **That conclusion was itself wrong.** Reality:

### Two independent SCSS pipelines coexist

1. **Sprockets (Rails asset pipeline) — THIS compiles Bootstrap core CSS**
   - `app/assets/config/manifest.js`: `//= link application.css`
   - Layouts: `= stylesheet_link_tag 'application'` (all 7 layouts)
   - `application.scss.erb` is `.erb` → **esbuild's inline-styles plugin does NOT match it**
     (filter is `/.*\.(css|scss)$/`, no `.erb`). Sprockets renders the ERB + compiles the SCSS.
   - `@import "bootstrap-sprockets"` / `"bootstrap"` / `"bootstrap/theme"` resolve via the
     **`bootstrap-sass` (3.4.1) gem** sass load path:
     `vendor/bundle/.../bootstrap-sass-3.4.1/assets/stylesheets/_bootstrap{,-sprockets}.scss`
   - Stack: `bootstrap-sass 3.4.1` + `sassc-rails 2.1.2` + `sassc 2.4.0` + `sprockets 4.2.2`
   - npm `bootstrap@3.4.1` ships **only `less/`, no `scss/`** → irrelevant to the CSS.
   - No `application.css` in `app/assets/builds/` → confirms it's NOT esbuild output.

2. **esbuild (`inline-styles` plugin, `sass.compile`, loadPaths `./node_modules`)**
   - Only plain `.scss` (no `.erb`): `app/javascript/tailwind.scss`,
     `app/javascript/widgets/landing_page/styles.scss`, plugin widget styles.
   - This is Tailwind + a few widget styles — **NOT** Bootstrap core.

### Consequence for the migration plan

- The BS3→BS5 SCSS swap is a **Sprockets + bootstrap-sass-gem** problem, not an esbuild/npm one.
- BS5 dropped the official `bootstrap-sass` gem (BS4+ is npm-only, ships `scss/`). So the plan
  must **move Bootstrap SCSS from the Sprockets/gem path to the npm/esbuild path** — i.e. change
  which pipeline owns Bootstrap. That is a bigger structural change than "swap @import lines".
- Doc's "bootstrap-sass gem (Sprockets)" description = **CORRECT**. The prior-session correction
  that flipped it to esbuild = **wrong, must be reverted in the doc.**

## TODO next
- Step 1: bump npm bootstrap 3.4.1 → ^5.3.x, observe pnpm install (react-bootstrap 0.33 peer).
- Step 2: the real SCSS break will surface in the **Sprockets** build (rails assets / server),
  not necessarily `pnpm build`. Need to decide whether to point application.scss.erb at the
  npm BS5 scss path and let sassc compile it, or move it to esbuild. Observe sassc errors on
  _variables/_mixins/_monsoon_theme (BS3 vars: $brand-primary, $screen-*, make-md-column).

## Step 1 — npm bootstrap 3.4.1 → 5.3.8 ✅ (install clean)

- `pnpm install` swapped bootstrap 3.4.1 → 5.3.8 **without conflict**.
- react-bootstrap 0.33.1 did **NOT** complain → it doesn't declare bootstrap as an npm peer dep;
  it expects BS3 CSS to be present globally at runtime. **Confirms doc thesis: the react-bootstrap
  conflict is a CSS/runtime problem, not an install-time one.**
- Pre-existing peer warnings (eslint-plugin-vitest, d3-transition) unrelated to Bootstrap.
- bootstrap@5.3.8 now ships `scss/bootstrap.scss` (BS3 npm shipped only `less/`).
- Side-effect: husky prepare failed (`not a git repository: .../worktrees/bs5-spike`) — worktree
  .git indirection; harmless for spike.

## FINDING #2 — Bootstrap SCSS lives in the GEM path, which BS5 can't satisfy

- bootstrap@5.3.8 `scss/` is only reachable via **node_modules** (npm/esbuild loadPath).
- Sprockets resolves `@import "bootstrap"` via the **bootstrap-sass gem** load path. Gem still
  present (Gemfile unchanged) → `@import "bootstrap"` would still pull **BS3** scss from the gem.
- Changed `application.scss.erb`: `@import "bootstrap-sprockets"/"bootstrap"/"bootstrap/theme"`
  → `@import "bootstrap/scss/bootstrap"` (attempt to reach the npm BS5 path).
- **Open:** Sprockets' sassc load path does not include `node_modules`, so this import likely
  won't resolve under Sprockets without adding node_modules to the asset paths OR moving the
  whole Bootstrap stylesheet to the esbuild pipeline.

## BLOCKER (environment, not Bootstrap) — Ruby/Sprockets can't run in the worktree

- `bundle exec rails` / `ruby` fails in the worktree:
  `Bundler::GitError: https://github.com/sapcc/elektron (at v2.2.5) is not yet checked out`.
- Cause: `elektron` is a **git-sourced gem**; bundler resolves its checkout relative to the
  worktree `.git`, which differs from the main checkout. Needs `bundle install` in the worktree
  (which requires the authenticated elektron git clone — see commit 75286c0e2).
- Same class of worktree friction as husky. The **JS/esbuild half runs fine in the worktree;
  the Ruby/Sprockets half does not** without extra setup.
- → This is exactly why the SCSS pipeline question matters: to observe the Sprockets SCSS break
  (the doc's "high risk" SCSS phase) we need a working Rails asset compile.

## RESOLVED — Ruby/Sprockets now runs in the worktree

- `bundle install` in the worktree (container, `--workdir /app/.claude/worktrees/bs5-spike`)
  checked out the elektron git-gem locally → `bundle exec rails` works. Blocker was worktree-only.

## FINDING #3 — The real SCSS break, measured empirically

Triggered the Sprockets compile: `rails runner 'Rails.application.assets.find_asset("application.css")'`.

### Break 3a — node_modules not on Sprockets sass load path
- `@import "bootstrap/scss/bootstrap"` → `SassC::SyntaxError: File to import not found` (line 19).
- Confirms FINDING #2: Sprockets' sassc load path does NOT include node_modules.
- **Spike fix:** `config/initializers/assets.rb` →
  `config.assets.paths << Rails.root.join("node_modules")`. One line. BS5 scss then resolves and
  **compiles through Bootstrap itself** — Bootstrap 5 core SCSS is NOT the problem.

### Break 3b — our custom SCSS uses BS3 variables/mixins BS5 removed (THE real work)
- First error after 3a: `Undefined variable: "$line-height-computed"` at `_monsoon_theme.scss:161`.
- Measured the full BS3-only surface across `app/assets` + all plugins:

  **Variables (~75 refs, but concentrated):**
  - `$line-height-computed` — **51** (dominant; BS3-derived, defined nowhere locally)
  - `$brand-primary/success/info/warning/danger` — 13 total
  - `$font-size-base` — 5, `$link-color` — 2, `$screen-sm/md/lg` — 3,
    `$border-radius-base` — 1

  **Mixins (7 refs):**
  - `@include make-md-column` — 3, `box-shadow` — 1, `transition` — 1,
    `border-top-radius` — 1, `opacity` — 1

  **Spread: only 6 files** — 2 core (`_mixins.scss`, `_monsoon_theme.scss`) + 4 plugins
  (kubernetes, masterdata_cockpit, tools/universalsearch, webconsole).

### Interpretation
- The doc's "SCSS is the biggest / high-risk block" is **directionally right but overstated in
  shape**: Bootstrap 5 core compiles fine; the break is a **small, concentrated set of removed
  BS3 variables/mixins in 6 custom files**, dominated by ONE variable (`$line-height-computed`).
- This is almost tailor-made for the doc's **compat-shim** idea: a short SCSS prelude defining the
  handful of removed BS3 vars/mixins in terms of BS5 equivalents
  (`$line-height-computed: $font-size-base * $line-height-base`, `$brand-primary: $primary`, …,
  `@mixin make-md-column` → BS5 grid) could unblock the bulk. Next: test that thesis stumpf.

## FINDING #4 — The compat-shim thesis TESTED: it works, until unit math

Built a throwaway `_bs3_compat_shim.scss` (imported right after `bootstrap/scss/bootstrap`) and
drove the Sprockets compile iteratively. Observed **four distinct break classes**, in order:

1. **Missing BS3 variables** (easy): compile walked 161 → 215 → 403 … each a removed BS3 var.
   Total truly-missing (referenced, not in BS5, not defined locally): **~23 vars** on top of the
   ~12 I seeded first → a **~30–35 variable** bridge. Dominated by `$line-height-computed` (51
   refs). Shimmable in one small file. ✅ thesis holds.

2. **Missing BS3 mixins** (easy): `box-shadow`, `transition`, `opacity`, `border-top-radius`,
   `make-md-column` — 5 mixins, trivial to re-provide. Most `@include`s in our SCSS are **custom
   Elektra mixins** (`spinner`, `pie-clearfix`, `fa-icon`, `button-variant-outline`), not BS. ✅

3. **Mixin signature collisions** (medium): `button-size` exists in BS5 but with 4 args (BS3: 5).
   Same name, incompatible API. Must override in the shim. This is the CSS-level analogue of the
   `data-toggle`→`data-bs-toggle` behavioral break the doc warns about. Few occurrences.

4. **Unit incompatibilities** (the real cost): `Incompatible units: 'px' and 'rem'` at
   `_monsoon_theme.scss:851`: `($line-height-computed / 2) - 2px`. BS5 moved base vars from `px`
   to `rem`; any custom arithmetic that mixed them now breaks. A pure variable/mixin shim CANNOT
   fix these — **each calc must be touched by hand**. These surface one-by-one through the 2842-line
   theme. This, not "missing variables", is the genuine SCSS-port labor.

### SCSS verdict
- Doc's "SCSS = high risk / biggest block" → **nuanced**: Bootstrap 5 core compiles instantly;
  classes (1)+(2) are a cheap ~35-line shim; the real, irreducible work is classes (3)+(4) —
  signature collisions and px/rem arithmetic — concentrated in `_monsoon_theme.scss` (2842 lines).
  Risk is "medium, bounded, mechanical" rather than "high / open-ended". The compat-shim idea is
  **validated for ~80% of the surface**; the last 20% (unit math) needs manual edits, not a shim.
- The doc's claim that a CSS-only shim can't fix behavioral breaks → **confirmed, and extends to
  unit math**: the shim unblocks symbols, not px/rem semantics.

## STOPPING POINT for the SCSS dimension
Reached a clear, quantified picture of the SCSS break (4 classes, sizes measured). Did NOT port
every px/rem calc — that's migration labor, not spike. Next spike dimension: JS side (essentials.js
`import "bootstrap"` BS5, the 5 jQuery plugins) + does the app boot in the browser.

## UPDATE — moved spike to main checkout + SCSS now COMPILES GREEN

Per user: the worktree was awkward (dev server serves /app, not the worktree). Moved the whole
spike onto branch `bs5-spike` **in the main checkout** (`/workspace/elektra` = container `/app`),
discarded the worktree. All build/install runs via `docker exec elektra` (container is root →
avoids the permission issues worktree node_modules caused).

### SCSS: application.css compiles with Bootstrap 5 (863 KB output)

Drove the Sprockets compile to green. **Total cost to get there:**
- `_bs3_compat_shim.scss` — **97 lines** (~40 vars + 8 mixins): the BS3→BS5 bridge.
- `config/initializers/assets.rb` — **1 line** (`config.assets.paths << node_modules`).
- `application.scss.erb` — import chain (3 BS3 lines → 2: bootstrap npm scss + shim).
- `_monsoon_theme.scss` — **exactly 2 line edits** in a 2842-line file
  (`$font-size-medium` px pin; one breadcrumb px/rem calc).

### The px/rem story, resolved
The unit clashes (FINDING #4 class 4) came from BS5 moving base vars to `rem`. Fixed centrally by
pinning the BS3-derived vars to their old **px** values in the shim (`$line-height-computed: 20px`,
`$font-size-*` px, `$grid-gutter-width: 30px` — the last WITHOUT `!default` to override BS5). That
collapsed ~all the "Incompatible units" errors to just 2 hand-edits. So class 4 is **more shimmable
than feared**, as long as you accept pinning the bridge vars to px (semantically fine for a theme
that was authored against BS3 px).

### Revised SCSS risk assessment
Doc says "SCSS = highest risk, biggest block." Empirically: **~100 lines of shim + a handful of
targeted edits** got the full Sprockets stylesheet (Bootstrap 5 + 2842-line custom theme + all
plugin SCSS) to compile. Risk is **LOW–MEDIUM and mechanical**, not high/open-ended. The compat-shim
idea is strongly validated. Caveat: "compiles" ≠ "looks right" — visual regressions (grid floats,
spacing, removed BS3 component classes) are the next unknown, visible only in the browser.

### Still open before the shim is "real" (not spike)
- Plugin SCSS compiled via **esbuild** (separate entrypoints) do NOT see this Sprockets-side shim.
  Need to check whether plugin widget styles that use BS3 vars break under esbuild too.
- `$grid-gutter-width: 30px` override lands AFTER BS5 generated its grid → fine for custom SCSS,
  but means our grid gutters and BS5's differ. Acceptable for spike.

## FINDING #5 — Both build pipelines are GREEN with Bootstrap 5; app boots

### esbuild JS build: green
`pnpm build` compiles with no errors. Confirms:
- `essentials.js` `import "bootstrap"` (BS5, jQuery-free) does NOT break the build.
- The 5 jQuery plugins (multiselect, 3-typeahead, slider, select, datetimepicker) still build —
  they attach to jQuery, not BS-core. **Doc/plan thesis confirmed.**
- react-bootstrap 0.33 does NOT break the build either.

### App boots on Bootstrap 5
- Rails (puma 7.2.1) up on :8010, JS watch build up.
- `GET /` → 200, redirects to `/monsoon3` → 200. Title renders.
- `GET /assets/application.css` → 200, **863 KB, contains `--bs-*` custom properties** → it IS
  Bootstrap 5 being served (BS3 had no CSS custom properties).
- First request took ~75 s (live asset compile), then cached.

### What's NOT yet observed (needs auth'd app pages in a browser)
- The landing page is lean (`landing_page_widget.js` only) — no react-bootstrap, no jQuery-BS on
  it. The interesting runtime breaks (react-bootstrap 0.33 Alert/Carousel/Modal rendering against
  BS5 CSS; `data-toggle` dropdowns/tooltips that need `data-bs-toggle`; the jQuery widgets) live on
  **authenticated dashboard pages**. Reaching those needs OpenStack auth or `RAILS_ENV=e2e` (mock
  services) + a browser/Playwright for screenshots + console errors.
- So far: **build-time and boot-time are green**; the predicted damage is **runtime/visual**, which
  matches the doc's thesis (react-bootstrap 0.33 markup/behavior vs BS5 is a runtime problem, not a
  compile problem).

## Running summary: doc assumption → spike reality
| # | Doc assumption | Spike reality | Verdict |
|---|---|---|---|
| 1 | SCSS via bootstrap-sass gem / Sprockets | TRUE — Sprockets+gem compiles app CSS; esbuild only does Tailwind + widget styles | ✅ (prior-session "it's esbuild" correction was WRONG) |
| 2 | react-bootstrap 0.33→v2 hard breaking (107 files) | Install + both builds stay green; conflict is runtime/CSS, not build | nuanced — not a build blocker |
| 3 | 5 jQuery plugins block / need work | They still build fine on BS5 (attach to jQuery) | ✅ build-safe; runtime TBD |
| 4 | Compat-shim: CSS-only, same class names collide | Shim works for ~95% of SCSS; px/rem + mixin-signature need targeted edits | ✅ validated, cheaper than feared |
| 5 | SCSS = highest risk, biggest block | ~100-line shim + 2 theme edits → full stylesheet compiles | overstated — LOW-MEDIUM, mechanical |
| 6 | BS-native `.modal()/.tooltip()` jQuery API (~43) is a real break | CONFIRMED at runtime: `$(...).modal is not a function` breaks the project list immediately | ✅ THE dominant runtime break |

## FINDING #6 — The dominant runtime break: BS-native jQuery API is gone (user-observed)

User started the app (RAILS_ENV=e2e on :8010) and clicked through. **App loads but "everything
looks broken"**, and the console shows:

```
Uncaught TypeError: $(...).modal is not a function
    at handleUrl (stateful_links.js:47:38)
    at HTMLDocument.<anonymous> (stateful_links.js:129:5)
```
→ **the project list doesn't load** because of this.

### Root cause (exactly as doc predicted for this category)
Bootstrap 5 dropped its jQuery plugin bridge. `$.fn.modal` / `.tooltip` / `.popover` / `.collapse`
no longer exist. Elektra's core JS calls them directly and pervasively.

### Measured surface (source, excl. builds/node_modules)
- `.modal()` × 18, `.tooltip()` × 11, `.popover()` × 3, `.collapse()` × 3 = **35 calls**
- across **14 files**: core (`modal.js`, `dialogs.js`, `stateful_links.js`, `init.js`, `snippets.js`,
  `Overlay.jsx`, …) + plugins (identity, kubernetes, networking, webconsole).
- Doc estimated ~43 for this category — **same order of magnitude**, slightly lower.

### Interpretation
- This is NOT fixable by the SCSS shim at all — it's behavioral JS. Each call site must be migrated
  to BS5's native JS API (`bootstrap.Modal.getOrCreateInstance(el).hide()` etc.) or a thin jQuery
  bridge shim must be written (`$.fn.modal = function(){ ... bootstrap.Modal ... }`).
- **This, not SCSS, is the real "biggest block."** The doc ranks SCSS as highest-risk; the spike
  shows SCSS is mechanical/bounded while the **jQuery-API-removal is the pervasive, app-breaking
  change** that blocks even the first authenticated page. Risk ranking in the doc should be flipped:
  **JS behavioral (modal/tooltip/data-bs) > SCSS**.
- Confirms the compat-shim limitation note in the doc: a CSS-only shim cannot fix this; a **JS
  bridge** (re-expose `.modal/.tooltip/...` on jQuery, delegating to BS5's JS) would be the
  cheapest unblock and is worth adding to the plan as an explicit option.

## FINDING #7 — A jQuery bridge shim fixes the *missing method*, NOT the *behavior* (the deeper break)

Built a throwaway JS bridge (`app/javascript/core/bs3_jquery_bridge.js`, imported in
`essentials.js` right after `import "bootstrap"`) that re-exposes `$.fn.modal/.tooltip/.popover/
.collapse` by delegating to BS5's `getOrCreateInstance(el)` + method dispatch. Build stays green.

### What the bridge fixed
- The `$(...).modal is not a function` TypeError is **gone**. The project list loads. ✅
- First-order symptom (app crashes on DOM-ready) resolved with a ~50-line shim.

### What the bridge did NOT fix — BS3→BS5 behavioral semantics
User: open a modal (e.g. "edit project") → URL changes to `?overlay=/…/identity/project/edit…`
and **stays there**, a "Loading" flashes, then the modal **immediately closes again**.

Two behavioral deltas a method-only shim cannot bridge:

1. **`.modal()` bare call = init-only in BS5, init+show in BS3.** First shim pass only constructed
   the instance → modal never shown. Added `autoShow` (modal/collapse call `.show()` on bare/options
   invocation; tooltip/popover must NOT). This is a real semantic difference, now partly bridged —
   but it shows every call site's *intent* must be re-encoded, not just the method name.

2. **Backdrop / transition timing (the one still breaking).** `MoModal.load()` (core/modal.js):
   - `InfoDialog.showLoading()` → `$ajaxLoader.modal("show")` adds a `.modal-backdrop` to `<body>`.
   - on AJAX done: `InfoDialog.hideLoading()` → `$ajaxLoader.modal("hide")`, then **synchronously**
     `if ($(".modal-backdrop").length === 0) { …open content modal… }` (modal.js:175).
   - **BS5 removes the backdrop asynchronously** (via transition/rAF), so at line 175 the backdrop
     is still in the DOM → the guard is false → the content modal is **never opened** → URL keeps
     `?overlay=` and only the loader flashed. Under BS3 the loader (no `.fade`) tore its backdrop
     down synchronously, so the guard passed.
   - This is NOT a missing method; it's **lifecycle/timing semantics** baked into Elektra's modal
     orchestration (load → showLoading → hideLoading → check-backdrop → show-content). No jQuery
     shim re-creates BS3's synchronous backdrop teardown without also re-implementing BS5 internals.

### Interpretation (sharpens Finding #6)
- The jQuery-API break has **two layers**: (a) the *symbol* (`$.fn.modal` missing) — cheap, a shim
  closes it; (b) the *behavior* (init-vs-show, backdrop/transition timing, event order) — this is
  the real cost and is **per-call-site migration work**, exactly what the doc warns a compat layer
  cannot absorb.
- Elektra's imperative jQuery modal orchestration (`MoModal`, `InfoDialog`, `stateful_links`'
  `?overlay=` routing, `dialogs.js` confirm dialogs) is tightly coupled to **BS3 modal lifecycle
  details**. Porting it means rewriting that orchestration against BS5's `Modal` API, not swapping
  method names — a bigger, riskier chunk than the SCSS shim.
- **Revised risk ranking for the plan:** `JS behavioral (modal lifecycle / backdrop / data-bs) `
  `>> SCSS`. The SCSS was ~100 lines of mechanical shim; this is genuine logic rework in the core
  JS, and it blocks the primary user flow (any overlay/modal action) immediately.
- A jQuery bridge is still worth it as a **first unblock** (gets the app interactive, surfaces the
  react-bootstrap/CSS layer underneath), but it is explicitly a *staging* tool, not the migration.

## FINDING #8 — react-bootstrap 0.33 → 2.10.10: the BUILD barely breaks (2 fixes), runtime is the risk

Bumped `react-bootstrap` `0.33.1 → ^2.10.10` and reinstalled/rebuilt in the elektra container.
Note: this repo is already on **React 19.2.8** (not 18 as CLAUDE.md says), with a hand-written
`react19-finddomnode-shim.js` + a custom `lib/components/Modal.tsx` ("React-19-compatible drop-in
replacement for react-bootstrap@0.33 Modal") — i.e. someone already started peeling off rb0.33
because it calls the `findDOMNode` React 19 removed. **rb2 no longer needs that shim** (it's
fully ref-based) and its peer deps (`react >=16.14`) are satisfied by React 19.

### Scope: ~130 source files import react-bootstrap
`grep` across `app/` + `plugins/` (excluding `app/assets/builds/`): **~130 files**. Matches the
doc's "107 files / hard breaking change" order of magnitude.

### Install: clean
`pnpm install` swapped 0.33.1 → 2.10.10 with no new conflicts (only the pre-existing
eslint-plugin-vitest / d3-transition peer warnings). rb2 declares react as a real peer dep now,
satisfied by 19.2.8.

### Build: only TWO breaks, both trivial symbol-level
Every import is a **named barrel import** (`import { Alert, Button, ... } from "react-bootstrap"`),
and esbuild does NOT typecheck props — so API/prop changes do NOT break the build, only two
structural things did:
1. **`react-bootstrap/lib/<Comp>` deep-import path removed in rb2** — `error_row.jsx` only. Fixed:
   `import { Button } from "react-bootstrap"`.
2. **`Label` component removed in rb2** (→ `Badge`) — `StateLabel.jsx` only. Fixed:
   `import { Badge as Label }`.

Measured the full barrel-import surface and checked each against rb2's actual exports:
| component | uses | in rb2? |
|---|---|---|
| Button | 90 | ✅ |
| Alert | 18 | ✅ |
| Collapse | 10 | ✅ |
| Table | 5 | ✅ |
| Popover | 3 | ✅ |
| Overlay | 3 | ✅ |
| Form | 2 | ✅ |
| Tooltip | 1 | ✅ |
| FormControl | 1 | ✅ |
| Carousel | 1 | ✅ |
| **Label** | 1 | ❌ → Badge |

→ **10 of 11 distinct components still export under the same name.** The build went green after 2
one-line edits. `pnpm build` = **success, no errors.**

### Interpretation
- The doc frames rb0.33→v2 as a "hard breaking change across 107 files." **Build-wise that's
  overstated**: named-barrel imports + esbuild (no prop typecheck) mean only *removed/renamed
  symbols* break compilation — here exactly 2. The ~130 files compile unchanged.
- **The real breakage is runtime/visual** (same shape as Finding #6/#7 for jQuery): rb2 changed
  nearly every component's **props/behavior** — `bsStyle` → `variant`, `Panel` → `Card`, Modal/
  Overlay API, controlled Form components, event signatures. esbuild won't catch any of it; it
  surfaces only when the component renders (and `pnpm typecheck` would flag the TS ones).
- So the rb migration cost is NOT "make it compile" (nearly free) but "**re-wire props and verify
  every rendered component**" across ~130 files — a large but *mechanical-per-file* effort that can
  be done incrementally, file by file, because the build never gates it.
- This repo already proves the incremental path works: `Modal.tsx` + the finddomnode shim are a
  partial hand-migration living alongside rb0.33. rb2 lets several of those crutches be deleted.

### What to verify in the browser (next)
Do the **React widget apps** still render/run under rb2 (NOT the Juno apps — those live in a shadow
root and bundle their own styling, so they're isolated and expected fine)? Watch for: console
errors from changed props (`variant` vs `bsStyle`), broken Overlays/Popovers (lbaas2
PopoverInfo/CopyPastePopover), Alerts (global_notifications Carousel+Alert), and forms.

### Runtime CONFIRMED — the prop-rename break (user-observed), and it IS the "107 files"
User opened object_storage → "Create Container" and the console showed:
```
React does not recognize the `bsStyle` prop on a DOM element. … spell it as lowercase `bsstyle` …
```
Source: `object_storage/.../containers/New.jsx:48` `<Alert bsStyle="danger">`. rb2 renamed the
0.33 styling props; the component no longer consumes them, so React forwards them to the raw DOM
node (warning) and the element renders **unstyled**.

Measured the legacy-prop surface (real JSX `prop=` usage, excl. builds):
| 0.33 prop | rb2 replacement | uses | files |
|---|---|---|---|
| `bsStyle=` | `variant=` | 83 | 26 |
| `bsSize=`  | `size=` (+ value remap: `small`→`sm`, `large`→`lg`) | 186 | 85 |
| `bsClass=` | `bsPrefix=` | 85 | 30 |
| `bsRole=` / `bsPrefix=` | — | 0 | 0 |
| **distinct files touching any of the three** | | **354 uses** | **107** |

→ **This is exactly the doc's "107 files."** The spike now explains what that number *is*: it is
the count of files carrying renamed styling props, and the break is **100% runtime** (esbuild
compiled them all fine in Finding #8). The migration work for rb0.33→v2 is therefore:
- ~2 structural/build edits (done: `lib/` path, `Label`→`Badge`), **plus**
- ~354 prop renames across 107 files (`bsStyle`→`variant`, `bsSize`→`size` + value remap,
  `bsClass`→`bsPrefix`), **plus**
- the harder-to-grep component-API changes (Modal/Overlay/Panel→Card, controlled Form components)
  that neither the build nor a simple grep catches — found only by rendering each widget.
- Mostly **mechanical and codemod-able** (the three prop renames are a scripted find/replace),
  but every touched widget still needs a render check for the non-grep-able API changes.

## FINDING #9 — The "compiles ≠ looks right" gap, user-observed: removed BS3 classes + data-toggle

User clicked the gear (settings): the **list renders but the CSS is totally broken**, and the
**services dropdown doesn't open**. These are the two remaining dimensions the SCSS shim and JS
bridge deliberately do NOT cover — now confirmed in the browser.

### 9a — Removed/renamed BS3 component CSS classes (the "totally broken CSS")
The SCSS shim (Findings #4/#5) makes the stylesheet *compile* by re-providing BS3 **variables/
mixins**. It cannot bring back BS3 **component classes** that BS5 deleted/renamed from its output.
Elektra's HAML/ERB views + react-bootstrap still emit BS3 class names with no BS5 rules behind
them. Rough usage across `app/`+`plugins/` (grep, excl. builds; counts inflated by substrings but
directionally clear):
| BS3 class | BS5 replacement | ~uses | effect |
|---|---|---|---|
| `.panel*` | `.card*` | ~1200 | **the dominant one** — Elektra's main container, now unstyled |
| `.btn-default` | `.btn-secondary` | ~466 | nearly every secondary button unstyled |
| `.well` | `.card` | ~395 | removed |
| `.help-block` | `.form-text` | ~413 | form hints unstyled |
| `.label-*` | `.badge` | ~346 | matches Label→Badge (Finding #8) |
| `.control-label` / `.form-horizontal` | BS5 reworked form grid | ~200 ea | form layouts collapse |
| `.caret` | removed (CSS pseudo) | ~185 | dropdown carets gone |
| `.pull-right` / `.pull-left` | `.float-end/.float-start` | ~113 | float helpers gone |

→ This is a **view-layer rewrite** problem, independent of SCSS and JS: every HAML/ERB/JSX that
hard-codes a removed class must be updated (or a CSS compat layer must re-alias every removed class
to its BS5 equivalent — far bigger than the ~100-line variable/mixin shim, and semantically risky
because the markup structure also changed, e.g. panel head/body vs card header/body).

### 9b — `data-toggle` → `data-bs-toggle` (the dead services dropdown)
BS5 renamed every data API attribute with a `-bs-` infix AND dropped the jQuery plugin bridge, so
`data-toggle="dropdown"` is inert. The jQuery bridge shim (Finding #7) covers modal/tooltip/popover/
collapse but **not dropdown**, and even with it the attribute prefix is wrong. Measured:
| attribute | count | note |
|---|---|---|
| `data-toggle=` (BS3) | 146 | inert under BS5 |
| `data-bs-toggle=` (BS5) | 22 | partial hand-migration already present |
| `data-dismiss=` (BS3) | 23 | modal close buttons dead |
| `data-bs-dismiss=` (BS5) | 2 | partial |
| of which `data-toggle="dropdown"` | 22 | **= the broken services dropdown** |

→ 146 `data-toggle` + 23 `data-dismiss` = ~169 attribute renames in views, plus BS5's auto-init on
`data-bs-*` only works for components with the native JS loaded. Mechanical find/replace, but it's
a third distinct surface (view attributes) on top of SCSS and component classes.

### Consolidated: the migration has FOUR independent surfaces, not one
1. **SCSS vars/mixins** — ~100-line shim, mechanical. (LOW, Findings #4/#5)
2. **react-bootstrap props/API** — ~354 prop renames / 107 files + non-grep API changes, codemod +
   render-check. (MEDIUM, Findings #8 + runtime)
3. **jQuery behavioral JS** — modal lifecycle / backdrop timing / dropdown; symbol-shimmable but
   behavior must be rewritten per call site. (HIGH, Findings #6/#7)
4. **View-layer BS3 classes + data-toggle** — ~thousands of class refs + ~169 data-attr renames in
   HAML/ERB/JSX; this is what makes the UI look "totally broken" even when everything compiles and
   boots. (MEDIUM-HIGH by sheer volume, Finding #9)

The doc collapsed much of this into "SCSS = highest risk." Empirically, SCSS is the *cheapest*
surface; the real cost is spread across #2/#3/#4 — all **runtime/visual**, none caught by the build.
Notably, the repo already shows a partial hand-migration (22 `data-bs-toggle`, `Modal.tsx`,
finddomnode shim), confirming an **incremental, file-by-file** path is viable because the build
never gates these changes.

## FINDING #10 — Trying to fix in place: the bridges work, but reveal structural mismatches

Attempted to patch far enough to keep exploring. Added to the shims:
- JS bridge: `$.fn.dropdown` + `$.fn.tab`, and a **BS3→BS5 data-attribute mirror** (`data-toggle`
  →`data-bs-toggle`, `data-dismiss`→`data-bs-dismiss`, `data-target`, `data-parent`, carousel
  attrs) run on DOM-ready + `modal:contentUpdated`, so the ~146 inert `data-toggle` attrs trigger
  BS5's native data-API without editing 146 templates.
- SCSS compat: aliased the removed BS3 component classes (`.panel*`→`@extend .card*`, `.btn-default`,
  `.well`, `.label-*`, `.help-block`, `.caret`, `.pull-*`, `.control-label`, `.hidden`).
  Both builds stay green (JS compiles; `application.css` 863KB→868KB).

### The crash it exposed — custom markup BS5 can't parse
Clicking the gear now threw `dropdown.js:245 Uncaught TypeError: Cannot read properties of null
(reading 'classList')`. Root cause (BS5 `dropdown.js` L98-102): BS5 resolves the dropdown menu as
`SelectorEngine.next/prev(toggle, '.dropdown-menu')` or `findOne('.dropdown-menu', parent)`. The
breadcrumb **services ("mega") dropdown** (`app/views/application/_breadcrumb.html.haml:18-23`) is:
```haml
%li.dropdown.dropdown-mega
  %a.dropdown-toggle{"data-toggle" => "dropdown", …}
    %span.caret
  = render_navigation(renderer: :fancy_list, …)   # custom nav, NOT a .dropdown-menu
```
There is **no `.dropdown-menu`** — the menu is a custom `render_navigation` fancy-list. So BS5 sets
`this._menu = null` and crashes on first interaction. Blanket attribute-mirroring is **too coarse**:
Elektra has dropdowns whose structure BS5 does not understand.

### Fix for the spike + the lesson
Made the mirror **defensive**: only promote `data-toggle="dropdown"` to `data-bs-toggle` when a
resolvable `.dropdown-menu` sibling/child actually exists; custom/mega dropdowns are left to
Elektra's own handlers. Build green again.

**Lesson for the plan:** the `data-toggle→data-bs-toggle` rename is NOT a safe blanket find/replace.
A subset of Elektra's dropdowns use **non-BS markup** (`render_navigation` mega menu) that BS5's
dropdown JS cannot drive at all — those need either their own JS or a markup rewrite to BS5's
expected toggle+`.dropdown-menu` structure. This is a 4th-surface (#9) refinement: within the
"view-layer" bucket there are **custom BS3-dependent widgets** that are more than attribute renames.

## FINDING #11 — The jQuery plugins DO break at runtime (revises #3/#5), and the shared-jQuery trap

Finding #3/#5 said the 5 jQuery plugins "build fine and attach to jQuery, so they're safe." The
BUILD part holds, but at RUNTIME **bootstrap-select throws immediately** and aborts the whole
`application.js` DOM-ready chain (which is why no `[bs3-dbg]` modal logs ever appeared — init.js
line 259 never ran):
```
bootstrap-select.js:593  TypeError: Cannot read properties of undefined (reading 'Constructor')
There was an issue retrieving Bootstrap's version. Ensure Bootstrap is being loaded before
bootstrap-select … version may need to be manually specified via
$.fn.selectpicker.Constructor.BootstrapVersion
```
bootstrap-select sniffs the Bootstrap version via `$.fn.dropdown.Constructor.VERSION`
(bootstrap-select.js:610). So it needs `$.fn.dropdown` to exist — i.e. it depends on BS providing
its jQuery plugin bridge, which BS5 removed. Our JS bridge *does* define `$.fn.dropdown`, so this
should have worked — but it still crashed. Root cause: the **multi-entrypoint / multiple-jQuery
trap**.

### The shared-jQuery trap (important for any BS5 JS work here)
- Elektra builds **separate esbuild entrypoints**: `essentials.js`, `application.js`, `plugins`,
  per-plugin bundles. Each bundles its **own copy** of the `jquery` module.
- `core/jquery.js` sets `window.$ = window.jQuery = jquery` (essentials' copy) so everything shares
  ONE jQuery *at the global*. The plugins in `application.js` (bootstrap-select etc.) read `$.fn`
  off that **global** jQuery.
- Our bridge first did `import jQuery from "jquery"; const $ = jQuery` and patched `$.fn.*` on the
  **bundled** copy, which is NOT the same object as `window.jQuery`. So `window.jQuery.fn.dropdown`
  stayed undefined → bootstrap-select read `undefined.Constructor` → crash.
- Fix: patch **`window.jQuery`** (`const $ = window.jQuery || bundled`). Build green; BS5 components
  do expose `.VERSION` ('5.3.8'), so once `$.fn.dropdown` resolves, bootstrap-select's version
  sniff succeeds.

### Lesson for the plan
- **Revises #3/#5:** the jQuery plugins are build-safe but NOT runtime-safe. At least
  bootstrap-select hard-depends on BS's jQuery bridge existing; removing BS5's bridge breaks it on
  load, and because it's imported early in `application.js`, its throw **cascades** — it kills
  stateful_links/modal/init initialization downstream (so the modal auto-close we were chasing was
  partly masked by this earlier crash).
- Any BS5 migration here must account for the **multi-entrypoint multiple-jQuery** architecture:
  a jQuery-API bridge has to be installed on the *global* jQuery before any entrypoint's plugin
  code runs, or each plugin that version-sniffs/attaches will fail. This is an architectural
  constraint the doc does not mention.


## FINDING #12 — The modal auto-close: BS5's OPTIONAL jQuery integration silently overwrites the bridge (the hardest JS break so far)

**Symptom (user-observed):** opening any content modal (e.g. "Edit project") showed the loading
spinner for a split second and then the modal closed itself immediately with nothing displayed —
making the whole app unusable, since nearly every edit/new/delete action is a modal. Critically:
**no console logs from the bridge appeared on the open path**, which was the key signal that the
`.modal()` call was NOT going through our bridge at all.

### Root cause — BS5 re-registers its OWN jQuery plugin and overwrites ours
Bootstrap 5 is "jQuery-free", but it still ships an **optional jQuery integration**. Each component
calls `defineJQueryPlugin(Component)`, which runs on `DOMContentLoaded`:

```js
onDOMContentLoaded(() => {
  const $ = getjQuery() // = window.jQuery
  if ($) {
    const name = Component.NAME
    $.fn[name] = Component.jQueryInterface   // <-- OVERWRITES $.fn.modal
    $.fn[name].Constructor = Component
    ...
  }
})
```

The guard is only `if (window.jQuery && !document.body.hasAttribute("data-bs-no-jquery"))`. Elektra
sets `window.$ = window.jQuery` (core/jquery.js), so **the guard is always true** → BS5 registers
its own `$.fn.modal` on DOMContentLoaded, clobbering the bridge's `$.fn.modal` that was installed at
module-eval time earlier.

BS5's `jQueryInterface` has **BS3-incompatible semantics**: a bare `$el.modal()` with no args does
`getOrCreateInstance(this, config)` and then `if (typeof config !== 'string') return` — i.e.
**init-ONLY, no `show()`**. BS3's `.modal()` did init **AND** show. So Elektra's
`.html(data).find(".modal").modal()` (core/modal.js) constructed the Modal instance but **never
displayed it**, and the loader's own backdrop/`modal-open` teardown then left a blank page →
"opens then immediately closes."

**Proof:** a setter trap on `$.fn.modal` logged `$.fn.modal REASSIGNED! new __isBridge=false` with
a stack landing inside BS5's `defineJQueryPlugin` → `HTMLDocument.<anonymous>` (the DOMContentLoaded
handler). The injected `.modal()` call hit BS5's init-only interface (`__isBridge=false`,
`_isShown=false` right after the call), not our bridge.

### Spike fix (two parts, in `core/bs3_jquery_bridge.js`)
1. **Opt out of BS5's jQuery auto-registration:** set `document.body.setAttribute("data-bs-no-jquery", "")`
   as early as the body exists (BS5 reads this flag at DOMContentLoaded). This stops BS5 from
   registering its init-only `$.fn.modal` at all, so our bridge (BS3 init+show semantics) stays
   authoritative.
2. **Belt-and-suspenders re-install:** also re-assign `$.fn[name] = fn` inside a DOMContentLoaded
   listener, to beat any listener-ordering race where BS5's handler still runs.

The bridge itself maps a bare `$el.modal()` → `instance.show()` (autoShow) to restore BS3's
init+show. After this, the edit-project modal opens and stays open (user confirmed "es hat
funktioniert").

### Secondary fixes that were also needed (NOT the root cause, but real)
While chasing the wrong hypotheses, two genuine BS5 behavior changes were also fixed and kept:
- **Detached loader must not drive a BS5 Modal.** `core/dialogs.js` builds `$ajaxLoader`/`$dialog`
  as detached fragments. BS3 auto-appended a detached modal on `.modal("show")`; BS5 does NOT, and
  a detached modal still mutates the *global* `body.modal-open` + shared `.modal-backdrop` and tears
  them down **asynchronously** (`_queueCallback`), racing the content modal. Fix: `showLoading()`/
  `hideLoading()` were rewritten as a **plain overlay** (no BS5 Modal instance at all — just a div +
  its own `bs3-loading-backdrop`, torn down synchronously), and `InfoDialog.show()` appends `$dialog`
  to `<body>` before `.modal()`.
- **Backdrop guard removed.** `core/modal.js` `load().done` previously only swept
  `.modal-backdrop` when `=== 0`; under BS5's async teardown that count is unreliable, so it now
  removes stray backdrops unconditionally before injecting.

### Interpretation (sharpens #6/#7)
- The dominant break is **not** a missing method (that was #6/#7) — it's that BS5's *presence of an
  optional jQuery bridge* actively fights any hand-rolled bridge, silently, at DOMContentLoaded.
  Any migration that keeps `window.jQuery` around AND relies on `.modal()` MUST either set
  `data-bs-no-jquery` or accept BS5's init-only jQuery semantics (and add explicit `.show()` calls
  everywhere). The doc does not mention `data-bs-no-jquery` or the init-vs-init+show difference —
  this is a concrete gap to add.
- Textbook HIGH-risk **category 3** break: method exists, call compiles, no type/build error — the
  break is pure runtime semantics + listener ordering, findable only by clicking the app and (here)
  trapping the setter. The cause was also **non-local**: symptom in `modal.js`, cause in BS5's own
  DOMContentLoaded handler plus `dialogs.js`'s detached loader.
- **For the plan:** audit everything that reads/writes `$.fn.modal` (and `.tooltip/.popover/...`),
  the detached-modal pattern in `dialogs.js`, and the loader/content-modal interleaving as one
  coupled jQuery-JS surface, not file-by-file.


## FINDING #13 — Migrating the custom theme's selectors to BS5 names while the shim bridges the still-BS3 markup

**What was done (user-directed test of a real theme migration):** rewrote the Bootstrap-3-specific
**component-class selectors** in `app/assets/stylesheets/_monsoon_theme.scss` (2842 lines) to their
BS5 names, while deliberately **keeping the BS3 variables/mixins** (`$line-height-computed`,
`$brand-*`, `$font-size-h*`, `make-md-column`, `button-size`, …) that the compat shim still
provides. The views (HAML/ERB) still emit BS3 class names, so the shim's `@extend` aliases
(`.panel { @extend .card }` etc.) keep the old markup rendering against the renamed BS5 rules
during the transition.

### The two kinds of rename — and the asymmetry that matters
- **Mechanical, keep both names (co-selectors):** most families were a pure rename where the BS5
  class simply did not exist in BS3, so we pair the BS5 name with the legacy BS3 name until the
  markup catches up:
  - `.input-group-addon` → **`.input-group-text`**
  - `.label-*-greyscale` → **`.badge-*-greyscale`** (BS5 renamed `.label` → `.badge`)
  - `.navbar-inverse` → **`.navbar-dark`** (two sites)
  - `.nav > li > a.navbar-identity` → **`.nav-link.navbar-identity`** (BS5 nav has no `li > a` wrapper)
  - `.radio-inline` / `.checkbox-inline` → **`.form-check-inline`** (+ `.form-check-input`)
- **`@extend` retargeting (clean, drops the shim dependency for that rule):** the three
  `bs-callout` buttons did `@extend .btn-default` (a shim alias). Retargeted to `@extend
  .btn-secondary`, which is a **native BS5 class**, so those rules no longer need the shim at all.
- **Structural, not just a rename — the real work:** the `smooth-accordion` block (~90 lines) was
  BS3 `.panel-group > .panel > .panel-heading / .panel-title / .panel-collapse > .panel-body`. BS5
  has **no `.panel*`** AND a **different accordion contract** (`.accordion > .accordion-item >
  .accordion-header > .accordion-button + .accordion-collapse > .accordion-body`). The shim aliases
  panel→card, so we paired every `.panel*` selector with its `.card*` / `.accordion` / `.collapse`
  equivalent. This is the one place a 1:1 class rename is a lie: the markup *structure* also changed,
  so a true BS5 accordion will need markup edits, not just class swaps. Pairing is a bridge, not a
  port.

### Things that correctly did NOT change
- `@extend .row` / `.col-sm-9` / `.col-sm-3` — BS5 kept these grid class names, so the extends stay
  valid untouched.
- `.well` — kept, because the shim defines `.well` as a *real* BS5-backed box (not just an alias),
  so it is no longer a dead BS3-only class.
- `.form-group` (3 sites) — BS5 removed it, but **simple_form** (`simple_form_bootstrap.rb`, out of
  scope) still emits it and the shim supports it, so the margin tweaks stay keyed to the real markup.
- `.label-cell` — a false positive: it is an Elektra table-cell class (`.data-tabular-cell.label-cell`),
  not BS3 `.label`.
- All BS3 **variables** and the vendor mixins `fa-icon` / `spinner` / `pie-clearfix` (Font Awesome /
  gem assets, NOT Bootstrap) — left as-is per the chosen strategy.

### Verification
Compiled `_monsoon_theme.scss` against the **full** chain (`_variables` → `bootstrap/scss/bootstrap`
→ `_bs3_compat_shim` → `_mixins` → theme) via a throwaway standalone `sass.compileString` harness
(gem-only `spinner`/`fa-icon`/`pie-clearfix` stubbed, `.fa*` extends neutralised). Result: **COMPILE
OK**, 356 KB CSS, and `.btn-secondary`, `.smooth-accordion .card-header`, `.input-group-text`,
`.navbar-dark` all present in the output — i.e. the retargeted `@extend`s resolve and no selector
rename broke the build.

### Interpretation (for the migration doc)
- The theme migration splits cleanly into **mechanical renames** (cheap, scriptable, safe to pair
  old+new) and a **handful of structural components** (accordion/panel→card, inline form checks)
  where class rename ≠ migration because the markup contract changed. The doc should separate these
  two buckets rather than treating "the custom theme" as one monolithic high-risk block.
- The **shim-as-bridge pattern works**: you can migrate the stylesheet to BS5 names *ahead* of the
  views and keep the app rendering, because the shim's `@extend` aliases connect still-BS3 markup to
  the renamed rules. This decouples the (large) CSS migration from the (even larger) view migration
  — a sequencing option the doc does not currently call out.
- Retargeting `@extend .btn-default` → `@extend .btn-secondary` shows how a rule sheds its shim
  dependency the moment both markup and CSS speak native BS5 — the natural order is CSS → views →
  shim-entry removal, component by component.


## FINDING #14 — Operational facts for the next session (read before touching anything) + first end-to-end view migration

This finding is the hard-won *operational* knowledge of the spike — the things that cost real time
to discover and that are NOT obvious from the code. Future-me: start here.

### 14a — The CSS is built by Sprockets, NOT esbuild (consequence of Finding #1, stated as a rule)
- The main stylesheet is compiled by the **Rails asset pipeline (Sprockets)** from
  `app/assets/stylesheets/application.scss.erb`, served via `stylesheet_link_tag 'application'`.
- esbuild's entrypoints (`config/esbuild/build.js`) are **JS-only**; SCSS only passes through esbuild
  when a JS file `import`s it. So:
  - **The JS watch (`start-js`) does NOT build the main CSS.** There is deliberately no
    `application.css` in `app/assets/builds/`. Do not go looking for one; its absence is not a bug.
  - To see a theme/shim SCSS change, you need a **page reload against Rails** (Sprockets recompiles
    on request in dev), not a JS rebuild.
- To verify SCSS compiles without a browser, compile via Sprockets in the container (NOT a standalone
  `sass` run — gem assets like `spinners`/`font-awesome` won't resolve standalone):
  `docker exec elektra bash -c 'cd /app && RAILS_ENV=development bin/rails runner "puts Rails.application.assets[\"application.css\"].to_s.length"'`
  (last confirmed length ≈ 872 KB, containing both theme and BS5 rules).

### 14b — Container & shell gotchas (cost real time)
- `docker exec elektra` app root is **`/app`** — NOT `/workspace/elektra`, NOT `/elektra`. `cd` to the
  wrong one fails.
- Use `bash -c 'cd /app && …'`. Do **not** use `bash -lc` for capturing output: the login shell prints
  an interactive MOTD banner that swallows/garbles the command's real output.
- `rails runner` is the reliable way to introspect server-side; `view_context`-based markup rendering
  from a bare runner does NOT work (`@_request` is nil; `SimpleForm.wrappers[:x]` has no `.options`).
  Don't try to inspect generated form HTML offline — **verify in the browser** instead.
- Git is the `ws-ide` container; use `docker exec ws-ide bash -c "cd /workspace/elektra && git …"`.
  **Omit `-it`** when calling non-interactively — `-it` fails with "the input device is not a TTY".

### 14c — simple_form wrapper changes need a Rails RESTART
- `config/initializers/simple_form_bootstrap.rb` is a Rails **initializer**. Editing it (e.g. the
  `:horizontal_form` wrapper) changes nothing in the browser until **Rails is restarted** — it is not
  picked up by the JS watch, nor by Sprockets request-time recompilation.
- Restart: `docker exec elektra bash -l -i "start-rails"` (per CLAUDE.md).

### 14d — "Compiles ≠ looks right" is the governing reality (restates Finding #9 as the default expectation)
- When the user reports "nothing changed / still looks broken / I don't see the monsoon3 theme," the
  default cause is **NOT** a broken build. The CSS compiles and is served correctly; the **views still
  emit BS3 class names that BS5 deleted** (`.panel`, `.btn-default`, `.label-*`, `data-toggle`…), so
  the rules the theme defines never match. This is a **view-layer** problem, independent of SCSS/JS.
- Editing the theme with *co-selectors* (pairing `.panel`+`.card`, same markup → same rules) is by
  design visually invisible until the views switch to the BS5 class. Don't chase a "regression" — there
  isn't one; it's the sequencing (CSS migrates ahead of views, per Finding #13).

### 14e — The BS5 defineJQueryPlugin trap (restates Finding #12 as a rule to not re-learn)
- BS5 ships an **optional** jQuery integration that, on `DOMContentLoaded`, OVERWRITES `$.fn.modal`
  (etc.) with an **init-only** `jQueryInterface` — so Elektra's BS3 `.modal()` (init **+ show**) stops
  showing. Guarded in `core/bs3_jquery_bridge.js` by (1) setting `data-bs-no-jquery` on `<body>` early,
  and (2) re-installing the bridge on `DOMContentLoaded`. If modals mysteriously stop opening, suspect
  this first.

### 14f — First end-to-end view migration completed: **edit project**
Proof-of-concept that a single screen can be taken fully to BS5 (the pattern for Plan Phase 4):
- **View** `plugins/identity/app/views/identity/projects/edit.html.haml` — BS5 markup
  (`modal-body`/`modal-footer`, `btn-secondary`/`btn-primary`, `data: {bs_dismiss: "modal"}`).
- **Wrapper** `config/initializers/simple_form_bootstrap.rb` → **only** `:horizontal_form` migrated to
  the BS5 horizontal grid: container `.row.mb-3`, label `.col-sm-4.col-form-label`, errors/hints as
  `.form-text`, `error_class: "is-invalid"`. **The other ~15 wrappers are still BS3**
  (`form-group`/`control-label`/`help-block`/`has-error`) — migrating them is the bulk of Phase 4 and
  must be done wrapper-by-wrapper, each needing a Rails restart + browser check of every screen it feeds.
- Form partial `plugins/identity/app/views/identity/projects/shared/_form.html.haml` needed **no**
  changes — it only uses `form.input`; all grid markup comes from the wrapper. **Lesson for the plan:**
  centralized simple_form wrappers are high *leverage* — one wrapper edit re-skins every form using it,
  but also means a wrapper change has wide blast radius and can't be verified from one screen alone.
- Status: edit-project is end-to-end BS5 **in code**; **browser verification is still pending a Rails
  restart** (see 14c) at the time these notes were written.

### Interpretation (for the migration doc)
- The plan's Phase 4 ("view markup") is really **two** coupled sub-tracks: per-view HAML class renames
  (volume work) **and** the shared simple_form wrappers (leverage work, each with wide blast radius +
  mandatory restart + multi-screen verification). The doc should budget the wrappers separately.
- The operational facts in 14a–14e are the actual time sinks of a BS5 spike here — more than any single
  class rename. Worth promoting into the plan's "Phase 0 — Groundwork" as a dev-loop checklist.










