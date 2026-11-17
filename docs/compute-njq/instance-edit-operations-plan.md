# Instance Edit Operations (Edit Name, Edit Tags, Reset Status) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the first three modal/form-based instance operations — Edit Name, Edit Tags, Reset Status — into `compute_njq`, establishing the reusable modal-mutation pattern.

**Architecture:** Each operation = one thin policy-gated BFF member endpoint (controller → service module → raw Nova call) + one `apiClient` method + one TanStack `useMutation` hook (extracted `build…Options` factory, unit-tested directly) + one `lib/components/Modal` component opened from `InstanceActionsMenu`. Defense-in-depth: the same policy rule gates the client menu item (`visibleActions`) and the server (`authorize!`).

**Tech Stack:** Ruby 3.4.8 / Rails 8.1 (RSpec), React 19 / TypeScript 5, TanStack Query, Zod, Vitest 4, Bootstrap 5.3.8.

**Spec:** [docs/compute-njq/instance-edit-operations-design.md](../../compute-njq/instance-edit-operations-design.md)

## Global Constraints

- Nova runs at microversion **2.67** — tags API (≥2.26) and `os-resetState` are available.
- Prettier: 120 cols, 2 spaces, no semicolons, double quotes. Strict TS, no `any`.
- Commits: Conventional Commits, scope `compute`, subject lowercase. **Never commit/push without explicit user permission.**
- Policy rules are defense-in-depth: every operation gated on BOTH client (`visibleActions` via `isAllowed`, fail-closed) AND server (`authorize!`).
- Backend tests run `docker exec elektra bash -c "cd /app && bundle exec rspec <path>"`; JS tests `docker exec elektra bash -c "cd /app && pnpm vitest run <path>"`; typecheck `pnpm typecheck` (pre-existing unrelated error: `MultiSelect.test.tsx(70,13) TS2322`).
- All three actions remain subject to `visibleActions`: hidden while transitioning, and hidden on a locked instance (only unlock shows when locked).

## Review Focus

- **Reset Status with an invalid state** (e.g. client sends `"deleted"`): service must raise `RequestError`, not forward an arbitrary state to Nova. — covered in Task 3.
- **Edit Tags replacing with an empty list** (clear all tags): `PUT /servers/{id}/tags` with `{tags:[]}` must be allowed and clear tags, not rejected. — covered in Task 2.
- **Edit Name with whitespace-only / unchanged name**: Save disabled (no pointless Nova call). — covered in Task 5.
- **A non-admin reaching reset_status**: server `authorize!` returns 403 even though the client hid the item. — covered in Task 3 (controller) / policy.
- **Tag chip duplicates / whitespace**: adding "web" twice or " web " must dedupe/trim to one chip. — covered in Task 6.

---

## Task 1: Backend — Edit Name (service + Nova + controller + route)

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb`
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb`
- Modify: `plugins/compute_njq/config/routes.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`

**Interfaces:**
- Produces: `update_instance(id, name) -> { ok: true }` (service); `nova_update_server(id, attrs) -> Hash` (nova); route `PATCH/PUT /:scope/compute-njq/api/instances/:id` → `InstancesController#update`.

- [ ] **Step 1: Write the failing service test**

In `instance_actions_spec.rb`, add:

```ruby
describe "#update_instance" do
  it "renames the server via nova_update_server" do
    expect(test_class).to receive(:nova_update_server).with("s1", { "name" => "web-02" })
    expect(test_class.update_instance("s1", "web-02")).to eq({ ok: true })
  end

  it "raises when the name is blank" do
    expect { test_class.update_instance("s1", "  ") }.to raise_error(ComputeNjq::RequestError)
  end
end
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb -e update_instance"`
Expected: FAIL (`update_instance` undefined).

- [ ] **Step 3: Add `nova_update_server` to `nova.rb`**

```ruby
# Updates mutable server attributes (currently just name) via Nova's
# PUT /servers/{id}, which expects the attrs wrapped under "server".
def nova_update_server(id, attrs)
  elektron_nova.put("servers/#{id}") { { server: attrs } }.body["server"]
end
```

- [ ] **Step 4: Add `update_instance` to `instance_actions.rb`**

Inside the module (alongside `terminate_instance`):

```ruby
def update_instance(id, name)
  name = name.to_s.strip
  raise ComputeNjq::RequestError, "Name must not be blank" if name.empty?

  nova_update_server(id, { "name" => name })
  { ok: true }
end
```

- [ ] **Step 5: Run the service test — expect PASS**

Run: same as Step 2. Expected: PASS.

- [ ] **Step 6: Add a nova_spec test for `nova_update_server`**

In `nova_spec.rb`, mirroring its existing style:

```ruby
describe "#nova_update_server" do
  it "PUTs the attrs wrapped under server and returns the server body" do
    allow(elektron_nova).to receive(:put).with("servers/s1").and_yield.and_return(
      double("response", body: { "server" => { "id" => "s1", "name" => "web-02" } })
    )
    expect(test_class.nova_update_server("s1", { "name" => "web-02" })["name"]).to eq("web-02")
  end
end
```

(If `nova_spec.rb`'s `put` mock style differs, match the file's existing `and_yield`/body-double convention exactly — read the file first.)

- [ ] **Step 7: Run nova_spec — expect PASS**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb -e nova_update_server"`
Expected: PASS.

- [ ] **Step 8: Wire the controller `update` + route**

In `routes.rb`, change the resource line to include update:
```ruby
resources :instances, only: %i[index show create update destroy] do
```

In `instances_controller.rb`, add the action and a param permit:
```ruby
# PATCH/PUT /:scope/compute-njq/api/instances/:id  (edit name)
def update
  return unless authorize!("compute_njq:instance_update")

  handle_api_call { compute_service.update_instance(params.require(:id), update_params[:name]) }
end
```
and in the private section:
```ruby
def update_params
  params.require(:instance).permit(:name).to_h.symbolize_keys
end
```

- [ ] **Step 9: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb \
  plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb \
  plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
  plugins/compute_njq/config/routes.rb \
  plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb \
  plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb
git commit -m "feat(compute): add compute_njq BFF endpoint to rename an instance"
```

---

## Task 2: Backend — Edit Tags (service + Nova + controller + route + policy)

**Files:**
- Modify: `nova.rb`, `instance_actions.rb`, `instances_controller.rb`, `config/routes.rb`, `config/policy.json`
- Test: `instance_actions_spec.rb`, `nova_spec.rb`

**Interfaces:**
- Produces: `set_instance_tags(id, tags) -> { ok: true }`; `nova_set_server_tags(id, tags) -> Hash`; route `PUT /:scope/compute-njq/api/instances/:id/tags` → `#set_tags`; policy `compute_njq:instance_tags`.

- [ ] **Step 1: Write the failing service test**

```ruby
describe "#set_instance_tags" do
  it "replaces the whole tag set via nova_set_server_tags" do
    expect(test_class).to receive(:nova_set_server_tags).with("s1", ["web", "prod"])
    expect(test_class.set_instance_tags("s1", ["web", "prod"])).to eq({ ok: true })
  end

  it "trims, drops blanks, and dedupes" do
    expect(test_class).to receive(:nova_set_server_tags).with("s1", ["web", "prod"])
    test_class.set_instance_tags("s1", [" web ", "web", "", "prod"])
  end

  it "allows clearing all tags with an empty list" do
    expect(test_class).to receive(:nova_set_server_tags).with("s1", [])
    test_class.set_instance_tags("s1", [])
  end
end
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb -e set_instance_tags"`
Expected: FAIL (`set_instance_tags` undefined).

- [ ] **Step 3: Add `nova_set_server_tags` to `nova.rb`**

```ruby
# Replaces the complete tag set (Nova PUT /servers/{id}/tags, microversion
# 2.26+). Nova echoes the resulting {"tags":[...]}.
def nova_set_server_tags(id, tags)
  elektron_nova.put("servers/#{id}/tags") { { "tags" => tags } }.body
end
```

- [ ] **Step 4: Add `set_instance_tags` to `instance_actions.rb`**

```ruby
def set_instance_tags(id, tags)
  clean = Array(tags).map { |t| t.to_s.strip }.reject(&:empty?).uniq
  nova_set_server_tags(id, clean)
  { ok: true }
end
```

- [ ] **Step 5: Run the service test — expect PASS**

Run: same as Step 2. Expected: PASS (all three).

- [ ] **Step 6: Add a nova_spec test for `nova_set_server_tags`** (mirror nova_spec's put-with-body convention; assert it PUTs `servers/s1/tags` with `{ "tags" => ["a"] }`).

- [ ] **Step 7: Run nova_spec — expect PASS.**

- [ ] **Step 8: Wire controller `set_tags` + route + policy**

`routes.rb` member block:
```ruby
put :tags, action: :set_tags
```

`instances_controller.rb`:
```ruby
# PUT /:scope/compute-njq/api/instances/:id/tags  (replace the tag set)
def set_tags
  return unless authorize!("compute_njq:instance_tags")

  handle_api_call { compute_service.set_instance_tags(params.require(:id), tags_params) }
end
```
private:
```ruby
def tags_params
  params.permit(tags: []).to_h.fetch(:tags, [])
end
```

`config/policy.json` — add after `instance_update`:
```json
"compute_njq:instance_tags": "rule:instance_actions",
```

- [ ] **Step 9: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb \
  plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb \
  plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
  plugins/compute_njq/config/routes.rb plugins/compute_njq/config/policy.json \
  plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb \
  plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb
git commit -m "feat(compute): add compute_njq BFF endpoint to edit instance tags"
```

---

## Task 3: Backend — Reset Status (service + controller + route + policy)

**Files:**
- Modify: `instance_actions.rb`, `instances_controller.rb`, `config/routes.rb`, `config/policy.json`
- Test: `instance_actions_spec.rb`

**Interfaces:**
- Produces: `reset_instance_status(id, state) -> { ok: true }`; route `POST /:scope/compute-njq/api/instances/:id/reset_status` → `#reset_status`; policy `compute_njq:instance_reset_status` (admin).

- [ ] **Step 1: Write the failing service test**

```ruby
describe "#reset_instance_status" do
  it "resets to active via os-resetState" do
    expect(test_class).to receive(:nova_server_action).with("s1", { "os-resetState" => { "state" => "active" } })
    expect(test_class.reset_instance_status("s1", "active")).to eq({ ok: true })
  end

  it "resets to error via os-resetState" do
    expect(test_class).to receive(:nova_server_action).with("s1", { "os-resetState" => { "state" => "error" } })
    test_class.reset_instance_status("s1", "error")
  end

  it "rejects any state other than active/error" do
    expect { test_class.reset_instance_status("s1", "deleted") }.to raise_error(ComputeNjq::RequestError)
  end
end
```

- [ ] **Step 2: Run it — expect FAIL.**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb -e reset_instance_status"`

- [ ] **Step 3: Add `reset_instance_status` to `instance_actions.rb`**

```ruby
RESET_STATES = %w[active error].freeze

def reset_instance_status(id, state)
  unless RESET_STATES.include?(state)
    raise ComputeNjq::RequestError, "Invalid reset state: #{state}"
  end

  nova_server_action(id, { "os-resetState" => { "state" => state } })
  { ok: true }
end
```

(Place `RESET_STATES` near the top of the module, next to `ACTION_BODIES`.)

- [ ] **Step 4: Run the service test — expect PASS.**

- [ ] **Step 5: Wire controller `reset_status` + route + policy**

`routes.rb` member block:
```ruby
post :reset_status
```

`instances_controller.rb`:
```ruby
# POST /:scope/compute-njq/api/instances/:id/reset_status  (admin recovery)
def reset_status
  return unless authorize!("compute_njq:instance_reset_status")

  handle_api_call { compute_service.reset_instance_status(params.require(:id), params.require(:state)) }
end
```

`config/policy.json`:
```json
"compute_njq:instance_reset_status": "rule:context_is_compute_admin",
```

- [ ] **Step 6: Run the full compute_njq RSpec suite — expect PASS**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec"`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb \
  plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
  plugins/compute_njq/config/routes.rb plugins/compute_njq/config/policy.json \
  plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb
git commit -m "feat(compute): add admin-only compute_njq BFF endpoint to reset instance status"
```

---

## Task 4: Client — apiClient methods

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`

**Interfaces:**
- Produces: `instances.updateName(id, name) -> Promise<void>`, `instances.setTags(id, tags) -> Promise<void>`, `instances.resetStatus(id, state) -> Promise<void>`. All POST/PUT/PATCH `{data:{ok:true}}`, only `checkForApiError` run (no schema to parse).

- [ ] **Step 1: Write failing apiClient tests** (mirror the existing `action`/`terminate` tests — mock `createAjaxHelper`, assert the right verb/path/body and that an error envelope throws). Example for one:

```ts
it("updateName PATCHes the instance with the new name", async () => {
  const put = vi.fn().mockResolvedValue({ data: { ok: true } })
  // ...wire the ajax mock so apiClient.patch -> put (match existing test harness)...
  await api.instances.updateName("s1", "web-02")
  expect(put).toHaveBeenCalledWith("instances/s1", { instance: { name: "web-02" } })
})
```

(Read `apiClient.test.ts` first to copy its exact mock wiring; add analogous tests for `setTags` → `PUT instances/s1/tags {tags}` and `resetStatus` → `POST instances/s1/reset_status {state}`, plus one error-envelope-throws test.)

- [ ] **Step 2: Run — expect FAIL** (`updateName` undefined).

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts"`

- [ ] **Step 3: Implement the three methods in `instanceApi`**

```ts
updateName: (id: string, name: string): Promise<void> =>
  apiClient.patch<{ data: { ok: true } }>(`instances/${id}`, { instance: { name } }).then((res) => {
    checkForApiError(res.data)
  }),

setTags: (id: string, tags: string[]): Promise<void> =>
  apiClient.put<{ data: { ok: true } }>(`instances/${id}/tags`, { tags }).then((res) => {
    checkForApiError(res.data)
  }),

resetStatus: (id: string, state: string): Promise<void> =>
  apiClient.post<{ data: { ok: true } }>(`instances/${id}/reset_status`, { state }).then((res) => {
    checkForApiError(res.data)
  }),
```

(If `createAjaxHelper` has no `patch`, use `put` for updateName and change the route to accept PUT — Rails `update` accepts both; prefer `put` if `patch` is unavailable. Verify against `lib/ajax_helper` before implementing.)

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/apiClient.ts \
  plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts
git commit -m "feat(compute): add compute_njq client methods for rename/tags/reset-status"
```

---

## Task 5: Hook + Modal — Edit Name

**Files:**
- Create: `hooks/useUpdateInstanceNameMutation.ts` + `.test.ts`
- Create: `routes/instances/-components/EditNameModal.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: `api.instances.updateName` (Task 4), `QUERY_KEYS.instances`/`instanceDetail`.
- Produces: `buildUpdateNameMutationOptions(api, qc)` + `useUpdateInstanceNameMutation(api, qc)`; `<EditNameModal instance apiClient onClose />`.

- [ ] **Step 1: Write failing hook test** (mirror `useInstanceActionMutation.test.ts` — exercise the factory callbacks directly):

```ts
it("onMutate patches the row name and onError restores it", async () => {
  const qc = new QueryClient()
  seedList(qc) // id s1, name "x"
  const api = { instances: { updateName: vi.fn() } } as never
  const opts = buildUpdateNameMutationOptions(api, qc)
  const ctx = await opts.onMutate!({ id: "s1", name: "web-02" })
  expect(rows(qc)[0].name).toBe("web-02")
  opts.onError!(new Error("boom"), { id: "s1", name: "web-02" }, ctx)
  expect(rows(qc)[0].name).toBe("x")
})
```

- [ ] **Step 2: Run — expect FAIL.**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useUpdateInstanceNameMutation.test.ts"`

- [ ] **Step 3: Implement the hook** (copy the `useTerminateInstanceMutation.ts` structure):

```ts
export interface UpdateNameVars { id: string; name: string }
interface Ctx { previous?: Instance[] }

export function buildUpdateNameMutationOptions(api: ComputeApi, queryClient: QueryClient): UseMutationOptions<void, Error, UpdateNameVars, Ctx> {
  return {
    mutationFn: ({ id, name }) => api.instances.updateName(id, name),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, name } : i))
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) queryClient.setQueryData(QUERY_KEYS.instances, ctx.previous) },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instanceDetail(vars.id) })
    },
  }
}
export function useUpdateInstanceNameMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildUpdateNameMutationOptions(api, queryClient))
}
```

- [ ] **Step 4: Run hook test — expect PASS.**

- [ ] **Step 5: Write failing modal test**

```tsx
it("saves the trimmed new name and closes", async () => {
  const onClose = vi.fn()
  const updateName = vi.fn().mockResolvedValue(undefined)
  renderModal({ updateName, onClose }) // instance name "web-01"
  const input = screen.getByLabelText(/name/i)
  fireEvent.change(input, { target: { value: " web-02 " } })
  fireEvent.click(screen.getByRole("button", { name: /save/i }))
  await waitFor(() => expect(updateName).toHaveBeenCalledWith("s1", "web-02"))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

it("disables Save when the name is empty or unchanged", () => {
  renderModal() // "web-01"
  const save = screen.getByRole("button", { name: /save/i })
  expect(save).toBeDisabled() // unchanged
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "   " } })
  expect(save).toBeDisabled() // whitespace only
})
```

(Define `renderModal` wrapping `<QueryClientProvider>` + `<EditNameModal>`, with an `apiClient` whose `instances.updateName` is the mock; mock `lib/policy` as other tests do.)

- [ ] **Step 6: Run — expect FAIL.**

- [ ] **Step 7: Implement `EditNameModal.tsx`**

Compound `Modal` (show, onHide=onClose, Header/Title/Body/Footer). Local `value` state seeded from `instance.name`; `const trimmed = value.trim()`; Save `disabled={!trimmed || trimmed === instance.name || mutation.isPending}`; on Save → `mutation.mutate({ id: instance.id, name: trimmed }, { onSuccess: onClose })`. Inline error from `mutation.error`. Use `useQueryClient()` + `useUpdateInstanceNameMutation`.

- [ ] **Step 8: Run modal + hook tests — expect PASS.**

- [ ] **Step 9: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/hooks/useUpdateInstanceNameMutation.ts \
  plugins/compute_njq/app/javascript/widgets/app/hooks/useUpdateInstanceNameMutation.test.ts \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/EditNameModal.tsx \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/EditNameModal.test.tsx
git commit -m "feat(compute): add Edit Name modal and mutation for compute_njq instances"
```

---

## Task 6: Hook + Modal — Edit Tags

**Files:**
- Create: `hooks/useSetInstanceTagsMutation.ts` + `.test.ts`
- Create: `routes/instances/-components/EditTagsModal.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: `api.instances.setTags` (Task 4); `useInstanceDetailQuery` for seeding; `QUERY_KEYS.instanceDetail`.
- Produces: `buildSetTagsMutationOptions`/`useSetInstanceTagsMutation`; `<EditTagsModal instance apiClient onClose />`.

- [ ] **Step 1: Write failing hook test** — tags live on `InstanceDetail`, so the optimistic patch targets `QUERY_KEYS.instanceDetail(id)`:

```ts
it("onMutate patches detail tags and onError restores them", async () => {
  const qc = new QueryClient()
  qc.setQueryData(QUERY_KEYS.instanceDetail("s1"), { id: "s1", tags: ["old"] })
  const api = { instances: { setTags: vi.fn() } } as never
  const opts = buildSetTagsMutationOptions(api, qc)
  const ctx = await opts.onMutate!({ id: "s1", tags: ["web", "prod"] })
  expect(qc.getQueryData<any>(QUERY_KEYS.instanceDetail("s1")).tags).toEqual(["web", "prod"])
  opts.onError!(new Error("x"), { id: "s1", tags: ["web", "prod"] }, ctx)
  expect(qc.getQueryData<any>(QUERY_KEYS.instanceDetail("s1")).tags).toEqual(["old"])
})
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement the hook** — same factory shape; `onMutate` cancels + snapshots `instanceDetail(id)`, patches `{ ...detail, tags }`; `onError` restores; `onSettled` invalidates `instances` + `instanceDetail(id)`.

- [ ] **Step 4: Run hook test — expect PASS.**

- [ ] **Step 5: Write failing modal test** (chip behaviour):

```tsx
it("adds, dedupes, trims and removes tag chips, then saves the full list", async () => {
  const setTags = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  renderModal({ setTags, onClose, tags: ["web"] })
  const input = screen.getByLabelText(/add tag/i)
  fireEvent.change(input, { target: { value: " web " } })
  fireEvent.keyDown(input, { key: "Enter" })            // duplicate -> ignored
  fireEvent.change(input, { target: { value: "prod" } })
  fireEvent.keyDown(input, { key: "Enter" })
  expect(screen.getAllByTestId("tag-chip")).toHaveLength(2) // web, prod
  fireEvent.click(screen.getByRole("button", { name: /remove web/i }))
  fireEvent.click(screen.getByRole("button", { name: /save/i }))
  await waitFor(() => expect(setTags).toHaveBeenCalledWith("s1", ["prod"]))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

it("allows saving an empty tag list to clear all tags", async () => {
  const setTags = vi.fn().mockResolvedValue(undefined)
  renderModal({ setTags, tags: ["web"] })
  fireEvent.click(screen.getByRole("button", { name: /remove web/i }))
  fireEvent.click(screen.getByRole("button", { name: /save/i }))
  await waitFor(() => expect(setTags).toHaveBeenCalledWith("s1", []))
})
```

- [ ] **Step 6: Run — expect FAIL.**

- [ ] **Step 7: Implement `EditTagsModal.tsx`**

Seed chips from `instance.tags` when available (the detail-modal caller passes an `InstanceDetail`); from the list caller, accept a `tags?: string[]` prop (default `[]`) — the list `Instance` carries no tags, so the plan passes `[]` and relies on the Nova replace (documented tradeoff). Local `chips: string[]` + `input` state. Enter/comma → push `input.trim()` if non-empty and not already in `chips`; clear input. Each chip has a remove button labelled `remove <tag>` and `data-testid="tag-chip"`. Save → `mutation.mutate({ id, tags: chips }, { onSuccess: onClose })`. Inline error.

- [ ] **Step 8: Run modal + hook tests — expect PASS.**

- [ ] **Step 9: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/hooks/useSetInstanceTagsMutation.ts \
  plugins/compute_njq/app/javascript/widgets/app/hooks/useSetInstanceTagsMutation.test.ts \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/EditTagsModal.tsx \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/EditTagsModal.test.tsx
git commit -m "feat(compute): add Edit Tags modal and mutation for compute_njq instances"
```

---

## Task 7: Hook + Modal — Reset Status

**Files:**
- Create: `hooks/useResetInstanceStatusMutation.ts` + `.test.ts`
- Create: `routes/instances/-components/ResetStatusModal.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: `api.instances.resetStatus` (Task 4).
- Produces: `buildResetStatusMutationOptions`/`useResetInstanceStatusMutation`; `<ResetStatusModal instance apiClient onClose />`.

- [ ] **Step 1: Write failing hook test** — NO optimistic patch; just verify `onSettled` invalidates both keys and `mutationFn` calls `resetStatus`:

```ts
it("fires resetStatus and invalidates on settle", async () => {
  const qc = new QueryClient()
  const spy = vi.spyOn(qc, "invalidateQueries")
  const resetStatus = vi.fn().mockResolvedValue(undefined)
  const api = { instances: { resetStatus } } as never
  const opts = buildResetStatusMutationOptions(api, qc)
  await opts.mutationFn!({ id: "s1", state: "active" })
  expect(resetStatus).toHaveBeenCalledWith("s1", "active")
  opts.onSettled!(undefined, null, { id: "s1", state: "active" }, undefined)
  expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
})
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement the hook** — factory with `mutationFn: ({id,state}) => api.instances.resetStatus(id,state)`, no `onMutate`/`onError`, `onSettled` invalidates `instances` + `instanceDetail(id)`.

- [ ] **Step 4: Run — expect PASS.**

- [ ] **Step 5: Write failing modal test**

```tsx
it("resets to the chosen state and closes", async () => {
  const resetStatus = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  renderModal({ resetStatus, onClose })
  fireEvent.change(screen.getByLabelText(/state/i), { target: { value: "error" } })
  fireEvent.click(screen.getByRole("button", { name: /reset/i }))
  await waitFor(() => expect(resetStatus).toHaveBeenCalledWith("s1", "error"))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})
```

- [ ] **Step 6: Run — expect FAIL.**

- [ ] **Step 7: Implement `ResetStatusModal.tsx`** — `<select>` labelled "State" with options `active`/`error` (default `active`); a short warning line that this is an admin recovery action; Reset button → `mutation.mutate({ id, state }, { onSuccess: onClose })`; inline error.

- [ ] **Step 8: Run modal + hook tests — expect PASS.**

- [ ] **Step 9: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/hooks/useResetInstanceStatusMutation.ts \
  plugins/compute_njq/app/javascript/widgets/app/hooks/useResetInstanceStatusMutation.test.ts \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResetStatusModal.tsx \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/ResetStatusModal.test.tsx
git commit -m "feat(compute): add Reset Status modal and mutation for compute_njq instances"
```

---

## Task 8: Register the actions + wire modals into the menu

**Files:**
- Modify: `routes/instances/-components/instanceActions.ts` + `.test.ts`
- Modify: `routes/instances/-components/InstanceActionsMenu.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: the three modal components (Tasks 5–7).
- Produces: three new `InstanceAction`s with a `modal` field; the menu opens the right modal.

- [ ] **Step 1: Write failing instanceActions test**

```ts
it("exposes edit-name, edit-tags (editor) and reset-status (admin) actions", () => {
  const keys = visibleActions(runningUnlocked, {}).map((a) => a.key)
  expect(keys).toEqual(expect.arrayContaining(["edit_name", "edit_tags", "reset_status"]))
})

it("hides reset_status when its policy denies", () => {
  // policy mock returns false only for instance_reset_status
  const keys = visibleActions(runningUnlocked, {}).map((a) => a.key)
  expect(keys).not.toContain("reset_status")
})
```

(Add `modal` to the `InstanceAction` type + `key` union: `"edit_name" | "edit_tags" | "reset_status"`. Use a `vi.mock("lib/policy")` whose `isAllowed` returns false for the reset-status rule.)

- [ ] **Step 2: Run — expect FAIL.**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts"`

- [ ] **Step 3: Add the actions to `INSTANCE_ACTIONS`**

```ts
{ key: "edit_name", label: "Edit Name", policy: "compute_njq:instance_update", group: "edit", isAvailable: () => true, modal: "editName" },
{ key: "edit_tags", label: "Edit Tags", policy: "compute_njq:instance_tags", group: "edit", isAvailable: () => true, modal: "editTags" },
{ key: "reset_status", label: "Reset Status", policy: "compute_njq:instance_reset_status", group: "terminate", isAvailable: () => true, modal: "resetStatus" },
```

Add `"edit"` to the `group` union and place the two edit entries at the **start** of `INSTANCE_ACTIONS` (legacy shows Edit Name/Tags above the power group); keep reset_status just before terminate. Add `modal?: "editName" | "editTags" | "resetStatus"` to the interface and the new keys to the `key` union.

- [ ] **Step 4: Run instanceActions test — expect PASS.** Also re-run the divider test expectation if group order changed — update `InstanceActionsMenu.test.tsx`'s expected label sequence to include the new groups/dividers.

- [ ] **Step 5: Write failing menu test**

```tsx
it("opens the Edit Name modal when the edit-name item is clicked", () => {
  renderMenu()
  fireEvent.click(screen.getByRole("button", { name: /actions/i }))
  fireEvent.click(screen.getByText("Edit Name"))
  expect(screen.getByRole("dialog")).toBeInTheDocument()
  expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  // dropdown closed, no inline confirm, no second mutation fired directly
  expect(document.querySelector(".dropdown-menu.show")).toBeNull()
})
```

- [ ] **Step 6: Run — expect FAIL.**

- [ ] **Step 7: Wire the modals in `InstanceActionsMenu.tsx`**

Add `const [activeModal, setActiveModal] = useState<InstanceAction["modal"] | null>(null)`. In `onClick(a)`: `if (a.modal) { setOpen(false); setActiveModal(a.modal); return }` before the confirm/else branches. After the dropdown `<ul>`, render:

```tsx
{activeModal === "editName" && <EditNameModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />}
{activeModal === "editTags" && <EditTagsModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />}
{activeModal === "resetStatus" && <ResetStatusModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />}
```

(EditTagsModal from the list menu receives the list `Instance` with no tags; pass `tags={[]}` — the Nova replace is authoritative, per the spec tradeoff.)

- [ ] **Step 8: Run the whole file — expect PASS.**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx"`

- [ ] **Step 9: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx \
  plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx
git commit -m "feat(compute): wire Edit Name/Tags and Reset Status into the compute_njq action menu"
```

---

## Task 9: Full verification

- [ ] **Step 1: Full compute_njq Vitest suite**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq"`
Expected: all green (prior 209 + the new tests).

- [ ] **Step 2: Full compute_njq RSpec suite**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec"`
Expected: all green.

- [ ] **Step 3: Typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm typecheck"`
Expected: no new errors (only the pre-existing `MultiSelect.test.tsx(70,13)`).

- [ ] **Step 4: Commit the design doc** (if not already committed)

```bash
git add docs/compute-njq/instance-edit-operations-design.md
git commit -m "docs(compute): design for compute_njq instance edit operations"
```

- [ ] **Step 5: Present the branch for review** — do NOT push or open a PR without explicit user permission (AGENTS.local.md).
