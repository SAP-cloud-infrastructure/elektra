---
name: bff-arch
description: >-
  Use when building or extending a plugin that backs a React (or other
  thick-client) UI with its own JSON backend-for-frontend, deciding whether
  logic belongs in the BFF or the client, or adding a user-triggered action
  that must be authorized. Covers the BFF↔client contract (autonomous service,
  server-side aggregation, uniform error envelope, runtime-validated client),
  TanStack Query for server state, and defense-in-depth authorization (client
  hides, server enforces). compute_njq is the reference implementation.
---

# BFF ↔ client architecture

A **backend-for-frontend (BFF)** is a thin, UI-specific JSON backend that lives
*inside the same plugin* as the UI it serves. The browser talks only to this
BFF — never to the OpenStack APIs or other plugins' service layers directly —
and the BFF shapes exactly the data the UI needs. This skill is the *recipe* for
that arrangement: where logic lives, what each layer promises the next, and how
authorization spans both sides.

It is **plugin- and client-agnostic**. The reference implementation is the
`compute_njq` plugin (React + TanStack Router/Query over a Rails `AjaxController`
BFF), cited throughout with real paths, but the pattern applies to any
thick-client UI and is the template for new plugins and for incrementally
modernizing old ones.

**Related skills — read them for the mechanics this one builds on:**

- [plugin-architecture](../plugin-architecture/SKILL.md) — Rails Engine
  structure, how a widget is built and mounted, and the six frontend patterns.
  This skill is the autonomous "Pattern 4 + BFF" variant.
- [policy-rbac](../policy-rbac/SKILL.md) — the policy *mechanism* (`policy.json`,
  `window.policyConfig`, `policy.isAllowed`, `enforce_permissions`). This skill
  only states the *usage rule*; go there for how policy is defined and delivered.
- [service-layer](../service-layer/SKILL.md) · [api-clients](../api-clients/SKILL.md)
  · [elektron](../elektron/SKILL.md) — how the BFF reaches OpenStack.
- [error-handling](../error-handling/SKILL.md) — the rendered-HTML error path.
  Contrast: a BFF returns JSON error *envelopes*, never HTML error pages.

---

## The shape

```
HAML mount point (application#show)
  → React app  (TanStack Router + Query)
      → apiClient            runtime Zod-validated, one call per endpoint
          → BFF controller   thin action, handle_api_call → { error, code, message } envelope
              → service layer own Elektron handles (Nova/Neutron/Glance/…)
                  → OpenStack APIs
```

Data crosses every boundary as **plain JSON**. The BFF returns *data*; the client
decides markup. Passing HTML strings as JSON (`{ ip_html: "<p>…" }`) is a
forbidden anti-pattern (see `docs/compute-njq/architecture-spec.md`, "Anti-pattern
(forbidden)") — it couples the backend to presentation and defeats the split.

**Where logic lives:**

| Concern | Lives in | compute_njq example |
|---|---|---|
| Data fetching + cross-API aggregation + shaping | BFF (Ruby) | `instance_assembler.rb` joins Nova + Neutron + Glance |
| Semantic mapping (e.g. vm_state/task_state → status) | BFF | returns a semantic `status`; the client picks color/icon |
| Presentation (pills, labels, "+N more" toggles) | Client (React/TS) | `StatusPill`, `IpList` |
| Server state (cache, loading, refetch, invalidation) | Client, via TanStack Query | `hooks/useInstanceQueries.ts` |

The client does **not** aggregate across several queries — the BFF does that
server-side and returns one UI-ready payload.

---

## Autonomy principle

The BFF's service layer builds its **own** Elektron handles per backend and calls
OpenStack directly. It must **not** call another plugin's service layer
(`services.networking`, `services.image`, `services.block_storage`,
`services.identity`). Redundancy is the deliberate, accepted price; the gain is
that a change in another plugin cannot break this one. Acceptance check for
`compute_njq`:

```
grep -rn "services\.\(networking\|image\|block_storage\|identity\)" plugins/compute_njq
# → no hits
```

Keep the redundancy **narrow** (only the fields the UI shows) and **modular**
(one mixin per backend: `compute_njq_services/nova.rb`, `neutron.rb`, `glance.rb`,
`cinder.rb`).

---

## BFF controller contract

The base controller inherits from `AjaxController` (`app/controllers/ajax_controller.rb`),
which **authenticates and rescopes but deliberately skips the permission check**
— that is why BFF actions that mutate must authorize *manually* (see
Authorization below).

Actions stay **thin**: they delegate to the service and wrap the result in
`handle_api_call`, which maps every known exception class to a uniform
`{ error, code, message }` envelope with a matching HTTP status and passes
upstream OpenStack status codes through unchanged. Reference:
`plugins/compute_njq/app/controllers/compute_njq/api/base_controller.rb`.

```ruby
def handle_api_call(auto_render: true)
  response = yield
  render json: response if auto_render
  response
rescue ComputeNjq::RequestError => e           # own domain error → 400
  render json: { error: "Request Error", code: 400, message: e.message }, status: :bad_request
rescue Elektron::Errors::ApiResponse => e       # upstream → pass its status through
  render json: { error: "API Error", code: e.code, message: e.message }, status: e.code
rescue Elektron::Errors::Request                # → 500 (sanitized)
  render json: { error: "Request Error", code: 500, message: "Service temporarily unavailable. Please try again later." }, status: 500
rescue StandardError => e                       # last-resort: never leak a raw HTML 500
  Rails.logger.error("… unhandled error: #{e.class}: #{e.message}")  # class+message only, no params/ids
  render json: { error: "Internal Server Error", code: 500, message: "An unexpected error occurred. Please try again later." }, status: 500
end
```

Rules of thumb: thin actions; one uniform envelope; pass upstream status through;
never leak a raw error message or log request params / object identifiers
(AGENTS.md: no sensitive logging).

---

## apiClient contract

The client wraps the shared `createAjaxHelper` (`app/javascript/lib/ajax_helper.js`)
with a `baseURL` that already carries the scope, and for **each endpoint**:

1. **Guards the 200-with-error-body case.** An upstream proxy can rewrite the
   status to 200 while the body is the `{ error, code }` envelope; `checkForApiError`
   detects that shape and throws so TanStack Query treats it as a failure.
2. **Validates at runtime with Zod `safeParse`** (not just `z.infer` types), via
   `parseOrThrow`, so a drifting BFF contract fails loudly with the Zod issues
   attached rather than surfacing as a vague render bug.

Reference: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts`
(`checkForApiError`, `parseOrThrow`). Do **not** use the ajax_helper's `osApi`
(latent header bug) — a BFF calls its own endpoints, not the OS API proxy.

---

## Server state: TanStack Query

All server state goes through TanStack Query — `useQuery` for reads, `useMutation`
for writes, with `invalidateQueries` to refresh after a mutation — not through
route loaders alone. Keep query keys centralized. References:
`hooks/useInstanceQueries.ts`, `hooks/useInstanceActionMutation.ts`,
`hooks/useTerminateInstanceMutation.ts`, `hooks/useCreateInstanceMutation.ts`,
`hooks/queryKeys.ts`.

---

## Defense-in-depth authorization

**The rule: one policy rule name, checked on both sides.**

A user-triggered action is gated by a single `plugin:action` policy rule (e.g.
`compute_njq:instance_create`). Check that **same** rule in **two** places:

- **Client hides** — so the UI never pretends an action is available that the
  user can't perform ("gaukelt vor"). Hiding is a UX courtesy, not a security
  boundary.
- **Server (BFF) enforces** — the real boundary. Because `AjaxController` skips
  the permission check, the action must call an `authorize!` guard itself; a
  hand-crafted request that bypasses the hidden UI still gets a 403.

Never do only one. Client-only is bypassable; server-only pretends.

### Client side — hide, fail-closed

Wrap `policy.isAllowed(rule, { target: scope })` in `try/catch` and return `false`
on throw. An unevaluable rule (missing from the policy config — stale server,
typo) makes `policy.isAllowed` **throw** (see policy-rbac). Treating the throw as
"not allowed" hides the element instead of letting the exception crash the whole
view through the router error boundary. **Fail-closed: when in doubt, hide.**

```tsx
// plugins/compute_njq/.../instances/-components/InstancesToolbar.tsx
function canCreate(scope: Record<string, unknown>): boolean {
  try {
    return policy.isAllowed("compute_njq:instance_create", { target: scope })
  } catch {
    return false // unevaluable rule → hide, don't crash
  }
}
// …
{canCreate(scope) && <Link to="/instances/new" className="btn btn-primary">Create New</Link>}
```

Same wrapper gates per-row lifecycle actions:
`plugins/compute_njq/.../instances/-components/instanceActions.ts` (`isAllowed` →
`visibleActions`).

### Server side — enforce, then act

An `authorize!` guard renders the 403 envelope (same `{ error, code, message }`
shape) and returns false so the action aborts **before** touching the service.
Reference: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb`.

```ruby
def create
  return unless authorize!("compute_njq:instance_create")
  handle_api_call { { instance: compute_service.create_instance(create_params) } }
end

def authorize!(rule)
  return true if current_user.is_allowed?(rule, policy_target)
  render json: { error: "Forbidden", code: 403, message: "You are not allowed to perform this action." },
         status: :forbidden
  false
end
```

For actions whose rule depends on a sub-type (e.g. a generic `action` endpoint),
map the sub-type to its rule and look it up (`ACTION_POLICY_RULES` in the same
controller).

### Same principle in classic (HAML) plugins

The pattern predates React and applies to old plugins too — only the tools
differ:

- **View hides:** `- if current_user.is_allowed?('compute:instance_update', …)`
  around the control (e.g. `plugins/compute/app/views/compute/instances/_item_actions.html.haml`).
- **Controller enforces:** `authorization_context "compute"` +
  `authorization_required` (or an explicit `enforce_permissions`), e.g.
  `plugins/compute/app/controllers/compute/instances_controller.rb`.

The rule *definitions* live in `config/policy.json` and are merged globally, so a
new plugin reuses shared rules (e.g. `rule:instance_actions`) rather than
redefining them — keep a ported action's rule **identical** to the legacy one
unless a tightening is intended.

---

## Testing both layers

Test the gate on **both** sides — a passing client test does not prove the server
enforces, and vice versa.

**Server (RSpec)** — for each gated action, two cases (see
`plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb`):

```ruby
it "checks the instance_create policy rule" do
  allow(scoped_service).to receive(:create_instance).and_return({ "id" => "s1" })
  expect_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser)
    .to receive(:is_allowed?).with("compute_njq:instance_create", anything).and_return(true)
  post :create, params: default_params.merge(instance: create_params)
end

context "when the user is not allowed to create" do
  before { allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser).to receive(:is_allowed?).and_return(false) }
  it "renders a 403 envelope and never calls the service" do
    expect(scoped_service).not_to receive(:create_instance)
    post :create, params: default_params.merge(instance: create_params)
    expect(response).to have_http_status(:forbidden)
  end
end
```

**Client (Vitest)** — mock `lib/policy`, assert shown-when-allowed,
hidden-when-denied, and **hidden-when-the-rule-throws** (fail-closed). See
`plugins/compute_njq/.../instances/-components/InstancesToolbar.test.tsx` and the
"treats an unevaluable rule as not allowed" test in `instanceActions.test.ts`.

```ts
const { isAllowed } = vi.hoisted(() => ({ isAllowed: vi.fn() }))
vi.mock("lib/policy", () => ({ policy: { isAllowed } }))
// allowed → link present; denied → queryByRole(...) null; throws → not rendered, no throw
```

---

## Future step: extract a shared gate

When a third client call site needs the same check, extract the fail-closed
wrapper into a small `usePolicy`/`canI` helper rather than copying the
`try/catch`. Until then, a local helper per file is fine — don't extract
prematurely (two call sites in `compute_njq` today: the toolbar and the row
actions).

---

## Key files (compute_njq reference + shared infra)

| File | Role |
|---|---|
| `plugins/compute_njq/app/controllers/compute_njq/api/base_controller.rb` | `handle_api_call` envelope + scoped-service accessor |
| `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb` | thin actions + `authorize!` server-side gate |
| `plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_assembler.rb` | server-side cross-API aggregation |
| `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts` | `createAjaxHelper` + `checkForApiError` + Zod `parseOrThrow` |
| `plugins/compute_njq/app/javascript/widgets/app/hooks/` | TanStack Query hooks + `queryKeys.ts` |
| `plugins/compute_njq/.../instances/-components/InstancesToolbar.tsx` · `instanceActions.ts` | client-side fail-closed gating |
| `docs/compute-njq/architecture-spec.md` | the full rationale and best-practice filter for this reference plugin |
| `app/controllers/ajax_controller.rb` | BFF base: authenticates + rescopes, **skips** permission check |
| `app/javascript/lib/ajax_helper.js` | shared fetch helper (CSRF, baseURL, cancelable) |
| `app/javascript/lib/policy.js` | holds `window.policy` for React (`policy.isAllowed`) |
