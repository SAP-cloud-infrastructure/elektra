# Edit Security Groups — Design

## Goal

Add an **Edit Security Groups** action to the `compute_njq` instance actions
dropdown so a user can change the set of security groups on a running
instance — the last of the two actions still missing versus the legacy
compute plugin (the other being Web Console).

## Context

The legacy compute plugin drives this through **Nova server-actions**
(`addSecurityGroup` / `removeSecurityGroup` on `POST /servers/{id}/action`),
diffing the current set against the submitted set and applying one call per
group. It reads the current set from Nova (`GET
/servers/{id}/os-security-groups`) and the candidate list from Neutron
(`GET /security-groups`).

`compute_njq`, by contrast, manages security-group membership **on the
Neutron port** throughout — `attach_interface` already sets
`security_groups` on the port it creates. The plugin has no Nova
add/remove-SG helper and no Neutron port-update helper today; both paths
are new work either way.

**Decision (confirmed with the user):** go through **Neutron**, not Nova.
On save, resolve the instance's port(s) via `neutron_ports_for_device` and
set the full desired `security_groups` list on each port
(`PUT /ports/{id}`). This matches the plugin's port-centric model and the
way `attach_interface` already works.

### Why "set the full set on every port" is the right semantics

The existing **Security Groups** detail tab reads the instance's SGs via
`nova_server_security_groups(server_id)` (`instance_detail_assembler.rb`),
which is Nova's **aggregated, server-wide** view — a single set across all
ports, not per-port. The UI therefore already presents one SG set per
instance. Editing mirrors that: the modal shows one set; saving writes that
set to every port of the instance. This also matches the legacy outcome,
where Nova propagated the change across all of the server's ports.

The rare case where a multi-port VM has *different* SGs per port is
flattened to a single set — consistent with what the detail tab already
shows, and acceptable per the user's decision.

## UI

A new modal `EditSecurityGroupsModal`, opened from the dropdown. Selection
uses the **`MultiSelect`** (tag/chip) control — the same component and the
same `groupSecurityGroupsByProject` grouping the Attach Interface modal and
the create form already use for security groups. The instance's current
SGs are **preselected**.

- Mechanism: user adjusts the set, clicks Save → the full desired set is
  written to the instance's port(s).
- Empty set: the legacy form rejected an empty submission ("assign at least
  one security group"). We mirror that — the Save button is disabled while
  the selection is empty, and the BFF also rejects an empty set defensively.
- A short info note explains that the change applies to all of the
  instance's ports (carrying the legacy warning's intent).
- Error from the mutation is shown inline; the modal stays open on failure.
- `dialogClassName="modal-lg"`, `bsClass="compute-njq modal"`,
  `aria-labelledby`.
- `listOnly: true` — a configuration/form action like the other edit
  actions; shown on the list row, not the detail-modal surface.

## Data flow

```
EditSecurityGroupsModal
  ├─ options:   useSecurityGroupOptionsQuery(api)  →  formOptions.getSecurityGroups()
  │             (existing endpoint GET form_options/security_groups)
  ├─ current:   instance detail's security_groups (preselect by id)
  └─ save:      useEditSecurityGroupsMutation → apiClient.instances.setSecurityGroups(id, { security_groups })
                     → PUT /instances/:id/security_groups
                         → ComputeNjqService#set_instance_security_groups(id, security_groups:)
                             → neutron_ports_for_device(id)   (find ports)
                             → neutron_update_port(port_id, security_groups:)  (per port)
```

On mutation success: invalidate `QUERY_KEYS.instances` and
`QUERY_KEYS.instanceDetail(id)` so the detail Security Groups tab refreshes.

## The current-SG source for preselection

The list-row `Instance` does **not** carry security groups (confirmed:
`InstanceSchema` has no `security_groups` field) — they exist only on
`InstanceDetail.security_groups` (`DetailSecurityGroup`, shape
`{ id, name, project_name, rules }`). So the modal fetches the detail
itself via `useInstanceDetailQuery(apiClient, instance.id)` and preselects
from `detail.data?.security_groups`. This works identically from both
surfaces (list row and detail modal) without the actions menu having to
thread SG data through, and reuses the already-cached detail query when the
detail modal is open. We preselect by `id`.

Note: `DetailSecurityGroup.id` may be `null` in the schema; only non-null
ids are used for preselection. While the detail is loading, the picker shows
its loading state and Save stays disabled.

## Backend changes (Ruby BFF)

### 1. Policy — `config/policy.json`
Add:
```json
"compute_njq:instance_edit_securitygroups": "rule:instance_actions"
```
Same `instance_actions` rule the other attach/detach network operations
use. (Legacy split this into `edit_securitygroups` + `assign_securitygroups`;
we have a single write path, so one rule suffices.)

### 2. Route — `config/routes.rb`
Add a member route on `:instances`:
```ruby
put :security_groups, action: :set_security_groups
```

### 3. Neutron helper — `neutron.rb`
Add the missing mutating helper:
```ruby
def neutron_update_port(port_id, security_groups:)
  elektron_neutron.put("ports/#{port_id}") do
    { "port" => { "security_groups" => Array(security_groups) } }
  end
end
```

### 4. New action module — `security_group_actions.rb`
New file `app/services/service_layer/compute_njq_services/security_group_actions.rb`,
`include`d into `ComputeNjqService`:
```ruby
module ServiceLayer
  module ComputeNjqServices
    module SecurityGroupActions
      # Sets the full desired security-group set on every port of the
      # instance. Mirrors how attach_interface manages SGs on the port, and
      # matches the aggregated server-wide set the detail tab displays.
      def set_instance_security_groups(server_id, security_groups:)
        groups = Array(security_groups).map(&:to_s).reject(&:empty?).uniq
        raise ComputeNjq::RequestError, "at least one security group is required" if groups.empty?

        ports = neutron_ports_for_device(server_id)
        raise ComputeNjq::RequestError, "no ports found for instance" if ports.empty?

        ports.each { |port| neutron_update_port(port["id"], security_groups: groups) }
        { ok: true }
      end
    end
  end
end
```
Register in `compute_njq_service.rb`: `include ComputeNjqServices::SecurityGroupActions`.

### 5. Controller — `instances_controller.rb`
```ruby
def set_security_groups
  return unless authorize!("compute_njq:instance_edit_securitygroups")
  handle_api_call do
    compute_service.set_instance_security_groups(
      params.require(:id),
      security_groups: Array(set_security_groups_params[:security_groups])
    )
  end
end

private

def set_security_groups_params
  scoped_params.permit(security_groups: [])
end
```

## Frontend changes

### 6. Types — reuse existing
Reuse `SecurityGroupSchema` / `SecurityGroupsResponse` (`types/formOptions.ts`)
for the options, and `DetailSecurityGroup` (`types/instance.ts`) for the
current set. No new schema required. Add a mutation vars type in the hook
(`{ id: string; security_groups: string[] }`).

### 7. apiClient — `apiClient.ts`
```ts
setSecurityGroups: (id: string, body: { security_groups: string[] }) =>
  apiClient
    .put<{ data: { ok: true } }>(`instances/${id}/security_groups`, body)
    .then((res) => { checkForApiError(res.data) })
    .catch((err) => { throw detailedError(err) }),
```

### 8. Hooks
- `useSecurityGroupOptionsQuery(api)` — copy `useInterfaceOptionsQuery`
  shape; `queryKey: QUERY_KEYS.securityGroups`,
  `queryFn: () => api.formOptions.getSecurityGroups()`. (Reuses the
  existing `securityGroups` query key.)
- `useEditSecurityGroupsMutation(api, queryClient)` — copy
  `useAttachInterfaceMutation`; `mutationFn` calls
  `api.instances.setSecurityGroups(id, { security_groups })`; no optimistic
  row-transition needed; `onSettled` invalidates `QUERY_KEYS.instances` and
  `QUERY_KEYS.instanceDetail(vars.id)`. Keep the testable
  `buildEditSecurityGroupsMutationOptions` split.

### 9. Modal — `EditSecurityGroupsModal.tsx`
Props `{ instance: Pick<Instance, "id">, apiClient, onClose }`. The modal
fetches its own detail via `useInstanceDetailQuery(apiClient, instance.id)`
(the list row carries no SGs) and the options via
`useSecurityGroupOptionsQuery(api)`. Local state `selected: string[]`,
initialized from the current SG ids once the detail resolves (non-null ids
only). Render:
- info note (applies to all ports);
- `MultiSelect` with `options` from `useSecurityGroupOptionsQuery`,
  `value={selected}`, `onChange={setSelected}`,
  `getLabel={(sg) => sg.name}`, `getValue={(sg) => sg.id}`,
  `getGroups={groupSecurityGroupsByProject}`, `isLoading`;
- inline error on `mutation.error`;
- footer Cancel + Save, Save `disabled={selected.length === 0 || mutation.isPending || detail.isLoading}`,
  label `{mutation.isPending ? "Saving…" : "Save"}`.
Submit: `mutation.mutate({ id: instance.id, security_groups: selected }, { onSuccess: onClose })`.

### 10. Action wiring — `instanceActions.ts` + `InstanceActionsMenu.tsx`
- Add `"edit_security_groups"` to the `key` union and
  `"editSecurityGroups"` to the `modal` union.
- Add the `INSTANCE_ACTIONS` entry:
  ```ts
  {
    key: "edit_security_groups",
    label: "Edit Security Groups",
    policy: "compute_njq:instance_edit_securitygroups",
    group: "interface",
    isAvailable: () => true,
    modal: "editSecurityGroups",
    listOnly: true,
  }
  ```
  Placed in the `interface` group so it reads as a network operation
  (its own divider section already exists for interface actions).
- In `InstanceActionsMenu.tsx`: import the modal and render
  `{activeModal === "editSecurityGroups" && <EditSecurityGroupsModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />}`.
  The modal reads the current SGs itself via the detail query, so the menu
  passes only the instance and the api client (same as the other modals).

## Testing

**Ruby (RSpec):** `security_group_actions` service spec —
- sets the full set on every port (stubs `neutron_ports_for_device`
  returning 2 ports, asserts `neutron_update_port` called per port with the
  deduped id list);
- raises `RequestError` on empty set;
- raises `RequestError` when the instance has no ports.
Controller spec for `set_security_groups` — authorized call delegates to the
service with permitted `security_groups: []`; unauthorized is rejected.

**Frontend (Vitest):**
- `useEditSecurityGroupsMutation.test.ts` — calls `setSecurityGroups` with
  the vars; invalidates instances + instanceDetail on settle.
- `EditSecurityGroupsModal.test.tsx` — preselects current SGs; Save disabled
  when selection empty; Save calls the mutation with the selected ids and
  closes on success; keeps open + shows error on failure.
- `InstanceActionsMenu.test.tsx` — "Edit Security Groups" entry opens the
  modal; gated by policy.

**Checks:** full `compute_njq` JS suite green; tsc baseline (exactly 8
errors, no new ones); prettier clean on changed files; `bundle exec rspec`
for the new Ruby specs.

## Review Focus

Inputs the spec implies but no happy-path test exercises — most likely to
bite, most likely first:

1. **Instance with multiple ports** — the full set must land on *every*
   port, not just the first. (Service spec with 2 ports covers this.)
2. **Empty selection** — rejected at both the Save button (disabled) and
   the BFF (`RequestError`), so a crafted empty request can't strip all SGs.
3. **Instance with no ports** — BFF raises a clear `RequestError` rather
   than silently succeeding.
4. **Duplicate ids in the submitted list** — deduped before writing so
   Neutron isn't sent a list with repeats.
5. **`DetailSecurityGroup.id === null`** — skipped when building the
   preselected set, so a null id doesn't become a phantom selection.

## Out of scope

- Web Console (the other missing legacy action) — separate feature.
- Per-port SG editing — the instance presents one aggregated set, matching
  the detail tab.
- Showing full SG rules inline in the picker — the legacy form did; the
  `MultiSelect` shows names grouped by project, consistent with the Attach
  Interface modal. Rules remain visible on the Security Groups detail tab.
