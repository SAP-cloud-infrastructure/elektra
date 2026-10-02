# Bootstrap 3 → Bootstrap 5 Migration Plan

> Status: Planning / proposal
> Related: [Issue #2190](https://github.com/SAP-cloud-infrastructure/elektra/issues/2190) (findDOMNode shim removal), PR #2189 (React-19 Modal/Tabs drop-ins)

## 🎮 The Campaign (TL;DR, for morale)

Elektra is a dungeon grown over three ages — the Age of Inline jQuery, the Age of React, and
the Age of Juno — stacked on top of each other until the keep became a patchwork beast. Our
quest: drag it from the ruins of **Bootstrap III** into the halls of **Bootstrap V**, and tidy
the oldest crypts into React on the way through. Seven dungeons (0–6); three bosses lurk in
Dungeons 1–3. Juno is a friendly NPC faction — do not attack it.

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
`bsStyle`→`variant` across 26 files, `<Label>`→`<Badge>`. Its sibling
`react-bootstrap-typeahead` (11 files) must be bumped in the same raid. Loot on victory: you may
finally **destroy the cursed `findDOMNode` shim** and its 3 bound familiars — **this closes
side-quest #2190.** Strike the 4 core files and the central Modal/Form components first; they
are the dragon's heart. **Enchantment rule for the whole campaign:** every `.jsx` scroll you
pick up is re-forged into a typed `.tsx` blade before you move on — touch it, type it.

**🧪 Dungeon 3 — The jQuery Widget Swamp.**
> **BOSS: the Plugin Golems** (select, multiselect, slider, typeahead, datetimepicker) — but
scout before you swing: **two are already dead** (`bootstrap-select` and `bootstrap-3-typeahead`
have zero call-sites — loot the corpse, i.e. just delete the dependency). Only multiselect (~6
sites), slider (2) and datetimepicker (1) actually fight back. They have no BS5 form — you cannot
upgrade them, you must *replace* them. House rule: reforge each as a **typed React component** —
or, for a lone leaf widget whose React form would summon a whole dependency horde, a **small
vanilla-TS trinket** instead. Never summon a new vanilla-JS *jQuery* golem — one undead variant
is enough for this dungeon. A small swamp, not an ocean — ~a dozen real call-sites.

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
second Bootstrap and gets deleted in Dungeon 5. **Loot discipline:** we leave the dungeon with a
*lighter* pack than we entered — no hoarding new dependencies; a single-purpose npm trinket is a
cursed item, so we forge a small typed tool ourselves instead.

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
3. **Prefer React when replacing old pieces — but weigh it per case; consolidation over
   patching.** Elektra grew in three layers: originally no React (logic as inline JS/jQuery in
   views), then React for new features only, then Juno on top. The result is a mix of
   generations. Wherever this migration forces us to touch an old jQuery/inline piece (e.g. the
   BS3 jQuery-plugin widgets), the **default is to replace it with a (typed) React component**
   rather than swap in another jQuery/vanilla-JS *library* — this unifies the stack instead of
   adding a fourth variant. **But React is not automatic.** We judge each site: pulling a widget
   into React can drag in a dependency tail (react-bootstrap/Juno, context providers, mount
   plumbing into a HAML view) that is heavier than the problem. Where the piece is small, mostly
   presentational, or isolated — a date field, a toggle, a bit of show/hide — a **small,
   self-contained vanilla-TS module** (plain DOM, no framework, strictly typed) is often the
   lighter, lower-dependency choice and is explicitly allowed. Decision guide: **React** when it
   shares state/props with surrounding React, reuses an existing component, or lives inside a
   React tree already; **vanilla TS** when it is a leaf widget whose React version would exist
   only to avoid vanilla and would import a dependency chain "all the way to the White House" for
   it. What we do **not** do is add a new *jQuery* plugin or a new third-party UI lib. Either way
   the result is TypeScript (decision 7). We decide this opportunistically, when the file is
   already open for BS5 reasons — not as a separate rewrite project.
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

   > ⚠️ **Known limit of the compat-shim — it is CSS-only.** The shim translates *class names*
   > (styling). It **cannot** fix the behavioral break where BS5 renamed the JS data hooks
   > `data-toggle`/`-target`/`-dismiss` → `data-bs-*` and stopped auto-initializing
   > tooltips/popovers. So in un-migrated views, dropdowns/modals/tabs/collapses that rely on
   > `data-toggle` are **functionally dead** between Phase 1 and the per-plugin Phase-4 pass, even
   > though they look styled. Two mitigations, pick per rollout: (a) a tiny **JS compat-helper**
   > that also recognizes the old `data-toggle` attributes until Phase 4 clears them, or (b) do the
   > `data-*`→`data-bs-*` rename as an **early global sweep** right after Phase 1 (it's a safe,
   > mechanical rename of 61 files / 112 occ). Do **not** assume the SCSS shim alone keeps
   > interactive widgets working.
6. **Embrace the BS5 look during migration; facelift is a separate final pass (Phase 6).** BS5
   looks different from BS3 by default (flatter, different spacing/button/form defaults). We
   **do not fight that** — the compat-shim only guarantees layout/functional integrity, not BS3
   pixel-parity, so the app already gains a modern look for free as we go. The **deliberate
   facelift** (tuned `$theme-colors`, spacing, button styles, optionally leaning toward the Juno
   aesthetic) happens in **Phase 6, after everything runs on BS5** — designing on stable ground,
   not on a moving migration. Consequence: migration E2E checks verify **function** ("button
   clickable, modal opens, form submits"), not screenshot pixel-diffs, since screens change on
   purpose.
7. **Everything we touch moves to TypeScript.** Any `.js`/`.jsx` file we open for a migration
   change gets renamed to `.ts`/`.tsx` and properly typed in the same PR — "touch it, type it".
   This is scoped to the migration footprint (the ~94 react-bootstrap `.jsx` files, the replaced
   jQuery-widget components, and the central Modal/Form libs), **not** a project-wide TS rewrite:
   files we never open stay as-is. The project already runs `strict: true` with `allowJs: true`,
   so `.jsx` still compiles untouched, but a freshly renamed `.tsx` is immediately held to
   `strict` — so this adds real typing work, not just a rename. Where full strict types are not
   feasible in the same step (e.g. an untyped third-party boundary), add a narrow, commented
   `// TODO(bs5-ts)` escape (minimal `any`/`unknown`) rather than blocking the PR — but prefer
   proper types. Rationale: it compounds the consolidation goal (decision 3) — the same files we
   rewrite for BS5 become type-safe at the same time, instead of being touched twice. Context:
   TypeScript is **already in use, but only partially** (today ~193 `.tsx`/56 `.ts` vs. ~388
   `.jsx`/430 `.js`) — another historically-grown patchwork. This rule **shrinks** that patchwork
   as we go rather than cementing it, without opening a separate project-wide TS rewrite.
8. **No new complex dependencies — simplify, don't accumulate.** The overarching goal of this
   migration is to make Elektra *simpler*, so adding libraries works against it. We **do not add
   new runtime dependencies** to replace the things we remove — especially not a small
   single-purpose npm package that does one trivial job. **In doubt, build it ourselves**: a
   short, typed, well-named in-house helper/module almost always beats pulling in a micro-package
   (and its transitive tail, supply-chain surface, version churn, and the risk it goes
   unmaintained). This directly supports decision 3's vanilla-TS option: when we replace a jQuery
   widget, the lighter path is often ~30 lines of our own typed code, not another dependency.
   Allowed exceptions, by exception only: the already-planned framework bumps (`bootstrap@5`,
   `react-bootstrap@2`, `react-bootstrap-typeahead`) and a genuinely non-trivial, well-maintained,
   broadly-used library where re-implementing it correctly would be unreasonable (e.g. a real
   date/time or a11y-critical widget) — decided consciously in the PR, not reached for by reflex.
   Net direction: every phase should leave the dependency list **smaller or equal**, never
   casually larger.

## What we gain (the payoff)

This is not a cosmetic upgrade — it buys down real, accumulating risk and debt. Concretely:

- **Unblocks React 19 and kills the `findDOMNode` shim (#2190).** react-bootstrap 0.33 is the
  reason the deprecated `findDOMNode` shim exists at all. React 19 removed `findDOMNode`; today we
  keep a hand-written shim alive to stop 0.33 from crashing. Upgrading to react-bootstrap v2 lets
  us **delete the shim and its 3 consumers** and removes the single biggest blocker to staying
  current with React.
- **Off a dead-end dependency.** `bootstrap-sass 3.4.1` and react-bootstrap 0.33 are both
  **end-of-life** — no security fixes, no bug fixes, no React/Sass-compat updates. Every month on
  them widens the gap. BS5 and react-bootstrap v2 are the actively-maintained lines.
- **Bootstrap becomes jQuery-free.** BS5 ships a vanilla-JS API. That severs Bootstrap's
  dependency on jQuery and makes the *eventual* full jQuery removal (future expansion) a
  tractable, isolated effort instead of an all-or-nothing knot.
- **One less generation in the "Frankenstein" stack.** Elektra carries three UI eras (inline
  jQuery → React → Juno). Decision 3 (replace touched jQuery widgets with a typed React component,
  or a small vanilla-TS module where that is lighter) means the migration actively **retires old
  inline/jQuery widgets** instead of preserving them — the codebase gets *more* consistent, not
  just newer, without over-reaching for React where it would add dependency weight.
- **Modern, lighter, more accessible baseline.** BS5 drops the icon font (`glyphicon`), ships
  CSS custom properties, better responsive/grid utilities, improved form controls and ARIA
  defaults — a stronger foundation for the facelift (Phase 6) and for new UI going forward.
- **Removes maintenance drag.** No more pinning around dead gems, no more shimming new React
  releases, fewer "why is this on jQuery 1.12" surprises. New contributors meet a current,
  documented framework instead of a 2015-era one.
- **A smaller, simpler dependency surface.** Net, the migration **removes** more than it adds:
  out go `bootstrap-sass`, `@types/react-bootstrap`, the 5 BS3 jQuery-plugin packages and their
  vendor CSS, the `bootstrap-kaminari-views` gem, and the `findDOMNode` shim. Decision 8 keeps it
  that way — no new micro-dependencies sneak in; trivial needs are built in-house as small typed
  helpers. Fewer deps = less supply-chain surface, less version churn, less unmaintained-package
  risk.
- **Type safety where we work ("touch it, type it").** Every file we open for the migration is
  moved from `.js`/`.jsx` to `.ts`/`.tsx` and typed in the same PR (decision 7). The react-bootstrap
  layer alone is **94 untyped `.jsx` files** today; migrating pays down that debt exactly where we
  are already rewriting, instead of touching the same files twice.
- **A measurable finish line.** The Phase-0 baseline grep makes "done" provable: a defined set of
  BS3 classes, attributes, and plugins that must reach **zero** — debt we can actually close out,
  not just carry.

## Current state (measured)

| Layer | Pin | Notes |
|-------|-----|-------|
| SCSS | `bootstrap-sass 3.4.1` (gem) | npm `bootstrap 3.4.1` too; `@import` chain in `app/assets/stylesheets/application.scss.erb` |
| React | `react-bootstrap 0.33.1` | last BS3-era release; v1=BS4, v2=BS5 (full API rewrite); 107 files import it |
| React typeahead | `react-bootstrap-typeahead ^6.4.1` | **separate** dep (not react-bootstrap); 11 files (core `autocomplete_field.jsx` + block_storage 4, identity 2, lbaas2 2, tools 2); bump alongside react-bootstrap in Phase 2 |
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
| `col-sm/md/lg-*` | 90 | 465 | kept; gutter/behavior review |
| `pull-right` / `pull-left` | 51 / 2 | 57 / 3 | `float-end` / `float-start` |
| `help-block` | 36 | 150 | `form-text` / `invalid-feedback` |
| `data-toggle`/`-target`/`-dismiss` | 61 | 112 | `data-bs-*` (silently break otherwise) |
| `form-group` | 37 | 103 | grid-based forms (mostly via `lib/elektra-form`) |
| `control-label` | 24 | 78 | `col-form-label` / `form-label` |
| `has-error` | 8 | 26 | `is-invalid` |
| `caret` | 7 | 9 | removed (CSS `::after`) |
| `label-*` | 5 | 23 | `badge` + `text-bg-*` |
| `input-group-addon` | 8 | 15 | `input-group-text` |
| `panel-*` (CSS class) | 5 | 25 | `.card` |
| `well` | 6 active (+3 commented) | 6 | `.card` / utilities |
| `glyphicon` | 1 | 8 | removed (icon font gone) |

### Bootstrap's own jQuery plugin call-sites (need BS5 vanilla API)

These are **Bootstrap-native** jQuery plugins (not the 5 third-party widgets above) — modal,
tooltip, popover, collapse, tab:

`.modal(` 19, `.tooltip(` 12, `.popover(` 7, `.collapse(` 3, `.tab(` 2 = ~43 call-sites, plus
declarative `data-toggle="tooltip|popover"` hooks (BS5: tooltips/popovers are **not**
auto-initialized — must opt in via JS). These are migrated to the BS5 vanilla API in **Phase 4**
(not Phase 3 — Phase 3 is only the 5 third-party widgets).

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
1. Bump `react-bootstrap` to v2, drop `@types/react-bootstrap` (v2 ships its own types). Bump
   `react-bootstrap-typeahead` to its BS5-compatible line in the same step (11 files: core
   `autocomplete_field.jsx` + block_storage 4, identity 2, lbaas2 2, tools 2).
2. Codemod the prop/API renames: `bsStyle`→`variant`, `bsSize`→`size` (`bsStyle` in 26 files),
   `<Label>`→`<Badge>` (1), `FormControl`/`Form` overhaul. (No `<Panel>`→`<Card>` here: Elektra
   has **zero** react-bootstrap `<Panel>` — the 15 `<Panel>` usages are all Juno, out of scope.
   Bootstrap `panel-*` **CSS classes** in HAML are handled as markup in Phase 4.)
3. Hand-review the transition components whose API changed: `Collapse` (10), `Overlay` (3),
   `Popover` (3), `Tooltip` (1), `Carousel` (1), `Alert` (18).
4. Start with the 4 **core** files + the two centralized components (`lib/elektra-form`'s
   `submit_button.jsx`, `lib/dialogs/dialog.jsx`), then fan out to plugins by tier.
5. **Delete `app/javascript/lib/react19-finddomnode-shim.js` and its 3 consumers**
   (`lib/widget.jsx`, `lib/dialogs/index.js`, `vitest.setup.ts`) → **closes #2190.**
6. **Rename each touched `.jsx` → `.tsx` and type it** (decision 7) — the 4 core files, the
   central Form lib, and every plugin react-bootstrap file as its tier is migrated.

- **Risk:** high (full-API lib migration). **Depends on:** Phase 1 (shared BS5 styles).
- **Test:** `pnpm test` for component units; migration specs per tier for overlays/collapses/
  buttons. **Exit:** shim gone, all react-bootstrap imports resolve on v2, specs green.

### Phase 3 — Replace BS3 jQuery plugins

**Goal:** no BS3-only jQuery widgets remain — replaced with a **typed React component or a
small vanilla-TS module**, chosen per widget (per decision 3).

> ⚠️ **Measure before you build — the real call-surface is small and uneven.** The 5 packages are
> in `package.json`, but actual *call-sites* are far fewer than a naive estimate: `bootstrap-select`
> (`.selectpicker()`) has **0 call-sites** (likely already a dead dependency — verify, then just
> drop it); `bootstrap-3-typeahead` (`.typeahead()`) has **0 direct calls** (it's imported in
> `application.js` but not invoked — the React autocomplete uses the separate
> `react-bootstrap-typeahead`, don't confuse them); `bootstrap-multiselect` is used in ~**6** files
> (data-attr-driven via `core/init.js` `[data-multiselect-box]` + identity `project_members.js`
> `.multiselect(`); `bootstrap-slider` in **2**; `datetimepicker` **1** real call-site + its lib
> file. **This is a handful of sites, not dozens.** Re-run the Phase-0 baseline against each
> package first; packages with zero call-sites are a delete, not a rewrite.

Steps:
1. **Audit first:** confirm per-package call-sites against the baseline (expect 0 for
   `bootstrap-select` and `bootstrap-3-typeahead`). Any zero-call-site package → remove the import
   + dependency outright (no replacement needed).
2. For the packages that *are* called (`multiselect`, `slider`, `datetimepicker`), replace each
   with its best-fit modern equivalent (the consolidation path) — they have **no BS5 drop-in**
   anyway, so this is the moment to retire the jQuery-in-HAML variant. **Per decision 3, weigh
   React vs. vanilla-TS for each widget:** default to a React component when it reuses an existing
   component or lives in a React tree; choose a small, self-contained **vanilla-TS** module for
   isolated leaf widgets where a React port would only drag in a dependency tail. Either way:
   TypeScript, no new jQuery/third-party UI lib. Reuse existing React patterns / Juno where a
   suitable component already exists. **No new npm dependency to replace a widget (decision 8)** —
   if the need is small, build a short typed in-house module instead of pulling a single-purpose
   package.
3. Replace each real usage site — `.multiselect()` (incl. the `[data-multiselect-box]` auto-init
   in `core/init.js`), `.slider()`, `datetimepicker`. Where the widget sits in a HAML view, mount
   the replacement into that spot (the React-widget mount pattern, or a scoped vanilla-TS init for
   the lighter cases).
4. Remove the npm packages and their SCSS/vendor CSS once no longer referenced.

- **Risk:** medium (small call-surface, but behavioral + markup→component conversion).
  **Depends on:** Phase 1.
- **Test:** migration specs that interact with each remaining widget (open multiselect, pick date,
  drag slider). **Exit:** every call-site is a typed React or vanilla-TS replacement; all 5 jQuery
  widget packages removed from `package.json`.

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
   `lib/elektra-form` (56 files) — so most plugin markup inherits the fix. (Division of labor:
   their **react-bootstrap API** is handled in Phase 2; here in Phase 4 we fix the **BS3 markup /
   `data-*` attributes** inside them. Note `lib/components/Modal.tsx` is already a React-19 drop-in
   from PR #2189 and already TypeScript — confirm whether it still renders BS3 modal markup/classes
   that need the `data-bs-*` + class updates, rather than assuming it's untouched.)
6. **Manually test the plugin** — click through its real screens (forms, modals, tables,
   wizards) until it behaves correctly, backed by that plugin's migration specs.

- **Risk:** medium (broad but mechanical). **Depends on:** Phases 1–3.
- **Test:** scripted pass + **manual click-through per plugin** + migration specs (functional);
  grep the plugin dir against baseline.
  **Exit per plugin:** zero BS3 classes/attrs in that plugin, every touched file now `.ts`/`.tsx`
  and typechecking (`pnpm typecheck` clean), specs green, manual pass signed off.

### Phase 5 — Pagination & cleanup

**Goal:** remove the last BS3 remnants and the temporary scaffolding.

Steps:
1. Replace `bootstrap-kaminari-views` gem with BS5-styled Kaminari templates (~16 paginated
   call-sites via `render_paginatable`/`paginate`).
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
- Scope: deep and specific, per Tier-A/B plugin screen; **functional assertions only** (renders,
  clickable, opens, submits) — no pixel-diffs, since the BS5 look changes screens on purpose.
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

> Decided: Phase 3 replacement = **typed React component by default, small vanilla-TS where React
> would drag in a disproportionate dependency tail; no new jQuery/UI lib** (see decision 3).
> Decided: Phase 4 approach = **hybrid, per plugin** (see decision 4).
> Decided: rollout = **incremental PRs to `master` + temporary compat-shim** (see decision 5);
> no single giant branch/merge.
> Decided: **embrace BS5 look during migration; deliberate facelift in Phase 6** (see decision 6).
> Decided: **touch it, type it** — every `.js`/`.jsx` we open migrates to `.ts`/`.tsx` in the
> same PR (see decision 7).
> Decided: **no new complex dependencies — simplify; build small things ourselves rather than
> pull a single-purpose npm** (see decision 8).

## Effort summary (relative)

- **HIGH:** react-bootstrap v2 rewrite (107); SCSS variable/mixin rewrite (`_monsoon_theme.scss`);
  `btn-default` rename (155 files).
- **MEDIUM:** grid review (90); `data-*` → `data-bs-*` (61 files); modal/form via centralized libs;
  Bootstrap-native `.modal(`/`.tooltip(` → BS5 vanilla API (~43); `pull-right`→`float-end` (51);
  nav-tabs/caret.
- **LOW:** replacing the BS3 third-party jQuery widgets (**small**: 2 are dead deletes, only
  multiselect/slider/datetimepicker need real work); `panel-*` CSS classes → card (5 files);
  well (6 active); label→badge (5); input-group-addon (8); glyphicon (1); pagination templates.

## Core vs. plugin breakdown (what to migrate & test, piece by piece)

### Core (`app/`) — must go first, everything depends on it

The core footprint is small in file count but high in leverage: fixing it unblocks every plugin.

**SCSS (Phase 1):**
- `app/assets/stylesheets/application.scss.erb` — the single `@import` entrypoint
- `app/assets/stylesheets/_variables.scss` — BS3 var overrides → BS5 Sass-map model
- `app/assets/stylesheets/_mixins.scss` — `make-*-column`, `$screen-*-min` → BS5 mixins
- `app/assets/stylesheets/_monsoon_theme.scss` — **2842 lines**, the main custom theme

**React (Phase 2) — only 4 core files import react-bootstrap (all `.jsx` → migrate to `.tsx`):**
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

**jQuery plugins (stay as jQuery, but verify BS5-neutral):** the 8 `core/jquery.*` plugins.
These keep working on jQuery; only confirm they don't rely on BS3 CSS/markup. Separately,
`lib/bootstrap-datetimepicker.js` is a **BS3 jQuery plugin and does *not* stay** — it is one of
the third-party widgets replaced in Phase 3 (its single real call-site + the lib file). The
`[data-multiselect-box]` auto-init in `core/init.js` (bootstrap-multiselect) is likewise a
**Phase 3** replacement. Core's ~43 **Bootstrap-native** jQuery calls (`.modal(`/`.tooltip(`/
`.popover(`…) are a separate concern → migrated to the BS5 vanilla API in **Phase 4**.

**Core numbers:** 4 react-bootstrap files · 10 `btn-default` files · ~8 `data-*` files ·
6 inline-`$()` view files · 1 BS3-widget call-site (`core/init.js` multiselect) + the
datetimepicker lib → Phase 3; ~43 Bootstrap-native `.modal(`/`.tooltip(` calls → Phase 4.

### Plugins — migrate & test in tiers (by Bootstrap footprint)

Legend: **rb**=react-bootstrap files · **btn**=`btn-default` · **pull**=`pull-*` ·
**data**=`data-toggle/target/dismiss` (counted across **all** file types incl. JSX/TSX, not just
views) · **jqPl**=real BS3 third-party jQuery-plugin *calls* (not `react-bootstrap-typeahead`
imports) · **inln**=inline `$()` in views. Note: `jqPl` is near-zero everywhere — the only real
call is `identity` (`.multiselect(`); the shared `core/init.js` multiselect auto-init is counted
in Core, not per plugin.

**Tier A — heavy (migrate first after core, test hard):**

| Plugin | rb | btn | pull | data | jqPl | inln | Notes |
|---|---|---|---|---|---|---|---|
| `networking` | 15 | 29 | 9 | 7 | 0 | 13 | all axes; biggest markup+inline load |
| `compute` | 0 | 31 | 12 | 1 | 0 | 22 | most inline `$()` + `btn-default`; no react-bootstrap |
| `lbaas2` | 28 | 5 | 2 | 8 | 0 | 0 | **most react-bootstrap** (incl. custom `DropdownMenu.jsx`) |
| `identity` | 1 | 17 | 5 | 3 | 1 | 9 | wizards w/ inline jQuery; the **only** real BS3 jQuery-plugin call (`.multiselect(`) |
| `shared_filesystem_storage` | 21 | 6 | 1 | 5 | 0 | 0 | react-bootstrap heavy |
| `block_storage` | 14 | 2 | 0 | 2 | 0 | 0 | react-bootstrap (jqPl earlier was typeahead imports, not jQuery) |

**Tier B — medium:**

| Plugin | rb | btn | pull | data | jqPl | inln | Notes |
|---|---|---|---|---|---|---|---|
| `dns_service` | 0 | 15 | 8 | 1 | 0 | 18 | lots of wizard inline jQuery + markup |
| `object_storage` | 12 | 5 | 1 | 0 | 0 | 0 | react-bootstrap |
| `image` | 3 | 7 | 3 | 1 | 0 | 8 | mixed markup + inline |
| `keppel` | 9 | 8 | 0 | 3 | 0 | 0 | react-bootstrap |
| `kubernetes` | 0 | 7 | 3 | 3 | 0 | 0 | markup only (note: `kubernetes_ng` is Juno-based, untouched) |

**Tier C — light (quick, low risk):**

| Plugin | rb | btn | pull | data | jqPl | inln | Notes |
|---|---|---|---|---|---|---|---|
| `tools` | 4 | 3 | 0 | 2 | 0 | 0 | small react-bootstrap (earlier jqPl was typeahead imports) |
| `masterdata_cockpit` | 0 | 0 | 2 | 2 | 0 | 6 | inline jQuery + `data-*` |
| `inquiry` | 0 | 4 | 0 | 0 | 0 | 2 | small |
| `lookup` | 0 | 2 | 2 | 1 | 0 | 0 | markup only |
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

