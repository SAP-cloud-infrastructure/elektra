# Architecture Spec: `compute_njq` — autonomous React/BFF plugin alongside `compute`

## Context

The existing `compute` plugin is a classic Rails app: HAML server-side rendering
+ jQuery for the frontend, server-side `.js.erb` DOM patches, a service layer that
returns Rails model objects. It has aged: 50 HAML templates, 16 `.js.erb` files,
decaffeinated CoffeeScript (`fixed_ip.js`), inline `:javascript` blocks with raw
`fetch()` calls. Goal: get rid of jQuery (security + UX), modern React UX, clean
separation.

**Team decision (deliberate, not a migration):** A **completely new, autonomous
plugin `compute_njq`** is built **in parallel**. The old `compute` stays untouched
and is **not** disabled. The new plugin has **no** cross-connections to other
service layers/plugins (`services.networking`, `services.image`,
`services.block_storage`, `services.identity`). Everything — networks, floating
IPs, images, volumes too — is implemented **in its own scope** against the
OpenStack APIs. Cross-connections exist only **at the API level** (the browser
calls several BFF endpoints of *this* plugin). Deliberately accepted price:
**redundancy** versus the existing service layers. Gain: when something changes in
another plugin/service, `compute_njq` does not break.

**Scope restriction:** `compute_njq` must **only appear in dev** — no prod
deployment while under development.

**Assessment (why this path is good):** The stack already exists as a reference in
`smartops` (simple, clean structure) and `kubernetes_ng` (more robust patterns):
`AjaxController` BFF + React Pattern 4 (TanStack Router + Juno `AppShellProvider`)
+ a service layer that calls OpenStack directly and returns plain hashes. The
autonomy principle is exactly what makes a real backend-for-frontend. Risk is low
because it runs in parallel (fallback = the old plugin stays).

**Reference strategy (best practice, no half measures):** `smartops` serves as the
**structural skeleton** (minimal, readable), but its patterns are **not copied
1:1** — several are rough edges. Where `smartops` is weaker, the **more robust
`kubernetes_ng` patterns** are adopted. See the "Best-practice filter" section.

**UI framework:** **Juno UI 4.0.1 first.** Where Juno does not provide a
component/function, the **fallback is allowed** — in this order: (1) Tailwind
`tw-` utilities (for layout/spacing, as `kubernetes_ng` does with ~95 `tw-`
classes), (2) **Bootstrap 5.3.8** / react-bootstrap 2.10.10 for missing
components. `smartops` stays deliberately Juno-only (0 `tw-`), `kubernetes_ng`
mixes Juno + Tailwind — both ends are proven in the repo.

> **Update (2026-11-10, team decision — reverses the UI strategy):** Instead of
> "Juno first" now **Bootstrap 5 first**, so that `compute_njq` **looks like the
> old `compute` page**. Juno is **removed entirely from the plugin** (no
> `@cloudoperators/juno` imports). The old UI is pure BS5 (`.table.instances`,
> `.toolbar`, `.input-group`, `.form-control`, `.btn`, `.status-pill`), and BS5 is
> loaded globally — the widget renders without Shadow DOM into the host page and
> inherits the BS5 styles directly. Status pills use the **shared core component**
> `app/javascript/lib/components/StatusPill.tsx` (same `.status-pill` look as the
> HAML world); that is core infra (`lib/*`, like `lib/ajax_helper`), **not a
> foreign plugin** → autonomy is preserved. TanStack Router/Query, Zod and the BFF
> JSON shape stay unchanged (pure UI change).

---

## Verified facts (as the basis)

- **No `RAILS_ENV=e2e`.** Rails envs are only `development`, `production`, `test`.
  E2E is Playwright against a normally running server.
- **Plugins are loaded env-agnostically via a Gemfile glob** (`Gemfile:76-84`, glob
  over `plugins/*`). The prod Docker image (`docker/Dockerfile`) copies **all**
  `plugins/*` and esbuild globs all widget entrypoints. A `Rails.env` guard in the
  engine only prevents *mounting*, not gem load/JS build → the plugin would still
  be in the prod image.
- **The only real prod-exclusion lever:** `BLACK_LIST_PLUGINS` (`Gemfile:76-84`),
  read at `bundle install` time. Currently set nowhere. Must be injected as a
  build arg/ENV into the prod `bundle install` step in `docker/Dockerfile`.
- **Engine auto-mount:** `config/routes.rb:82-93` mounts every `mountable_plugin`
  automatically under `/:domain/:project/<mount_point>`. `mount_point` comes from
  the gemspec `spec.metadata["mount_path"]`. No explicit `mount` entry needed.
- **esbuild auto-discovery:** `config/esbuild/build.js` scans
  `plugins/*/esbuild.plugin.js` and merges the exported plugins. Entrypoint
  `widgets/app/init.js` → asset `compute_njq_app_widget`. No root build-config
  change needed.
- **No new npm deps needed:** React 19, `@tanstack/react-query@^4.28.0`,
  `@tanstack/react-router@1.131.25`, `zod@^4.1.12`, Juno `4.0.1` are in the root
  `package.json`.
- **Bootstrap 5.3.8 IS present and active** (`package.json`,
  `application.scss.erb` imports `bootstrap/scss/bootstrap`, BS5 JS as a singleton
  via `essentials.js` on `window.bootstrap`). **The docs are wrong:** CLAUDE.md and
  `skills/css-styling/SKILL.md` claim BS 3.4.1 — that is no longer true.
  react-bootstrap 2.10.10 (BS5-compatible) is also installed.
- **`smartops`/`kubernetes_ng` have NO `db/` and NO engine initializers** → do not
  replicate for a DB-less BFF.
- **Shared-infra facts:** `createAjaxHelper` (`app/javascript/lib/ajax_helper.js`)
  provides `get/post/put/patch/delete`, `baseURL`, CSRF injection, `.cancelable.*`
  (AbortController) and throws on `!response.ok` an error with
  `.status/.data/.response`. **Known latent bug**: `osApi` header prefixing
  (`ajax_helper.js:392`, `heders` typo) — avoid `osApi` therefore; we talk to our
  own BFF anyway, not the OS API proxy.

---

## Target architecture

### Autonomy principle (core rule)
No `services.<foreign>` call. `compute_njq_service` builds its own Elektron
handles per OpenStack backend (Nova, Neutron, Glance, Cinder) and calls them
directly. Redundancy is deliberate, but **narrow** (only the fields the new UI
shows) and **modular** (one mixin per backend).

### Data flow
`DashboardController#show` renders a HAML page with a React mount point. React
(Pattern 4) calls the BFF JSON endpoints under `/:scope/api/...`. **Aggregation in
the BFF**: `GET /api/instances` joins Nova + Neutron + Glance server-side in an
`InstanceAssembler` and returns UI-ready JSON (Pattern C, plain hashes). React does
not aggregate across multiple queries.

### Logic placement (solves the "where does the helper logic land?" question)
- **Data fetching + shaping** (today `grouped_images`, `grouped_flavors`, IP
  aggregation in `instances_helper.rb`) → **new & narrow** in
  `compute_njq_services/*` + `instance_assembler.rb` (Ruby). Do not call the old
  helper — reimplement.
- **Presentation** (IP pills, status pills, labels, "+N more" toggle) → React/TS
  components.
- **Semantic status mapping** (vm_state/task_state → status) → in the BFF (returns
  the semantic state); color/icon/pill → React (uses the existing Juno status
  pills, cf. commit `b853617`).
- **Anti-pattern (forbidden):** passing HTML strings as JSON (`{ ip_html:
  "<p>..." }`). The BFF returns data, React decides on markup.

---

## Best-practice filter (COPY vs. do NOT reproduce)

`smartops` = structural model (lean), but several patterns are rough edges.
Binding:

**COPY (from `kubernetes_ng`, the more robust model):**
- **Typed, complete error envelope** `handle_api_call` → uniform `{ error, code,
  message }` with a matching HTTP status + upstream status passthrough. Error
  ladder by type: `Elektron::Errors::ApiResponse` → `e.code`,
  `Elektron::Errors::Request` → 500, `Net::HTTPError` → 500, own domain errors →
  400. (kng `base_controller.rb:28-60`.)
- **Elektron handle with robustness** where needed: internal→public interface
  fallback via `rescue Elektron::Errors::ServiceEndpointUnavailable` +
  memoization (kng `elektron_gardener`).
- **Zod `safeParse` per endpoint at RUNTIME** (not just `z.infer` types) + error
  normalization.
- **TanStack Query** for all server state (`useQuery`/`useMutation`,
  `isLoading`/error, `invalidateQueries`), not pulling data only via route loaders.
- **Deep test coverage**: RSpec per service module + assembler + controller error
  cases; Vitest per component + apiClient parsing.

**Do NOT reproduce (rough edges from `smartops` / shared infra):**
- ❌ The `smartops` error envelope `{ success, error }` with a **blanket
  `:bad_request`** for all non-Elektron errors and the assumption that
  `error.response` exists. → Use the kng envelope instead.
- ❌ Misnamed ivar (`@elektron_identity` in the smartops service) → clean,
  descriptive names.
- ❌ Hardcoded `return true` after POST without evaluating the response.
- ❌ Zod schemas as types only (smartops does NOT validate responses at runtime) →
  we validate.
- ❌ Dead `available?` that is never called → either use it at the request
  boundary or drop it.
- ❌ Logging object/job IDs (`Rails.logger.info` with IDs) — AGENTS.md: no
  sensitive logging.
- ❌ Leftover debug comments / commented-out code.
- ❌ The ajax_helper's `osApi` (latent `heders` bug) — we only call our own BFF.

**Juno-first + fallback (document where deviating):** Juno 4.0.1 first (reference
components from smartops: `AppShellProvider`, `AppShell embedded`, `DataGrid*`,
`Panel`, `PanelBody`, `Message`, `Badge`, `Stack`, `Button`, `Spinner`,
`IntroBox`). If something is missing: Tailwind `tw-` (layout) → BS5/react-bootstrap
(components). Briefly justify every deviation from Juno in the code.

---

## File structure (verified against real `kubernetes_ng` files)

```
plugins/compute_njq/
├── compute_njq.gemspec                     # spec.metadata = { "mount_path" => "compute-njq" }
├── tsconfig.json                          # 4 lines: extends ../../tsconfig.json, include widgets
├── esbuild.plugin.js                      # createTanstackRouterPlugin with compute_njq paths
├── lib/
│   ├── compute_njq.rb                      # require version + engine
│   └── compute_njq/
│       ├── engine.rb                      # isolate_namespace ComputeNjq (minimal, NO initializers)
│       └── version.rb
├── config/
│   ├── routes.rb                          # show + api scope + *path catch-all
│   └── policy.json                        # RBAC
├── app/
│   ├── controllers/compute_njq/
│   │   ├── application_controller.rb      # < DashboardController, only #show (renders React mount)
│   │   └── api/
│   │       ├── base_controller.rb         # < AjaxController, handle_api_call (kng envelope) + scoped-service accessor
│   │       ├── instances_controller.rb    # thin: handle_api_call { ... } (aggregates via assembler)
│   │       ├── networks_controller.rb     # autonomous – own Neutron calls
│   │       ├── floating_ips_controller.rb # autonomous – own Neutron calls
│   │       ├── images_controller.rb       # autonomous – own Glance calls
│   │       └── flavors_controller.rb      # autonomous – own Nova calls
│   ├── services/service_layer/
│   │   ├── compute_njq_service.rb          # < Core::ServiceLayer::Service; scoped(...), includes mixins
│   │   └── compute_njq_services/
│   │       ├── nova.rb                     # own elektron handle (Nova microversion), Server/Flavor/Keypair
│   │       ├── neutron.rb                  # own handle: networks/ports/FIPs
│   │       ├── glance.rb                   # Images
│   │       ├── cinder.rb                   # Volumes/volume types
│   │       └── instance_assembler.rb       # aggregation Nova+Neutron+Glance → UI JSON
│   ├── views/compute_njq/application/
│   │   └── show.html.haml                  # javascript_include_tag "compute_njq_app_widget", data: {basepath,region,projectid}
│   └── javascript/
│       ├── plugin.js                       # comment stub
│       └── widgets/app/
│           ├── init.js                     # createWidget({pluginName:"compute_njq",widgetName:"app"}).render(App)
│           ├── App.tsx                     # AppShellProvider → MessagesProvider → QueryClientProvider → RouterProvider(basepath)
│           ├── router.ts                   # createAppRouter(basepath, region, projectid)
│           ├── routeTree.gen.ts            # GENERATED (esbuild) — do not edit manually
│           ├── apiClient.ts                # createAjaxHelper({baseURL}), Zod safeParse PER endpoint (runtime), checkForApiError guard
│           ├── styles.scss                 # ?inline (Juno + possibly tw-)
│           ├── hooks/                       # useInstanceQueries.ts (TanStack Query), queryKeys.ts
│           ├── types/                       # Zod schemas (instance, network, flavor, image) — runtime-validated
│           └── routes/
│               ├── __root.tsx              # RouterContext { apiClient, region, projectid }, AppShell + Outlet
│               ├── index.tsx               # redirect → /instances
│               └── instances/
│                   ├── route.tsx           # loader + Outlet
│                   ├── index.tsx           # list (FIRST VERTICAL SLICE)
│                   ├── $instanceName.tsx   # detail (later)
│                   └── -components/         # InstanceTable, StatusPill, IpList (— prefix = excluded from route gen)
└── spec/                                   # RSpec: services (Nova/Neutron mocked) + assembler + controller
```

---

## Enforce dev-only (combine both)

1. **Hard boundary — `BLACK_LIST_PLUGINS`:** In the prod build
   (`docker/Dockerfile`), before the `bundle install` step, set `ENV
   BLACK_LIST_PLUGINS=compute_njq` (or a build arg) so the gem is not loaded at all
   → no route, no JS in the image. (The Gemfile already reads it; it just needs to
   be set in the prod build.)
2. **Defense-in-depth — mount guard:** In `config/routes.rb` additionally couple
   the auto-mount for `compute_njq` to `Rails.env.development?` (analogous to the
   existing `next if %w[docs ...]` filter resp. the `unless Rails.env.test?`
   pattern in `config/application.rb`), in case the blacklist entry is ever
   forgotten.

> Note: `domain-config` `disabled_plugins` would only be a runtime *hide* (the
> plugin stays loaded & mounted) — unsuitable as the sole solution, at most
> complementary.

---

## First vertical slice

**Instance list with network/FIP** — demonstrates the autonomy principle + BFF
aggregation by example:
1. `GET /:scope/api/instances` → `instances_controller#index` → `handle_api_call {
   compute_njq_service.scoped(...).list_instances }`.
2. `list_instances` in the `InstanceAssembler`: calls `nova.rb` (servers) +
   `neutron.rb` (ports/FIPs) + `glance.rb` (image names), joins into UI JSON. **No**
   `services.networking` etc.
3. React: `useInstancesQuery` (TanStack Query) → `InstanceTable` with
   search/pagination, `StatusPill`, `IpList` (+N-more toggle as a component).
4. Runs **in parallel** with the old `compute` page, reachable under
   `/:domain/:project/compute-njq`.

---

## Verification (end-to-end)

- **Dev container:** `bin/workspace start-rails` (port 4001) + `bin/workspace
  start-js` (esbuild watch).
- **Plugin mounts:** `/:domain/:project/compute-njq` loads the HAML page;
  `compute_njq_app_widget` asset is built (esbuild log "Found plugin configs in:
  [... compute_njq]").
- **BFF returns JSON:** `GET /:domain/:project/compute-njq/api/instances` → 200 with
  aggregated JSON; error case → `{ error, code, message }` (handle_api_call).
- **React:** instance list renders with data, search/pagination work, no jQuery
  dependency.
- **Autonomy check:** `grep -rn
  "services\.\(networking\|image\|block_storage\|identity\)" plugins/compute_njq`
  → **no hits** (acceptance criterion).
- **Tests:**
  - RSpec: `bin/workspace bundle exec rspec plugins/compute_njq/spec` — service
    mixins (Elektron mocked), `InstanceAssembler` (aggregation), API controller
    (JSON + error envelope).
  - Vitest: `bin/workspace pnpm test plugins/compute_njq/...` — components
    (InstanceTable, StatusPill, IpList), apiClient Zod parsing, query hooks.
  - `bin/workspace pnpm typecheck` + `pnpm lint`.
- **Prod exclusion:** After setting `BLACK_LIST_PLUGINS=compute_njq` in the prod
  build, the plugin must not be mounted and no `compute_njq_app_widget` asset
  produced.

---

## Explicit non-goals / risks

- **No rework/disabling of `compute`.** Parallel operation.
- **Hard-bound the API surface to "what the new UI shows"**, not "what the old
  plugin can do" (otherwise duplicating ~45 actions needlessly).
- **Shifted coupling:** redundancy means OpenStack API changes (Nova microversion,
  Neutron payloads) must be maintained in `compute` *and* `compute_njq`. A
  deliberate trade-off.
- **Naming:** `compute_njq` (consistent with the `kubernetes_ng` convention) —
  confirmed.
- **Docs correction due:** `skills/css-styling/SKILL.md` + CLAUDE.md claim BS
  3.4.1, really it is **BS 5.3.8**. Not part of this plugin, but note as follow-up
  hygiene (do not blindly follow the docs).
- **No `smartops` 1:1 clone:** structure yes, patterns only filtered (see
  best-practice filter).
