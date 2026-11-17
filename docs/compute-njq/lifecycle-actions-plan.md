# compute_njq Lifecycle (Power) Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add instance lifecycle (power) actions — start, stop, reboot, hard reset, pause, suspend, lock, unlock, terminate — to the `compute_njq` plugin, rendered as a per-row dropdown in the instances table.

**Architecture:** A data-driven action registry describes each operation (label, policy, state gate, confirm text, optimistic task_state). The BFF exposes one generic `POST /api/instances/:id/action` endpoint (plus `DELETE` for terminate) that maps a whitelisted `action_name` to the exact Nova `POST /servers/{id}/action` body. Policy gating uses the existing client-side `lib/policy` engine; state gating lives in the frontend. Mutations apply an optimistic row transition so the spinner appears immediately, then invalidate so the existing poll-while-transitioning behaviour drives it to completion.

**Tech Stack:** Ruby 3.4.8 · Rails 8.1 · RSpec · React 19 · TypeScript 5 · TanStack Query/Router · Zod · Vitest 4 · esbuild · pnpm.

**Spec:** `docs/compute-njq/lifecycle-actions-design.md`

## Global Constraints

- **Ruby:** `snake_case` files/methods, `PascalCase` classes; `# frozen_string_literal: true` at the top of every Ruby file (matches existing plugin files).
- **JS/TS:** Prettier — 120 cols, 2 spaces, no semicolons, double quotes, ES5 trailing commas. Strict TypeScript, no `any`. Functional React components, no `React` import needed.
- **Nova microversion is `2.67`** (`ComputeNjqService::NOVA_MICROVERSION`) — `locked` is a native server attribute; do not reintroduce the legacy metadata-based lock simulation for *reading*.
- **All BFF actions go through `handle_api_call { ... }`** so every error becomes the uniform `{ error, code, message }` envelope.
- **Lock/unlock are admin-only** (`rule:context_is_compute_admin`); the other actions use `rule:instance_actions`.
- **Commits:** Conventional Commits `type(scope): subject`, scope `compute`, subject lower-case. Do not push or open a PR without explicit approval.
- **Dev/test commands run in the container:** `bin/workspace bundle exec rspec <path>` and `bin/workspace pnpm test <path>`.

## Review Focus

- **Unknown `action_name`** (typo, stale client, malicious) → BFF must reject with a 400 envelope, never call Nova. Covered in Task 2.
- **Action on a transitioning instance** (double-click, stale row) → the menu must hide all actions while `isTransitioning`; the optimistic patch must not fire. Covered in Task 8.
- **Lock/unlock with a non-admin user** → the menu must not offer them (policy gate), and the BFF policy entry must still be admin-only as defense in depth. Covered in Tasks 3 and 8.
- **`locked` absent from a Nova payload** (older server record) → assembler must default to `false` so unlock is not offered on an unlocked server. Covered in Task 1.
- **Mutation error after optimistic patch** (Nova rejects, e.g. stop on an already-stopped server) → the row must roll back to its previous status and the error must surface, not leave a stuck spinner. Covered in Task 7.

---

## File Structure

**Backend (`plugins/compute_njq`):**
- `config/routes.rb` — add `post :action` member route + `:destroy`.
- `app/controllers/compute_njq/api/instances_controller.rb` — add `action` + `destroy`.
- `app/services/service_layer/compute_njq_services/nova.rb` — add raw Nova action wrappers.
- `app/services/service_layer/compute_njq_services/instance_assembler.rb` — add `locked`.
- `app/services/service_layer/compute_njq_services/instance_detail_assembler.rb` — add `locked`.
- `config/policy.json` — add action policy rules.
- `spec/services/service_layer/compute_njq_services/nova_spec.rb` (or existing) — service specs.
- `spec/controllers/compute_njq/api/instances_controller_spec.rb` — controller specs.

**Frontend (`plugins/compute_njq/app/javascript/widgets/app`):**
- `types/instance.ts` — add `locked` to `InstanceSchema` + `InstanceDetailSchema`.
- `types/lib.d.ts` — add `declare module "lib/policy"`.
- `apiClient.ts` — add `instances.action` + `instances.terminate`.
- `hooks/useInstanceActionMutation.ts` — generic action mutation with optimistic transition.
- `hooks/useTerminateInstanceMutation.ts` — terminate mutation.
- `routes/instances/-components/instanceActions.ts` — the registry + gating helpers.
- `routes/instances/-components/InstanceActionsMenu.tsx` — the dropdown + confirm.
- `routes/instances/-components/InstanceTable.tsx` — render the menu in the actions column.
- Test files colocated: `*.test.ts` / `*.test.tsx` next to each unit.

---

## Task 1: Expose `locked` from the BFF assemblers

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_assembler.rb` (in `assemble_instance`, ~line 38-47)
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_detail_assembler.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_assembler_spec.rb`

**Interfaces:**
- Produces: `assemble_instance` hash now includes `locked: <Boolean>` (default `false` when Nova omits it).

- [ ] **Step 1: Write the failing test**

Add to the assembler spec (create the file if absent, following the existing spec style in `plugins/compute_njq/spec/`):

```ruby
# frozen_string_literal: true
require "spec_helper"

describe ServiceLayer::ComputeNjqServices::InstanceAssembler do
  let(:service) { ServiceLayer::ComputeNjqService.new(nil) }

  describe "#assemble_instance locked flag" do
    before do
      allow(service).to receive(:flavor_names_by_id).and_return({})
      allow(service).to receive(:image_names_by_id).and_return({})
    end

    it "passes through a true locked flag" do
      server = { "id" => "s1", "name" => "x", "status" => "ACTIVE", "locked" => true }
      allow(service).to receive(:nova_server).with("s1").and_return(server)
      expect(service.find_instance("s1")[:locked]).to eq(true)
    end

    it "defaults locked to false when Nova omits it" do
      server = { "id" => "s2", "name" => "y", "status" => "ACTIVE" }
      allow(service).to receive(:nova_server).with("s2").and_return(server)
      expect(service.find_instance("s2")[:locked]).to eq(false)
    end
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_assembler_spec.rb`
Expected: FAIL — returned hash has no `:locked` key (`nil`, not `false`/`true`).

- [ ] **Step 3: Implement**

In `instance_assembler.rb`, inside the hash returned by `assemble_instance`, add after `created:`:

```ruby
          created: server["created"],
          # Native Nova attribute at microversion 2.9+ (we run 2.67). Drives the
          # Lock/Unlock action gating in the UI; default to not-locked when a
          # server record predates the attribute.
          locked: server["locked"] == true,
```

Apply the identical `locked: server["locked"] == true` addition to the hash built in `instance_detail_assembler.rb` (find where it assembles the detail hash and add the key alongside the other top-level fields).

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_assembler_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_assembler.rb \
        plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_detail_assembler.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_assembler_spec.rb
git commit -m "feat(compute): expose locked flag from compute_njq instance assemblers"
```

---

## Task 2: Nova action service wrappers

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`

**Interfaces:**
- Produces, on the Nova mixin (available on `ComputeNjqService`):
  - `nova_server_action(id, body)` → posts `servers/{id}/action` with `body`, returns response body.
  - `nova_delete_server(id)` → `DELETE servers/{id}`.
  - `nova_set_locked_metadata(id, value)` → `PUT servers/{id}/metadata/locked` with `{ "meta" => { "locked" => value } }`.

- [ ] **Step 1: Write the failing test**

```ruby
# frozen_string_literal: true
require "spec_helper"

describe ServiceLayer::ComputeNjqServices::Nova do
  let(:service) { ServiceLayer::ComputeNjqService.new(nil) }
  let(:nova) { double("elektron_nova") }
  before { allow(service).to receive(:elektron_nova).and_return(nova) }

  it "posts a raw action body to the server action endpoint" do
    expect(nova).to receive(:post).with("servers/s1/action", { "os-start" => nil })
      .and_return(double(body: {}))
    service.nova_server_action("s1", { "os-start" => nil })
  end

  it "deletes a server" do
    expect(nova).to receive(:delete).with("servers/s1").and_return(double(body: {}))
    service.nova_delete_server("s1")
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`
Expected: FAIL — `nova_server_action` / `nova_delete_server` undefined.

- [ ] **Step 3: Implement**

Add to `nova.rb` (inside `module Nova`):

```ruby
      # Raw Nova server-action call: POST /servers/{id}/action with the given
      # body (e.g. { "os-start" => nil }, { "reboot" => { "type" => "HARD" } }).
      # Callers (the aggregator) own the action→body mapping.
      def nova_server_action(id, body)
        elektron_nova.post("servers/#{id}/action") { body }.body
      end

      # Terminate: Nova deletes a server with DELETE /servers/{id} (NOT an
      # /action call).
      def nova_delete_server(id)
        elektron_nova.delete("servers/#{id}").body
      end

      # Legacy lock-simulation compatibility: set the `locked` metadata key so
      # list views that still read metadata stay consistent with the native
      # locked flag.
      def nova_set_locked_metadata(id, value)
        elektron_nova.put("servers/#{id}/metadata/locked") { { "meta" => { "locked" => value } } }.body
      end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb
git commit -m "feat(compute): add compute_njq nova server-action wrappers"
```

---

## Task 3: Aggregator action mapping + policy rules

**Files:**
- Create: `plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` (include the new mixin)
- Modify: `plugins/compute_njq/config/policy.json`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`

**Interfaces:**
- Consumes: `nova_server_action`, `nova_delete_server`, `nova_set_locked_metadata`, `nova_server` (Task 2).
- Produces:
  - `ComputeNjqService#instance_action(id, action_name)` — validates `action_name` against the whitelist (raises `ComputeNjq::RequestError` on unknown), maps to the Nova body, performs the call. Returns `{ ok: true }`.
  - `ComputeNjqService#terminate_instance(id)` — calls `nova_delete_server`, returns `{ ok: true }`.
  - Constant `ComputeNjqServices::InstanceActions::ACTION_BODIES` (frozen Hash of `String => Hash`).

- [ ] **Step 1: Write the failing test**

```ruby
# frozen_string_literal: true
require "spec_helper"

describe ServiceLayer::ComputeNjqServices::InstanceActions do
  let(:service) { ServiceLayer::ComputeNjqService.new(nil) }

  it "maps simple actions to their Nova body" do
    expect(service).to receive(:nova_server_action).with("s1", { "os-stop" => nil })
    service.instance_action("s1", "stop")
  end

  it "maps hard_reset to a HARD reboot" do
    expect(service).to receive(:nova_server_action).with("s1", { "reboot" => { "type" => "HARD" } })
    service.instance_action("s1", "hard_reset")
  end

  it "picks unpause/resume/os-start for start based on current status" do
    allow(service).to receive(:nova_server).with("s1").and_return({ "status" => "PAUSED" })
    expect(service).to receive(:nova_server_action).with("s1", { "unpause" => nil })
    service.instance_action("s1", "start")
  end

  it "runs the two-step lock sequence" do
    expect(service).to receive(:nova_set_locked_metadata).with("s1", "true").ordered
    expect(service).to receive(:nova_server_action).with("s1", { "lock" => nil }).ordered
    service.instance_action("s1", "lock")
  end

  it "rejects an unknown action without calling Nova" do
    expect(service).not_to receive(:nova_server_action)
    expect { service.instance_action("s1", "destroy_everything") }
      .to raise_error(ComputeNjq::RequestError)
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`
Expected: FAIL — mixin/constant/method undefined.

- [ ] **Step 3: Implement**

Create `instance_actions.rb`:

```ruby
# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Maps whitelisted UI action names to the exact Nova POST /servers/{id}/action
    # body. The whitelist IS the security boundary: anything not here is rejected
    # before any backend call. Mirrors the legacy Compute::Server action methods.
    module InstanceActions
      # Straight action_name => Nova body. (start/lock/unlock need extra logic,
      # handled below; they are intentionally absent here.)
      ACTION_BODIES = {
        "stop" => { "os-stop" => nil },
        "reboot" => { "reboot" => { "type" => "SOFT" } },
        "hard_reset" => { "reboot" => { "type" => "HARD" } },
        "pause" => { "pause" => nil },
        "suspend" => { "suspend" => nil },
      }.freeze

      SPECIAL_ACTIONS = %w[start lock unlock].freeze

      def instance_action(id, action_name)
        if ACTION_BODIES.key?(action_name)
          nova_server_action(id, ACTION_BODIES[action_name])
        elsif action_name == "start"
          start_instance(id)
        elsif action_name == "lock"
          nova_set_locked_metadata(id, "true")
          nova_server_action(id, { "lock" => nil })
        elsif action_name == "unlock"
          nova_server_action(id, { "unlock" => nil })
          nova_set_locked_metadata(id, "false")
        else
          raise ComputeNjq::RequestError, "Unknown instance action: #{action_name}"
        end
        { ok: true }
      end

      def terminate_instance(id)
        nova_delete_server(id)
        { ok: true }
      end

      private

      # "Start" means different Nova verbs depending on how the server is parked,
      # matching the legacy Compute::Server#start branch.
      def start_instance(id)
        status = (nova_server(id)["status"] || "").downcase
        body =
          case status
          when "paused" then { "unpause" => nil }
          when "suspended" then { "resume" => nil }
          else { "os-start" => nil }
          end
        nova_server_action(id, body)
      end
    end
  end
end
```

Add the include to `compute_njq_service.rb` next to the other mixins:

```ruby
    include ComputeNjqServices::InstanceActions
```

Add to `config/policy.json`:

```json
{
  "compute_njq:instance_list": "@",
  "compute_njq:instance_get": "@",
  "compute_njq:instance_create": "@",
  "compute_njq:instance_update": "rule:instance_actions",
  "compute_njq:instance_delete": "rule:instance_actions",
  "compute_njq:instance_hard_reset": "rule:context_is_compute_editor and (not rule:monsoon2_domain)",
  "compute_njq:instance_lock": "rule:context_is_compute_admin",
  "compute_njq:instance_unlock": "rule:context_is_compute_admin"
}
```

> Note: `rule:instance_actions`, `rule:context_is_compute_editor`, `rule:context_is_compute_admin`, and `rule:monsoon2_domain` are defined in the shared/compute policy set already loaded globally; referencing them here is enough.

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/instance_actions.rb \
        plugins/compute_njq/app/services/service_layer/compute_njq_service.rb \
        plugins/compute_njq/config/policy.json \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/instance_actions_spec.rb
git commit -m "feat(compute): map compute_njq instance actions to nova and add policies"
```

---

## Task 4: BFF action + destroy endpoints

**Files:**
- Modify: `plugins/compute_njq/config/routes.rb`
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb`
- Test: `plugins/compute_njq/spec/controllers/compute_njq/api/instances_controller_spec.rb`

**Interfaces:**
- Consumes: `compute_service.instance_action(id, action_name)`, `compute_service.terminate_instance(id)` (Task 3).
- Produces HTTP endpoints:
  - `POST /:scope/compute-njq/api/instances/:id/action` with body `{ action_name: "<name>" }` → `{ ok: true }` or error envelope.
  - `DELETE /:scope/compute-njq/api/instances/:id` → `{ ok: true }` or error envelope.

- [ ] **Step 1: Write the failing test**

Follow the existing controller spec style in the plugin. Minimal shape:

```ruby
# frozen_string_literal: true
require "spec_helper"

describe ComputeNjq::Api::InstancesController, type: :controller do
  # (reuse the plugin's existing auth/scope setup helpers)
  let(:compute_service) { double("compute_service") }
  before { allow(controller).to receive(:compute_service).and_return(compute_service) }

  describe "POST #action" do
    it "forwards the action_name to the service" do
      expect(compute_service).to receive(:instance_action).with("s1", "stop").and_return({ ok: true })
      post :action, params: default_scope_params.merge(id: "s1", action_name: "stop")
      expect(response).to have_http_status(:ok)
    end
  end

  describe "DELETE #destroy" do
    it "terminates via the service" do
      expect(compute_service).to receive(:terminate_instance).with("s1").and_return({ ok: true })
      delete :destroy, params: default_scope_params.merge(id: "s1")
      expect(response).to have_http_status(:ok)
    end
  end
end
```

(Use whatever scope/auth param helper the existing `index`/`create` specs use; if there is no controller spec yet, mirror the setup from another compute_njq request/controller spec.)

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/controllers/compute_njq/api/instances_controller_spec.rb`
Expected: FAIL — no `action`/`destroy` route or action.

- [ ] **Step 3: Implement**

In `routes.rb`, extend the instances resource:

```ruby
    resources :instances, only: %i[index show create destroy] do
      member do
        get :detail
        get :metrics
        # Generic lifecycle action: body { action_name: "start"|"stop"|... }.
        post :action
      end
    end
```

In `instances_controller.rb`, add after `create`:

```ruby
      # POST /:scope/compute-njq/api/instances/:id/action
      # Generic lifecycle action. The service whitelists action_name and maps it
      # to the Nova server-action body.
      def action
        handle_api_call do
          compute_service.instance_action(params.require(:id), params.require(:action_name))
        end
      end

      # DELETE /:scope/compute-njq/api/instances/:id  (terminate)
      def destroy
        handle_api_call { compute_service.terminate_instance(params.require(:id)) }
      end
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/controllers/compute_njq/api/instances_controller_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/config/routes.rb \
        plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
        plugins/compute_njq/spec/controllers/compute_njq/api/instances_controller_spec.rb
git commit -m "feat(compute): add compute_njq instance action and destroy endpoints"
```

---

## Task 5: Frontend types — `locked` + policy module

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/types/instance.ts`
- Modify: `plugins/compute_njq/app/javascript/widgets/app/types/lib.d.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/types/instance.test.ts`

**Interfaces:**
- Produces: `InstanceSchema`/`InstanceDetailSchema` now include `locked: boolean` (default `false`); `Instance.locked` typed `boolean`. `lib/policy` module declared with `policy.isAllowed(permission, options?) => boolean`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest"
import { InstanceSchema } from "./instance"

describe("InstanceSchema locked", () => {
  const base = {
    id: "s1",
    name: "x",
    status: { state: "active" },
    flavor: { id: "f", name: "F" },
    image: { id: "i", name: "I" },
    ips: [],
    created: null,
  }

  it("parses locked true/false", () => {
    expect(InstanceSchema.parse({ ...base, locked: true }).locked).toBe(true)
    expect(InstanceSchema.parse({ ...base, locked: false }).locked).toBe(false)
  })

  it("defaults locked to false when omitted", () => {
    expect(InstanceSchema.parse(base).locked).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/types/instance.test.ts`
Expected: FAIL — `locked` is not on the schema (defaults to `undefined`).

- [ ] **Step 3: Implement**

In `instance.ts`, add to `InstanceSchema` (after `created`) and to `InstanceDetailSchema` (after `id`/`name` group):

```ts
  // Native Nova locked flag (microversion 2.9+); defaults to false so Lock is
  // offered on a server record that predates the attribute.
  locked: z.boolean().default(false),
```

In `lib.d.ts`, add the policy module (copied from core `app/javascript/types/global.d.ts`):

```ts
declare module "lib/policy" {
  interface Policy {
    isAllowed: (permission: string, options?: Record<string, unknown>) => boolean
  }
  export const policy: Policy
  export function setPolicy(newPolicy: Policy): void
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/types/instance.test.ts`
Then: `bin/workspace pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/types/instance.ts \
        plugins/compute_njq/app/javascript/widgets/app/types/lib.d.ts \
        plugins/compute_njq/app/javascript/widgets/app/types/instance.test.ts
git commit -m "feat(compute): add locked field and lib/policy types to compute_njq"
```

---

## Task 6: API client — `action` + `terminate`

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts` (extend if it exists, else create)

**Interfaces:**
- Consumes: `apiClient.post`, `apiClient.delete` (from `lib/ajax_helper`); `checkForApiError`.
- Produces on `instances`:
  - `action(id: string, actionName: string): Promise<void>` → `POST instances/${id}/action` body `{ action_name: actionName }`.
  - `terminate(id: string): Promise<void>` → `DELETE instances/${id}`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest"

const post = vi.fn().mockResolvedValue({ ok: true })
const del = vi.fn().mockResolvedValue({ ok: true })
vi.mock("lib/ajax_helper", () => ({
  createAjaxHelper: () => ({ get: vi.fn(), post, delete: del, put: vi.fn() }),
}))

import { createComputeApi } from "./apiClient"

describe("instances.action / terminate", () => {
  it("posts the action_name", async () => {
    await createComputeApi("/x/y/compute-njq").instances.action("s1", "stop")
    expect(post).toHaveBeenCalledWith("instances/s1/action", { action_name: "stop" })
  })

  it("deletes for terminate", async () => {
    await createComputeApi("/x/y/compute-njq").instances.terminate("s1")
    expect(del).toHaveBeenCalledWith("instances/s1")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`
Expected: FAIL — `action`/`terminate` not defined on `instances`.

- [ ] **Step 3: Implement**

In `apiClient.ts`, add to the `instanceApi` object:

```ts
    // Generic lifecycle action: body { action_name }. The BFF returns { ok: true }.
    action: (id: string, actionName: string): Promise<void> =>
      apiClient.post<{ ok: true }>(`instances/${id}/action`, { action_name: actionName }).then((res) => {
        checkForApiError(res)
      }),

    terminate: (id: string): Promise<void> =>
      apiClient.delete<{ ok: true }>(`instances/${id}`).then((res) => {
        checkForApiError(res)
      }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/apiClient.ts \
        plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts
git commit -m "feat(compute): add action and terminate to compute_njq api client"
```

---

## Task 7: Mutation hooks with optimistic transition

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useInstanceActionMutation.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useTerminateInstanceMutation.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/hooks/useInstanceActionMutation.test.ts`

**Interfaces:**
- Consumes: `api.instances.action`, `api.instances.terminate` (Task 6); `QUERY_KEYS.instances`, `QUERY_KEYS.instanceDetail` (existing); `Instance` type with `locked` (Task 5).
- Produces:
  - `useInstanceActionMutation(api, queryClient)` → `useMutation` taking `{ id: string; actionName: string; optimisticTransition?: string }`. `onMutate` patches the row's `status.transition`; `onError` rolls back; `onSettled` invalidates `instances` + `instanceDetail(id)`.
  - `useTerminateInstanceMutation(api, queryClient)` → `useMutation` taking `{ id: string }`, optimistic `transition: "deleting"`, same rollback/invalidate.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "./queryKeys"
import { useInstanceActionMutation } from "./useInstanceActionMutation"

// Exercise the onMutate/onError/onSettled callbacks directly (no React render):
// useMutation returns an object; we test the option callbacks the hook builds.
// To keep it simple, extract the options into a tested factory:
import { buildActionMutationOptions } from "./useInstanceActionMutation"

function seedList(qc: QueryClient) {
  qc.setQueryData(QUERY_KEYS.instances, [
    { id: "s1", name: "x", status: { state: "active", transition: null }, locked: false,
      flavor: { id: null, name: null }, image: { id: null, name: null }, ips: [], created: null },
  ])
}

describe("action mutation optimistic transition", () => {
  it("onMutate patches the row transition and onError restores it", async () => {
    const qc = new QueryClient()
    seedList(qc)
    const api = { instances: { action: vi.fn() } } as never
    const opts = buildActionMutationOptions(api, qc)

    const ctx = await opts.onMutate!({ id: "s1", actionName: "stop", optimisticTransition: "powering-off" })
    expect((qc.getQueryData(QUERY_KEYS.instances) as any)[0].status.transition).toBe("powering-off")

    opts.onError!(new Error("boom"), { id: "s1", actionName: "stop" }, ctx)
    expect((qc.getQueryData(QUERY_KEYS.instances) as any)[0].status.transition).toBe(null)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/hooks/useInstanceActionMutation.test.ts`
Expected: FAIL — module/`buildActionMutationOptions` not defined.

- [ ] **Step 3: Implement**

Create `useInstanceActionMutation.ts`:

```ts
import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface ActionVars {
  id: string
  actionName: string
  // Synthetic Nova task_state shown immediately; omitted for actions with no
  // task_state (lock/unlock).
  optimisticTransition?: string
}

interface ActionCtx {
  previous?: Instance[]
}

// Factory kept separate from the hook so the optimistic cache logic can be
// unit-tested without rendering a component.
export function buildActionMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, ActionVars, ActionCtx> {
  return {
    mutationFn: ({ id, actionName }) => api.instances.action(id, actionName),
    onMutate: async ({ id, optimisticTransition }) => {
      if (!optimisticTransition) return {}
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) =>
          i.id === id ? { ...i, status: { ...i.status, transition: optimisticTransition } } : i
        )
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

export function useInstanceActionMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildActionMutationOptions(api, queryClient))
}
```

Create `useTerminateInstanceMutation.ts` (same shape; `mutationFn` calls `api.instances.terminate`, optimistic `transition: "deleting"`):

```ts
import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface TerminateVars {
  id: string
}
interface TerminateCtx {
  previous?: Instance[]
}

export function buildTerminateMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, TerminateVars, TerminateCtx> {
  return {
    mutationFn: ({ id }) => api.instances.terminate(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) => (i.id === id ? { ...i, status: { ...i.status, transition: "deleting" } } : i))
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEYS.instances, ctx.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
  }
}

export function useTerminateInstanceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildTerminateMutationOptions(api, queryClient))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/hooks/useInstanceActionMutation.test.ts`
Then: `bin/workspace pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/hooks/useInstanceActionMutation.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useTerminateInstanceMutation.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useInstanceActionMutation.test.ts
git commit -m "feat(compute): add compute_njq lifecycle action mutation hooks"
```

---

## Task 8: Action registry + gating

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts`

**Interfaces:**
- Consumes: `Instance`, `isTransitioning` (types/instance); `policy.isAllowed` (lib/policy).
- Produces:
  - Type `InstanceAction` with `{ key, label, policy, isAvailable(i: Instance): boolean, confirm?: { message, ok }, destructive?: boolean, optimisticTransition?: string }`.
  - `INSTANCE_ACTIONS: InstanceAction[]` (the registry).
  - `visibleActions(instance: Instance, scope: Record<string, unknown>): InstanceAction[]` — filters by `!isTransitioning` + `isAvailable` + `policy.isAllowed(action.policy, { target: scope })`.

State-gate rules (from spec; `power_state` is the human label):
- start → power is one of `Paused`/`Suspended`/`Shut off`/`Shut down`.
- stop/reboot/pause/suspend/hard_reset → power is `Running`.
- lock → `!instance.locked`; unlock → `instance.locked`.
- terminate → always (transition gate already applied).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest"
vi.mock("lib/policy", () => ({ policy: { isAllowed: vi.fn(() => true) } }))
import { policy } from "lib/policy"
import { INSTANCE_ACTIONS, visibleActions } from "./instanceActions"
import type { Instance } from "../../../types/instance"

function inst(over: Partial<Instance> = {}): Instance {
  return {
    id: "s1", name: "x", locked: false,
    status: { state: "active", transition: null, power_state: "Running" },
    flavor: { id: null, name: null }, image: { id: null, name: null }, ips: [], created: null,
    ...over,
  } as Instance
}

describe("visibleActions", () => {
  it("offers stop/reboot/pause/suspend/hard_reset when Running", () => {
    const keys = visibleActions(inst(), {}).map((a) => a.key)
    expect(keys).toEqual(expect.arrayContaining(["stop", "reboot", "pause", "suspend", "hard_reset"]))
    expect(keys).not.toContain("start")
  })

  it("offers start only when parked", () => {
    const keys = visibleActions(inst({ status: { state: "stopped", transition: null, power_state: "Shut off" } }), {}).map((a) => a.key)
    expect(keys).toContain("start")
    expect(keys).not.toContain("stop")
  })

  it("offers lock when unlocked and unlock when locked", () => {
    expect(visibleActions(inst({ locked: false }), {}).map((a) => a.key)).toContain("lock")
    expect(visibleActions(inst({ locked: true }), {}).map((a) => a.key)).toContain("unlock")
  })

  it("hides everything while transitioning", () => {
    expect(visibleActions(inst({ status: { state: "active", transition: "rebooting", power_state: "Running" } }), {})).toHaveLength(0)
  })

  it("respects the policy gate", () => {
    ;(policy.isAllowed as any).mockReturnValue(false)
    expect(visibleActions(inst(), {})).toHaveLength(0)
    ;(policy.isAllowed as any).mockReturnValue(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts`
Expected: FAIL — module not defined.

- [ ] **Step 3: Implement**

Create `instanceActions.ts`:

```ts
import { policy } from "lib/policy"
import { Instance, isTransitioning } from "../../../types/instance"

export interface InstanceAction {
  key: "start" | "stop" | "reboot" | "hard_reset" | "pause" | "suspend" | "lock" | "unlock" | "terminate"
  label: string
  policy: string
  isAvailable: (i: Instance) => boolean
  confirm?: { message: string; ok: string }
  destructive?: boolean
  optimisticTransition?: string
}

const PARKED = ["Paused", "Suspended", "Shut off", "Shut down"]
const isRunning = (i: Instance) => i.status.power_state === "Running"
const isParked = (i: Instance) => PARKED.includes(i.status.power_state ?? "")

// Legacy wording from Compute::Server#target_state_for_action / confirm texts.
export const INSTANCE_ACTIONS: InstanceAction[] = [
  { key: "start", label: "Start", policy: "compute_njq:instance_update",
    isAvailable: isParked, optimisticTransition: "powering-on" },
  { key: "stop", label: "Stop", policy: "compute_njq:instance_update",
    isAvailable: isRunning, optimisticTransition: "powering-off", destructive: true,
    confirm: { message: "Are you sure you want to stop this instance?", ok: "Yes, stop it" } },
  { key: "reboot", label: "Reboot", policy: "compute_njq:instance_update",
    isAvailable: isRunning, optimisticTransition: "rebooting",
    confirm: { message: "Are you sure you want to reboot this instance?", ok: "Yes, reboot it" } },
  { key: "pause", label: "Pause", policy: "compute_njq:instance_update",
    isAvailable: isRunning, optimisticTransition: "pausing",
    confirm: { message: "Are you sure you want to pause this instance?", ok: "Yes, pause it" } },
  { key: "suspend", label: "Suspend", policy: "compute_njq:instance_update",
    isAvailable: isRunning, optimisticTransition: "suspending",
    confirm: { message: "Are you sure you want to suspend this instance?", ok: "Yes, suspend it" } },
  { key: "hard_reset", label: "Hard Reset", policy: "compute_njq:instance_hard_reset",
    isAvailable: isRunning, optimisticTransition: "rebooting", destructive: true,
    confirm: { message: "Are you sure you want to hard reset this instance?", ok: "Yes, hard reset it" } },
  { key: "lock", label: "Lock", policy: "compute_njq:instance_lock",
    isAvailable: (i) => !i.locked,
    confirm: { message: "Are you sure you want to lock this instance?", ok: "Yes, lock it" } },
  { key: "unlock", label: "Unlock", policy: "compute_njq:instance_unlock",
    isAvailable: (i) => i.locked,
    confirm: { message: "Are you sure you want to unlock this instance?", ok: "Yes, unlock it" } },
  { key: "terminate", label: "Terminate", policy: "compute_njq:instance_delete",
    isAvailable: () => true, optimisticTransition: "deleting", destructive: true,
    confirm: { message: "Are you sure you want to terminate this instance?", ok: "Yes, terminate it" } },
]

export function visibleActions(instance: Instance, scope: Record<string, unknown>): InstanceAction[] {
  if (isTransitioning(instance.status)) return []
  return INSTANCE_ACTIONS.filter(
    (a) => a.isAvailable(instance) && policy.isAllowed(a.policy, { target: scope })
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts
git commit -m "feat(compute): add compute_njq instance action registry and gating"
```

---

## Task 9: Actions dropdown menu + confirm

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx`
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx`

**Interfaces:**
- Consumes: `visibleActions`, `InstanceAction` (Task 8); `useInstanceActionMutation`, `useTerminateInstanceMutation` (Task 7); `Modal` (`lib/components/Modal`); `Instance` type. Reads `apiClient`/`region`/`projectid` from router context and `queryClient` via `useQueryClient`.
- Produces: `InstanceActionsMenu` default export, props `{ instance: Instance; scope: Record<string, unknown> }`. Renders a `.btn-group` dropdown of `visibleActions`; clicking a non-confirm action fires the mutation; clicking a confirm action opens a `Modal` with `action.confirm.message` + `ok`. Mutation error renders inline.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
vi.mock("lib/policy", () => ({ policy: { isAllowed: () => true } }))

const action = vi.fn().mockResolvedValue(undefined)
vi.mock("../../../router", () => ({})) // router context mocked per-render instead
import InstanceActionsMenu from "./InstanceActionsMenu"
import type { Instance } from "../../../types/instance"

const instance: Instance = {
  id: "s1", name: "x", locked: false,
  status: { state: "active", transition: null, power_state: "Running" },
  flavor: { id: null, name: null }, image: { id: null, name: null }, ips: [], created: null,
} as Instance

function renderMenu() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <InstanceActionsMenu instance={instance} scope={{}} apiOverride={{ instances: { action, terminate: vi.fn() } } as never} />
    </QueryClientProvider>
  )
}

describe("InstanceActionsMenu", () => {
  it("opens a confirm dialog for a confirm action and fires on confirm", async () => {
    renderMenu()
    fireEvent.click(screen.getByText("Stop"))
    expect(screen.getByText("Yes, stop it")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Yes, stop it"))
    expect(action).toHaveBeenCalledWith("s1", "stop")
  })
})
```

> If the router-context wiring makes an `apiOverride` prop awkward, instead read the api from router context and mock `useRouteContext`; keep the component's production path context-driven and expose a small seam for the test. Decide at implementation time and keep the test asserting the same behaviour (confirm shows, click calls `action("s1","stop")`).

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx`
Expected: FAIL — component not defined.

- [ ] **Step 3: Implement**

Create `InstanceActionsMenu.tsx`. Use the router context for the api (mirror how other components get `apiClient` via `useRouteContext`), `useQueryClient` for the cache, the two mutation hooks, and `Modal` for the confirm. Render a Bootstrap `.btn-group` dropdown (matching the legacy `_item_actions` markup: a `.dropdown-toggle` cog button + `.dropdown-menu`). Keep the confirm renderer as a local helper so a later step can swap it for an inline renderer in the detail modal.

```tsx
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouteContext } from "@tanstack/react-router"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import { visibleActions, type InstanceAction } from "./instanceActions"
import { useInstanceActionMutation } from "../../../hooks/useInstanceActionMutation"
import { useTerminateInstanceMutation } from "../../../hooks/useTerminateInstanceMutation"

interface Props {
  instance: Instance
  scope: Record<string, unknown>
  // Test seam: override the api that the router context would otherwise supply.
  apiOverride?: ReturnType<typeof import("../../../apiClient").createComputeApi>
}

export default function InstanceActionsMenu({ instance, scope, apiOverride }: Props) {
  const ctx = useRouteContext({ strict: false }) as { apiClient?: ReturnType<typeof import("../../../apiClient").createComputeApi> }
  const api = apiOverride ?? ctx.apiClient!
  const queryClient = useQueryClient()
  const actionMutation = useInstanceActionMutation(api, queryClient)
  const terminateMutation = useTerminateInstanceMutation(api, queryClient)
  const [pending, setPending] = useState<InstanceAction | null>(null)

  const actions = visibleActions(instance, scope)
  if (actions.length === 0) return null

  const run = (a: InstanceAction) => {
    if (a.key === "terminate") {
      terminateMutation.mutate({ id: instance.id })
    } else {
      actionMutation.mutate({ id: instance.id, actionName: a.key, optimisticTransition: a.optimisticTransition })
    }
  }

  const onClick = (a: InstanceAction) => (a.confirm ? setPending(a) : run(a))
  const error = actionMutation.error ?? terminateMutation.error

  return (
    <div className="btn-group">
      <button type="button" className="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
        <span className="fa fa-cog" />
      </button>
      <ul className="dropdown-menu dropdown-menu-end" role="menu">
        {actions.map((a) => (
          <li key={a.key}>
            <button type="button" className={`dropdown-item${a.destructive ? " text-danger" : ""}`} onClick={() => onClick(a)}>
              {a.label}
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="text-danger small mt-1">{error.message}</div>}

      <Modal show={!!pending} onHide={() => setPending(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{pending?.label}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{pending?.confirm?.message}</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-default" onClick={() => setPending(null)}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${pending?.destructive ? "btn-danger" : "btn-primary"}`}
            onClick={() => {
              if (pending) run(pending)
              setPending(null)
            }}
          >
            {pending?.confirm?.ok}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx`
Then: `bin/workspace pnpm typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx
git commit -m "feat(compute): add compute_njq instance actions dropdown with confirm"
```

---

## Task 10: Wire the menu into the instances table

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceTable.tsx` (the reserved `<td className="snug" />` at ~line 239)
- Test: extend `InstanceTable`'s existing test, or add `InstanceTable.actions.test.tsx`

**Interfaces:**
- Consumes: `InstanceActionsMenu` (Task 9). Needs `scope` — the `{ scoped_domain_name, project }` object passed to `policy.isAllowed`. Thread it from the table's props/route context (match how the instances route already knows domain/project; if not readily available, pass `{}` and rely on the policy rules that don't require a target, with a follow-up note).

- [ ] **Step 1: Write the failing test**

```tsx
// Assert the actions cell now renders the menu for a running instance.
// (Reuse the table's existing render harness.)
import { screen } from "@testing-library/react"
// ...render InstanceTable with one running instance...
it("renders an actions menu in the last column", () => {
  // after render:
  expect(screen.getByRole("button", { name: /cog|actions/i })).toBeInTheDocument()
})
```

> Match the table's existing test setup (how `instances` are passed, any router/query wrappers). If the table has no test yet, create `InstanceTable.actions.test.tsx` with a minimal `QueryClientProvider` + router-context stub like Task 9.

- [ ] **Step 2: Run test to verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/`
Expected: FAIL — no actions button rendered.

- [ ] **Step 3: Implement**

In `InstanceTable.tsx`, import the menu and render it in the trailing data cell:

```tsx
import InstanceActionsMenu from "./InstanceActionsMenu"
```

Replace the empty row-actions cell (`<td className="snug" />` inside `rows.map`):

```tsx
                  <td className="snug">
                    <InstanceActionsMenu instance={instance} scope={scope} />
                  </td>
```

Add a `scope` prop to `InstanceTableProps` and thread it from the caller (the instances layout route that already renders `InstanceTable`). If the scope values are not yet available there, pass `scope={{}}` and add a code comment `// TODO(step-2): thread scoped_domain_name/project for targeted policy checks` — the default policy rules evaluate without a target, so gating still works for the lifecycle rules.

- [ ] **Step 4: Run test to verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/`
Then: `bin/workspace pnpm typecheck && bin/workspace pnpm lint`
Expected: PASS; typecheck + lint clean.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceTable.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceTable.actions.test.tsx
git commit -m "feat(compute): render lifecycle actions menu in compute_njq instances table"
```

---

## Task 11: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole plugin test suite**

Run:
```bash
bin/workspace bundle exec rspec plugins/compute_njq/spec
bin/workspace pnpm test plugins/compute_njq
bin/workspace pnpm typecheck
bin/workspace pnpm lint
bin/workspace pnpm check-format
```
Expected: all green. Fix any failures in the owning task's files (not here), then re-run.

- [ ] **Step 2: Format if needed**

If `check-format` flags files: `bin/workspace pnpm format`, then re-run `check-format`, then commit:
```bash
git add -A
git commit -m "style(compute): format compute_njq lifecycle action files"
```

---

## Notes carried from the spec (do NOT implement in this plan)

- **Detail-modal actions are deferred.** When added later: keep the modal open and show the transition inline (patch both `instances` and `instanceDetail(id)` caches — the action hook already invalidates both); terminate must actively `navigate({ to: "/instances" })` because polling never closes the route-based modal; render confirm **inline** (no stacked `Modal`); and do **not** offer actions that need their own form modal from inside the detail modal.
