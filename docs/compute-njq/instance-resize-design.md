# Instance Resize (Resize + Confirm/Revert Resize) — Design

**Status:** approved design, ready for an implementation plan
**Area:** `compute_njq` (React/BFF compute plugin)
**Related:** [instance-edit-operations-design.md](instance-edit-operations-design.md),
[lifecycle-actions-design.md](lifecycle-actions-design.md),
[architecture-spec.md](architecture-spec.md)

## Goal

Port the **Resize** instance operation into `compute_njq`, including its two
follow-up actions **Confirm Resize** and **Revert Resize**. Resizing changes a
running/stopped server's flavor; Nova performs it as a two-step flow:

1. `os-resize` moves the server through a transitioning `RESIZE` state into the
   stable `VERIFY_RESIZE` state (not an in-flight task — it waits for the user).
2. From `VERIFY_RESIZE`, the user either **confirms** (`os-confirmResize` → back
   to `ACTIVE` on the new flavor) or **reverts** (`os-revertResize` → back to the
   old flavor).

This reuses the **modal-mutation pattern** established in
[instance-edit-operations-design.md](instance-edit-operations-design.md) for the
parametrised Resize step, and the existing **lifecycle-action pattern**
(`ACTION_BODIES` + `useInstanceActionMutation`) for the two parameter-less
follow-up actions.

Out of scope for this feature: Snapshot/Image, Security Groups mutation, Floating
IP, Interface, Console (each a later, separate feature).

## Scope & decisions

- **Resize** — change a server's flavor. Modal with a read-only "current flavor"
  summary and a "New Flavor" select (all flavors except the current one), mirroring
  the legacy `new_size.html.haml`. Parametrised → dedicated BFF endpoint + hook +
  modal. Policy: existing `compute_njq:instance_update` (legacy uses
  `compute:instance_update` for resize).
- **Confirm Resize** — `os-confirmResize`, no input. Lifecycle action via the
  existing `ACTION_BODIES` map + `useInstanceActionMutation`, visible only when
  `state === "verify_resize"`. Confirmation dialog, no modal.
- **Revert Resize** — `os-revertResize`, no input. Same treatment as Confirm,
  with a warning confirmation ("discards the new size").

All three gated by the existing `compute_njq:instance_update` policy — no new
policy. This matches the legacy menu, where resize/confirm/revert all sit behind
`compute:instance_update`.

**Why Confirm/Revert are not their own modals:** they take no user input
(`confirmResize`/`revertResize` with a `null` body). That is exactly what
`ACTION_BODIES` + `useInstanceActionMutation` cover (like stop/pause/reboot). A
modal exists only when the user must enter something first — here only Resize
does. The legacy UI treats them the same way: separate menu links, no modal; only
resize itself has a modal.

## Backend

### Resize (dedicated endpoint)

- **Route:** `PUT instances/:id/resize` (member), gated `compute_njq:instance_update`.
- **Controller** (`instances_controller.rb`): `resize` reads `params[:flavor_id]`,
  calls `services...resize_instance(id, flavor_id)`, renders the `{ ok: true }`
  result — same shape as `update`/`set_tags`/`reset_status`.
- **Service** (`instance_actions.rb`):
  ```ruby
  # Resize a server to a new flavor. Nova's os-resize takes a flavorRef; we
  # reject a blank flavor here rather than making a pointless backend call.
  def resize_instance(id, flavor_id)
    flavor_id = flavor_id.to_s.strip
    raise ComputeNjq::RequestError, "Flavor must not be blank" if flavor_id.empty?

    nova_server_action(id, { "resize" => { "flavorRef" => flavor_id } })
    { ok: true }
  end
  ```
  Reuses the existing `nova_server_action` raw call — no new `nova.rb` method.

### Confirm / Revert Resize (lifecycle actions)

Two entries added to the existing `ACTION_BODIES` map in `instance_actions.rb`:
```ruby
"confirm_resize" => { "confirmResize" => nil },
"revert_resize"  => { "revertResize"  => nil },
```
They run through the existing generic `instance_action(id, action_name)` path —
no controller or routing change.

## Status model (already in place)

The instance assembler already maps Nova's `verify_resize`/`resized` vm_state to a
stable `state: "verify_resize"`, and `types/instance.ts#isTransitioning`
deliberately treats `verify_resize` as **not** transitioning (it waits for the
user). So:

- During the resize itself (`transition` set) the menu is locked, as for any
  lifecycle action.
- In `verify_resize` the menu stays open and shows Confirm/Revert.

No status-model changes are required. The exact `state` value for a stopped
server (`stopped` vs `shutoff`) is verified against the assembler during
implementation before the `isAvailable` predicates are finalised.

## Client & hook

### apiClient

One new method, analogous to `updateInstanceName`:
```ts
resizeInstance: (id: string, flavorId: string) =>
  apiClient
    .put<{ data: unknown }>(`instances/${id}/resize`, { flavor_id: flavorId })
    .then((res) => parseOrThrow(ActionResultSchema, res.data, "resize"))
```
Reuses the existing `{ ok: true }` response schema shared by the other edit
operations. Confirm/Revert need **no** new apiClient method — they go through the
existing `instances.action(id, actionName)`.

### Hook

One new `useResizeInstanceMutation`, built like `useUpdateInstanceNameMutation`:
- `mutationFn: ({ id, flavorId }) => api.instances.resizeInstance(id, flavorId)`
- **optimistic patch:** set `instanceDetail(id).status.transition` to a
  resize-prep marker so the row immediately reads as transitioning and the menu
  locks (consistent with the lifecycle actions' `optimisticTransition`).
- `onError` restores the previous detail; `onSettled` invalidates
  `QUERY_KEYS.instances` + `QUERY_KEYS.instanceDetail(id)`.

Confirm/Revert reuse `useInstanceActionMutation` with an `optimisticTransition`
(`"resize_confirming"` / `"resize_reverting"`), exactly like stop/reboot.

## UI

### Menu integration (`instanceActions.ts`)

`InstanceAction["key"]` gains `"resize" | "confirm_resize" | "revert_resize"`;
`InstanceAction["modal"]` gains `"resize"`. Three new entries in
`INSTANCE_ACTIONS`, all `group: "power"`:

```ts
{ key: "resize", label: "Resize", policy: "compute_njq:instance_update",
  group: "power", isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
  modal: "resize" }

{ key: "confirm_resize", label: "Confirm Resize", policy: "compute_njq:instance_update",
  group: "power", isAvailable: (i) => i.status.state === "verify_resize",
  optimisticTransition: "resize_confirming",
  confirm: { title: "Confirm resize?",
    message: "This keeps the new size and finalizes the resize. The instance stays on the new flavor.",
    ok: "Confirm resize" } }

{ key: "revert_resize", label: "Revert Resize", policy: "compute_njq:instance_update",
  group: "power", isAvailable: (i) => i.status.state === "verify_resize",
  optimisticTransition: "resize_reverting",
  confirm: { title: "Revert resize?",
    message: "This discards the new size and restores the instance to its previous flavor.",
    ok: "Revert resize" } }
```

The exact `state` strings in the `isAvailable` predicates are verified against the
assembler during implementation.

### ResizeModal (`ResizeModal.tsx`)

Built like `EditNameModal`, with flavor selection mirroring the legacy
`new_size.html.haml`. Data from `useInstanceDetailQuery(apiClient, instance.id)`
(current flavor) and the existing `formOptionsApi.getFlavors()` query (catalog —
same source CreateInstanceForm uses; no new data source).

Layout, top to bottom:
1. **Info callout** (`alert alert-info`): "Resizing a server is a technically
   complex operation and might fail for a variety of reasons. In many cases a
   better course of action is to create a new server in the new size and delete
   the old." (legacy wording).
2. **Current flavor**, read-only: name + `RAM / VCPUs / Disk`, from the detail
   query.
3. **"New Flavor" select**: all flavors except the current one; each label shows
   `name (RAM: … VCPUs: … Disk: …)`; placeholder "Choose flavor". Uses the same
   select component CreateInstanceForm uses (verified during implementation —
   likely `SearchableSelect`).
4. **Error alert** on `mutation.error`.

Footer: Cancel + Resize button (disabled until a flavor is chosen and differs from
the current one; disabled while `mutation.isPending`). Submit calls
`mutation.mutate({ id, flavorId })` and `onClose()` on success; the optimistic
transition patch makes the row read as resizing immediately.

Byte→GB/MB formatting reuses CreateInstanceForm's existing helper if one exists
(verified during implementation) rather than a new one.

### Menu wiring (`InstanceActionsMenu.tsx`)

Add `activeModal === "resize"` → `<ResizeModal instance={instance}
apiClient={apiClient} onClose={() => setActiveModal(null)} />`, analogous to the
three existing edit modals.

## Tests

### Backend (RSpec)

- `instance_actions_spec.rb`:
  - `resize_instance(id, flavor)` calls
    `nova_server_action(id, {"resize"=>{"flavorRef"=>flavor}})` and returns
    `{ ok: true }`.
  - blank / nil flavor raises `ComputeNjq::RequestError`.
  - `instance_action("confirm_resize")` → `nova_server_action(id,
    {"confirmResize"=>nil})`; `instance_action("revert_resize")` →
    `{"revertResize"=>nil}`.
- Controller spec (if present): the resize endpoint is policy-gated and forwards
  `flavor_id` to the service.

### Frontend (Vitest)

- `instanceActions.test.ts`: resize visible for active/stopped, hidden for
  verify_resize; confirm/revert visible only for verify_resize; `modal:"resize"`.
- `useResizeInstanceMutation.test.ts`: calls `resizeInstance`; optimistic
  transition patch; rollback `onError`; invalidation `onSettled`.
- `apiClient.test.ts`: `resizeInstance` issues `PUT instances/:id/resize` with
  `{ flavor_id }`.
- `ResizeModal.test.tsx`: shows the current flavor read-only; the select lists all
  flavors except the current; submit calls the mutation with the chosen flavor;
  error alert surfaces a persist error.
- `InstanceActionsMenu.test.tsx`: Resize opens the modal instead of firing a
  mutation; group/divider layout stays correct.

### Verification (cadence "build all, then approve")

- `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq"` → green
- `docker exec elektra bash -c "cd /app && pnpm typecheck"` → clean except the
  pre-existing `MultiSelect.test.tsx(70,13)` error
- `bin/workspace bundle exec rspec plugins/compute_njq` → green
- Manual (port 8010): active instance → Resize → choose flavor → VERIFY_RESIZE →
  Confirm (stays on new flavor) and, in a second run, Revert (back to old flavor).

## Review focus

Inputs/failure modes the tests above must pin, most likely to bite first:

- **Blank/whitespace flavor** reaching resize → `RequestError`, not a Nova call
  (covered in `instance_actions_spec`).
- **Same flavor selected** as the current one → the Resize button stays disabled
  (covered in `ResizeModal.test.tsx`).
- **verify_resize visibility** → Confirm/Revert appear only in that state and
  Resize disappears (covered in `instanceActions.test.ts`), so the menu never
  offers a resize of an already-pending resize.
- **Menu lock during resize** → the optimistic transition keeps the menu disabled
  until Nova settles, preventing a second resize racing the first.
