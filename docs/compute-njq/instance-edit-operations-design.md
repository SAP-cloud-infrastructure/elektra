# Instance Edit Operations (Edit Name, Edit Tags, Reset Status) — Design

**Status:** approved design, ready for an implementation plan
**Area:** `compute_njq` (React/BFF compute plugin)
**Related:** [lifecycle-actions-design.md](lifecycle-actions-design.md),
[architecture-spec.md](architecture-spec.md)

## Goal

Port the first **form/modal-based** instance operations into `compute_njq`:
**Edit Name**, **Edit Tags**, and **Reset Status**. All lifecycle power actions
(start/stop/reboot/pause/suspend/hard_reset/lock/unlock/terminate) and Launch are
already ported; everything that still requires a modal/form is not. This batch
establishes the reusable **modal-mutation pattern** that the later form-based
operations (Resize, Snapshot, Security Groups, Floating IP, Interface, Console)
will follow.

Ship all three in a single PR (user decision: "Gruppe 1 gebündelt").

## Scope & decisions

- **Edit Name** — rename a server. Modal with a single text field.
  Policy: existing `compute_njq:instance_update`.
- **Edit Tags** — manage the server's Nova tag list. Modal with a chip editor
  (type + Enter adds a chip, × removes it). The full list is replaced in one
  Nova call. New policy: `compute_njq:instance_tags`.
- **Reset Status** — admin recovery: reset the Nova `vm_state` to `active` or
  `error` via `os-resetState`. Modal with a state select. New policy:
  `compute_njq:instance_reset_status`, gated **admin-only**
  (`rule:context_is_compute_admin`, same as lock/unlock).

Out of scope for this batch: Resize, Snapshot/Image, Security Groups mutation,
Floating IP, Interface, Console (each a later, separate feature).

## The modal-mutation pattern (established here)

A new generic shape, mirroring the existing lifecycle-action pattern but for
operations that need user input before firing:

1. **Backend** — one thin, policy-gated member endpoint per operation on the
   `instances` controller; the mapping + Nova call live in the service layer
   (`instance_actions.rb` for the orchestration, `nova.rb` for the raw call),
   exactly like `instance_action`.
2. **Client** — one `apiClient` method per operation + a Zod response schema.
3. **Hook** — one TanStack `useMutation` per operation, with `onSettled`
   invalidating `QUERY_KEYS.instances` + `QUERY_KEYS.instanceDetail(id)`
   (same reconciliation as `useInstanceActionMutation`). Optimistic update
   where it is safe (name, tags); none for reset-status.
4. **UI** — one modal component per operation (`lib/components/Modal`,
   compound `Modal.Header/Title/Body/Footer`), opened from `InstanceActionsMenu`.

### Menu integration

`InstanceAction` gains an optional discriminator so the menu knows an action
opens a modal instead of firing a mutation directly:

```ts
// instanceActions.ts
export interface InstanceAction {
  // ...existing fields...
  // When set, clicking the item opens a modal keyed by this id instead of
  // running a mutation or inline confirm. The menu owns which component each
  // id maps to (keeps instanceActions.ts free of React/JSX).
  modal?: "editName" | "editTags" | "resetStatus"
}
```

In `InstanceActionsMenu.tsx`, `onClick(a)` becomes:
- `a.modal` set → `setActiveModal(a.modal)`, close the dropdown.
- `a.confirm` set → inline confirm (unchanged).
- else → fire immediately (unchanged).

The menu renders the active modal (switch on `activeModal`), passing
`instance`, `apiClient`, and an `onClose` that clears `activeModal`. The modals
live **outside** the dropdown `<ul>` so closing the menu does not unmount a
half-filled form; the `busy` pending-guard from the in-flight-action work also
covers these (the toggle disables while the mutation runs).

The three new actions join the existing groups. Group placement (legacy
`_item_actions.html.haml` order):
- **Edit Name**, **Edit Tags** → a new `"edit"` group near the top (above the
  `power` group), matching legacy where Edit Name/Tags sit above Start/Stop.
- **Reset Status** → its own position after the power group (legacy shows it
  just before Terminate, admin-gated). Keep it in the `power` group tail or a
  dedicated spot; a divider separates it as today.

`isAvailable` per action:
- Edit Name: always (any non-transitioning instance).
- Edit Tags: always.
- Reset Status: always (admin-gated by policy, which already hides it for
  non-admins via `isAllowed`).

All three remain subject to the existing `visibleActions` rules: hidden while
transitioning, and — like every non-unlock action — hidden on a locked
instance.

## Operation details

### 1. Edit Name

**Nova:** `PUT /servers/{id}` with `{ "server": { "name": "<new>" } }`.

**Backend:**
- `nova.rb`: `nova_update_server(id, attrs)` → `elektron_nova.put("servers/#{id}") { { server: attrs } }.body["server"]`.
- `instance_actions.rb`: `update_instance(id, name)` → validates name present,
  calls `nova_update_server(id, { "name" => name })`, returns `{ ok: true }`.
- Controller `update` (PATCH `instances/:id`): `authorize!("compute_njq:instance_update")`,
  then `compute_service.update_instance(id, name_param)`. Permit `instance: [:name]`.

**Route:** add `:update` to the `instances` resource (`PATCH/PUT instances/:id`).

**Client:** `instances.updateName(id, name)` → `PATCH instances/{id}` body
`{ instance: { name } }`, returns `{ ok: true }` (nothing to parse beyond the
error envelope).

**Hook:** `useUpdateInstanceNameMutation`. Optimistic: patch the cached list row
+ detail `name`; roll back on error; `onSettled` reconciles.

**Modal `EditNameModal`:** single text input pre-filled with current name;
Save disabled when empty or unchanged; trims whitespace. Shows mutation error
inline; closes on success.

**Validation:** name required, non-empty after trim. (Nova allows most
characters; no extra client rule beyond non-empty, matching legacy.)

### 2. Edit Tags

**Nova:** `PUT /servers/{id}/tags` with `{ "tags": ["a", "b"] }` — **replaces**
the entire tag set. (Microversion 2.26+. The project already reads tags, so the
microversion is available.)

**Backend:**
- `nova.rb`: `nova_set_server_tags(id, tags)` →
  `elektron_nova.put("servers/#{id}/tags") { { "tags" => tags } }.body`.
- `instance_actions.rb`: `set_instance_tags(id, tags)` → coerces to an array of
  non-empty strings, calls `nova_set_server_tags`, returns `{ ok: true }`.
- Controller `set_tags` (PUT `instances/:id/tags`):
  `authorize!("compute_njq:instance_tags")`, permit `tags: []`.

**Route:** member `put :tags, action: :set_tags`.

**Policy:** add `"compute_njq:instance_tags": "rule:instance_actions"` to
`config/policy.json` (same base rule as update; editor-level, not admin).

**Client:** `instances.setTags(id, tags)` → `PUT instances/{id}/tags` body
`{ tags }`.

**Hook:** `useSetInstanceTagsMutation`. Optimistic: patch cached detail `tags`
(the list row has no tags field — list Instance carries no tags, only detail
does, so optimistic patch targets `instanceDetail(id)`); roll back on error.

**Modal `EditTagsModal`:** chip editor seeded from the current tags
(`InstanceDetail.tags`). Text input; Enter or comma adds a trimmed, de-duplicated
chip; × removes. Save sends the full array. Empty array is valid (clears all
tags). Shows mutation error inline.

**Note on data source:** tags live on `InstanceDetail`, not the list `Instance`.
The modal is reachable from both the list menu and the detail-modal menu. From
the list it has no tags to seed from, so it fetches the detail (or seeds empty
and relies on the server replace). Plan decision: seed from
`useInstanceDetailQuery` when opened (the detail is cheap and usually cached),
falling back to empty while loading.

### 3. Reset Status

**Nova:** `POST /servers/{id}/action` with `{ "os-resetState": { "state": "<active|error>" } }`.

**Backend:**
- `nova.rb`: reuse `nova_server_action(id, body)`.
- `instance_actions.rb`: `reset_instance_status(id, state)` → whitelist
  `state ∈ {"active","error"}` (raise `RequestError` otherwise), call
  `nova_server_action(id, { "os-resetState" => { "state" => state } })`,
  return `{ ok: true }`.
- Controller `reset_status` (POST `instances/:id/reset_status`):
  `authorize!("compute_njq:instance_reset_status")`, permit `:state`.

**Route:** member `post :reset_status`.

**Policy:** add
`"compute_njq:instance_reset_status": "rule:context_is_compute_admin"` —
admin-only, matching lock/unlock.

**Client:** `instances.resetStatus(id, state)` → `POST instances/{id}/reset_status`
body `{ state }`.

**Hook:** `useResetInstanceStatusMutation`. **No** optimistic update (the
resulting vm_state is a backend recovery decision); `onSettled` reconciles.

**Modal `ResetStatusModal`:** a `<select>` with `active` / `error`; a short
warning that this is an administrative recovery action. Confirm fires the
mutation.

## Error handling

All mutations surface the thrown `checkForApiError` message inline in their
modal (same envelope detection as the rest of the client). A 403 from a
hand-crafted request is already rendered by the controller's `authorize!`.
The modal stays open on error so the user can retry or cancel.

## Security (defense-in-depth, per bff-arch skill)

Each operation is gated on **both** sides by the same rule:
- Client: `visibleActions` hides the menu item when `policy.isAllowed(rule)` is
  false (fail-closed — a missing rule throws → hidden).
- Server: the controller `authorize!(rule)` enforces it before any Nova call.

New rules: `instance_tags` (editor), `instance_reset_status` (admin).
`instance_update` (Edit Name) already exists.

## Testing

**Backend (RSpec):** per operation — the service method maps to the correct
Nova call/body (mock `elektron_nova`), whitelists invalid input
(reset_status rejects a bad state; set_tags coerces), and the controller
returns 403 when the policy denies.

**Frontend (Vitest):**
- `instanceActions.test.ts`: the three actions appear with correct
  group/policy; reset_status hidden when its policy denies; all hidden when
  transitioning/locked.
- Each hook: optimistic patch + rollback on error + `onSettled` invalidation
  (name, tags); reset-status fires with the chosen state, no optimistic patch.
- Each modal: renders seeded, validates (empty name disables Save; chip
  add/remove/dedup; state select), fires the mutation on confirm, shows an
  error inline, closes on success.
- `InstanceActionsMenu.test.tsx`: clicking a `modal` action opens the right
  modal (not an inline confirm / not a direct mutation) and closing clears it.

## Files

**Backend**
- Modify: `app/controllers/compute_njq/api/instances_controller.rb`
  (`update`, `set_tags`, `reset_status` + policy-rule map entries + param permits)
- Modify: `config/routes.rb` (add `update` to resource; members `tags`, `reset_status`)
- Modify: `app/services/service_layer/compute_njq_services/instance_actions.rb`
  (`update_instance`, `set_instance_tags`, `reset_instance_status`)
- Modify: `app/services/service_layer/compute_njq_services/nova.rb`
  (`nova_update_server`, `nova_set_server_tags`)
- Modify: `config/policy.json` (`instance_tags`, `instance_reset_status`)

**Frontend**
- Modify: `apiClient.ts` (+ `.test.ts`) — `updateName`, `setTags`, `resetStatus`
- Modify: `types/instance.ts` — response schemas if needed (all return `{ ok }`)
- Create: `hooks/useUpdateInstanceNameMutation.ts` (+ test)
- Create: `hooks/useSetInstanceTagsMutation.ts` (+ test)
- Create: `hooks/useResetInstanceStatusMutation.ts` (+ test)
- Modify: `routes/instances/-components/instanceActions.ts` (+ test) — add the
  three actions + `modal` field
- Create: `routes/instances/-components/EditNameModal.tsx` (+ test)
- Create: `routes/instances/-components/EditTagsModal.tsx` (+ test)
- Create: `routes/instances/-components/ResetStatusModal.tsx` (+ test)
- Modify: `routes/instances/-components/InstanceActionsMenu.tsx` (+ test) —
  render + wire the modals

## Open questions / risks

- **Tags microversion:** RESOLVED. The plugin runs Nova microversion 2.67
  (`instance_assembler.rb:47`), well above the 2.26 the tags API needs, and
  `instance_detail_assembler.rb:36` already reads `server["tags"]`. The
  `PUT /servers/{id}/tags` write uses the same `elektron_nova` client, so the
  path is available.
- **Edit Tags seeding from the list menu:** the list `Instance` carries no
  tags; the modal seeds from the detail query. Acceptable because the Nova PUT
  replaces the whole set — worst case the user re-sees the current tags after
  the detail loads.
