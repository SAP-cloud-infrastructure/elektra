# Web Console — Design

## Goal

Add a per-instance **Web Console** to the `compute_njq` plugin: a terminal
icon in each instance row that opens the instance's Nova remote console
inline, in a panel that slides up from the bottom of the viewport (the
"web shell" pattern). This is the second of the two actions still missing
versus the legacy compute plugin.

## Context

The legacy compute plugin exposes a "Web Console" link that opens a
standalone tab rendering the Nova console URL in an `<iframe>`. Nova serves
the console (noVNC for KVM, webmks for VMware, serial for Cloud Hypervisor /
Ironic) at a short-lived, token-bearing URL obtained via
`POST /servers/{id}/remote-consoles`.

The existing global "Web Shell" (the `webconsole` plugin) is the visual
precedent for the slide-up panel: a `position: fixed; bottom: 0` panel
(~40vh) holding an iframe, toggled from a terminal icon. That implementation
is jQuery/vanilla-JS and global; we replicate the **look and behaviour** in
React, scoped to compute_njq, not reuse it.

### Decisions (confirmed with the user)

- **One terminal icon per row → opens the console inline** (slide-up panel).
  No dropdown/menu and no "open in new tab" for now (may be added later).
- **Everything lives in compute_njq** — the plugin stays self-contained; no
  change to the core breadcrumb or the `webconsole` plugin.
- **No 2FA special-casing.** The legacy plugin forced 2FA for the console
  action, but 2FA is globally off unless `TWO_FACTOR_AUTHENTICATION=on` and
  is no longer used in prod. The console action inherits the normal
  `authentication_required`; we add no console-specific override.

## Console type by hypervisor

compute_njq already resolves `hypervisor_type` (normalised: `kvm`, `vmware`,
`baremetal`, or null) from the flavor's `capabilities:hypervisor_type`
(`FormOptionsAssembler::HYPERVISOR_MAP`). The BFF maps the **raw** Nova
hypervisor string to a (protocol, type) pair exactly as the legacy
controller did, so no second flavor fetch is needed:

| Raw `capabilities:hypervisor_type` | normalised | protocol / type |
|---|---|---|
| `QEMU` | kvm | `vnc` / `novnc` |
| `CH` (Cloud Hypervisor) | kvm | `serial` / `serial` |
| `VMware vCenter Server` | vmware | `mks` / `webmks` |
| `ironic` | baremetal | `serial` / `shellinabox` |
| unknown / missing | null | `mks` / `webmks` (Nova default) |

Note QEMU and CH both normalise to `kvm` but need different console types,
so the BFF keys off the **raw** extra_specs value, not the normalised one.

## Data flow

```
InstanceTable row
  └─ ConsoleButton (terminal icon, left of the actions cog)
       └─ click → open the console panel for this instance
WebConsolePanel (one, mounted at the instances route; slides up from bottom)
  └─ useInstanceConsoleQuery(apiClient, instanceId, enabled)
       → apiClient.instances.getConsole(id)
           → GET /instances/:id/console
               → ComputeNjqService#remote_console(id)
                   → map hypervisor_type → (protocol, type)
                   → nova POST servers/:id/remote-consoles → { url, type, protocol }
  └─ renders <iframe src={url}> inside the panel
```

The console URL is **fetched fresh on every open** (short-lived token), with
no-cache response headers; a "Reconnect" button re-runs the query for a new
URL.

## Backend (Ruby BFF)

### 1. Policy — `config/policy.json`
Add:
```json
"compute_njq:instance_console": "rule:instance_actions"
```
(Legacy gated the link on `instance_get` but had a stricter dedicated
`instance_console` rule; we use a dedicated `instance_console` rule for
clarity, mapped to the shared `instance_actions` rule like the other
lifecycle operations.)

### 2. Route — `config/routes.rb`
```ruby
get :console
```
on the `:instances` member — `GET instances/:id/console`.

### 3. Nova helper — `nova.rb`
```ruby
# POST /servers/{id}/remote-consoles (microversion >= 2.6). Returns the raw
# remote_console hash { "protocol", "type", "url" }.
def nova_remote_console(server_id, protocol:, type:)
  elektron_nova
    .post("servers/#{server_id}/remote-consoles") { { "remote_console" => { "protocol" => protocol, "type" => type } } }
    .body["remote_console"]
end
```

### 4. Service — new `console_actions.rb` module (included in ComputeNjqService)
```ruby
module ServiceLayer
  module ComputeNjqServices
    module ConsoleActions
      # Raw Nova hypervisor string → (protocol, type) for the remote console.
      CONSOLE_BY_HYPERVISOR = {
        "QEMU" => %w[vnc novnc],
        "CH" => %w[serial serial],
        "VMware vCenter Server" => %w[mks webmks],
        "ironic" => %w[serial shellinabox],
      }.freeze
      DEFAULT_CONSOLE = %w[mks webmks].freeze

      def instance_console(server_id)
        server = nova_server(server_id) # raw server hash (reuse existing nova getter)
        raw_hv = server.dig("flavor", "extra_specs", "capabilities:hypervisor_type")
        protocol, type = CONSOLE_BY_HYPERVISOR.fetch(raw_hv, DEFAULT_CONSOLE)
        console = nova_remote_console(server_id, protocol: protocol, type: type)
        { url: console["url"], type: console["type"], protocol: console["protocol"] }
      end
    end
  end
end
```
(Confirm during implementation the exact existing Nova "get one server (raw,
with embedded flavor extra_specs)" method name; the detail assembler already
reads `flavor.extra_specs`, so a raw server getter exists — reuse it. If the
embedded flavor lacks extra_specs, fall back to `DEFAULT_CONSOLE` rather than
fetching the flavor separately.)

### 5. Controller — `instances_controller.rb`
```ruby
# GET /:scope/compute-njq/api/instances/:id/console
def console
  return unless authorize!("compute_njq:instance_console")

  # The console URL carries a short-lived token; never cache it.
  response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
  handle_api_call { compute_service.instance_console(params.require(:id)) }
end
```
Returns `{ url, type, protocol }` wrapped in the usual data envelope.

## Frontend

### 6. Types — `types/console.ts`
```ts
export const ConsoleSchema = z.object({
  url: z.string(),
  type: z.string().nullable(),
  protocol: z.string().nullable(),
})
export type Console = z.infer<typeof ConsoleSchema>
```

### 7. apiClient — `apiClient.ts`
```ts
getConsole: (id: string): Promise<Console> =>
  apiClient
    .get<{ data: { console: unknown } }>(`instances/${id}/console`)
    .then((res) => {
      checkForApiError(res.data)
      return parseOrThrow(ConsoleSchema, res.data.console, "console")
    })
    .catch((err) => {
      throw detailedError(err)
    }),
```
(Match the exact envelope the controller renders — confirm the key the
handler wraps under; mirror an existing read like `getInstanceDetail`.)

### 8. Hook — `hooks/useInstanceConsoleQuery.ts`
```ts
export function useInstanceConsoleQuery(api: ComputeApi, id: string, enabled: boolean) {
  return useQuery<Console, Error>({
    queryKey: QUERY_KEYS.instanceConsole(id),
    queryFn: () => api.instances.getConsole(id),
    enabled,
    // Short-lived token: never serve a stale URL, always refetch on open.
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}
```
Add `instanceConsole: (id) => ["instance", id, "console"]` to `queryKeys.ts`.

### 9. ConsoleButton — in `InstanceTable.tsx`
A terminal icon button in the actions cell, left of `InstanceActionsMenu`:
```tsx
<button
  type="button"
  className="btn btn-link btn-sm"
  aria-label="Web console"
  title="Web console"
  onClick={() => onOpenConsole(instance)}
>
  <i className="fa fa-terminal" />
</button>
```
Shown only when the instance is running (`status.power_state === "Running"`)
and the policy allows it — a console on a stopped VM is meaningless. (Policy
check mirrors how `visibleActions` evaluates rules; the button is omitted
when not allowed.) `onOpenConsole` is passed down from the instances route.

### 10. WebConsolePanel — new slide-up panel
A single `WebConsolePanel` mounted at the instances route (not per row),
driven by `openInstance: Instance | null` state lifted to the route. When an
instance is set, the panel slides up and loads its console.

- Shell: `position: fixed; bottom: 0; width: 100vw; height: 40vh; z-index: ...`,
  a CSS `transform: translateY(100%)` → `translateY(0)` transition for the
  slide-up (React equivalent of the jQuery `slideDown`). Hidden/removed when
  `openInstance` is null.
- Toolbar (above the iframe): title `Web Console — {name}`, a **Reconnect**
  button (re-runs the query), and a **Close** button.
- Body: the console query's states —
  - loading → spinner "Connecting…"
  - error → `alert alert-danger` with the message + Reconnect
  - success → `<iframe src={console.url} title="Web console" className="..." />`
    filling the panel.
- A short "The session may expire — click Reconnect if the connection is
  lost." hint, mirroring the legacy toolbar note.
- New stylesheet rules in the compute_njq SCSS for `.compute-njq-console-panel`
  (fixed/bottom/height/transition, dark `#222` background like the legacy
  shell, borderless iframe).

### CSP
`config/initializers/content_security_policy.rb` sets
`policy.frame_src :self, "*.cloud.sap"`, so a Nova console served from a
`*.cloud.sap` host is already frameable. No CSP change expected; verify the
actual console host falls under this during manual testing and note it if
not (a stopped iframe with a blocked frame is the symptom).

## Testing

**Ruby (RSpec):**
- `console_actions` service spec: maps each raw hypervisor value to the right
  (protocol, type) and returns `{ url, type, protocol }` from the Nova hash;
  unknown/missing hypervisor → `mks`/`webmks`. Stub `nova_server` +
  `nova_remote_console`.
- Controller spec for `#console`: authorized call delegates to
  `instance_console` and returns the envelope; unauthorized → 403; sets the
  no-cache header.

**Frontend (Vitest):**
- `useInstanceConsoleQuery.test.ts`: calls `getConsole`, `enabled` gates the
  fetch, `staleTime: 0`.
- `WebConsolePanel.test.tsx`: loading spinner; error + Reconnect refetches;
  success renders an iframe with the url; Close clears the open instance.
- `InstanceTable.actions.test.tsx` (or a focused test): the terminal button
  shows for a running instance and is absent for a stopped one / when policy
  denies; clicking it calls `onOpenConsole` with the instance.

**Checks:** full compute_njq JS suite green; tsc baseline (exactly 8, no new
errors); prettier clean; `bundle exec rspec` for the new Ruby specs.

## Review Focus

Inputs the spec implies but no happy-path test exercises — most likely to
bite, most likely first:

1. **QEMU vs CH both normalise to kvm** — the BFF must key off the raw
   extra_specs string, not the normalised type, or Cloud Hypervisor VMs get
   the wrong console. (Service spec covers both.)
2. **Flavor without extra_specs** (embedded flavor lacks
   `capabilities:hypervisor_type`) → falls back to the Nova default rather
   than erroring.
3. **Stale token** — the query must refetch on every open (`staleTime: 0`,
   `gcTime: 0`); a cached URL would hand the user a dead console.
4. **Console on a non-running instance** — the button is hidden for stopped
   VMs, and the BFF surfaces Nova's error (not a blank iframe) if called
   anyway.
5. **Nova returns no url / an error** — the panel shows the error with a
   Reconnect affordance, never a silently blank iframe.

## Out of scope

- "Open in a new tab" (deferred — one inline icon for now).
- Serial Log (the other commented-out legacy action).
- Resizing/dragging the panel (fixed 40vh like the legacy web shell).
- 2FA enforcement for the console action.
- Reusing/altering the global `webconsole` plugin or the core breadcrumb.
