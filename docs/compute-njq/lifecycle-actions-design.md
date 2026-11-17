# compute_njq — Instance Lifecycle (Power) Actions

**Date:** 2026-11-17
**Branch:** `feat/compute-no-jquery`
**Status:** Design — awaiting review

## Purpose

Add instance lifecycle ("device") operations to the new React/BFF `compute_njq`
plugin, porting the behaviour of the legacy
`plugins/compute/app/views/compute/instances/_item_actions.html.haml` dropdown.

This is **step 1 of 3**, agreed with the user:

1. **Lifecycle (power) actions** — this spec.
2. Simple modals (Edit Name, Reset Status, Confirm/Revert Resize) — later.
3. Complex form modals (Floating IP, Interfaces, Resize, Snapshot, Tags,
   Security Groups) — last.

A secondary goal of step 1 is to establish the **reusable action-registry +
dropdown + confirm infrastructure** that steps 2 and 3 build on.

### In scope (step 1)

`start`, `stop`, `reboot`, `hard_reset`, `pause`, `suspend`, `lock`, `unlock`,
`terminate`.

### Out of scope (step 1)

Web Console, Edit Name/Tags, Floating IP, Interfaces, Resize, Confirm/Revert
Resize, Snapshot, Edit Security Groups, Reset Status. These are steps 2–3 and
must slot into the same registry without rework.

## Legacy analysis (reference)

The legacy dropdown drives every action through three things:

- **Policy gate** — `current_user.is_allowed?("compute:instance_*", { target })`.
- **State gate** — `instance.status`, `instance.power_state`, `instance.locked?`,
  and `os_ext_sts_task_state` (no actions while transitioning).
- **Confirm config** — custom confirm text for destructive/risky actions.

Verified Nova calls (all `POST /servers/{id}/action` unless noted), from
`plugins/compute/app/services/service_layer/compute_services/server.rb` and
`plugins/compute/app/models/compute/server.rb`:

| Action      | Nova body                                   | Notes |
|-------------|---------------------------------------------|-------|
| start       | `{"os-start": null}`                         | if `paused` → `{"unpause": null}`; if `suspended` → `{"resume": null}` |
| stop        | `{"os-stop": null}`                          | |
| reboot      | `{"reboot": {"type": "SOFT"}}`               | |
| hard_reset  | `{"reboot": {"type": "HARD"}}`               | legacy gates behind a confirm form |
| pause       | `{"pause": null}`                            | |
| suspend     | `{"suspend": null}`                          | |
| lock        | PUT metadata `locked=true` **then** `{"lock": null}`   | legacy simulates lock on microversion 2.1 |
| unlock      | `{"unlock": null}` **then** PUT metadata `locked=false`| |
| terminate   | `DELETE /servers/{id}`                       | **not** an `/action` POST |

Legacy policy strictness (`plugins/compute/config/policy.json`):

- start/stop/reboot/pause/suspend/terminate → `rule:instance_actions`
  (`context_is_compute_editor and (not monsoon2_domain or project_parent)`)
- hard_reset → editor, `not monsoon2_domain`
- lock / unlock → `rule:context_is_compute_admin` (**admin-only, stricter**)

Legacy state constants (`power_state`): `RUNNING=1`, `PAUSED=3`,
`SHUT_DOWN=4`, `SHUT_OFF=5`, `SUSPENDED=7`.

## Design decisions (agreed with user)

1. **Policy gating: client-side, via the existing shared policy engine.**
   The repo already ships a client-side engine equivalent to Ruby
   `is_allowed?`:
   - `app/javascript/policy_engine.js` builds `window.policy` from
     `window.policyConfig` (serialized rules + the current user's roles/scope),
     injected by Rails on every page.
   - Components `import { policy } from "lib/policy"` and call
     `policy.isAllowed("compute:instance_update", { target })` synchronously —
     the pattern used by `keymanagerng`, `block_storage`,
     `shared_filesystem_storage`.
   - `compute_njq/app/javascript/widgets/app/init.js` **already** calls
     `widget.setPolicy()`, so `policy` is live in the widget's components.
   This replaces the earlier (rejected) idea of computing `allowed_actions`
   server-side; doing so would duplicate the engine and diverge from every
   other React widget.

2. **State gating stays in the frontend**, separate from policy, mirroring
   legacy (`is_allowed?` vs. the `instance.status` checks). An action shows only
   when **both** the policy gate and the state gate pass, and never while the
   instance is transitioning (`isTransitioning(status)` — `status.transition`
   set, i.e. Nova `OS-EXT-STS:task_state`).

3. **BFF endpoint: one generic action endpoint.**
   `POST /api/instances/:id/action` with body `{ action_name: "start" | ... }`,
   plus `DELETE /api/instances/:id` for terminate. The controller validates
   `action_name` against a whitelist. Avoids per-action routing/controller
   boilerplate and matches the data-driven registry.

4. **Confirm UI: like legacy.** Terminate, Hard Reset, Stop, Reboot, Pause,
   Suspend, Lock, Unlock open a confirm dialog with the legacy custom text.
   Start runs without confirmation.

5. **UI placement (step 1): table only.** The `InstanceActionsMenu` dropdown +
   action registry are rendered **only** in the `InstanceTable` row actions
   column (the reserved empty `<td className="snug"/>`). The detail-modal footer
   is explicitly deferred to a later step — but the menu + registry are built so
   that dropping them into `InstanceModal` later needs no rework.

## Architecture

### Core abstraction — the action registry

Each operation is a descriptor; the UI renders the registry generically.

```ts
type InstanceActionKey =
  | "start" | "stop" | "reboot" | "hard_reset"
  | "pause" | "suspend" | "lock" | "unlock" | "terminate"

type InstanceAction = {
  key: InstanceActionKey
  label: string
  policy: string                          // e.g. "compute_njq:instance_update"
  isAvailable: (i: Instance) => boolean   // state gate
  confirm?: { message: string; ok: string }
  destructive?: boolean
  // Synthetic Nova task_state applied optimistically on click so the row shows
  // a spinner immediately (before Nova reports the real task_state). Mirrors
  // legacy `target_state_for_action`/`task_state` labels, e.g. start →
  // "powering-on", stop → "powering-off", reboot → "rebooting",
  // terminate → "deleting".
  optimisticTransition?: string
}
```

Visibility helper (used by both table and modal):

```ts
function visibleActions(instance, policyEngine, scope): InstanceAction[]
// filters REGISTRY by:
//   !isTransitioning(instance.status)
//   && action.isAvailable(instance)
//   && policyEngine.isAllowed(action.policy, { target: scope })
```

State gates (from `status.state` / `status.power_state` / `locked`):

- **start** — available when power is Paused/Suspended/Shut off/Shut down
  (the legacy `[SUSPENDED, PAUSED, SHUT_DOWN, SHUT_OFF]` set); the BFF picks
  os-start vs unpause vs resume.
- **stop / reboot / pause / suspend / hard_reset** — available when power is
  Running.
- **lock** — when `!locked`; **unlock** — when `locked`.
- **terminate** — available unless transitioning.

### Backend / BFF

Files to touch in `plugins/compute_njq`:

- `config/routes.rb` — add `member { post :action }` and `:destroy` to
  `resources :instances`.
- `app/controllers/compute_njq/api/instances_controller.rb` — add:
  - `action` — reads `params[:action_name]`, validates against the whitelist,
    calls the matching service method, all inside `handle_api_call { ... }`.
  - `destroy` — calls terminate via `handle_api_call`.
- `app/services/service_layer/compute_njq_services/nova.rb` — add thin wrappers
  for `POST servers/{id}/action` with the bodies in the table above, plus the
  metadata PUT for lock/unlock and a server delete for terminate.
- `app/services/service_layer/compute_njq_service.rb` /
  `compute_njq_services/*` — add the high-level methods the controller calls
  (`instance_action(id, action_name)`, `terminate_instance(id)`), including the
  start → os-start/unpause/resume branching and the lock/unlock two-step
  sequence.
- `app/services/service_layer/compute_njq_services/instance_assembler.rb` and
  `instance_detail_assembler.rb` — add `locked: server["locked"]` (Nova
  microversion is 2.67, so `locked` is native).
- `config/policy.json` — add:
  - `compute_njq:instance_update` → `rule:instance_actions`
  - `compute_njq:instance_delete` → `rule:instance_actions`
  - `compute_njq:instance_hard_reset` → editor, not monsoon2_domain
  - `compute_njq:instance_lock` / `compute_njq:instance_unlock`
    → `rule:context_is_compute_admin` (stricter)

Whitelist maps `action_name` → Nova verb; unknown names return the standard
error envelope with a 4xx status.

### Frontend

Files to add/touch in
`plugins/compute_njq/app/javascript/widgets/app`:

- `types/instance.ts` — add `locked: boolean` to `InstanceSchema` and
  `InstanceDetailSchema`.
- `types/lib.d.ts` — add `declare module "lib/policy"` (4 lines from core
  `app/javascript/types/global.d.ts`) so TS knows `policy.isAllowed`.
- `apiClient.ts` — add `instances.action(id, actionName)` →
  `apiClient.post("instances/${id}/action", { action_name })` and
  `instances.terminate(id)` → `apiClient.delete("instances/${id}")`; validate
  responses with Zod.
- `hooks/useInstanceActionMutation.ts` — generic mutation hook
  `(api, queryClient)` mirroring `useCreateInstanceMutation`, with optimistic
  transition (see "Transition display" below): `onMutate` patches the row,
  `onError` rolls back, `onSettled` invalidates `QUERY_KEYS.instances` +
  `QUERY_KEYS.instanceDetail(id)`.
- `hooks/useTerminateInstanceMutation.ts` — same shape for delete
  (optimistic `transition: "deleting"`).
- `routes/instances/-components/instanceActions.ts` — the registry + gating
  helpers (`visibleActions`, `isAvailable` per action).
- `routes/instances/-components/InstanceActionsMenu.tsx` — the dropdown
  component (none exists in the plugin yet; built from the `lib/components`
  primitives + Juno, styled after legacy). Handles click → optional confirm
  dialog (`lib/components/Modal`) → mutation; shows `mutation.isError` /
  `mutation.error` inline. Reusable, so a later step can drop it into
  `InstanceModal` unchanged.
- `routes/instances/-components/InstanceTable.tsx` — render
  `<InstanceActionsMenu instance=... />` in the reserved `<td className="snug"/>`.

Deferred (not in step 1): `InstanceModal` footer actions — see "Deferred:
detail-modal actions" below.

### Confirm is presentation-agnostic

The registry only carries `confirm: { message, ok }` (the *what*). *How* the
confirmation is shown depends on the caller's context, so the same registry
works in both places without rework:

- **Table (step 1):** no modal is open, so confirm renders as a normal `Modal`
  (single backdrop).
- **Detail modal (deferred):** a modal is already open. A second stacked `Modal`
  is an anti-pattern — the `Modal` primitive portals its own `.modal-backdrop`
  to `document.body`, toggles `body.modal-open`, and listens for `Escape`
  (`Modal.tsx:143,151,186`); two instances mean a double backdrop and an
  ambiguous Escape. Therefore the detail modal renders the confirmation
  **inline** (a confirm bar in the footer / a replaced body region:
  "Reboot? [Yes, reboot it] [Cancel]") — one backdrop, one Escape context.

`InstanceActionsMenu` takes the confirm renderer as a prop/strategy (default =
`Modal`), so the detail step can pass an inline renderer later.

### Data flow

1. User opens the actions dropdown on a table row.
2. `visibleActions` filters the registry by transition state + per-action state
   gate + `policy.isAllowed`.
3. Click → if `action.confirm`, open confirm dialog with legacy text; else run
   immediately.
4. Mutation calls `POST /api/instances/:id/action` (or `DELETE`), wrapped in
   `handle_api_call`.
5. On click (`onMutate`) the row is patched optimistically to its
   `optimisticTransition` task_state, so `StatusPill` shows a spinner + label
   immediately. On error the patch is rolled back; `onSettled` invalidates the
   instances + detail queries, after which the real Nova task_state and the
   existing 15s poll-while-transitioning behaviour take over until the server
   settles.

### Transition display (how in-progress actions look in the list)

The plugin already renders transitions and polls for them; step 1 reuses this
and only adds the optimistic head-start.

- **`StatusPill`** (`StatusPill.tsx:53-62`): when `status.transition` (Nova
  `OS-EXT-STS:task_state`) is set, it renders a single capsule — spinner +
  status label + the in-flight action in muted text (e.g. `Active · Rebooting`).
  Nothing to change here.
- **Polling**: `useInstancesQuery` refetches every 15s while any row
  `isTransitioning`, and stops automatically when Nova clears the task_state
  (`useInstanceQueries.ts:17-20`). Nothing to change here.
- **Optimistic head-start** (the only new piece): the action mutation's
  `onMutate` writes `status.transition = action.optimisticTransition` onto the
  affected row in the `QUERY_KEYS.instances` cache (saving the previous value in
  the mutation context). The spinner + label appear the instant the user
  clicks — no legacy-style `sleep 2`. `onError` restores the saved value;
  `onSettled` invalidates so the authoritative Nova task_state replaces the
  synthetic one and polling drives it to completion.
- The synthetic label per action lives on the registry descriptor
  (`optimisticTransition`), using legacy `task_state` wording as the source of
  truth (start → "powering-on", stop → "powering-off", reboot/hard_reset →
  "rebooting", pause → "pausing", suspend → "suspending", terminate →
  "deleting"; lock/unlock have no Nova task_state, so they use no optimistic
  transition and rely on `onSettled` invalidation).

**Scroll position is preserved — no extra work needed.** When a poll (or a
post-action refetch) replaces the whole list, the user's scroll position and the
acted-on row stay put, because:

- Rows use a stable `key={instance.id}` (`InstanceTable.tsx:213`), so a changed
  instance re-renders **in place** (no unmount/remount of the table).
- A lifecycle action changes no sort key — sorting is client-side over
  name/az/os/created, **not status**, and defaults to the backend order
  (`InstanceTable.tsx:167-177`). So a status change never reorders the row.
  (Only if the user has *explicitly* sorted by the Status column would the row
  move — their deliberate choice.)
- Background refetches set `isFetching`, not `isLoading`, so the table never
  flips to `SkeletonRows` on a poll — no reload flicker.

This behaviour already holds today for ordinary polling; lifecycle actions just
feed into it. (Caveat: this relies on the table rendering all rows — if
virtualisation/pagination is added later, scroll preservation must be revisited.
Not in step 1.)

### Error handling

- BFF: every path goes through `handle_api_call`, producing the uniform
  `{ error, code, message }` envelope + matching HTTP status.
- Frontend: `checkForApiError` throws on that envelope; the dropdown/confirm
  dialog shows `mutation.error.message`, matching how `CreateInstanceForm`
  handles `mutation.isError`.

### Deferred: detail-modal actions (later step — architecture locked now)

Actions from the detail modal are a later step, but the hooks/registry are built
now so it needs no rework:

- **Keep the modal open; show the transition inline.** The detail modal is a
  **route** (`instances/$id.tsx`), not bound to query state — it stays open
  until the user navigates away. `useInstanceDetailQuery` polls every 10s while
  `isTransitioning` (`useInstanceQueries.ts:81-83`), so the status updates live
  inside the open modal. Mutations must therefore patch **both** caches
  optimistically: `QUERY_KEYS.instances` (the row) **and**
  `QUERY_KEYS.instanceDetail(id)` (the modal). The mutation hooks are written to
  accept both from the start.
- **Polling never closes the modal.** A refetch — success or error — does not
  change the route. So every action keeps the modal open *except* terminate.
- **Terminate is the exception.** After delete, `getInstanceDetail(id)` 404s;
  polling will not close the modal, so terminate must **actively navigate** away
  (`onSuccess` → `navigate({ to: "/instances" })`, or close on a not-found
  detail). Build terminate's mutation with this close-on-success path.
- **Confirm inline, not modal-in-modal** — see "Confirm is presentation-
  agnostic" above.
- **Actions that need their own form modal are NOT offered from the detail
  modal.** Not relevant in step 1 (lifecycle ops only need a confirm, which we
  render inline). But from step 2 onward, actions with their own modal — Edit
  Name, Reset Status (step 2); Floating IP, Interfaces, Resize, Snapshot, Tags,
  Security Groups (step 3) — must **not** open a second modal on top of the open
  detail modal (the stacked-`Modal` anti-pattern). Options for those, decided
  per action when we get there: offer them only from the table row menu, render
  their form inline inside the detail modal, or close the detail modal first and
  open the form modal. Keep this constraint in mind when designing steps 2–3.

## Testing

**RSpec:**
- Controller spec for `action`: whitelist acceptance/rejection, each
  `action_name` → correct service call, error envelope on unknown action and on
  backend error; `destroy` → terminate.
- Service specs: each Nova body is correct (os-start/os-stop/reboot SOFT & HARD,
  pause, suspend, lock/unlock two-step, start branching for paused/suspended),
  terminate issues `DELETE`.

**Vitest:**
- `instanceActions` registry: `isAvailable` per power/lock/transition state.
- `visibleActions`: filtered by both gates (mock `policy.isAllowed` + states).
- `InstanceActionsMenu`: renders only allowed+available actions; confirm dialog
  appears for configured actions with correct text; start skips confirm;
  mutation error renders.
- Mutation hooks: call the right api method; `onMutate` patches the row's
  `status.transition` to the action's `optimisticTransition`; `onError` rolls
  the row back to the saved value; `onSettled` invalidates the right query keys.

## Open questions / risks

- **`locked` field presence.** Confirm Nova at microversion 2.67 returns
  `locked` on list + detail; the assemblers must default to `false` if absent so
  lock/unlock gating stays correct.
- **Confirm dialog component.** The plugin has no dropdown/confirm primitive
  yet; `InstanceActionsMenu` introduces the first one. Keep it small and
  reusable since steps 2–3 depend on it.
