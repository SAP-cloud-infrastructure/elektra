# Bootstrap 3 → Bootstrap 5 Migration Plan

> Status: Planning / proposal
> Related: [Issue #2190](https://github.com/SAP-cloud-infrastructure/elektra/issues/2190) (findDOMNode shim removal), PR #2189 (React-19 Modal/Tabs drop-ins)

## 🎮 The Campaign (TL;DR, for morale)

Elektra is a dungeon grown over three ages — the Age of Inline jQuery, the Age of React, and
the Age of Juno — stacked on top of each other until the keep became a patchwork beast. Our
quest: drag it from the ruins of **Bootstrap III** into the halls of **Bootstrap V**, and tidy
the oldest crypts into React on the way through. Five dungeons, five bosses. Juno is a friendly
NPC faction — do not attack it.

**🗺️ Dungeon 0 — The Base Camp.** No boss. You forge your gear: the *Baseline Scroll of Grep*
(so you always know what's left) and the *Throwaway Lantern* (the temporary local-only E2E
suite that lights up anything that breaks). Take before-screenshots of the land. Weak party
members skip this; the smart ones don't.

**🔥 Dungeon 1 — The SCSS Catacombs.**
> **BOSS: `_monsoon_theme.scss`, the 2842-Line Hydra.** Every variable you rename
(`$brand-primary` → `$primary`) sprouts two more. You also slay its minions `_variables.scss`
and `_mixins.scss`, and banish the `bootstrap-sass` gem from the realm. High danger — a wrong
hit recolors the *entire* kingdom.

**⚔️ Dungeon 2 — The React Keep.**
> **BOSS: react-bootstrap 0.33, the Ancient One (107-headed).** A full-API-rewrite dragon:
`bsStyle`→`variant` across 89 heads, `<Panel>`→`<Card>`, `<Label>`→`<Badge>`. Loot on victory:
you may finally **destroy the cursed `findDOMNode` shim** and its 3 bound familiars — **this
closes side-quest #2190.** Strike the 4 core files and the central Modal/Form components first;
they are the dragon's heart.

**🧪 Dungeon 3 — The jQuery Widget Swamp.**
> **BOSS: the Five Plugin Golems** (select, multiselect, slider, typeahead, datetimepicker).
They have no BS5 form — you cannot upgrade them, you must *replace* them. House rule: reforge
each as a **React component** (don't summon a new vanilla-JS golem — one undead variant is
enough for this dungeon). ~31 view sites + ~46 core call-sites.

**🧹 Dungeon 4 — The View Markup Sprawl (open-world grind).** The biggest map, cleared
**plugin by plugin, Tier A → B → C**. Mostly trash mobs: `btn-default`→`btn-secondary` (155
rooms), `pull-*`→`float-*`, `panel`/`well`→`card`, and the sneaky silent-killer
`data-toggle`→`data-bs-*`. Clear the central Modal (87) and Form (56) hubs first and whole
regions fall at once.

**🏁 Dungeon 5 — The Cleanup & Credits.** No boss, just loot and lockup: BS5 pagination
templates, delete dead vendor CSS, **remove the compat-shim**, final grep sweep must read
**zero**. Then **extinguish the Throwaway Lantern** (tear down the migration E2E suite); keep a
torch or two for the general suite.

**✨ Dungeon 6 — The Glow-Up (post-game, optional).** Everything already runs on BS5; now we
make the keep *look* reborn — a light facelift using BS5's modern defaults, tuned `$theme-colors`
and spacing. A deliberate design pass on stable ground, not a migration task. Roll credits. 🏆

**Party rules:** jQuery is an *allied mercenary*, not a target — it stays this campaign (full
jQuery removal is a future expansion pack). Juno is untouched allied territory. We **embrace the
BS5 look** as we go (no fighting to look like BS3); the *compat-shim* is a translator that keeps
old BS3-named markup functional on BS5 styling until each region is migrated — it is **not** a
second Bootstrap and gets deleted in Dungeon 5.

---

## Scope & non-goals

**In scope:** everything in Elektra that depends on Bootstrap 3 — the SCSS pipeline, the
react-bootstrap component layer, the Bootstrap jQuery plugins, and the Bootstrap-specific
markup/`data-*` attributes in HAML/ERB views.

**Out of scope (untouched):**

- **Full jQuery removal.** Deferred to a separate, later effort. The BS5 upgrade only needs
  *Bootstrap* to be jQuery-free (BS5 ships its own vanilla-JS API). Removing jQuery entirely
  would additionally require replacing `jquery-ujs` and its `.js.erb` AJAX pattern (~59 files),
  porting the 8 in-house `core/jquery.*` plugins, and rewriting ~443 inline `$(` call-sites
  across ~84 views — all of which are coupled to the Rails UJS pattern, **not** to Bootstrap.
  Bundling it here would roughly double the change, inflate risk, and violate "one context per
  PR". It is best driven later by the ongoing React migration, which retires inline scripts
  incrementally.

**Key decisions (agreed):**

1. **jQuery may stay.** Bootstrap becomes jQuery-free (BS5 ships a vanilla-JS API), but jQuery
   itself remains in the project for `jquery-ujs`, the 8 in-house `core/jquery.*` plugins, and
   the inline view scripts. We only touch the inline scripts that call *Bootstrap* plugins.
   **Full jQuery removal is explicitly out of scope** — see below.
2. **react-bootstrap 0.33 → v2** (BS5-compatible). After this, the `findDOMNode` shim and its 3
   consumers can be deleted (closes #2190).
3. **Prefer React when replacing old pieces — consolidation over patching.** Elektra grew in
   three layers: originally no React (logic as inline JS/jQuery in views), then React for new
   features only, then Juno on top. The result is a mix of generations. Wherever this migration
   forces us to touch an old jQuery/inline piece (e.g. the BS3 jQuery-plugin widgets), we
   **replace it with a React component** rather than swapping in another vanilla-JS lib — this
   unifies the stack instead of adding a fourth variant. We do this opportunistically (when we
   already have the file open for BS5 reasons), not as a separate rewrite project.
4. **Phase 4 is hybrid and strictly per plugin.** For each plugin we first clear the bulk
   **programmatically** (scripted class renames for the unambiguous static-markup cases), then
   do a **manual step-by-step pass** on what's left (dynamic classes, jQuery selectors in inline
   JS, `.js.erb`). Each plugin is taken on its own and **manually tested — clicked through until
   it's right** — before moving to the next. No single sweep across all plugins at once.
5. **Incremental rollout to `master`, enabled by a temporary compat-shim.** There is no real
   "BS3 and BS5 at the same time" at runtime — only one Bootstrap CSS loads, and from Phase 1 on
   it is **BS5**. BS3 and BS5 define the same class names (`.btn`, `.row`, `.col-*`) with
   different rules, so they cannot be loaded side by side. To still ship small PRs straight to
   `master` without a broken in-between state, Phase 1 introduces a **compat-shim**: a small SCSS
   file that maps the *old BS3 class names still present in un-migrated views* onto BS5 styles
   (`.btn-default { @extend .btn-secondary }`, `.panel { @extend .card }`, `.pull-right { float:
   right }`, …). It is a **translator, not a second framework** — it shrinks as views migrate and
   is **deleted in Phase 5**. We do **not** use one giant long-lived branch with one giant final
   merge; `master` stays live and shippable after every PR. (Our custom theme, `_monsoon_theme`
   /`_variables`/`_mixins`, is natively ported to the BS5 Sass model in Phase 1 — it lives in the
   BS5 world, not in the shim.)
6. **Embrace the BS5 look during migration; facelift is a separate final pass (Phase 6).** BS5
   looks different from BS3 by default (flatter, different spacing/button/form defaults). We
   **do not fight that** — the compat-shim only guarantees layout/functional integrity, not BS3
   pixel-parity, so the app already gains a modern look for free as we go. The **deliberate
   facelift** (tuned `$theme-colors`, spacing, button styles, optionally leaning toward the Juno
   aesthetic) happens in **Phase 6, after everything runs on BS5** — designing on stable ground,
   not on a moving migration. Consequence: migration E2E checks verify **function** ("button
   clickable, modal opens, form submits"), not screenshot pixel-diffs, since screens change on
   purpose.

## Current state (measured)

| Layer | Pin | Notes |
|-------|-----|-------|
| SCSS | `bootstrap-sass 3.4.1` (gem) | npm `bootstrap 3.4.1` too; `@import` chain in `app/assets/stylesheets/application.scss.erb` |
| React | `react-bootstrap 0.33.1` | last BS3-era release; v1=BS4, v2=BS5 (full API rewrite); 107 files import it |
| jQuery plugins | bootstrap-select 1.13.6, -multiselect 0.9.15, -slider 9.1.3, -3-typeahead 4.0.2, custom datetimepicker | **no BS5 drop-in — must be replaced** |
| jQuery | `jquery 1.12.4` | global `window.$`/`jQuery` via `core/jquery.js` — stays |
| Pagination | `bootstrap-kaminari-views 0.0.5` (gem) | BS3-styled Kaminari views — needs BS5 templates |

### Centralization leverage (reduces view churn dramatically)

- **Modals** flow through `app/javascript/lib/components/Modal` → backs ~87 files. Fix once.
- **Forms** flow through `lib/elektra-form` (`<Form>`) → backs ~56 files. Fix once.

### Breaking surface in views (BS5 renamed/removed)

| BS3 class/attr | files | occ | BS5 target |
|---|---|---|---|
| `btn-default` | 155 | 231 | `btn-secondary` |
| `col-sm/md/lg-*` | 89 | 459 | kept; gutter/behavior review |
| `pull-right` / `pull-left` | 51 / 3 | 57 / 4 | `float-end` / `float-start` |
| `help-block` | 46 | 150 | `form-text` / `invalid-feedback` |
| `data-toggle`/`-target`/`-dismiss` | ~55 | 112 | `data-bs-*` (silently break otherwise) |
| `form-group` | 37 | 103 | grid-based forms (mostly via `lib/elektra-form`) |
| `control-label` | 24 | 78 | `col-form-label` / `form-label` |
| `has-error` | 8 | 26 | `is-invalid` |
| `caret` | 14 | 26 | removed (CSS `::after`) |
| `label-*` | 5 | 23 | `badge` + `text-bg-*` |
| `input-group-addon` | 8 | 15 | `input-group-text` |
| `panel-*` + `<Panel>` | ~7 + 13 | — | `.card` |
| `well` | 9 | 9 | `.card` / utilities |
| `glyphicon` | 1 | 8 | removed (icon font gone) |

### Bootstrap jQuery plugin call-sites (need BS5 vanilla API)

`.modal(` 19, `.tooltip(` 12, `.popover(` 7, `.collapse(` 3, `.tab(` 2 = ~43 call-sites, plus
declarative `data-toggle="tooltip|popover"` hooks (BS5: tooltips/popovers are **not**
auto-initialized — must opt in via JS).

## Migration phases

Each phase should be independently shippable where possible, behind the existing build.

### Phase 0 — Groundwork & safety net

**Goal:** a baseline and a throwaway safety net before touching anything.

Steps:
1. **Baseline inventory.** Commit a script (`docs/bs5-grep-baseline.sh`) that greps the counts in
   this doc (per class/attr, per plugin, excluding `app/assets/builds/`). Running it later shows
   remaining work and proves "done".
2. **Temporary migration E2E tests** (see *Testing strategy* below). Author targeted Playwright
   specs under `e2e/playwright/migration/` covering exactly the things that can break:
   grid/button/panel/form/modal rendering, dropdowns, tooltips/popovers, the BS3 jQuery-plugin
   widgets, and the wizard flows. **These assert function (renders, clickable, opens, submits),
   not pixel-parity** — screens change on purpose as we adopt the BS5 look. Deep-dive, local-only,
   thrown away at the end.
3. Capture reference screenshots of the Tier-A plugin screens on BS3 — as a *visual reference*
   for the eventual facelift (Phase 6), not as a pass/fail parity gate.

- **Risk:** low. **Blocks:** nothing. Do first.
- **Exit criteria:** baseline script committed; migration specs green (functional) on current BS3
  build; reference screenshots captured.

### Phase 1 — SCSS pipeline: bootstrap-sass → bootstrap 5 (npm)

**Goal:** Bootstrap 5 CSS compiling through esbuild; app functional on BS5 via the compat-shim.

Steps:
1. Remove `gem 'bootstrap-sass'` from the Gemfile; add `bootstrap@5` to the npm/esbuild pipeline.
   Replace the `@import "bootstrap-sprockets" / "bootstrap" / "bootstrap/theme"` chain in
   `application.scss.erb` (drop `theme` — BS3 gradient theme is gone in BS5).
2. Rewrite `_variables.scss` to the BS5 Sass-map model: `$brand-primary`→`$primary`, define
   `$theme-colors`, `$grid-breakpoints`; move overrides *before* the Bootstrap `@import` with
   `!default` semantics.
3. Rewrite `_mixins.scss`: `make-md-column(n)`→`make-col(n)`/`make-row()`, `$screen-*-min`→
   `media-breakpoint-up()`; port `container-width-responsive()`, `button-variant-outline()`,
   `pie-clearfix()`.
4. Audit `_monsoon_theme.scss` (2842 lines) section by section against the new variables.
5. Temporarily keep the 4 BS3 jQuery-plugin SCSS imports stubbed/vendored so the build doesn't
   break before Phase 3 replaces them.
6. **Introduce the compat-shim** (`app/assets/stylesheets/_bs5_compat_shim.scss`): map the BS3
   class names still present in un-migrated views onto BS5 styles so `master` renders correctly
   while views are migrated incrementally. Temporary — removed in Phase 5.

- **Risk:** high (global visual regressions). **Depends on:** Phase 0.
- **Test:** migration specs on core chrome (nav, breadcrumb, buttons, grid, cards) — **functional
  checks** (renders, interactive), not pixel-parity (we embrace the BS5 look). **Exit:** app
  renders on BS5, core chrome works, compat-shim keeps un-migrated views functional.

### Phase 2 — react-bootstrap 0.33 → v2 (107 files)

**Goal:** the React component layer runs on a BS5-compatible react-bootstrap; shim deleted.

Steps:
1. Bump `react-bootstrap` to v2, drop `@types/react-bootstrap` (v2 ships its own types).
2. Codemod the prop/API renames: `bsStyle`→`variant`, `bsSize`→`size` on `<Button>` (89 files),
   `<Panel>`→`<Card>` (13), `<Label>`→`<Badge>` (1), `FormControl`/`Form` overhaul.
3. Hand-review the transition components whose API changed: `Collapse` (10), `Overlay` (3),
   `Popover` (3), `Tooltip` (1), `Carousel` (1), `Alert` (18).
4. Start with the 4 **core** files + the two centralized components (`lib/elektra-form`'s
   `submit_button.jsx`, `lib/dialogs/dialog.jsx`), then fan out to plugins by tier.
5. **Delete `app/javascript/lib/react19-finddomnode-shim.js` and its 3 consumers**
   (`lib/widget.jsx`, `lib/dialogs/index.js`, `vitest.setup.ts`) → **closes #2190.**

- **Risk:** high (full-API lib migration). **Depends on:** Phase 1 (shared BS5 styles).
- **Test:** `pnpm test` for component units; migration specs per tier for overlays/collapses/
  buttons. **Exit:** shim gone, all react-bootstrap imports resolve on v2, specs green.

### Phase 3 — Replace BS3 jQuery plugins

**Goal:** no BS3-only jQuery widgets remain — replaced with **React components** (per decision 3).

Steps:
1. Replace each widget with a React component (the consolidation path): bootstrap-select,
   -multiselect, -slider, -3-typeahead, -datetimepicker have **no BS5 drop-in** anyway, so this
   is the moment to retire the jQuery-in-HAML variant rather than add another vanilla-JS lib.
   Reuse existing React patterns / Juno where a suitable component already exists.
2. Replace each usage site — `.selectpicker()`, `.multiselect()`, `.slider()`, `.typeahead()`,
   `datetimepicker` (~31 view files, concentrated in `compute`/`identity`/`dns_service`/`image`
   wizards and ~46 core call-sites). Where the widget sits in a HAML view, mount the React
   component into that spot (the same pattern used for existing React widgets).
3. Remove the npm packages and their SCSS/vendor CSS once no longer referenced.

- **Risk:** medium-high (behavioral + markup→React conversion). **Depends on:** Phase 1.
- **Test:** migration specs that interact with each widget (open select, pick date, drag slider,
  type-ahead). **Exit:** every call-site is now a React component; jQuery widget packages removed.

### Phase 4 — View markup: classes + data attributes (per plugin, by tier)

**Goal:** all BS3 markup migrated to BS5, worked plugin-by-plugin so each is independently
shippable and testable. **Hybrid workflow (decision 4): programmatic bulk pass, then manual
step-by-step verification, one plugin at a time, clicked through until it's right.**

Steps (repeat per plugin, Tier A → B → C — never one big cross-plugin sweep):
1. **Programmatic bulk pass** — clear the easy majority with scripted, context-guarded renames
   on static markup only (`%tag.btn-default`, `class="..."`, `class: "..."`): `btn-default`→
   `btn-secondary`, `pull-*`→`float-*`, `help-block`→`form-text`/`invalid-feedback`,
   `panel*`→`card`, `well`→`card`, `label-*`→`badge`+`text-bg-*`, `input-group-addon`→
   `input-group-text`, `caret`/`glyphicon` removal, `col-xs-*`→`col-*`.
   For JSX/TSX use `jscodeshift`; for HAML/ERB use guarded regex (there is no HAML AST codemod).
2. **Manual step-by-step pass** — review what the script can't safely touch: dynamic class
   names, jQuery selectors inside inline JS (`$(".btn-default")` — must stay in sync with the
   markup rename or interactions break silently), and `.js.erb` responses.
3. `data-toggle/-target/-dismiss` → `data-bs-*`; explicitly init tooltips/popovers in JS
   (BS5 drops auto-init).
4. Fix the Bootstrap jQuery-plugin call-sites to the BS5 vanilla API (`new bootstrap.Modal(...)`
   etc.) or the component equivalent.
5. **Do the centralized components first** — `lib/components/Modal` (87 files) and
   `lib/elektra-form` (56 files) — so most plugin markup inherits the fix.
6. **Manually test the plugin** — click through its real screens (forms, modals, tables,
   wizards) until it behaves correctly, backed by that plugin's migration specs.

- **Risk:** medium (broad but mechanical). **Depends on:** Phases 1–3.
- **Test:** scripted pass + **manual click-through per plugin** + migration specs (functional);
  grep the plugin dir against baseline.
  **Exit per plugin:** zero BS3 classes/attrs in that plugin, specs green, manual pass signed off.

### Phase 5 — Pagination & cleanup

**Goal:** remove the last BS3 remnants and the temporary scaffolding.

Steps:
1. Replace `bootstrap-kaminari-views` gem with BS5-styled Kaminari templates (11 paginated
   views).
2. Remove dead BS3 vendor CSS (`bootstrap-datetimepicker.css`, `-multiselect.css`, `-select.css`,
   `-slider.css`, `-treeview.css`).
3. **Delete the compat-shim** (`_bs5_compat_shim.scss`) — by now every view uses real BS5
   classes, so no BS3-named selectors remain to translate.
4. Final grep sweep against the Phase-0 baseline → must be zero.
5. **Tear down the temporary migration E2E suite** (`e2e/playwright/migration/`). Promote only a
   few durable, non-deep-dive checks into the general `ui`/`smoke` suites if genuinely valuable;
   delete the rest.

- **Risk:** low. **Depends on:** all above.
- **Exit:** baseline grep clean; compat-shim gone; migration suite removed; general E2E passes.

### Phase 6 — The facelift (optional, post-migration)

**Goal:** a deliberate light modernization — now that everything runs on BS5, make Elektra *look*
refreshed on stable ground. This is a design pass, **not** a migration task, and can be a
separate follow-up issue.

Steps:
1. Tune `$theme-colors`, spacing scale, border-radius, button/form styling in the BS5 Sass model.
2. Smooth over the sharpest BS3→BS5 visual shifts using the Phase-0 reference screenshots as a
   "before" guide — intentionally choosing what to modernize vs. keep familiar.
3. Optionally align visual language with the Juno aesthetic for a more consistent feel across the
   BS5 and Juno areas of the app.

- **Risk:** low-medium (visual only, no behavioral change). **Depends on:** Phases 1–5 complete.
- **Test:** manual visual review; general E2E suite must still pass (function unchanged).

## Testing strategy

Two distinct test layers — do not conflate them:

**Temporary migration E2E suite (`e2e/playwright/migration/`) — throwaway, local-only, deep-dive**
- Purpose: catch exactly what a BS3→BS5 change breaks — grid/button/panel/form/modal rendering,
  dropdowns, tooltips/popovers (now opt-in), the replaced jQuery widgets, and wizard flows.
- Scope: deep and specific, per Tier-A/B plugin screen; includes before/after visual diffs.
- Execution: **run locally by the developer** (`RAILS_ENV=e2e` Rails on `localhost:8010`,
  `pnpm e2e:ui -- --host http://localhost:8010`). Not wired into CI.
- Lifecycle: built in Phase 0, used throughout, **removed in Phase 5.** A couple of durable
  checks may be promoted into the general suites; the deep-dive ones are deleted.

**General E2E suite (`e2e/playwright/{smoke,ui}/`) — existing, stays**
- Purpose: general correctness/health control, **not** deep-dive. Intentionally shallow.
- Policy: do **not** bloat it with migration-specific deep checks. It keeps verifying that
  screens load and core flows work across the migration.

Plus the usual unit layer each phase: `docker exec elektra pnpm test` and
`docker exec elektra bundle exec rspec`.

## Open questions for the team

- Phase 4 codemod tooling details: exact guarded-regex ruleset for HAML vs. `jscodeshift` for
  JSX — to be refined when Phase 4 starts.
- Phase 6 facelift scope: how far to modernize vs. keep familiar (own follow-up issue).

> Decided: Phase 3 replacement = **React components** (consolidation, see decision 3).
> Decided: Phase 4 approach = **hybrid, per plugin** (see decision 4).
> Decided: rollout = **incremental PRs to `master` + temporary compat-shim** (see decision 5);
> no single giant branch/merge.
> Decided: **embrace BS5 look during migration; deliberate facelift in Phase 6** (see decision 6).

## Effort summary (relative)

- **HIGH:** react-bootstrap v2 rewrite (107); SCSS variable/mixin rewrite (`_monsoon_theme.scss`);
  replacing 4-5 BS3 jQuery plugins; `btn-default` rename (155 files).
- **MEDIUM:** grid review (89); `data-*` → `data-bs-*` (~55); modal/form via centralized libs;
  `pull-right`→`float-end` (51); nav-tabs/caret.
- **LOW:** panel→card (~7+13); well (9); label→badge (5); input-group-addon (8); glyphicon (1);
  pagination templates.

## Core vs. plugin breakdown (what to migrate & test, piece by piece)

### Core (`app/`) — must go first, everything depends on it

The core footprint is small in file count but high in leverage: fixing it unblocks every plugin.

**SCSS (Phase 1):**
- `app/assets/stylesheets/application.scss.erb` — the single `@import` entrypoint
- `app/assets/stylesheets/_variables.scss` — BS3 var overrides → BS5 Sass-map model
- `app/assets/stylesheets/_mixins.scss` — `make-*-column`, `$screen-*-min` → BS5 mixins
- `app/assets/stylesheets/_monsoon_theme.scss` — **2842 lines**, the main custom theme

**React (Phase 2) — only 4 core files import react-bootstrap:**
- `app/javascript/lib/components/autocomplete_field.jsx`
- `app/javascript/lib/elektra-form/components/submit_button.jsx` (part of the central form lib)
- `app/javascript/core/global_notifications.jsx` (uses `Alert`/`Carousel`)
- `app/javascript/lib/dialogs/dialog.jsx` (imports the findDOMNode shim)

**Centralized components (fix once → propagate to all plugins):**
- `app/javascript/lib/components/Modal` — backs ~87 modal usages across core + plugins
- `lib/elektra-form` (`<Form>`) — backs ~56 form usages across core + plugins

**Shared view partials (Phase 4) — touched by every page:**
- `app/views/application/_simple_modal_form.html.haml`, `_breadcrumb`, `_user_profile`,
  `_cloudops_nav`, `_error_page`, `exceptions/*` — BS markup + a few inline `$()`

**jQuery plugins (stay as jQuery, but verify BS5-neutral):** the 8 `core/jquery.*` plugins +
`lib/bootstrap-datetimepicker.js`. These keep working on jQuery; only confirm they don't rely on
BS3 CSS/markup. Core also has ~46 BS3-jQuery-plugin call-sites (datetimepicker-heavy) → Phase 3.

**Core numbers:** 4 react-bootstrap files · 10 `btn-default` files · ~8 `data-*` files ·
6 inline-`$()` view files · ~46 BS3-plugin call-sites.

### Plugins — migrate & test in tiers (by Bootstrap footprint)

Legend: **rb**=react-bootstrap files · **btn**=`btn-default` · **pull**=`pull-*` ·
**data**=`data-toggle/target/dismiss` · **jqPl**=BS3 jQuery plugins · **inln**=inline `$()`.

**Tier A — heavy (migrate first after core, test hard):**

| Plugin | rb | btn | pull | data | jqPl | inln | Notes |
|---|---|---|---|---|---|---|---|
| `networking` | 13 | 26 | 9 | 1 | 1 | 13 | all axes; biggest markup+inline load |
| `compute` | 0 | 31 | 12 | 0 | 0 | 22 | most inline `$()` + `btn-default`; no react-bootstrap |
| `lbaas2` | 30 | 5 | 2 | 0 | 2 | 0 | **most react-bootstrap** (incl. custom `DropdownMenu.jsx`) |
| `identity` | 3 | 16 | 3 | 1 | 3 | 9 | wizards w/ inline jQuery + BS3 plugins |
| `shared_filesystem_storage` | 21 | 6 | 1 | 0 | 0 | 0 | react-bootstrap heavy |
| `block_storage` | 15 | 2 | 0 | 0 | 2 | 0 | react-bootstrap + BS3 plugins |

**Tier B — medium:**

| Plugin | rb | btn | pull | data | jqPl | inln | Notes |
|---|---|---|---|---|---|---|---|
| `dns_service` | 0 | 15 | 8 | 0 | 0 | 18 | lots of wizard inline jQuery + markup |
| `object_storage` | 12 | 5 | 1 | 0 | 0 | 0 | react-bootstrap |
| `image` | 2 | 7 | 3 | 0 | 0 | 8 | mixed markup + inline |
| `keppel` | 9 | 8 | 0 | 0 | 0 | 0 | react-bootstrap |
| `kubernetes` | 0 | 7 | 3 | 0 | 0 | 0 | markup only (note: `kubernetes_ng` is Juno-based, untouched) |

**Tier C — light (quick, low risk):**

| Plugin | rb | btn | pull | data | jqPl | inln | Notes |
|---|---|---|---|---|---|---|---|
| `tools` | 5 | 3 | 0 | 0 | 2 | 0 | small react-bootstrap + BS3 plugins |
| `masterdata_cockpit` | 0 | 0 | 2 | 2 | 0 | 6 | inline jQuery + `data-*` |
| `inquiry` | 0 | 4 | 0 | 0 | 0 | 2 | small |
| `lookup` | 0 | 2 | 2 | 0 | 0 | 0 | markup only |
| `audit` | 0 | 1 | 0 | 0 | 0 | 0 | trivial |
| `reports` | 0 | 1 | 0 | 0 | 0 | 0 | trivial |
| `testikus` | 2 | 0 | 0 | 0 | 0 | 0 | test plugin |

**Plugins with no Bootstrap footprint (skip):** all others (e.g. `kubernetes_ng` and the
remaining ~9 plugins) show zero hits — Juno-based or no UI. Verify with the grep sweep before
declaring done.

### Suggested per-plugin test loop

For each plugin, after migrating:
1. `docker exec elektra pnpm test` + `docker exec elektra bundle exec rspec` (unit).
2. E2E UI render check: `RAILS_ENV=e2e` Rails + `pnpm e2e:ui -- --host http://localhost:8010`
   focused on that plugin's screens (forms, modals, tables, wizards).
3. Manual visual pass on the plugin's main views (grid/button/panel/form rendering).
4. Grep the plugin dir against the Phase-0 baseline to confirm zero remaining BS3 classes/attrs.

