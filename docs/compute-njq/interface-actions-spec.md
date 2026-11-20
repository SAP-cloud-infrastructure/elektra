# Interface (Port) Attach/Detach — compute_njq Spec

## Context

The compute_njq plugin already ships Floating IP attach/detach as a dropdown
action with a modal in `InstanceActionsMenu`. This spec adds **network interface
(Neutron port) attach/detach** to the same surface, using the exact same 8-layer
pattern — dropdown action + modal, `listOnly: true`, optimistic transition,
`handle_api_call` + `authorize!`, Zod types, RSpec + Vitest.

**Attach scope:** full, like the legacy compute plugin — network + optional
subnet + optional fixed IP + security groups. A Neutron port is created first
(carrying network/subnet/fixed-ip/SG), then attached to Nova **by port_id**.

**Detach UX:** a "Detach Interface" dropdown action opens a modal that fetches the
instance's **actual os-interfaces live** (not a filter of `instance.ips`) and lists
only genuinely detachable interfaces. The user picks one by its fixed IP; the
server resolves the port_id from that fixed IP via the Nova os-interface list, then
issues the delete. Fetching live avoids offering the primary/boot IP, whose DELETE
the backend would reject.

This spec is the companion to `floating-ip-actions-spec.md`, which the FIP feature
followed. It documents only what differs or is new; the reused controller/service
conventions are the same.

## Out of scope

- No audit logging (FIP has none; the controllers only have the last-resort
  `Rails.logger.error` in `handle_api_call`'s `StandardError` rescue).
- No changes to the detail-modal IP-addresses tab. Interface actions live in the
  dropdown menu like every other action, not in the IP tab.
- No pre-reserved fixed-IP-port ("fixed_ip_allocation") selection flow — the
  legacy plugin supports picking an existing reserved port; this spec always
  creates a fresh port for the chosen network.

## Layer 1 — Service layer (Nova os-interface + Neutron port)

### New Nova methods — `nova.rb`

compute_njq has **no** os-interface methods today. Add three, in the existing
`elektron_nova` style (microversion 2.67 is already set on the handle):

```ruby
def nova_server_os_interfaces(id)
  elektron_nova.get("servers/#{id}/os-interface").body["interfaceAttachments"] || []
end

def nova_attach_interface(id, attributes)
  elektron_nova.post("servers/#{id}/os-interface") { { "interfaceAttachment" => attributes } }.body["interfaceAttachment"]
end

def nova_detach_interface(id, port_id)
  elektron_nova.delete("servers/#{id}/os-interface/#{port_id}").body
end
```

Nova os-interface API shape (confirmed against the legacy plugin):
- `POST /servers/{id}/os-interface`, body `{ "interfaceAttachment": { "port_id": ... } }`
  (we always attach by port_id; net_id/fixed_ips variants are not used).
- `GET /servers/{id}/os-interface` → `interfaceAttachments[]`, each entry has
  `port_id`, `net_id`, `fixed_ips` (array of `{ subnet_id, ip_address }`),
  `mac_addr`, `port_state`.
- `DELETE /servers/{id}/os-interface/{port_id}` → no body.

### Extend `neutron_create_port` — `neutron.rb`

Today it supports `subnet_id` but not a specific `ip_address`. Extend additively
(default `ip_address: nil` keeps existing callers unchanged):

```ruby
def neutron_create_port(network_id:, subnet_id: nil, ip_address: nil, security_groups: [])
  port = { "network_id" => network_id }
  if subnet_id
    fixed = { "subnet_id" => subnet_id }
    fixed["ip_address"] = ip_address if ip_address
    port["fixed_ips"] = [fixed]
  end
  port["security_groups"] = security_groups unless security_groups.empty?
  elektron_neutron.post("ports") { { "port" => port } }.body["port"]
end
```

### New mixin — `interface_actions.rb`

Module `ServiceLayer::ComputeNjqServices::InterfaceActions`, keyword-arg methods
returning `{ ok: true }`, mirroring `FloatingIpActions`:

```ruby
def attach_interface(server_id, network_id:, subnet_id: nil, ip_address: nil, security_groups: [])
  raise ComputeNjq::RequestError, "network is required" if network_id.to_s == ""
  port = neutron_create_port(
    network_id: network_id, subnet_id: subnet_id, ip_address: ip_address, security_groups: security_groups,
  )
  begin
    nova_attach_interface(server_id, { "port_id" => port["id"] })
  rescue StandardError => e
    neutron_delete_port(port["id"]) # roll back the orphaned port (best-effort)
    raise e
  end
  { ok: true }
end

def detach_interface(server_id, fixed_ip_address:)
  interfaces = nova_server_os_interfaces(server_id)
  match = interfaces.find { |i| Array(i["fixed_ips"]).any? { |f| f["ip_address"] == fixed_ip_address } }
  raise ComputeNjq::RequestError, "No interface found for #{fixed_ip_address}" if match.nil?
  nova_detach_interface(server_id, match["port_id"])
  { ok: true }
end
```

Include it in `compute_njq_service.rb` after `FloatingIpActions`:
`include ComputeNjqServices::InterfaceActions`.

### Attached-interfaces options method — `form_options_assembler.rb`

The detach modal needs the instance's live, detachable interfaces. Add a small
assembler method that shapes `nova_server_os_interfaces` into UI data (one entry
per fixed IP of each attached port):

```ruby
def form_attached_interfaces(server_id)
  nova_server_os_interfaces(server_id).flat_map do |iface|
    Array(iface["fixed_ips"]).filter_map do |f|
      addr = f["ip_address"]
      next if addr.to_s == ""
      { port_id: iface["port_id"], fixed_ip_address: addr, mac_addr: iface["mac_addr"] }
    end
  end
end
```

Keys: `port_id`, `fixed_ip_address`, `mac_addr`. The client submits only
`fixed_ip_address`; the server still resolves port_id in `detach_interface` (the
options list is for display/selection, not trusted for the delete target).

### Two deliberate divergences from the FIP code

1. **Rollback on attach failure.** FIP attach creates nothing before associating,
   so it needs no rollback. Interface attach creates a Neutron port first — if the
   Nova attach then fails, the port would be orphaned. The `rescue → neutron_delete_port`
   block mirrors the legacy plugin's rollback.
2. **Detach resolves port_id from `nova_server_os_interfaces`, not
   `neutron_ports_for_device`.** os-interface is Nova's view of what is actually
   *attached*; `neutron_ports_for_device` could list ports that are not (yet)
   attached as an interface.

## Layer 2 — Controller, Routes, Policy, Form-Options

### Controller — `instances_controller.rb`

```ruby
def attach_interface
  return unless authorize!("compute_njq:instance_attach_interface")
  handle_api_call do
    compute_service.attach_interface(
      params.require(:id),
      network_id: attach_interface_params[:network_id],
      subnet_id: attach_interface_params[:subnet_id],
      ip_address: attach_interface_params[:ip_address],
      security_groups: Array(attach_interface_params[:security_groups]),
    )
  end
end

def detach_interface
  return unless authorize!("compute_njq:instance_detach_interface")
  handle_api_call do
    compute_service.detach_interface(
      params.require(:id),
      fixed_ip_address: detach_interface_params[:fixed_ip_address],
    )
  end
end
```

Private param readers:

```ruby
def attach_interface_params
  scoped_params.permit(:network_id, :subnet_id, :ip_address, security_groups: [])
end

def detach_interface_params
  scoped_params.permit(:fixed_ip_address)
end
```

### Form-Options endpoint — `form_options_controller.rb`

```ruby
def interface_options
  handle_api_call do
    {
      networks: compute_service.form_networks,
      subnets: compute_service.form_subnets,
      security_groups: compute_service.form_security_groups,
    }
  end
end
```

No new assembler methods for the attach dropdowns: `form_networks` (keys `id`,
`name`), `form_subnets` (keys `id`, `name`, `cidr`, `network_id`), and
`form_security_groups` (keys `id`, `name`, `project_id`, `project_label`) already
exist in `FormOptionsAssembler`.

The detach modal's live interface list is a **member** action on the instances
controller (it needs a server id), not a namespace-level form_options endpoint:

```ruby
# instances_controller.rb
def attached_interfaces
  handle_api_call do
    { attached_interfaces: compute_service.form_attached_interfaces(params.require(:id)) }
  end
end
```

(No `authorize!` — it is a read of the instance's own interfaces, like the other
read paths; the mutating attach/detach actions carry the policy checks.)

### Routes — `config/routes.rb`

```ruby
# member block of resources :instances
post :attach_interface
post :detach_interface
get :attached_interfaces
# namespace level
get "form_options/interface_options", to: "form_options#interface_options"
```

Resolved: `POST /api/instances/:id/attach_interface`,
`POST /api/instances/:id/detach_interface`,
`GET /api/instances/:id/attached_interfaces`,
`GET /api/form_options/interface_options`.

### Policy — `config/policy.json`

```json
"compute_njq:instance_attach_interface": "rule:instance_actions",
"compute_njq:instance_detach_interface": "rule:instance_actions",
```

Policies are boot-loaded: restart Rails (port 8010) after adding these so the new
rules take effect.

## Layer 3 — Frontend: Types, apiClient, Hooks

### Types — `types/interface.ts` (new)

```ts
export const InterfaceNetworkSchema = z.object({ id: z.string(), name: z.string().nullable() })
export const InterfaceSubnetSchema = z.object({
  id: z.string(), name: z.string().nullable(), cidr: z.string().nullable(), network_id: z.string(),
})
export const InterfaceSecurityGroupSchema = z.object({
  id: z.string(), name: z.string().nullable(), project_id: z.string().nullable(), project_label: z.string().nullable(),
})
export const InterfaceOptionsSchema = z.object({
  networks: z.array(InterfaceNetworkSchema),
  subnets: z.array(InterfaceSubnetSchema),
  security_groups: z.array(InterfaceSecurityGroupSchema),
})
export const AttachedInterfaceSchema = z.object({
  port_id: z.string(),
  fixed_ip_address: z.string(),
  mac_addr: z.string().nullable(),
})
export const AttachedInterfacesSchema = z.object({
  attached_interfaces: z.array(AttachedInterfaceSchema),
})
export type InterfaceNetwork = z.infer<typeof InterfaceNetworkSchema>
export type InterfaceSubnet = z.infer<typeof InterfaceSubnetSchema>
export type InterfaceSecurityGroup = z.infer<typeof InterfaceSecurityGroupSchema>
export type InterfaceOptions = z.infer<typeof InterfaceOptionsSchema>
export type AttachedInterface = z.infer<typeof AttachedInterfaceSchema>
export type AttachedInterfaces = z.infer<typeof AttachedInterfacesSchema>
```

Request shapes live inline in the hooks/apiClient (as FIP does), not here.

### apiClient — `apiClient.ts`

```ts
// instanceApi
attachInterface: (
  id: string,
  body: { network_id: string; subnet_id?: string; ip_address?: string; security_groups?: string[] }
): Promise<void> =>
  apiClient.post<{ data: { ok: true } }>(`instances/${id}/attach_interface`, body)
    .then((res) => { checkForApiError(res.data) })
    .catch((err) => { throw detailedError(err) }),

detachInterface: (id: string, body: { fixed_ip_address: string }): Promise<void> =>
  apiClient.post<{ data: { ok: true } }>(`instances/${id}/detach_interface`, body)
    .then((res) => { checkForApiError(res.data) })
    .catch((err) => { throw detailedError(err) }),

getAttachedInterfaces: (id: string): Promise<AttachedInterfaces> =>
  apiClient.get<{ data: unknown }>(`instances/${id}/attached_interfaces`).then((res) => {
    checkForApiError(res.data)
    return parseOrThrow(AttachedInterfacesSchema, res.data, "attached_interfaces")
  }),

// formOptionsApi
getInterfaceOptions: (): Promise<InterfaceOptions> =>
  apiClient.get<{ data: unknown }>("form_options/interface_options").then((res) => {
    checkForApiError(res.data)
    return parseOrThrow(InterfaceOptionsSchema, res.data, "interface_options")
  }),
```

### QUERY_KEYS — `queryKeys.ts`

```ts
interfaceOptions: ["form", "interface_options"] as const,
attachedInterfaces: (id: string) => ["instance", id, "attached_interfaces"] as const,
```

### Hooks

`useAttachInterfaceMutation.ts` — `AttachInterfaceVars = { id, network_id, subnet_id?,
ip_address?, security_groups? }`; `mutationFn` calls `api.instances.attachInterface`;
optimistic transition `"attaching_interface"` on `QUERY_KEYS.instances`; `onError`
rolls back; `onSettled` invalidates `QUERY_KEYS.instances` + `instanceDetail(id)`.

`useDetachInterfaceMutation.ts` — `DetachInterfaceVars = { id, fixed_ip_address }`;
`mutationFn` calls `api.instances.detachInterface`; optimistic transition
`"detaching_interface"`; same onMutate/onError/onSettled, and `onSettled`
additionally invalidates `QUERY_KEYS.attachedInterfaces(id)`.

`useInterfaceOptionsQuery.ts` — thin `useQuery` wrapper over
`api.formOptions.getInterfaceOptions()`, keyed `QUERY_KEYS.interfaceOptions`, with
the shared `staleTime`/`refetchOnWindowFocus` options.

`useAttachedInterfacesQuery.ts` — `useQuery` over
`api.instances.getAttachedInterfaces(id)`, keyed
`QUERY_KEYS.attachedInterfaces(id)`. **Not** cached stale — the detach modal must
see the current interfaces, so use `staleTime: 0` and `enabled` only while the
modal is open (the hook takes an `enabled` flag; the modal passes `true`). The
detach mutation's `onSettled` also invalidates this key so a re-opened modal
reflects the removal.

Both transition strings pass through the existing `isTransitioning()` — the menu
locks during the action; the modal stays mounted (the stable tree-position fix is
already in `InstanceActionsMenu`).

## Layer 4 — Frontend: Actions registry, Modals, Menu dispatch

### Actions registry — `instanceActions.ts`

Extend the `InstanceAction.key` union with `"attach_interface" | "detach_interface"`
and the `modal` discriminator with `"attachInterface" | "detachInterface"`.

```ts
const hasFixedIp = (i: Instance) => (i.ips ?? []).some((ip) => ip.type === "fixed")

{
  key: "attach_interface",  label: "Attach Interface",
  policy: "compute_njq:instance_attach_interface",
  group: "power",
  isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
  modal: "attachInterface",
  listOnly: true,
},
{
  key: "detach_interface",
  label: "Detach Interface",
  policy: "compute_njq:instance_detach_interface",
  group: "power",
  isAvailable: (i) => ["active", "stopped"].includes(i.status.state) && hasFixedIp(i),
  modal: "detachInterface",
  listOnly: true,
},
```

Placed in `group: "power"` right after the FIP entries, so they render in the same
dropdown block. `hasFixedIp` gates whether the Detach entry appears at all (a cheap
client-side check, no fetch); the modal itself fetches the live, detachable
interfaces.

### `AttachInterfaceModal.tsx` (new)

Mirrors `AttachFloatingIpModal` but with the full-attach fields:
- `useInterfaceOptionsQuery(apiClient)` + `useAttachInterfaceMutation(apiClient, queryClient)`.
- State: `networkId`, `subnetId`, `ipAddress`, `securityGroups: string[]`.
- Network `<select>` (required) from `options.data.networks`.
- Subnet `<select>` (optional), filtered to the chosen network
  (`subnet.network_id === networkId`), with an empty "Auto" option.
- Fixed-IP `<input type="text">` (optional) — enabled only when a subnet is
  chosen (a fixed IP must come from a subnet's CIDR; this mirrors the legacy
  behavior and prevents the common backend 400).
- Security groups: multi-select (checkboxes) from `options.data.security_groups`.
- Submit:
  ```ts
  mutation.mutate(
    { id: instance.id, network_id: networkId, subnet_id: subnetId || undefined,
      ip_address: ipAddress || undefined, security_groups: securityGroups },
    { onSuccess: () => onClose() }
  )
  ```
- Disabled when `!networkId || mutation.isPending`. Errors in `.alert-danger`;
  modal stays open on failure.

### `DetachInterfaceModal.tsx` (new)

Mirrors `DetachFloatingIpModal`, but lists the instance's **live, detachable
interfaces** (not a filter of `instance.ips`):
- `useAttachedInterfacesQuery(apiClient, instance.id, true)` +
  `useDetachInterfaceMutation(apiClient, queryClient)`.
- `interfaces = query.data?.attached_interfaces ?? []`.
- While `query.isLoading`, show a loading state; if the list is empty, show
  "No detachable interfaces".
- One radio per interface, value/label = `iface.fixed_ip_address` (optionally
  showing `mac_addr` as a hint); `selected` auto when exactly one.
- Submit: `mutation.mutate({ id: instance.id, fixed_ip_address: selected }, { onSuccess: () => onClose() })`.
- Disabled when `!selected || mutation.isPending`; label "Detaching…" while pending.
  The server resolves port_id from the address.

### Menu dispatch — `InstanceActionsMenu.tsx`

Add to the `modals` fragment (stays mounted across the row transition — the fix
already in place):

```tsx
{activeModal === "attachInterface" && (
  <AttachInterfaceModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />
)}
{activeModal === "detachInterface" && (
  <DetachInterfaceModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />
)}
```

## Layer 5 — Tests

### RSpec
- `interface_actions_spec.rb` (new) — attach: port created + attached by port_id;
  rollback (`neutron_delete_port`) when `nova_attach_interface` raises; raise on
  empty `network_id`. Detach: resolves port_id from `nova_server_os_interfaces` by
  fixed IP + DELETE; raise when no interface IP matches.
- `neutron_spec.rb` — extended for the new `ip_address` variant of
  `neutron_create_port` (RED→GREEN for the extension).
- Nova spec — the three new os-interface methods (GET/POST/DELETE path + body).
- `form_options_assembler_spec.rb` — `form_attached_interfaces` shape: one entry
  per fixed IP, keys `port_id`/`fixed_ip_address`/`mac_addr`, drops entries with a
  blank `ip_address`.
- `interface_routes_spec.rb` (new) — the four routes (attach, detach,
  attached_interfaces, interface_options), mirroring `floating_ip_routes_spec.rb`.
- Controller specs — FIP has a gap here (no controller tests). Fill it for
  interface: two tests in `instances_controller_spec.rb` (authorize +
  handle_api_call path), one for `attached_interfaces`, and one in
  `form_options_controller_spec.rb` for `interface_options`.

### Vitest
- `useAttachInterfaceMutation.test.tsx`, `useDetachInterfaceMutation.test.tsx` —
  optimistic onMutate/onError/onSettled, transition strings; detach also
  invalidates `attachedInterfaces(id)`.
- `useAttachedInterfacesQuery.test.tsx` — fetches via `getAttachedInterfaces`,
  keyed correctly, `enabled` flag gates the fetch.
- `AttachInterfaceModal.test.tsx` — network required, subnet filter by chosen
  network, fixed-IP only with subnet, SG multi-select, submit payload,
  close-on-success.
- `DetachInterfaceModal.test.tsx` — lists live interfaces from the query,
  auto-select with one, empty/loading states, submit `{ fixed_ip_address }`,
  close-on-success.
- `interface.test.ts` — Zod schema parse/reject (options + attached interfaces).
- `apiClient.test.ts` — extend for `attachInterface`/`detachInterface`/
  `getAttachedInterfaces`/`getInterfaceOptions`.
- `instanceActions.test.ts` — extend for the two new entries + `hasFixedIp` predicate.
- `InstanceActionsMenu.test.tsx` — dispatch of the two new modals + the
  `attaching_interface` transition (modal stays mounted — regression like FIP).

TDD throughout: each test RED before implementation. Final verification: full Ruby
+ JS suites + `tsc` (hold the 8-error baseline).

## Verification

1. Ruby: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq"`
2. JS: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq"`
3. Typecheck: `docker exec elektra bash -c "cd /app && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`
4. Manual (port 8010, Rails restarted for the new policy rules): attach an
   interface (network + subnet + optional fixed IP + SGs) to a running instance →
   modal closes on success, the new fixed IP appears in the list; detach it → the
   IP disappears and the Detach action goes away when no fixed IP remains.
