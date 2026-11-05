# Bootstrap 3 → 5 Migration — Regression Review Plan

Purpose: systematically find **anything the migration missed** (un-migrated BS3
remnants) **or broke** (regressions the switch introduced). The migration's
governing reality is **"compiles ≠ looks right"** (see
[`README.md` §4b](README.md)): build/typecheck/tests go green long before the UI
is correct, so this plan deliberately layers *static* checks (cheap, catch
remnants) **and** *runtime/visual* checks (catch the real breakage).

> Scope note: react-bootstrap props, Bootstrap JS behaviour, and SCSS variable
> values are **not** validated by the compiler or by Vitest. Treat every "green"
> below as necessary-but-not-sufficient.

---

## 0. How to use this plan

Work top-to-bottom. Each item has: **what**, **how** (concrete command / where to
look), and **pass criteria**. Record findings in the tracking table at the end.
File a fix (or a deliberate "kept as app-owned utility" note) for every miss.

Two environments:

- **Static / build** — run in the dev container (`bin/workspace …`).
- **Runtime / visual** — a human drives the browser against `RAILS_ENV=e2e`
  (`http://localhost:4001`) per [`README.md` §7](README.md). No QA/SSO.

---

## 1. Static sweep — un-migrated BS3 remnants

Goal: prove there are **zero** BS3-only class names / attributes left in **source**
(never trust `app/assets/builds`, `vendor`, `node_modules`).

> ⚠️ Lesson learned: a naive grep gave a false "0 users" for `.well` because HAML
> writes the class as a bare `.well` at line start, not `class="well"`. **Every
> class check below must cover all four syntaxes:** `class="…"` (ERB/HTML),
> `className="…"`/`` className={`…`} `` (JSX), HAML dot-notation `%tag.x` / `.x`
> at line start, and dynamic strings built in JS (`'<div class="x">'`,
> `"… x …"` passed to `$()`), plus Ruby `class: 'x'` / `content_tag`.

### 1a. Removed/renamed BS3 classes (must be 0)

| BS3 class | BS5 target | notes |
| --- | --- | --- |
| `panel`, `panel-*` | `card`, `card-*` | exclude Juno `juno-panel`, test ids |
| `btn-default` | `btn-secondary` | |
| `btn-block` | `d-block w-100` | |
| `label`, `label-*` | `badge`, `text-bg-*` | exclude `label-right`, `label-tooltip`, `form-label`, `control-label`, `image-label`, `aria-label` |
| `well`, `page-header`, `jumbotron` | card / utilities | **`.well` is kept as an app-owned shim (6 live users) — confirm the shim exists, not that markup is 0** |
| `pull-left` / `pull-right` | `float-start` / `float-end` | |
| `col-xs-*` | `col-*` | |
| `hidden`, `hidden-xs`, `visible-xs` | `d-none` + responsive | |
| `img-responsive` | `img-fluid` | |
| `sr-only`, `sr-only-focusable` | `visually-hidden(-focusable)` | |
| `input-group-addon`, `input-group-btn` | input-group children / `input-group-text` | |
| `control-label`, `help-block` | `form-label`/`col-form-label`, `form-text`/`invalid-feedback` | exclude `help-block-text`, `help-block-popover` |
| `form-group` | `mb-3` (+ JS selectors!) | simple_form emits `.mb-3`; check `.closest('.form-group')`/`$('… .form-group')` too |
| `ml-*`/`mr-*`/`pl-*`/`pr-*` (BS4) | `ms-*`/`me-*`/`ps-*`/`pe-*` | exclude Tailwind `tw-*` and prose "as well" |
| `badge-pill` | `rounded-pill` | |
| `dropdown-menu-right` | `dropdown-menu-end` | |
| `nav`/`navbar` BS3: `navbar-inverse`, `navbar-header`, `navbar-right`, `navbar-toggle`, `navbar-fixed-top`, `icon-bar` | BS5 navbar | |
| `caret` | kept as app-owned utility (3 users) | confirm shim exists |
| `btn-xs` | kept as app-owned utility (17 users) | confirm shim exists |
| `glyphicon*` | FA / remove | |

**How:** use the helper script below (covers all syntaxes + exclusions), or the
Grep tool per class. The script is intentionally conservative — review every hit
by hand, don't trust the count blindly.

```bash
bin/workspace bash docs/bootstrap5-migration/scan-bs3-remnants.sh
```

**Pass:** every removed/renamed class above = 0 real hits (app-owned `well`,
`btn-xs`, `caret` excepted, and only because their shims are present).

### 1b. BS3 data attributes (must be 0, except documented custom values)

| BS3 | BS5 | keep (custom, do NOT touch) |
| --- | --- | --- |
| `data-toggle` | `data-bs-toggle` | `help`, `paginationSpinner`, `show-error-details` |
| `data-target` | `data-bs-target` | React test-ids (plain-string values, not `#id`) |
| `data-dismiss`/`data-backdrop`/`data-keyboard`/`data-ride`/`data-slide` | `data-bs-*` | — |

Search `.haml .erb .jsx .tsx .js .ts .rb` and the simple_form initializers under
`config/initializers/` (the `help_hint` popover miss lived there).

### 1c. BS3-only jQuery plugins (must be replaced, not just present)

`.multiselect(`, `.selectpicker`/`bootstrap-select`, `.slider(`,
`datetimepicker`, jQuery `typeahead`, jQuery-UI `.autocomplete(`. Confirm each
remaining call-site is intentional and works under BS5 + jQuery 3.7.

### 1d. Gems / packages

- `Gemfile`/`Gemfile.lock`: **no** `bootstrap-sass`. `font-awesome-sass ~>4` is a
  known, deliberate leftover (Phase 6b).
- `package.json`: `bootstrap@5.3.x`, `react-bootstrap@2.x`, `jquery@3.7.x`,
  `bootstrap-multiselect@2.x`.

### 1e. Orphaned / live compat shims

For each shim in `_monsoon_theme.scss`, `_generals.scss`, `_forms.scss`,
`_bs5_compat_shim.scss`: is it still referenced by live markup?
- **0 users → delete** (but re-verify with the all-syntax grep — this is exactly
  where `.well` was wrongly dropped).
- **>0 users → keep** and note it as app-owned.

---

## 2. Build / static-analysis gate

| Check | Command | Pass |
| --- | --- | --- |
| JS/TS types | `bin/workspace pnpm typecheck` | 0 errors |
| JS bundle | `bin/workspace pnpm build` | "Compile completed successfully" |
| **SCSS via Sprockets** (the real pipeline, not esbuild) | `bin/workspace bash -lc "RAILS_ENV=development bundle exec ruby -e \"require './config/environment'; puts Rails.application.assets.find_asset('application.css') ? :ok : :fail\""` | `ok`, no Sass error |
| JS unit/component | `bin/workspace pnpm test` | all green (currently 2227) |
| Ruby | `bin/workspace bundle exec rspec` | green |
| HAML syntax (changed views) | `Haml::Template.new(f)` per file | compiles |

> Reminder: green here does **not** prove visual correctness. It only rules out
> hard breakage (removed symbols, Sass errors, dead imports).

---

## 3. Runtime / visual review (the part that actually catches regressions)

Driven by a human in the browser (`RAILS_ENV=e2e`, port 4001). This is where
rb2 prop drops, BS5 JS behaviour, and SCSS value drift surface.

### 3a. Cross-cutting interactive components (test once, everywhere)

For each, open a page that uses it and confirm it **opens, positions, and closes**:

- **Modals** — open/close, backdrop, `Esc`, stacked/AJAX-loaded modals, no
  leftover/stacked backdrops. (BS5 `.show` not `.in`; `btn-close` not `close`.)
- **Dropdowns** — incl. the breadcrumb **mega-dropdown** (`data-mega-dropdown`),
  the top-nav user menu + **region switcher** (both broke once — see
  `_cloudops_nav`/`_nav`), table action dropdowns.
- **Tooltips / popovers** — `data-bs-toggle`, the simple_form **`help_hint`**
  info-icon popover (was broken), lbaas2 PopoverInfo/CopyPastePopover.
- **Tabs** — tab switching + ARIA.
- **Collapse / accordion**.
- **Multiselect** (`.multiselect(`) and **autocomplete** (jQuery-UI) fields.
- **Flash / alerts** — dismiss button (`btn-close`).
- **Forms** — labels, hints (`form-text`), validation/error styling
  (`is-invalid`/`invalid-feedback`/`text-danger`), inline add-forms
  (networking subnets / bgp_vpns rbacs: fields + Add/Cancel layout).

### 3b. Per-plugin click-through (catch the silent prop/style drift)

Go plugin-by-plugin; on each main list + create/edit/show view check:
buttons (variant/size, esp. the 33 files that had `bsStyle`/`bsSize`/`bsClass`),
badges/labels, tables, spacing, and any inline/wizard forms.

Priority order (by rb2/BS-coupling risk, from `README.md` inventory):

1. **lbaas2** (28 `bsStyle/Size/Class` files, Overlay/Popover trio, StateLabel→Badge, btn-xs)
2. **networking** (ports, routers, subnets, floating IPs, bgp_vpns, dhcp agents, rbac inline forms, security groups)
3. **identity** (domains/projects api-endpoints `.well`, choose-scope, role assignments)
4. **compute** (servers/volumes/images/flavors, create-instance wizard)
5. **block_storage**, **object_storage**, **image**, **keppel**, **dns_service**,
   **masterdata_cockpit**, **inquiry**, **kubernetes**, **reports**, **audit**,
   **lookup**, **tools**, **shared_filesystem_storage**, **email_service**,
   **keymanagerng**, **cloudops**.
6. **Juno-based plugins** — out of scope to change (D5), but still click-through
   to confirm the BS5 switch didn't disturb their host pages.

### 3c. Layout/auth shells (non-dashboard)

Login, SSO-only, noscope, error pages, 2FA, password-sync, jump, auth_token —
all had BS3 navbars/`btn-block`; confirm brand, buttons, and (where present)
the user/region group render.

### 3d. Responsive + theme

- Collapse the viewport (md breakpoint): navbars toggle, grids reflow
  (`col-xs-*` removal), no horizontal overflow.
- Monsoon brand look: `navbar-sap` gradient, button palette
  (`btn-secondary`/`btn-danger` contrast), badges, `.well` boxes.

---

## 4. Security re-audit (Phase 6 goal, zero visual risk)

```bash
bin/workspace pnpm audit
```
Confirm the jQuery (1.12.4) and Bootstrap (3.4.1) + bootstrap-multiselect
advisories are gone. Note any new/unrelated advisories separately.

---

## 5. Git-assisted regression hunt

The migration branch is large; use history to spot accidental drops.

- `git diff --stat origin/master...HEAD` — review the full surface.
- For each deleted SCSS rule / shim in the branch, grep for live users of the
  class it provided (the `.well` lesson — do it for **every** removed shim).
- `git log --oneline origin/master..HEAD | grep -iE "fix|regression"` — cluster
  of fixes often points at a fragile area to re-test.

---

## 6. Findings tracker

| # | Area | Type (miss / regression) | Severity | Detail | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | identity/inquiry | regression (self-inflicted) | high | `.well` shim removed in Phase 6 but 6 live users → boxes unstyled | **fixed** (restore shim, commit `ad19ef1b9`) |
| 2 | `lib/components/Overlay.jsx` | dead BS3 code | low | commented-out `Tooltip2`/`TooltipContent2` (BS3 `.in` tooltip markup) + stray `console.log`; 0 importers | **fixed** (deleted, commit `97975d9e0`) |
| 3 | `app/javascript/react-bootstrap.d.ts` | stale shim (type safety) | medium | `declare module "react-bootstrap"` forced `any`, hiding rb2's real types + declaring dead `react-bootstrap/lib/*` imports | **fixed** (removed + tsconfig include; tsc/build green, commit `97975d9e0`) |
| 4 | masterdata_cockpit SCSS | dead CSS (pre-existing) | low | `.co-help-block`/`.op-help-block` rules have 0 markup users | open — Phase 6 cleanup (not migration-introduced) |
| 5 | `font-awesome-sass ~>4` (Gemfile), `_bs5_compat_shim.scss` | deferred | info | FA4 and the BS3 vars/mixins shim intentionally kept | open — Phase 6/6b (by design) |
| 6 | `.multiselect(` (2), jquery-ui `.autocomplete(` (9) | BS3-era jQuery plugins | info | still present; run under jQuery 3.7 — verify in §3 runtime | open — §3 runtime check |
| 7 | `bootstrap-kaminari-views` gem (pagination) | potential BS-coupled markup | medium | confirm pagination renders correctly under BS5 | open — §3 runtime check |

### Static review result (§1, §2, §4, §5)

- **§1 remnant scan:** 0 un-explained BS3 classes / data-attrs. Only app-owned
  `.well`/`.btn-xs`/`.caret` and the known jQuery plugins remain (findings 5–6).
- **§2 build gate:** typecheck ✅, esbuild ✅, Sprockets SCSS ✅ (824 KB),
  Vitest ✅ (2227 passed), RSpec ✅ (1700 examples, 0 failures).
- **§4 pnpm audit:** **0 jQuery and 0 Bootstrap advisories** (the migration's
  security goal is met — jQuery 1.12.4, Bootstrap 3.4.1, bootstrap-multiselect
  0.9.15 CVEs all closed). The remaining 77 advisories are all build/dev
  toolchain (commitlint/fast-uri, postcss, vitest, js-yaml, …), out of BS5 scope.
- **§5 git hunt:** every SCSS rule removed on the branch that still has live
  markup users also still has a style (verified class-by-class); the only gap
  was `.well` (finding #1, fixed). No other shim removed without replacement.

Remaining work is **runtime/visual only** (§3) + the deferred Phase-6 items.

---

## 7. Exit criteria

- §1 static sweep: 0 un-explained BS3 remnants (documented app-owned shims aside).
- §2 gate: all green.
- §3 visual: every cross-cutting component + every plugin's main views reviewed,
  findings filed.
- §4: BS3/jQuery advisories closed.
- All tracker rows resolved (fixed, or consciously accepted with rationale).
- `README.md` §9 progress log + PR #2214 status table updated to match reality.

---

## 8. §3 runtime walkthrough checklist (for the browser pass)

Start Rails in e2e mode, log in (`http://localhost:4001`), tick each box. The
static review (§1/§2/§4/§5) is **done and green** — this is the only part left,
and it's what actually catches rb2-prop / BS5-JS / SCSS-value regressions.

### Cross-cutting (test on any page that shows them)

- [ ] Modal opens/closes, backdrop OK, `Esc` closes, no stacked/leftover backdrop
- [ ] AJAX-loaded modal (e.g. networking router new/edit) opens & closes
- [ ] Top-nav **user menu** dropdown opens (dashboard `_nav` + CLOUDOPS `_cloudops_nav`)
- [ ] Top-nav **region switcher** dropdown opens and lists regions
- [ ] Breadcrumb **mega-dropdown** opens (`data-mega-dropdown`)
- [ ] Table/row action dropdowns open (e.g. networking ports, lbaas2 lists)
- [ ] Tooltips show (`abbr[title]`, `[data-bs-toggle=tooltip]`)
- [ ] simple_form **help_hint** info-icon popover shows (finding re: `help_hint.rb`)
- [ ] Tabs switch (identity, image, tools, …)
- [ ] Collapse/accordion toggles
- [ ] Flash/alert **dismiss** button (`btn-close`) works and shows the ✕
- [ ] **Multiselect** fields work — finding #6 (`core/init.js`, identity project members)
- [ ] **jQuery-UI autocomplete** works — finding #6 (networking rbac `new`, compute fixed-ip)
- [ ] **Pagination** renders correctly — finding #7 (`bootstrap-kaminari-views`): any long list

### Forms / validation

- [ ] Labels + hints (`form-text`) positioned correctly
- [ ] Validation errors styled red (`is-invalid`/`invalid-feedback`/`text-danger`)
- [ ] Inline add-forms layout: networking subnets (name/CIDR + Add/Cancel inline),
      bgp_vpns rbacs/routers Add row, networks access `_new_rbac_form`
- [ ] Horizontal forms (router new/edit) field/label columns align

### Per-plugin click-through (main list + create/edit/show)

Priority by rb2/BS coupling:

- [ ] **lbaas2** — buttons (variant/size), `btn-xs` action buttons, StateLabel
      badges, PopoverInfo/CopyPastePopover, health monitor/listener/pool/member forms
- [ ] **networking** — ports (list/edit/show, dropdown, tags badges), routers
      (status badges), subnets, floating IPs, bgp_vpns, dhcp agents, security groups
- [ ] **identity** — domains/projects api-endpoints **`.well`** boxes, choose-scope,
      role assignments (typeahead), project members (multiselect)
- [ ] **compute** — servers/volumes/images/flavors lists, create-instance wizard, fixed-ip autocomplete
- [ ] **masterdata_cockpit** — additional-infos warning badges, help_hint popovers
- [ ] **keppel** — image labels (badges), rbac add button, move/hovercopier btn-xs
- [ ] **object_storage / block_storage / image / dns_service / inquiry** — lists, modals, badges
- [ ] **reports / audit / lookup / tools** — btn-xs, caret toggles, tables
- [ ] **kubernetes / shared_filesystem_storage / email_service / keymanagerng** — forms, Juno host pages unaffected

### Auth/layout shells

- [ ] Login, SSO-only, noscope, error page, 2FA, password-sync — navbar + full-width buttons render

### Responsive + theme

- [ ] md breakpoint: navbar toggler works, grid reflows, no horizontal overflow
- [ ] monsoon look: navbar-sap gradient, btn-secondary/btn-danger contrast, `.well` boxes

> File every visual miss into the §6 tracker; fixes that change markup/SCSS must
> re-pass §2 (and ideally a Playwright snapshot once Phase 0 exists).
