---
name: big-picture
description: >-
  Use when onboarding to Elektra, orienting yourself before a larger change, or
  understanding how the major subsystems fit together. A map of all skills with
  the connections between them — not a replacement for the individual skills, but
  a guide to which one to read first.
---

# Big Picture — How Elektra fits together

Elektra is an OpenStack dashboard: a Rails 8.1 application where every OpenStack
service (compute, networking, identity, …) is an independent Rails Engine plugin.
A React 19 frontend lives inside those plugins. Everything talks to OpenStack via
a shared HTTP client (Elektron). Auth is handled by a dedicated plugin that injects
itself into every controller.

---

## The request lifecycle — one full trip

```
Browser request
  │
  ▼
oauth2-proxy (OIDC / TFA gate — production only)
  │
  ▼
Rails router → DashboardController (before_actions)
  │  ├── authentication_required  ←─── monsoon-openstack-auth plugin
  │  │     AuthSession validates session token against Keystone
  │  │     current_user (AuthUser) available from here on
  │  │
  │  ├── load_scoped_objects (ScopeController)
  │  │     domain slug → UUID via FriendlyIdEntry (DB lookup or Keystone API)
  │  │     UUID → slug redirect if URL has raw UUIDs
  │  │
  │  └── authorization_required
  │        enforce_permissions("plugin:resource_action") → policy.json rules
  │        SecurityViolation → 403 page
  │
  ▼
Plugin controller action
  │  ├── services.compute.servers(...)     ← Elektron user client (user token)
  │  ├── service_user.identity.find_user   ← Elektron privileged client
  │  └── cloud_admin.identity.projects     ← Elektron cloud_admin client
  │         │
  │         ▼
  │       Elektron middleware stack
  │         RequestUUID → DebugLogger → ObjectCache → ResponseErrorHandler → Net::HTTP
  │         Response → ObjectCache writes to DB → ResponseHandler wraps in map_to
  │
  ▼
Response
  ├── Pattern A: HAML view + ServiceLayer::Model  (older plugins)
  ├── Pattern B: JSON + ServiceLayer::Model        (React backend)
  └── Pattern C: JSON raw                          (simple endpoints)
```

---

## Subsystem map

### Authentication → `authentication` skill

The `monsoon-openstack-auth` plugin injects into every `ActionController::Base`.
It owns the full login flow: three auth paths (session token / access key / SSO
certificate), login page with three partials (federation → sso_only → password
form), oauth2-proxy integration, two-factor RADIUS, and cross-dashboard SSO
cookies. `AuthSession` manages token lifecycle; `AuthUser` is the `current_user`
object available in every controller.

**Feeds into:** every other subsystem — nothing works without a valid token.

---

### OpenStack HTTP client → `elektron` skill

After auth, all OpenStack API calls go through Elektron (`github.com/sapcc/elektron`,
`Net::HTTP` under the hood). Three client tiers:

- `services` — user token, per-request, no auto-renew
- `service_user` / `cloud_admin` — app credentials, auto-renewing, class-level cached

A middleware stack surrounds every call: `ObjectCache` writes responses to the DB,
`RequestUUID` adds tracing headers, logger middlewares print colored debug output.
`rescue_api_errors` on models turns HTTP errors into `model.errors`.

**Feeds into:** service layer, ObjectCache (DB), error handling.

---

### Service layer → `service-layer` + `elektron` skills

Plugin controllers never call Elektron directly — they go through a service:

```ruby
services.compute.servers(pagination_options)   # → Compute::Server[]
```

`Service` base class holds the Elektron client and `map_to` / `class_map_proc`
helpers. `Model` base class makes API responses behave like ActiveRecord objects
(`save`, `destroy`, `errors`). Three response patterns:

- **Pattern A** — HAML + Model (older plugins: identity, compute)
- **Pattern B** — JSON + Model (React backends: lbaas2, block_storage)
- **Pattern C** — JSON raw (simple endpoints: smartops, lbaas2 device)

---

### Local database → `database` skill

Elektra stores only what OpenStack cannot:

| Table | Purpose |
|-------|---------|
| `friendly_id_entries` | UUID ↔ slug mapping for URLs |
| `object_cache` | Denormalized OpenStack API response cache |
| `user_profiles` | User display names and emails |
| `domain_profiles` | Terms-of-Use acceptance per domain |
| `project_profiles` | New-project wizard completion state |
| `inquiry_inquiries` + 3 related tables | Approval workflow (see below) |

`FriendlyIdEntry` is touched on every scoped request (cache miss → Keystone call).
`ObjectCache` is populated by Elektron's middleware on every API response — it
never expires and is consumed by the `lookup` and `cloudops` plugins.

---

### Plugin architecture → `plugin-architecture` skill

27 Rails Engines under `plugins/`. Each has its own controllers, services, views,
and frontend widgets. Six frontend patterns from oldest to newest:

1. Pure HAML (inquiry, image, volume_snapshots)
2. Redux + React Router (older React plugins)
3. TanStack Query + Juno UI (lbaas2, block_storage, shared_filesystem_storage)
4. TanStack Router + Juno UI (kubernetes_ng — newest pattern)
5. Juno shadow DOM (external widget mounting)
6. Direct OS API (castellum, keppel — token at render time)

New plugins: `bin/generate PLUGIN_NAME --mountable --service_layer --react`.

---

### Permissions → `policy-rbac` skill

Every plugin has a `config/policy.json`. All files are merged at boot into one
flat `PolicyEngine`. Server-side: `authorization_required` + `enforce_permissions`
guard controller actions. Client-side: `policy.to_js` → `window.policyConfig` →
`policy_engine.js` → `window.policy.isAllowed()` in React widgets. This is
Elektra's **own UI-layer mapping** — best-effort, the OpenStack backend is always
the final authority.

---

### Approval workflow → `inquiry` skill

A standalone plugin with its own AASM state machine and DB tables. Consumers
(identity, dns_service) call `InquiryService.create_inquiry(...)` to request
human approval; processors approve/reject in the Inquiry UI; the consumer then
performs the OS action and calls `set_inquiry_state(:approved)`. Processor list
is fixed at creation time.

---

### CSS / UI → `css-styling` skill

Four layers coexist through scoping:

1. **Bootstrap 3.4.1** — Sprockets, all HAML views
2. **monsoon theme** — `_variables.scss` (brand palette) + `_monsoon_theme.scss` (layout, nav, components)
3. **Tailwind 3.4.15** — `tw-` prefix (avoids Bootstrap conflicts), `preflight:false`, Juno color preset
4. **Juno UI Components 4.0.1** — React component library, `?inline` CSS scoped to each widget via `AppShellProvider`

---

### Build system → `build-system` skill

Two parallel pipelines:

- **esbuild** — JS/TS/React → bundles per plugin widget; also compiles `tailwind.scss`
- **Sprockets** — SCSS → `application.css` (Bootstrap + monsoon theme + plugin SCSS)

Dev: `bin/workspace start-rails` + `bin/workspace start-js` (watch mode).
Prod: `assets:precompile` runs both.

---

### Runtime configuration → `configuration` skill

All config via ENV vars. Key groups: OpenStack service user credentials
(`MONSOON_OPENSTACK_AUTH_API_*` or `APP_CRED_*`), database (`MONSOON_DB_*`,
`POSTGRES_*`), Rails/Puma (`PORT`, `MAX_THREADS`), auth/SSO feature flags
(`MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED`, `SSO_PRECHECK_ENABLED`, `TWO_FACTOR_*`),
and debug flags (`DEBUG_API_CALLS`, `DEBUG_POLICY_ENGINE`). In production, injected
by the Helm chart (`_env.tpl`).

---

### Testing → `testing` skill

Three layers: RSpec (controller specs with `stub_authentication`, Elektron doubles,
`FriendlyIdEntry` seeding), Vitest (React/JS unit tests, jsdom, fetch/policy/
ajaxHelper mocking), Playwright E2E (smoke: no auth needed; ui: `RAILS_ENV=e2e`
with mock OS services). E2E is not in CI — manual only.

---

## "I want to…" quick-reference

| Task | Start with |
|------|-----------|
| Add a new plugin | `plugin-architecture` |
| Add a new controller action | `service-layer`, `policy-rbac` |
| Add a new service method | `elektron`, `service-layer` |
| Add a new DB table | `database` |
| Change the login / SSO flow | `authentication` |
| Add a permission check | `policy-rbac` |
| Style a new component | `css-styling` |
| Add an approval workflow | `inquiry` |
| Debug an OpenStack API error | `elektron`, `error-handling` |
| Add an ENV var | `configuration` |
| Write tests | `testing` |
| Understand the JS build | `build-system` |
| Debug a URL slug issue | `database` (FriendlyIdEntry) |
| Debug a missing service in the menu | `service-layer` (services.available?) |
| Understand why a button is hidden | `policy-rbac` |

---

## How the skills relate

```
big-picture  ←  you are here
  │
  ├── authentication      (login → current_user → token)
  │     └── policy-rbac   (token roles → permission rules)
  │
  ├── elektron            (token → HTTP → OpenStack API)
  │     ├── service-layer (Elektron → Service → Model → controller)
  │     ├── error-handling (Elektron errors → rendered pages)
  │     └── database      (Elektron → ObjectCache middleware → DB)
  │
  ├── plugin-architecture (plugin structure → frontend patterns)
  │     ├── build-system  (esbuild + Sprockets)
  │     └── css-styling   (Bootstrap + monsoon + Tailwind + Juno)
  │
  ├── database            (FriendlyIdEntry + ObjectCache + profiles)
  │     └── inquiry       (approval workflow, own DB tables)
  │
  ├── configuration       (ENV vars → all subsystems)
  ├── domain-config       (per-domain YAML → plugin visibility, SSO)
  └── testing             (RSpec + Vitest + Playwright)
```
