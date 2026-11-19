# Instance Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (user chose inline execution). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Resize instance operation to `compute_njq` — a modal that changes a server's flavor, plus Confirm/Revert Resize follow-up actions shown only in `verify_resize`.

**Architecture:** Resize is parametrised → dedicated BFF endpoint (`PUT instances/:id/resize`) + service method + apiClient method + `useResizeInstanceMutation` hook + `ResizeModal`, following the modal-mutation pattern of Edit Name. Confirm/Revert take no input → two new entries in the existing `ACTION_BODIES` map, fired through the existing `useInstanceActionMutation` with an `optimisticTransition`. Menu wiring mirrors the three existing edit modals.

**Tech Stack:** Ruby 3.4.8 / Rails 8.1 (RSpec), React 19 / TypeScript 5 / TanStack Query / Zod / Vitest 4.

**Spec:** [docs/compute-njq/instance-resize-design.md](../compute-njq/instance-resize-design.md)

## Global Constraints

- Prettier: 120 cols, 2 spaces, no semicolons, double quotes, ES5 trailing commas. Strict TS, no `any`.
- Ruby: `snake_case`, service methods in the `InstanceActions`/`Nova` modules, controller inherits existing auth via `authorize!`.
- Policy for all three actions: existing `compute_njq:instance_update`. **No new policy.**
- Nova bodies, exact: Resize `{ "resize" => { "flavorRef" => flavor_id } }`; Confirm `{ "confirmResize" => nil }`; Revert `{ "revertResize" => nil }`.
- State strings from the assembler (verified): `active`, `stopped` (shutoff), `verify_resize`.
- apiClient edit methods return `Promise<void>` and call `checkForApiError(res.data)` — match that; do **not** add a new Zod schema for resize.
- Response shape from the BFF is `{ ok: true }`, same as update/set_tags/reset_status.
- Commit after each task (Conventional Commits, scope `compute`, subject not capitalised). Do **not** push.
- Cadence: build all tasks, verify at the end, then the user approves commits/push.

## Review Focus

- **Blank/whitespace flavor** reaching resize → `RequestError`, no Nova call. Pinned in Task 1.
- **Same flavor selected** as current → Resize button stays disabled. Pinned in Task 6.
- **verify_resize visibility** → Resize hidden, Confirm/Revert shown only then. Pinned in Task 5.
- **Menu lock during resize** → optimistic transition keeps the menu disabled until Nova settles (inherited from `useInstanceActionMutation`/`useResizeInstanceMutation` optimistic patch; the hook test in Task 3 pins the patch).

---

### Task 1: Backend — resize service method + confirm/revert action bodies

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`

**Interfaces:**
- Consumes: existing `nova_server_action(id, body)`, `ComputeNjq::RequestError`.
- Produces: `resize_instance(id, flavor_id)` → `{ ok: true }`; `ACTION_BODIES` gains `"confirm_resize"` / `"revert_resize"`, callable via existing `instance_action(id, name)`.

- [ ] **Step 1: Write the failing specs**

Add to `instance_actions_spec.rb` (match the existing `describe`/subject style in that file — the service is mixed into a test double that responds to `nova_server_action`):

```ruby
describe "#resize_instance" do
  it "posts an os-resize with the flavorRef and returns ok" do
    expect(service).to receive(:nova_server_action).with("s1", { "resize" => { "flavorRef" => "f2" } })
    expect(service.resize_instance("s1", "f2")).to eq({ ok: true })
  end

  it "trims the flavor id" do
    expect(service).to receive(:nova_server_action).with("s1", { "resize" => { "flavorRef" => "f2" } })
    service.resize_instance("s1", "  f2  ")
  end

  it "rejects a blank flavor without calling Nova" do
    expect(service).not_to receive(:nova_server_action)
    expect { service.resize_instance("s1", "  ") }.to raise_error(ComputeNjq::RequestError)
    expect { service.resize_instance("s1", nil) }.to raise_error(ComputeNjq::RequestError)
  end
end

describe "#instance_action resize follow-ups" do
  it "maps confirm_resize to confirmResize" do
    expect(service).to receive(:nova_server_action).with("s1", { "confirmResize" => nil })
    expect(service.instance_action("s1", "confirm_resize")).to eq({ ok: true })
  end

  it "maps revert_resize to revertResize" do
    expect(service).to receive(:nova_server_action).with("s1", { "revertResize" => nil })
    expect(service.instance_action("s1", "revert_resize")).to eq({ ok: true })
  end
end
```

(If the existing spec names the subject differently than `service`, use that name — read the top of the file first.)

- [ ] **Step 2: Run to verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`
Expected: FAIL — `resize_instance` undefined; `confirm_resize`/`revert_resize` raise "Unknown instance action".

- [ ] **Step 3: Implement**

Add the two keys to `ACTION_BODIES`:

```ruby
ACTION_BODIES = {
  "stop" => { "os-stop" => nil },
  "reboot" => { "reboot" => { "type" => "SOFT" } },
  "hard_reset" => { "reboot" => { "type" => "HARD" } },
  "pause" => { "pause" => nil },
  "suspend" => { "suspend" => nil },
  "confirm_resize" => { "confirmResize" => nil },
  "revert_resize" => { "revertResize" => nil },
}.freeze
```

Add the method next to `update_instance`/`set_instance_tags`:

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

- [ ] **Step 4: Run to verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb
git commit -m "feat(compute): add resize service method and confirm/revert action bodies for compute_njq"
```

---

### Task 2: Backend — resize controller endpoint + route

**Files:**
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb`
- Modify: `plugins/compute_njq/config/routes.rb`
- Test: (covered by the service spec in Task 1 + the manual/Vitest apiClient test in Task 4; there is no controller request spec in this plugin — confirm by `ls plugins/compute_njq/spec/controllers` and if one exists, add a gating test there in this task's style)

**Interfaces:**
- Consumes: `resize_instance(id, flavor_id)` from Task 1; existing `authorize!`, `handle_api_call`, `compute_service`.
- Produces: `PUT instances/:id/resize` → `{ ok: true }`, gated `compute_njq:instance_update`.

- [ ] **Step 1: Add the route**

In `routes.rb`, inside the `member do` block (after `post :reset_status`):

```ruby
# Resize: change the server's flavor, body { flavor_id: "..." }.
put :resize
```

- [ ] **Step 2: Add the controller action**

In `instances_controller.rb`, after `reset_status` (before `action`):

```ruby
# PUT /:scope/compute-njq/api/instances/:id/resize  (change flavor)
def resize
  return unless authorize!("compute_njq:instance_update")

  handle_api_call { compute_service.resize_instance(params.require(:id), params.require(:flavor_id)) }
end
```

- [ ] **Step 3: Verify it loads (route + controller parse)**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb` (sanity: the suite still loads the engine without route errors)
Expected: PASS. If a controller spec dir exists, run it too.

- [ ] **Step 4: Commit**

```bash
git add plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
        plugins/compute_njq/config/routes.rb
git commit -m "feat(compute): add resize endpoint to compute_njq instances controller"
```

---

### Task 3: Client — apiClient.resizeInstance + useResizeInstanceMutation

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts`
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useResizeInstanceMutation.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useResizeInstanceMutation.test.ts`

**Interfaces:**
- Consumes: existing `apiClient.put`, `checkForApiError`, `QUERY_KEYS`, `Instance` type.
- Produces: `instances.resizeInstance(id, flavorId): Promise<void>`; `useResizeInstanceMutation(api, queryClient)` and `buildResizeMutationOptions(api, queryClient)` with vars `{ id: string; flavorId: string }`.

- [ ] **Step 1: Write the failing apiClient test**

Add to `apiClient.test.ts` (match the existing edit-method tests for `updateName`/`setTags` — they stub the underlying http `put` and assert the URL + body, then `checkForApiError`):

```ts
it("resizeInstance issues PUT instances/:id/resize with the flavor_id", async () => {
  const put = vi.fn().mockResolvedValue({ data: { ok: true } })
  const client = makeClient({ put }) // use the same harness the other edit-method tests use
  await client.instances.resizeInstance("s1", "f2")
  expect(put).toHaveBeenCalledWith("instances/s1/resize", { flavor_id: "f2" })
})
```

(Read the existing `updateName` test first and copy its exact harness — `makeClient`/mock shape may differ.)

- [ ] **Step 2: Write the failing hook test**

Create `useResizeInstanceMutation.test.ts`, mirroring `useUpdateInstanceNameMutation`'s test if one exists, else `useInstanceActionMutation.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { buildResizeMutationOptions } from "./useResizeInstanceMutation"
import { QUERY_KEYS } from "./queryKeys"
import type { ComputeApi } from "../apiClient"

function setup() {
  const resizeInstance = vi.fn().mockResolvedValue(undefined)
  const api = { instances: { resizeInstance } } as unknown as ComputeApi
  const qc = new QueryClient()
  return { api, qc, resizeInstance }
}

describe("buildResizeMutationOptions", () => {
  it("calls resizeInstance with id and flavorId", async () => {
    const { api, qc, resizeInstance } = setup()
    const opts = buildResizeMutationOptions(api, qc)
    await opts.mutationFn!({ id: "s1", flavorId: "f2" })
    expect(resizeInstance).toHaveBeenCalledWith("s1", "f2")
  })

  it("optimistically marks the list row as transitioning and restores on error", async () => {
    const { api, qc } = setup()
    qc.setQueryData(QUERY_KEYS.instances, [
      { id: "s1", status: { state: "active", transition: null, power_state: "Running" } },
    ])
    const opts = buildResizeMutationOptions(api, qc)
    const ctx = await opts.onMutate!({ id: "s1", flavorId: "f2" })
    const patched = qc.getQueryData<any[]>(QUERY_KEYS.instances)!
    expect(patched[0].status.transition).toBe("resize_prep")
    opts.onError!(new Error("x"), { id: "s1", flavorId: "f2" }, ctx as never)
    expect(qc.getQueryData<any[]>(QUERY_KEYS.instances)![0].status.transition).toBeNull()
  })

  it("invalidates instances and instanceDetail on settle", () => {
    const { api, qc } = setup()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const opts = buildResizeMutationOptions(api, qc)
    opts.onSettled!(undefined, null, { id: "s1", flavorId: "f2" }, undefined as never)
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useResizeInstanceMutation.test.ts plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts"`
Expected: FAIL — `resizeInstance` / `buildResizeMutationOptions` undefined.

- [ ] **Step 4: Implement the apiClient method**

In `apiClient.ts`, after `resetStatus` in the `instancesApi` block:

```ts
// Resize: change the server's flavor via the BFF. The BFF answers { ok: true }.
resizeInstance: (id: string, flavorId: string): Promise<void> =>
  apiClient.put<{ data: { ok: true } }>(`instances/${id}/resize`, { flavor_id: flavorId }).then((res) => {
    checkForApiError(res.data)
  }),
```

- [ ] **Step 5: Implement the hook**

Create `useResizeInstanceMutation.ts`:

```ts
import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface ResizeVars {
  id: string
  flavorId: string
}
interface ResizeCtx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component (mirrors useUpdateInstanceNameMutation).
export function buildResizeMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, ResizeVars, ResizeCtx> {
  return {
    mutationFn: ({ id, flavorId }) => api.instances.resizeInstance(id, flavorId),
    onMutate: async ({ id }) => {
      // Mark the row as transitioning so it immediately reads as resizing and
      // the actions menu locks; onSettled reconciles against the real state.
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, status: { ...i.status, transition: "resize_prep" } } : i))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEYS.instances, ctx.previous)
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instanceDetail(vars.id) })
    },
  }
}

export function useResizeInstanceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildResizeMutationOptions(api, queryClient))
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useResizeInstanceMutation.test.ts plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/apiClient.ts \
        plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useResizeInstanceMutation.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useResizeInstanceMutation.test.ts
git commit -m "feat(compute): add resizeInstance apiClient method and mutation hook for compute_njq"
```

---

### Task 4: UI — ResizeModal

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResizeModal.tsx`
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResizeModal.test.tsx`

**Interfaces:**
- Consumes: `useInstanceDetailQuery(apiClient, id)` (current flavor via `.data.flavor` / `.data.specs`), `useFlavorsQuery(apiClient, { enabled })` (catalog), `useResizeInstanceMutation`, `SearchableSelect`, `flavorLabel` from `./flavorGrouping`, `Modal` from `lib/components/Modal`.
- Produces: `ResizeModal({ instance, apiClient, onClose })`.

- [ ] **Step 1: Write the failing test**

Create `ResizeModal.test.tsx`. Mock `useFlavorsQuery` and `useInstanceDetailQuery` the way `CreateInstanceForm.test.tsx` mocks `useFlavorsQuery` (module mock returning a fixed `data`), render inside `QueryClientProvider`, and stub `apiClient.instances.resizeInstance`:

```ts
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import { ResizeModal } from "./ResizeModal"

const flavorData = [
  { id: "f1", name: "m1.small", vcpus: 1, ram: 2048, disk: 20, hypervisor_type: "kvm", is_public: true },
  { id: "f2", name: "m1.large", vcpus: 4, ram: 8192, disk: 80, hypervisor_type: "kvm", is_public: true },
]
vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: flavorData, isLoading: false }),
}))
vi.mock("../../../hooks/useInstanceQueries", () => ({
  useInstanceDetailQuery: () => ({
    data: { id: "s1", name: "web-01", flavor: { id: "f1", name: "m1.small" } },
    isLoading: false,
  }),
}))

function renderModal(resizeInstance = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <ResizeModal
        instance={{ id: "s1", name: "web-01" } as never}
        apiClient={{ instances: { resizeInstance } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { resizeInstance, onClose }
}

describe("ResizeModal", () => {
  it("shows the current flavor read-only", () => {
    renderModal()
    expect(screen.getByText(/m1\.small/)).toBeInTheDocument()
  })

  it("keeps Resize disabled until a different flavor is chosen", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /^resize$/i })).toBeDisabled()
  })

  it("resizes to the chosen flavor and closes", async () => {
    const { resizeInstance, onClose } = renderModal()
    fireEvent.click(screen.getByText(/choose flavor/i))
    fireEvent.click(screen.getByText(/m1\.large/))
    fireEvent.click(screen.getByRole("button", { name: /^resize$/i }))
    await waitFor(() => expect(resizeInstance).toHaveBeenCalledWith("s1", "f2"))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("surfaces a resize error", async () => {
    const resizeInstance = vi.fn().mockRejectedValue(new Error("resize failed"))
    renderModal(resizeInstance)
    fireEvent.click(screen.getByText(/choose flavor/i))
    fireEvent.click(screen.getByText(/m1\.large/))
    fireEvent.click(screen.getByRole("button", { name: /^resize$/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent("resize failed")
  })
})
```

(Confirm the exact mock paths `../../../hooks/useFormOptionQueries` and `../../../hooks/useInstanceQueries` and the SearchableSelect open-trigger text by reading `CreateInstanceForm.test.tsx` — it clicks `getByText("Select a flavor…")`; the ResizeModal uses placeholder "Choose flavor", so the test clicks that.)

- [ ] **Step 2: Run to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResizeModal.test.tsx"`
Expected: FAIL — `ResizeModal` not found.

- [ ] **Step 3: Implement**

Create `ResizeModal.tsx`:

```tsx
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance, Flavor } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useInstanceDetailQuery } from "../../../hooks/useInstanceQueries"
import { useFlavorsQuery } from "../../../hooks/useFormOptionQueries"
import { useResizeInstanceMutation } from "../../../hooks/useResizeInstanceMutation"
import { SearchableSelect } from "./SearchableSelect"
import { flavorLabel } from "./flavorGrouping"

interface ResizeModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

// Resize: pick a new flavor for the server. The current flavor is shown read-only
// and removed from the choices; Resize stays disabled until a different flavor is
// chosen. Mirrors the legacy new_size.html.haml (info callout + "New Flavor").
export function ResizeModal({ instance, apiClient, onClose }: ResizeModalProps) {
  const queryClient = useQueryClient()
  const detail = useInstanceDetailQuery(apiClient, instance.id)
  const flavors = useFlavorsQuery(apiClient, { enabled: true })
  const mutation = useResizeInstanceMutation(apiClient, queryClient)
  const [flavorId, setFlavorId] = useState<string | null>(null)

  const currentId = detail.data?.flavor?.id ?? null
  const currentName = detail.data?.flavor?.name ?? "unknown"
  const choices = (flavors.data ?? []).filter((f) => f.id !== currentId)
  const disabled = !flavorId || flavorId === currentId || mutation.isPending

  const submit = () => {
    if (disabled || !flavorId) return
    mutation.mutate({ id: instance.id, flavorId }, { onSuccess: onClose })
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal" aria-labelledby="resize-title">
      <Modal.Header closeButton>
        <Modal.Title id="resize-title">Resize Instance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-info" role="note">
          Resizing a server is a technically complex operation and might fail for a variety of reasons. In many
          cases a better course of action is to create a new server in the new size and delete the old.
        </div>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="form-group mb-3">
          <label className="form-label">Current Flavor</label>
          <input type="text" className="form-control" value={currentName} disabled readOnly />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="resize-flavor">
            New Flavor
          </label>
          <SearchableSelect<Flavor>
            options={choices}
            value={flavorId}
            onChange={setFlavorId}
            getValue={(f) => f.id}
            getLabel={(f) => flavorLabel(f)}
            placeholder="Choose flavor"
            isLoading={flavors.isLoading}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={submit}>
          {mutation.isPending ? "Resizing…" : "Resize"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
```

Note: `Flavor` is exported from `types/formOptions`, not `types/instance` — fix the import to `import type { Flavor } from "../../../types/formOptions"` and `import type { Instance } from "../../../types/instance"` (verify the exact export path when wiring; `flavorGrouping.ts` imports `Flavor` — copy its import). If `SearchableSelect` requires more props than shown (read its interface), pass the minimum it needs.

- [ ] **Step 4: Run to verify it passes**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResizeModal.test.tsx"`
Expected: PASS. If the SearchableSelect interaction in the test doesn't match the real open/select behaviour, align the test with how `CreateInstanceForm.test.tsx` drives it (same component).

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResizeModal.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResizeModal.test.tsx
git commit -m "feat(compute): add resize modal with flavor select for compute_njq"
```

---

### Task 5: Menu registry — resize / confirm_resize / revert_resize actions

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts`
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts`

**Interfaces:**
- Consumes: `Instance.status.state`, existing `InstanceAction` shape.
- Produces: `InstanceAction["key"]` gains `"resize" | "confirm_resize" | "revert_resize"`; `modal` gains `"resize"`; three entries in `INSTANCE_ACTIONS`.

- [ ] **Step 1: Write the failing tests**

Add to `instanceActions.test.ts` (match the existing `visibleActions` tests — they build an `Instance` and assert on the returned keys):

```ts
it("offers Resize for active or stopped, not while verify_resize", () => {
  const keys = (state: string) =>
    visibleActions({ ...base, status: { state, transition: null, power_state: "Running" } } as Instance, {}).map(
      (a) => a.key
    )
  expect(keys("active")).toContain("resize")
  expect(keys("stopped")).toContain("resize")
  expect(keys("verify_resize")).not.toContain("resize")
})

it("offers Confirm/Revert Resize only while verify_resize", () => {
  const keys = (state: string) =>
    visibleActions({ ...base, status: { state, transition: null, power_state: "Running" } } as Instance, {}).map(
      (a) => a.key
    )
  expect(keys("verify_resize")).toEqual(expect.arrayContaining(["confirm_resize", "revert_resize"]))
  expect(keys("active")).not.toContain("confirm_resize")
  expect(keys("active")).not.toContain("revert_resize")
})

it("exposes the resize modal discriminator", () => {
  const resize = INSTANCE_ACTIONS.find((a) => a.key === "resize")
  expect(resize?.modal).toBe("resize")
})
```

(Use whatever base-instance helper the file already defines; `base`/`INSTANCE_ACTIONS` import names must match the file. The policy mock in that suite already allows all rules, so `instance_update` passes.)

- [ ] **Step 2: Run to verify they fail**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts"`
Expected: FAIL — keys absent.

- [ ] **Step 3: Implement**

In `instanceActions.ts`, extend the unions:

```ts
key:
  | "edit_name"
  | "edit_tags"
  | "resize"
  | "confirm_resize"
  | "revert_resize"
  | "start"
  // ...rest unchanged
```
```ts
modal?: "editName" | "editTags" | "resetStatus" | "resize"
```

Add `resize` into the `power` group (after `hard_reset`, before the lock group — i.e. at the end of the power actions) and `confirm_resize`/`revert_resize` as well:

```ts
{
  key: "resize",
  label: "Resize",
  policy: "compute_njq:instance_update",
  group: "power",
  isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
  modal: "resize",
},
{
  key: "confirm_resize",
  label: "Confirm Resize",
  policy: "compute_njq:instance_update",
  group: "power",
  isAvailable: (i) => i.status.state === "verify_resize",
  optimisticTransition: "resize_confirming",
  confirm: {
    title: "Confirm resize?",
    message: "This keeps the new size and finalizes the resize. The instance stays on the new flavor.",
    ok: "Confirm resize",
  },
},
{
  key: "revert_resize",
  label: "Revert Resize",
  policy: "compute_njq:instance_update",
  group: "power",
  isAvailable: (i) => i.status.state === "verify_resize",
  optimisticTransition: "resize_reverting",
  confirm: {
    title: "Revert resize?",
    message: "This discards the new size and restores the instance to its previous flavor.",
    ok: "Revert resize",
  },
},
```

Place these relative to the existing `power` entries so the divider grouping stays contiguous (all `group: "power"` entries adjacent). Resize sits with the power actions; confirm/revert directly after it.

- [ ] **Step 4: Run to verify they pass**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts
git commit -m "feat(compute): register resize, confirm and revert resize actions in compute_njq menu"
```

---

### Task 6: Menu wiring — open ResizeModal from the action menu

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx`
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx`

**Interfaces:**
- Consumes: `ResizeModal` from Task 4; existing `activeModal` state + `run(a)` path for confirm/revert (they are plain confirm actions, already handled — `run` calls `actionMutation.mutate({ actionName, optimisticTransition })`).
- Produces: `activeModal === "resize"` renders `<ResizeModal …>`.

- [ ] **Step 1: Write the failing test**

Add to `InstanceActionsMenu.test.tsx`, mirroring the existing "opens the Edit Name modal" test. Note the menu now mounts `ResizeModal`, which calls `useInstanceDetailQuery` + `useFlavorsQuery` on open — mock both at the top of the file (module mocks) so the harness's apiClient mock needs no new methods:

```ts
vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: [], isLoading: false }),
}))
// If the suite doesn't already mock useInstanceQueries, add:
vi.mock("../../../hooks/useInstanceQueries", () => ({
  useInstanceDetailQuery: () => ({ data: { flavor: { id: "f1", name: "m1.small" } }, isLoading: false }),
}))
```

```ts
it("opens the Resize modal from the menu instead of firing a mutation", () => {
  renderMenu()
  fireEvent.click(screen.getByRole("button", { name: /actions/i }))
  fireEvent.click(screen.getByText("Resize"))

  expect(document.querySelector(".dropdown-menu.show")).toBeNull()
  expect(confirmMock).not.toHaveBeenCalled()
  expect(action).not.toHaveBeenCalled()
  expect(screen.getByText("Resize Instance", { selector: ".modal-title" })).toBeInTheDocument()
})
```

Check whether the existing divider-grouping test (`separates action groups with dividers`) asserts an exact label sequence — if it does, update that expected array to include `"Resize"` in the power group (after "Hard Reset"), since the default instance is active/unlocked and Resize is now visible. Confirm/Revert stay absent there (not verify_resize).

- [ ] **Step 2: Run to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx"`
Expected: FAIL — modal not rendered (and the label-sequence test fails if it pins the array).

- [ ] **Step 3: Implement**

In `InstanceActionsMenu.tsx`, import and render:

```tsx
import { ResizeModal } from "./ResizeModal"
```
After the `resetStatus` modal block:
```tsx
{activeModal === "resize" && (
  <ResizeModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />
)}
```

No change to `onClick`/`run` — `modal: "resize"` routes through the existing `if (a.modal) { setActiveModal(a.modal); return }`, and confirm/revert (no `modal`, with `confirm`) route through the existing confirm path.

- [ ] **Step 4: Run to verify it passes**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx
git commit -m "feat(compute): wire resize modal into compute_njq action menu"
```

---

### Task 7: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full plugin Vitest**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq"`
Expected: all green.

- [ ] **Step 2: Typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm typecheck"`
Expected: clean except the pre-existing `MultiSelect.test.tsx(70,13)` error.

- [ ] **Step 3: Backend RSpec**

Run: `bin/workspace bundle exec rspec plugins/compute_njq`
Expected: all green.

- [ ] **Step 4: Report**

Summarise results to the user (German), list the 6 feature commits + whether anything needs attention. Do **not** push. Await explicit approval.

## Self-Review

- **Spec coverage:** Resize endpoint/service (T1-T2), apiClient+hook (T3), modal (T4), menu registry incl. confirm/revert (T5), menu wiring (T6), verification (T7). All spec sections covered.
- **Placeholder scan:** none — every step has concrete code or an exact command.
- **Type consistency:** `resize_instance(id, flavor_id)` (T1) ↔ `resizeInstance(id, flavorId)` (T3) ↔ `ResizeVars {id, flavorId}` (T3) ↔ modal `mutation.mutate({ id, flavorId })` (T4). `modal: "resize"` (T5) ↔ `activeModal === "resize"` (T6). Nova bodies identical across spec/T1. `Flavor` imported from `types/formOptions` (flagged in T4).
- **Review Focus:** blank flavor (T1), same flavor disabled (T4/T6), verify_resize visibility (T5), menu lock via optimistic transition (T3). All pinned.
