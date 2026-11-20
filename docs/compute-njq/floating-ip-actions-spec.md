# Floating IP Attach/Detach — compute_njq design spec

## Goal

Add **Attach Floating IP** and **Detach Floating IP** actions to the
compute_njq instance list-view dropdown, implemented as React modals backed by
new BFF endpoints — mirroring the existing resize/snapshot pattern (modal fires
a mutation, closes on submit, progress shows in the row's status pill).

This spec covers **Floating IP only**. Attach/Detach **Interface** is a
separate, later block (same surface, same patterns) and is explicitly out of
scope here.

## Context

The compute_njq BFF already has a **project-scoped** token with a full service
catalog and a live Neutron handle (`elektron_neutron`) — no domain-scope
constraint. Networking data exists today only as read-only create-form
dropdowns. All four networking actions are missing; this spec adds the two
floating-IP ones.

**Existing patterns this spec reuses verbatim:**

- BFF controller: `ComputeNjq::Api::InstancesController` with `authorize!(rule)`
  + `handle_api_call { ... }` returning the uniform `{error,code,message}`
  envelope; mutations return `{ ok: true }` unless noted.
- Service: `ServiceLayer::ComputeNjqService` with `elektron_nova` /
  `elektron_neutron`; Neutron slices live in
  `compute_njq_services/neutron.rb`, action bodies in `instance_actions.rb` /
  dedicated mixins (e.g. `snapshot.rb`).
- Frontend: `apiClient.ts` `instances`/`formOptions` namespaces →
  `checkForApiError` + `parseOrThrow` (Zod) + `detailedError`; optimistic
  mutation hooks in `hooks/` (see `useResizeInstanceMutation.ts`); actions
  registered in `instanceActions.ts`; modals under
  `routes/instances/-components/`.

## User-confirmed decisions

1. **Scope:** Floating IP first (Attach + Detach). Interfaces later.
2. **Detach IDs resolved server-side:** the frontend sends only the floating-IP
   **address**; the detach endpoint looks up the Neutron floating-ip id from the
   address. No change to the instance detail payload or its Zod schema.
3. **Surface:** list-view only (`listOnly: true`), like Resize/Snapshot. Not in
   the detail modal.
4. **Attach source:** choose an existing **free** (unassigned) project floating
   IP, **or allocate a new one** in the modal (pick an external network →
   Neutron create floatingip → attach).
5. **Target fixed IP selectable:** when the server has multiple fixed
   IPs/ports, the user picks the target fixed IP; a single fixed IP is
   preselected. Fixed IPs come from the existing detail payload.
6. **Detach is a selection modal:** list all of the server's floating IPs; the
   user picks one (a single one is preselected/confirm-only).

## Policy

compute_njq has no networking policy rule yet. Add two rules to
`plugins/compute_njq/config/policy.json`, matching the existing
`rule:instance_actions` style used by `instance_update`:

```json
"compute_njq:instance_attach_floating_ip": "rule:instance_actions",
"compute_njq:instance_detach_floating_ip": "rule:instance_actions"
```

Policy rules are **boot-loaded** into `window.policyConfig` — a Rails restart
(port 8010 in dev) is required before the actions appear in the dropdown. This
is a known operational note (same as the snapshot rule), not a code concern.

## Backend

### Neutron service additions — `compute_njq_services/neutron.rb`

```ruby
# Floating IPs for the scoped project that are not currently associated
# (port_id is null) — the attach modal offers these as "free to attach".
def neutron_available_floating_ips
  neutron_floating_ips.select { |fip| fip["port_id"].to_s.empty? }
end

# External networks the project may allocate a floating IP from
# (router:external == true). Attach modal uses these for "allocate new".
def neutron_external_networks
  elektron_neutron.get("networks", { "router:external" => true }).body["networks"] || []
end

# The scoped project's ports for a given server, used to find the port that
# carries a chosen fixed IP when associating a floating IP.
def neutron_ports_for_device(device_id)
  elektron_neutron.get("ports", { "device_id" => device_id }).body["ports"] || []
end

# Allocate a new floating IP on an external network. Returns the raw hash.
def neutron_create_floating_ip(floating_network_id)
  elektron_neutron
    .post("floatingips") { { "floatingip" => { "floating_network_id" => floating_network_id } } }
    .body["floatingip"]
end

# Associate: PUT floatingips/{id} with port_id + fixed_ip_address.
def neutron_associate_floating_ip(id, port_id:, fixed_ip_address:)
  elektron_neutron
    .put("floatingips/#{id}") { { "floatingip" => { "port_id" => port_id, "fixed_ip_address" => fixed_ip_address } } }
    .body["floatingip"]
end

# Disassociate: PUT floatingips/{id} nulling both fields.
def neutron_disassociate_floating_ip(id)
  elektron_neutron
    .put("floatingips/#{id}") { { "floatingip" => { "port_id" => nil, "fixed_ip_address" => nil } } }
    .body["floatingip"]
end

# Resolve a floating-ip hash by its address for the scoped project, or nil.
def neutron_floating_ip_by_address(address)
  neutron_floating_ips.find { |fip| fip["floating_ip_address"] == address }
end
```

### Service action mixin — `compute_njq_services/floating_ip_actions.rb` (new)

Registered in `compute_njq_service.rb` alongside the existing mixins.

```ruby
# Attach: optionally allocate a new floating IP, then associate it with the
# server's port that carries the chosen fixed IP.
#   params: { floating_ip_id:, floating_network_id:, fixed_ip_address: }
#   - exactly one of floating_ip_id (existing free FIP) or
#     floating_network_id (allocate new) is provided.
def attach_floating_ip(server_id, floating_ip_id:, floating_network_id:, fixed_ip_address:)
  fip_id =
    if floating_network_id.present?
      neutron_create_floating_ip(floating_network_id)["id"]
    else
      floating_ip_id
    end
  port = port_for_fixed_ip(server_id, fixed_ip_address)
  neutron_associate_floating_ip(fip_id, port_id: port["id"], fixed_ip_address: fixed_ip_address)
  { ok: true }
end

# Detach: resolve the floating-ip id from its address, then disassociate.
def detach_floating_ip(server_id, floating_ip_address:)
  fip = neutron_floating_ip_by_address(floating_ip_address)
  raise ... unless fip # 404-style; handled by handle_api_call envelope
  neutron_disassociate_floating_ip(fip["id"])
  { ok: true }
end

private

# The server's port whose fixed_ips contains the chosen address; falls back to
# the server's first port (mirrors legacy). Raises if the server has no ports.
def port_for_fixed_ip(server_id, fixed_ip_address)
  ports = neutron_ports_for_device(server_id)
  ports.find { |p| (p["fixed_ips"] || []).any? { |fi| fi["ip_address"] == fixed_ip_address } } ||
    ports.first
end
```

`server_id` is the Nova server id, which Neutron stores as the port
`device_id`.

### Controller endpoints — `InstancesController`

Add two member actions, each gated by its policy rule:

```ruby
def attach_floating_ip
  return unless authorize!("compute_njq:instance_attach_floating_ip")
  handle_api_call do
    compute_service.attach_floating_ip(
      params.require(:id),
      floating_ip_id: attach_fip_params[:floating_ip_id],
      floating_network_id: attach_fip_params[:floating_network_id],
      fixed_ip_address: attach_fip_params[:fixed_ip_address]
    )
  end
end

def detach_floating_ip
  return unless authorize!("compute_njq:instance_detach_floating_ip")
  handle_api_call do
    compute_service.detach_floating_ip(params.require(:id), floating_ip_address: detach_fip_params[:floating_ip_address])
  end
end
```

Strong params permit `floating_ip_id`, `floating_network_id`,
`fixed_ip_address` (attach) and `floating_ip_address` (detach).

### Routes — `config/routes.rb`

Member routes on the `instances` resource:

```ruby
post :attach_floating_ip
post :detach_floating_ip
```

### Form options — new endpoint

Attach modal needs free FIPs and external networks. Add a single endpoint that
returns both (mirrors how `subnets` returns `{ subnets, fixed_ip_ports }`):

`FormOptionsController#floating_ip_options`:

```ruby
def floating_ip_options
  handle_api_call do
    {
      available_floating_ips: compute_service.form_available_floating_ips,
      external_networks: compute_service.form_external_networks,
    }
  end
end
```

with `form_available_floating_ips` / `form_external_networks` thin wrappers
(service-layer, cached like the other `form_*`) over
`neutron_available_floating_ips` / `neutron_external_networks`, each projected
to `{ id, floating_ip_address }` and `{ id, name }` respectively.

Route: `get :floating_ip_options` (collection, under form_options).

## Frontend

### Zod schemas — `types/` (new `floatingIp.ts` or in an existing types file)

```ts
export const AvailableFloatingIpSchema = z.object({ id: z.string(), floating_ip_address: z.string() })
export const ExternalNetworkSchema = z.object({ id: z.string(), name: z.string().nullable() })
export const FloatingIpOptionsSchema = z.object({
  available_floating_ips: z.array(AvailableFloatingIpSchema),
  external_networks: z.array(ExternalNetworkSchema),
})
```

Detach reads the server's current floating IPs from the **existing** detail
payload (`ip_addresses[].ips[].floating.addr`) — no new schema, no id needed
(server resolves it). The detail payload already pairs each fixed IP's
`{ addr, mac }` with its `floating: { addr } | null`, which also feeds the
attach modal's target-fixed-IP picker.

### apiClient — `instances` + `formOptions`

```ts
// instances
attachFloatingIp(id, { floating_ip_id?, floating_network_id?, fixed_ip_address }) -> POST .../attach_floating_ip
detachFloatingIp(id, { floating_ip_address })                                    -> POST .../detach_floating_ip
// formOptions
getFloatingIpOptions() -> GET .../form_options/floating_ip_options  (parsed with FloatingIpOptionsSchema)
```

### Mutation hooks — `hooks/`

`useAttachFloatingIpMutation` and `useDetachFloatingIpMutation`, following
`useResizeInstanceMutation`: `(api, queryClient)` signature, optimistic
`status.transition` patch on the row (synthetic label, e.g.
`"associating_floating_ip"` / `"disassociating_floating_ip"`), `onError`
rollback, `onSettled` invalidates `QUERY_KEYS.instances` +
`QUERY_KEYS.instanceDetail(id)`. The list already polls while transitioning.

### Actions — `instanceActions.ts`

Two new entries, `group: "power"` (networking sits with lifecycle in the legacy
menu order), `listOnly: true`, `modal:` discriminators:

```ts
{ key: "attach_floating_ip", label: "Attach Floating IP",
  policy: "compute_njq:instance_attach_floating_ip", group: "power",
  isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
  modal: "attachFloatingIp", listOnly: true },
{ key: "detach_floating_ip", label: "Detach Floating IP",
  policy: "compute_njq:instance_detach_floating_ip", group: "power",
  isAvailable: (i) => hasFloatingIp(i), modal: "detachFloatingIp", listOnly: true },
```

Attach is offered for `active` **or** `stopped` (mirrors legacy — floating-IP
association does not require a running guest). `hasFloatingIp(i)` is a new predicate: the
instance's `ips` array contains an entry with `type === "floating"` (the list
payload already flags these). Extend the `InstanceAction["key"]` and
`["modal"]` unions accordingly.

### Modals — `routes/instances/-components/`

- **`AttachFloatingIpModal.tsx`:** on open, `getFloatingIpOptions()`. Radio/segment:
  "Use existing" (select from free FIPs) vs "Allocate new" (select external
  network). Plus a target-fixed-IP select (from the instance's fixed IPs;
  single one preselected and the control hidden/disabled). Submit → mutation →
  close on success; error alert keeps the modal open. Follows `ResizeModal`'s
  shape.
- **`DetachFloatingIpModal.tsx`:** list the server's floating IP addresses (from
  detail / the row); user selects one (single preselected). Submit sends the
  address → mutation → close on success. Confirm-style copy explaining the
  effect.

Wire both into `InstanceActionsMenu.tsx`'s `activeModal` switch, exactly like
`resize`/`snapshot`.

## Global constraints

- TS/JS: Prettier (120 cols, 2 spaces, no semicolons, double quotes), strict
  TS, functional components. Comments/code in English.
- TDD throughout (RED→GREEN per change); plugin vitest baseline must stay green;
  tsc must not add errors over the known 8-error baseline.
- `listOnly: true` on both actions — detail modal unaffected (regression-guard
  via the existing surface tests).

## Review focus (inputs the happy-path tests won't cover)

1. **Multi-NIC server, attach:** the chosen fixed IP must map to the correct
   port; `port_for_fixed_ip` picks by `fixed_ips[].ip_address`, not the first
   port, when several exist.
2. **Allocate-new failure after create:** if association fails after a new FIP
   was allocated, the newly created FIP is now orphaned (unassociated).
   **Decision: leave it** (as legacy does) — a freshly allocated,
   unassociated FIP is reusable and will appear in the next attach modal's
   "free FIPs" list. The association error must still surface to the user.
   Test: a create-then-associate where associate raises still propagates a
   clean error envelope and does **not** delete the FIP.
3. **Detach address not found:** `neutron_floating_ip_by_address` returns nil
   (address already detached elsewhere / race) → the endpoint must return a
   clean error envelope, not a 500.
4. **Server with zero Neutron ports** (e.g. just-deleted): `port_for_fixed_ip`
   falls back to `ports.first` which is nil → attach must fail with a clear
   error, not a nil-dereference.
5. **`hasFloatingIp` + attach availability:** Detach must not be offered when
   the server has no floating IP (`hasFloatingIp` false). Attach is offered for
   `active` or `stopped` (decided — see Actions); it must not appear for other
   states (e.g. `error`, `building`, `verify_resize`).

## Out of scope

- Attach/Detach Interface (separate block).
- Web Console and Edit Security Groups actions.
- Surfacing floating-ip-id / port-id in the detail payload (avoided by
  resolving server-side).
