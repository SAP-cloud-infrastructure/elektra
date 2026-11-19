# Instance Snapshot (Create Image) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an instance "Create Snapshot" operation to compute_njq whose modal stays open, polls the new Glance image's status, and shows success only when the image reaches `active`.

**Architecture:** A new BFF service method posts Nova `createImage`, reads the new image id from the `Location` response header (name-lookup fallback), and a generic image-status read endpoint exposes the Glance `status`. The React modal runs a `form → creating → success/error` state machine, polling the status query only while `creating`.

**Tech Stack:** Ruby/Rails service + controllers (RSpec), React 19 + TanStack Query + Zod (Vitest), Bootstrap 5 Modal.

**Spec:** [docs/compute-njq/instance-snapshot-design.md](instance-snapshot-design.md)

## Global Constraints

- No auto-close: the snapshot modal never closes itself; the user closes it after success.
- Metadata is always `{}` (name-only, legacy parity).
- Policy gate: `role:image_admin and (role:admin or role:objectstore_admin)` (both legacy roles).
- Terminal statuses: `active` → success; `killed`/`deleted`/`error` → error; anything else keeps polling.
- Ruby via `docker exec elektra bash -c "cd /app && bundle exec rspec ..."`; JS via `docker exec elektra bash -c "cd /app && pnpm vitest run ..."`; tsc via `docker exec elektra bash -c "cd /app && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`. Git only via `docker exec ws-ide bash -c "cd /workspace/elektra && git ..."` (no `-it`).
- Prettier: 120 cols, 2 spaces, no semicolons, double quotes.

## Review Focus

- `createImage` POST returns no `Location` header → the name-lookup fallback must still yield an id; if both fail the modal must land in `error`, never poll forever (Task 1 fallback test; Task 7 missing-id test).
- Two images share the snapshot name → fallback picks the newest by `created_at`, not an arbitrary one (Task 1 test).
- Image reaches a terminal *failure* (`killed`/`error`) rather than `active` → modal shows error, does not hang in `creating` (Task 7 test).
- User without both roles → action hidden client-side AND rejected 403 server-side with no service call (Task 3 policy test).
- Blank/whitespace name → rejected before any backend call (Task 1 test) and the submit button stays disabled (Task 7 test).

---

## Task 1: BFF service — create snapshot + image status

**Files:**
- Create: `plugins/compute_njq/app/services/service_layer/compute_njq_services/snapshot.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` (add `include ComputeNjqServices::Snapshot` after line 27)
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/snapshot_spec.rb`

**Interfaces:**
- Consumes: `elektron_nova` (from Nova module), `glance_image(id)` / `glance_images(filter)` (from Glance module), `ComputeNjq::RequestError`.
- Produces:
  - `create_instance_snapshot(id, name) → { image_id: String|nil }`
  - `find_image_status(id) → { id:, name:, status: }` or `nil`

- [ ] **Step 1: Write the failing test**

```ruby
# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Snapshot do
  let(:test_class) do
    Class.new do
      include ServiceLayer::ComputeNjqServices::Snapshot
    end.new
  end
  let(:elektron_nova) { double("elektron_nova") }

  before { allow(test_class).to receive(:elektron_nova).and_return(elektron_nova) }

  describe "#create_instance_snapshot" do
    it "posts createImage and returns the image id from the Location header" do
      response = double("response", header: { "Location" => "https://nova/v2.1/images/img-7" }, body: {})
      allow(elektron_nova).to receive(:post).with("servers/s1/action").and_yield.and_return(response)

      expect(test_class.create_instance_snapshot("s1", "snap-1")).to eq(image_id: "img-7")
    end

    it "falls back to the newest image by name when no Location header is present" do
      response = double("response", header: {}, body: {})
      allow(elektron_nova).to receive(:post).with("servers/s1/action").and_yield.and_return(response)
      allow(test_class).to receive(:glance_images).with("name" => "snap-1").and_return([
        { "id" => "old", "created_at" => "2024-01-01T00:00:00Z" },
        { "id" => "new", "created_at" => "2024-06-01T00:00:00Z" },
      ])

      expect(test_class.create_instance_snapshot("s1", "snap-1")).to eq(image_id: "new")
    end

    it "raises RequestError on a blank name and makes no backend call" do
      expect(elektron_nova).not_to receive(:post)
      expect { test_class.create_instance_snapshot("s1", "  ") }.to raise_error(ComputeNjq::RequestError)
    end
  end

  describe "#find_image_status" do
    it "shapes the glance image to id/name/status" do
      allow(test_class).to receive(:glance_image).with("img-7").and_return(
        { "id" => "img-7", "name" => "snap-1", "status" => "saving", "extra" => "ignored" }
      )
      expect(test_class.find_image_status("img-7")).to eq(id: "img-7", name: "snap-1", status: "saving")
    end

    it "returns nil for a missing image" do
      allow(test_class).to receive(:glance_image).with("missing").and_return(nil)
      expect(test_class.find_image_status("missing")).to be_nil
    end
  end
end
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/snapshot_spec.rb"`
Expected: FAIL — `uninitialized constant ServiceLayer::ComputeNjqServices::Snapshot`.

- [ ] **Step 3: Write minimal implementation**

```ruby
# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Snapshot (Create Image): captures a server's disk as a new Glance image.
    # Nova's createImage action returns the new image's URL in the Location
    # response header; we extract the id so the client can poll its status. This
    # spans Nova (the action) and Glance (the status read), hence its own module.
    module Snapshot
      TERMINAL_OK = "active"
      TERMINAL_FAILURE = %w[killed deleted error].freeze

      def create_instance_snapshot(id, name)
        name = name.to_s.strip
        raise ComputeNjq::RequestError, "Snapshot name must not be blank" if name.empty?

        response = elektron_nova.post("servers/#{id}/action") do
          { "createImage" => { "name" => name, "metadata" => {} } }
        end
        image_id = image_id_from_location(response) || newest_image_id_by_name(name)
        { image_id: image_id }
      end

      def find_image_status(id)
        img = glance_image(id)
        return nil if img.nil?

        { id: img["id"], name: img["name"], status: img["status"] }
      end

      private

      def image_id_from_location(response)
        location = response.header["Location"] || response.header["location"]
        location&.split("/")&.last
      end

      def newest_image_id_by_name(name)
        glance_images("name" => name).max_by { |i| i["created_at"].to_s }&.dig("id")
      end
    end
  end
end
```

And add to `compute_njq_service.rb` after line 27:

```ruby
    include ComputeNjqServices::Snapshot
```

- [ ] **Step 4: Run test to verify it passes**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/snapshot_spec.rb"`
Expected: PASS (5 examples).

- [ ] **Step 5: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/services/service_layer/compute_njq_services/snapshot.rb plugins/compute_njq/app/services/service_layer/compute_njq_service.rb plugins/compute_njq/spec/services/service_layer/compute_njq_services/snapshot_spec.rb && git commit -m 'feat(compute): add snapshot service for compute_njq'"
```

---

## Task 2: Policy rules

**Files:**
- Modify: `plugins/compute_njq/config/policy.json`
- Test: (covered by Task 3 controller specs — policy.json has no standalone spec)

**Interfaces:**
- Produces: policy rules `compute_njq:instance_snapshot`, `compute_njq:image_get`.

- [ ] **Step 1: Add the rules**

Add these two keys to `plugins/compute_njq/config/policy.json` (after `instance_unlock`):

```json
  "compute_njq:instance_snapshot": "role:image_admin and (role:admin or role:objectstore_admin)",
  "compute_njq:image_get": "@"
```

(Remember to add a trailing comma to the preceding line so the JSON stays valid.)

- [ ] **Step 2: Verify the JSON parses**

Run: `docker exec elektra bash -c "cd /app && ruby -rjson -e 'JSON.parse(File.read(%q{plugins/compute_njq/config/policy.json})); puts :ok'"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/config/policy.json && git commit -m 'feat(compute): add snapshot and image policy rules for compute_njq'"
```

---

## Task 3: Controllers & routes

**Files:**
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb` (add `snapshot` action + `snapshot_params`)
- Create: `plugins/compute_njq/app/controllers/compute_njq/api/images_controller.rb`
- Modify: `plugins/compute_njq/config/routes.rb` (add `post :snapshot` member + `resources :images`)
- Test: `plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb` (add `POST #snapshot`), create `plugins/compute_njq/spec/controllers/api/images_controller_spec.rb`

**Interfaces:**
- Consumes: `create_instance_snapshot(id, name)`, `find_image_status(id)` (Task 1); `authorize!`, `handle_api_call` (BaseController).
- Produces: `POST .../instances/:id/snapshot` → `{ image_id }`; `GET .../images/:id` → `{ image: {...} }`.

- [ ] **Step 1: Write the failing controller tests**

Add to `instances_controller_spec.rb` (new `describe` block):

```ruby
  describe "POST #snapshot" do
    before { allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser).to receive(:is_allowed?).and_return(true) }

    it "forwards the name to the service and returns the image id" do
      expect(scoped_service).to receive(:create_instance_snapshot).with("s1", "snap-1").and_return(image_id: "img-7")

      post :snapshot, params: default_params.merge(id: "s1", snapshot: { name: "snap-1" })

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq("image_id" => "img-7")
    end

    it "checks the instance_snapshot policy rule" do
      allow(scoped_service).to receive(:create_instance_snapshot).and_return(image_id: "img-7")
      expect_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser).to receive(:is_allowed?).with(
        "compute_njq:instance_snapshot", anything
      ).and_return(true)

      post :snapshot, params: default_params.merge(id: "s1", snapshot: { name: "snap-1" })
    end

    context "when the user is not allowed to snapshot" do
      before { allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser).to receive(:is_allowed?).and_return(false) }

      it "renders a 403 envelope and never calls the service" do
        expect(scoped_service).not_to receive(:create_instance_snapshot)

        post :snapshot, params: default_params.merge(id: "s1", snapshot: { name: "snap-1" })

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)).to include("error" => "Forbidden", "code" => 403)
      end
    end
  end
```

Create `plugins/compute_njq/spec/controllers/api/images_controller_spec.rb`:

```ruby
# frozen_string_literal: true
require "spec_helper"

RSpec.describe ComputeNjq::Api::ImagesController, type: :controller do
  routes { ComputeNjq::Engine.routes }

  let(:compute_service) { double("compute_njq_service") }
  let(:scoped_service) { double("scoped_compute_njq_service") }
  let(:services_mock) { double("services", compute_njq: compute_service) }

  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }

  before(:all) do
    FriendlyIdEntry.find_or_create_entry("Domain", nil, default_params[:domain_id], "default")
    FriendlyIdEntry.find_or_create_entry(
      "Project", default_params[:domain_id], default_params[:project_id], default_params[:project_id]
    )
  end

  before do
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    allow(controller).to receive(:current_region).and_return("qa-de-1")
    allow(compute_service).to receive(:scoped).and_return(scoped_service)
    allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthUser).to receive(:is_allowed?).and_return(true)
  end

  describe "GET #show" do
    it "returns the shaped image status" do
      allow(scoped_service).to receive(:find_image_status).with("img-7").and_return(
        { id: "img-7", name: "snap-1", status: "saving" }
      )

      get :show, params: default_params.merge(id: "img-7")

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)).to eq(
        "image" => { "id" => "img-7", "name" => "snap-1", "status" => "saving" }
      )
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb plugins/compute_njq/spec/controllers/api/images_controller_spec.rb"`
Expected: FAIL — `ImagesController` uninitialized; `No route matches ... snapshot`.

- [ ] **Step 3: Write the implementation**

In `instances_controller.rb`, add after the `resize` action (line 70):

```ruby
      # POST /:scope/compute-njq/api/instances/:id/snapshot  body { snapshot: { name } }
      # Creates a Glance image (snapshot) of the server. Returns the new image id
      # so the client can poll its status until it becomes active.
      def snapshot
        return unless authorize!("compute_njq:instance_snapshot")

        handle_api_call { compute_service.create_instance_snapshot(params.require(:id), snapshot_params[:name]) }
      end
```

And add to the `private` section (near `update_params`):

```ruby
      # Snapshot: only the image name is accepted; metadata is always {} (legacy
      # parity with the name-only new_snapshot form).
      def snapshot_params
        params.require(:snapshot).permit(:name).to_h.symbolize_keys
      end
```

Create `plugins/compute_njq/app/controllers/compute_njq/api/images_controller.rb`:

```ruby
# frozen_string_literal: true

module ComputeNjq
  module Api
    # Generic image reads. Currently serves the snapshot status poll; kept
    # separate from InstancesController so it stays reusable for future image
    # features rather than coupled to the snapshot flow.
    class ImagesController < Api::BaseController
      # GET /:scope/compute-njq/api/images/:id  → { image: { id, name, status } }
      def show
        return unless authorize!("compute_njq:image_get")

        handle_api_call { { image: compute_service.find_image_status(params.require(:id)) } }
      end
    end
  end
end
```

In `routes.rb`, add `post :snapshot` inside the instances `member do` block (after `put :resize`), and add a new resource after the instances block:

```ruby
        # Snapshot: create a Glance image of the server, body { snapshot: { name } }.
        post :snapshot
```

```ruby
    # Image status reads (snapshot polling), kept generic/reusable.
    resources :images, only: %i[show]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb plugins/compute_njq/spec/controllers/api/images_controller_spec.rb"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/controllers plugins/compute_njq/config/routes.rb plugins/compute_njq/spec/controllers && git commit -m 'feat(compute): add snapshot and image-status endpoints for compute_njq'"
```

---

## Task 4: Image status schema + API client methods

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/types/image.ts`
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts` (add `createSnapshot` to instances, new `images` group)
- Test: `plugins/compute_njq/app/javascript/widgets/app/types/image.test.ts`

**Interfaces:**
- Produces:
  - `ImageStatus` type `{ id: string; name: string | null; status: string }`
  - `apiClient.instances.createSnapshot(id, name) → Promise<{ image_id: string | null }>`
  - `apiClient.images.getStatus(id) → Promise<ImageStatus>`

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, it, expect } from "vitest"
import { ImageStatusResponseSchema } from "./image"

describe("ImageStatusResponseSchema", () => {
  it("parses a shaped image status", () => {
    const parsed = ImageStatusResponseSchema.safeParse({ image: { id: "img-7", name: "snap-1", status: "saving" } })
    expect(parsed.success).toBe(true)
  })

  it("accepts a null name", () => {
    const parsed = ImageStatusResponseSchema.safeParse({ image: { id: "img-7", name: null, status: "active" } })
    expect(parsed.success).toBe(true)
  })

  it("rejects a missing status", () => {
    const parsed = ImageStatusResponseSchema.safeParse({ image: { id: "img-7", name: "snap-1" } })
    expect(parsed.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/types/image.test.ts"`
Expected: FAIL — cannot resolve `./image`.

- [ ] **Step 3: Write the schema and client methods**

Create `types/image.ts`:

```ts
import { z } from "zod"

export const ImageStatusSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  status: z.string(),
})
export type ImageStatus = z.infer<typeof ImageStatusSchema>

export const ImageStatusResponseSchema = z.object({ image: ImageStatusSchema })

export const SnapshotResponseSchema = z.object({ image_id: z.string().nullable() })
export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>
```

In `apiClient.ts`, import the schemas:

```ts
import { ImageStatus, ImageStatusResponseSchema, SnapshotResponseSchema } from "./types/image"
```

Add to `instanceApi` (after `resizeInstance`):

```ts
    // Snapshot: create a Glance image of the server. Returns the new image id so
    // the caller can poll its status; the modal stays open until it is active.
    createSnapshot: (id: string, name: string): Promise<{ image_id: string | null }> =>
      apiClient
        .post<{ data: unknown }>(`instances/${id}/snapshot`, { snapshot: { name } })
        .then((res) => {
          checkForApiError(res.data)
          return parseOrThrow(SnapshotResponseSchema, res.data, "snapshot")
        })
        .catch((err) => {
          throw detailedError(err)
        }),
```

Add a new `imagesApi` group before the `return`:

```ts
  const imagesApi = {
    getStatus: (id: string): Promise<ImageStatus> =>
      apiClient.get<{ data: unknown }>(`images/${id}`).then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(ImageStatusResponseSchema, res.data, "image status").image
      }),
  }

  return { instances: instanceApi, formOptions: formOptionsApi, images: imagesApi }
```

- [ ] **Step 4: Run test + typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/types/image.test.ts && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`
Expected: PASS; no new tsc errors.

- [ ] **Step 5: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/javascript/widgets/app/types/image.ts plugins/compute_njq/app/javascript/widgets/app/types/image.test.ts plugins/compute_njq/app/javascript/widgets/app/apiClient.ts && git commit -m 'feat(compute): add snapshot and image-status api client methods'"
```

---

## Task 5: Query key + image-status query hook

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/hooks/queryKeys.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useImageStatusQuery.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/hooks/useImageStatusQuery.test.tsx`

**Interfaces:**
- Consumes: `apiClient.images.getStatus(id)` (Task 4).
- Produces: `useImageStatusQuery(apiClient, imageId, { enabled }) → UseQueryResult<ImageStatus>`; stops its own `refetchInterval` once a terminal status (`active`/`killed`/`deleted`/`error`) is observed.
- Produces: `QUERY_KEYS.imageStatus(id)`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import { useImageStatusQuery, isTerminalStatus } from "./useImageStatusQuery"

function wrapper() {
  const qc = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("isTerminalStatus", () => {
  it("treats active/killed/deleted/error as terminal", () => {
    expect(isTerminalStatus("active")).toBe(true)
    expect(isTerminalStatus("error")).toBe(true)
    expect(isTerminalStatus("saving")).toBe(false)
    expect(isTerminalStatus("queued")).toBe(false)
  })
})

describe("useImageStatusQuery", () => {
  it("does not fetch when disabled (no image id yet)", () => {
    const getStatus = vi.fn()
    const api = { images: { getStatus } } as unknown as ComputeApi
    renderHook(() => useImageStatusQuery(api, null, { enabled: false }), { wrapper: wrapper() })
    expect(getStatus).not.toHaveBeenCalled()
  })

  it("fetches the status when enabled with an image id", async () => {
    const getStatus = vi.fn().mockResolvedValue({ id: "img-7", name: "snap-1", status: "saving" })
    const api = { images: { getStatus } } as unknown as ComputeApi
    const { result } = renderHook(() => useImageStatusQuery(api, "img-7", { enabled: true }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.status).toBe("saving"))
    expect(getStatus).toHaveBeenCalledWith("img-7")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useImageStatusQuery.test.tsx"`
Expected: FAIL — cannot resolve `./useImageStatusQuery`.

- [ ] **Step 3: Write the hook**

Add to `queryKeys.ts` (inside `QUERY_KEYS`):

```ts
  imageStatus: (id: string) => ["image", id, "status"] as const,
```

Create `hooks/useImageStatusQuery.ts`:

```ts
import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { ImageStatus } from "../types/image"

// Glance image statuses that end the snapshot: active is success; the rest are
// failures. Anything else (queued/saving/…) means still building → keep polling.
const TERMINAL = new Set(["active", "killed", "deleted", "error"])

export function isTerminalStatus(status: string | undefined): boolean {
  return status != null && TERMINAL.has(status)
}

// Polls a Glance image's status while a snapshot is being built. Enabled only
// while the modal is in its "creating" state; stops polling itself once the
// status reaches a terminal value so a finished (or failed) snapshot does not
// keep hitting the BFF.
export function useImageStatusQuery(apiClient: ComputeApi, imageId: string | null, opts: { enabled: boolean }) {
  return useQuery<ImageStatus, Error>({
    queryKey: QUERY_KEYS.imageStatus(imageId ?? "none"),
    queryFn: () => apiClient.images.getStatus(imageId as string),
    enabled: opts.enabled && !!imageId,
    refetchInterval: (data, query) => {
      if (!data || query.state.error) return false
      return isTerminalStatus(data.status) ? false : 2000
    },
    refetchOnWindowFocus: false,
  })
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useImageStatusQuery.test.tsx && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`
Expected: PASS; no new tsc errors.

- [ ] **Step 5: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/javascript/widgets/app/hooks/queryKeys.ts plugins/compute_njq/app/javascript/widgets/app/hooks/useImageStatusQuery.ts plugins/compute_njq/app/javascript/widgets/app/hooks/useImageStatusQuery.test.tsx && git commit -m 'feat(compute): add image-status polling query for compute_njq'"
```

---

## Task 6: Snapshot mutation hook

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateSnapshotMutation.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateSnapshotMutation.test.tsx`

**Interfaces:**
- Consumes: `apiClient.instances.createSnapshot(id, name)` (Task 4).
- Produces: `useCreateSnapshotMutation(apiClient) → UseMutationResult<{ image_id: string | null }, Error, { id: string; name: string }>`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../apiClient"
import { useCreateSnapshotMutation } from "./useCreateSnapshotMutation"

function wrapper() {
  const qc = new QueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe("useCreateSnapshotMutation", () => {
  it("calls createSnapshot and returns the image id", async () => {
    const createSnapshot = vi.fn().mockResolvedValue({ image_id: "img-7" })
    const api = { instances: { createSnapshot } } as unknown as ComputeApi
    const { result } = renderHook(() => useCreateSnapshotMutation(api), { wrapper: wrapper() })

    let returned: { image_id: string | null } | undefined
    await act(async () => {
      returned = await result.current.mutateAsync({ id: "s1", name: "snap-1" })
    })

    expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1")
    expect(returned).toEqual({ image_id: "img-7" })
  })

  it("surfaces an error from createSnapshot", async () => {
    const createSnapshot = vi.fn().mockRejectedValue(new Error("quota exceeded"))
    const api = { instances: { createSnapshot } } as unknown as ComputeApi
    const { result } = renderHook(() => useCreateSnapshotMutation(api), { wrapper: wrapper() })

    act(() => {
      result.current.mutate({ id: "s1", name: "snap-1" })
    })
    await waitFor(() => expect(result.current.error?.message).toBe("quota exceeded"))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateSnapshotMutation.test.tsx"`
Expected: FAIL — cannot resolve `./useCreateSnapshotMutation`.

- [ ] **Step 3: Write the hook**

Create `hooks/useCreateSnapshotMutation.ts`:

```ts
import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"

export interface SnapshotVars {
  id: string
  name: string
}

// Factory kept separate from the hook for unit testing, mirroring the resize
// mutation. No optimistic cache update: a snapshot does not change the instance
// row; the modal polls the new image's status instead.
export function buildCreateSnapshotMutationOptions(
  api: ComputeApi
): UseMutationOptions<{ image_id: string | null }, Error, SnapshotVars> {
  return {
    mutationFn: ({ id, name }) => api.instances.createSnapshot(id, name),
  }
}

export function useCreateSnapshotMutation(api: ComputeApi) {
  return useMutation(buildCreateSnapshotMutationOptions(api))
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateSnapshotMutation.test.tsx && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`
Expected: PASS; no new tsc errors.

- [ ] **Step 5: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateSnapshotMutation.ts plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateSnapshotMutation.test.tsx && git commit -m 'feat(compute): add create-snapshot mutation for compute_njq'"
```

---

## Task 7: SnapshotModal (state machine + polling)

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SnapshotModal.tsx`
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SnapshotModal.test.tsx`

**Interfaces:**
- Consumes: `useCreateSnapshotMutation` (Task 6), `useImageStatusQuery` + `isTerminalStatus` (Task 5), `Modal` (`lib/components/Modal`), `InlineLoading` (`./tabs/InlineLoading`), `Instance`.
- Produces: `SnapshotModal({ instance, apiClient, onClose })` React component.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { SnapshotModal } from "./SnapshotModal"

// Control the polled status per test.
let polledStatus = "saving"
vi.mock("../../../hooks/useImageStatusQuery", async (orig) => {
  const actual = (await orig()) as object
  return {
    ...actual,
    useImageStatusQuery: (_api: unknown, imageId: string | null, opts: { enabled: boolean }) => ({
      data: opts.enabled && imageId ? { id: imageId, name: "snap-1", status: polledStatus } : undefined,
    }),
  }
})

const instance = { id: "s1", name: "web-01" } as Instance

function renderModal(createSnapshot = vi.fn().mockResolvedValue({ image_id: "img-7" })) {
  const onClose = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <SnapshotModal
        instance={instance}
        apiClient={{ instances: { createSnapshot }, images: { getStatus: vi.fn() } } as unknown as ComputeApi}
        onClose={onClose}
      />
    </QueryClientProvider>
  )
  return { createSnapshot, onClose }
}

describe("SnapshotModal", () => {
  beforeEach(() => {
    polledStatus = "saving"
  })

  it("keeps Create disabled until a name is entered", () => {
    renderModal()
    expect(screen.getByRole("button", { name: /create snapshot/i })).toBeDisabled()
  })

  it("moves to a progress state after submit and does NOT close", async () => {
    const { createSnapshot, onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    await waitFor(() => expect(createSnapshot).toHaveBeenCalledWith("s1", "snap-1"))
    // Progress indicator shows; modal stays open.
    await waitFor(() => expect(document.querySelectorAll(".spinner").length).toBeGreaterThan(0))
    expect(onClose).not.toHaveBeenCalled()
  })

  it("shows a success state when the image becomes active", async () => {
    polledStatus = "active"
    const { onClose } = renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByText(/snapshot ready/i)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("shows an error state when the image ends in a failure status", async () => {
    polledStatus = "error"
    renderModal()
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("surfaces a create error and stays on the form", async () => {
    const createSnapshot = vi.fn().mockRejectedValue(new Error("quota exceeded"))
    renderModal(createSnapshot)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "snap-1" } })
    fireEvent.click(screen.getByRole("button", { name: /create snapshot/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent("quota exceeded")
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SnapshotModal.test.tsx"`
Expected: FAIL — cannot resolve `./SnapshotModal`.

- [ ] **Step 3: Write the component**

Create `SnapshotModal.tsx`:

```tsx
import { useEffect, useState } from "react"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useCreateSnapshotMutation } from "../../../hooks/useCreateSnapshotMutation"
import { useImageStatusQuery, isTerminalStatus } from "../../../hooks/useImageStatusQuery"
import { InlineLoading } from "./tabs/InlineLoading"

interface SnapshotModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

type Phase = "form" | "creating" | "success" | "error"

// Create Snapshot: unlike the fire-and-close modals, this one stays open after
// submit. It posts createImage, then polls the new Glance image's status and
// shows progress until the image is active (success) or fails (error). The user
// closes it manually — it never auto-closes.
export function SnapshotModal({ instance, apiClient, onClose }: SnapshotModalProps) {
  const mutation = useCreateSnapshotMutation(apiClient)
  const [name, setName] = useState("")
  const [phase, setPhase] = useState<Phase>("form")
  const [imageId, setImageId] = useState<string | null>(null)

  const statusQuery = useImageStatusQuery(apiClient, imageId, { enabled: phase === "creating" })
  const status = statusQuery.data?.status

  // Drive the state machine from the polled status while creating.
  useEffect(() => {
    if (phase !== "creating" || !isTerminalStatus(status)) return
    setPhase(status === "active" ? "success" : "error")
  }, [phase, status])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed || mutation.isPending) return
    mutation.mutate(
      { id: instance.id, name: trimmed },
      {
        onSuccess: ({ image_id }) => {
          // No image id means we can neither poll nor confirm — treat as error
          // rather than spin forever.
          if (!image_id) {
            setPhase("error")
            return
          }
          setImageId(image_id)
          setPhase("creating")
        },
      }
    )
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal" aria-labelledby="snapshot-title">
      <Modal.Header closeButton>
        <Modal.Title id="snapshot-title">Create Snapshot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && phase !== "error" && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}

        {phase === "form" && (
          <>
            {mutation.error && (
              <div className="alert alert-danger" role="alert">
                {mutation.error.message}
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="snapshot-name">
                Name
              </label>
              <input
                id="snapshot-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </>
        )}

        {phase === "creating" && (
          <div role="status">
            <InlineLoading /> Creating snapshot… ({status ?? "starting"})
          </div>
        )}

        {phase === "success" && (
          <div className="alert alert-success" role="status">
            Snapshot ready.
          </div>
        )}

        {phase === "error" && (
          <div className="alert alert-danger" role="alert">
            {mutation.error?.message ?? "The snapshot could not be created."}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {phase === "success" ? "Close" : "Cancel"}
        </button>
        {phase === "form" && (
          <button type="button" className="btn btn-primary" disabled={!name.trim() || mutation.isPending} onClick={submit}>
            {mutation.isPending ? "Creating…" : "Create Snapshot"}
          </button>
        )}
        {phase === "error" && (
          <button type="button" className="btn btn-primary" onClick={() => { mutation.reset(); setPhase("form") }}>
            Try again
          </button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
```

> Note: the duplicated `mutation.error` block is intentional in the draft above — collapse it when implementing so the create error renders once, on the form. The test asserts exactly one `role="alert"` with the message while on the form.

- [ ] **Step 4: Clean up the error rendering**

Remove the top-level `mutation.error && phase !== "error"` block; keep only the one inside the `form` phase (and the `error` phase block). Re-run the test.

- [ ] **Step 5: Run test + typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SnapshotModal.test.tsx && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`
Expected: PASS; no new tsc errors.

- [ ] **Step 6: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SnapshotModal.tsx plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SnapshotModal.test.tsx && git commit -m 'feat(compute): add snapshot modal with progress polling for compute_njq'"
```

---

## Task 8: Wire the action into the registry + menu

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts` (new `key`, `modal` union, registry entry)
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx` (import + render)
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts` (extend) or the menu test

**Interfaces:**
- Consumes: `SnapshotModal` (Task 7); `visibleActions` policy filtering.
- Produces: registry entry `{ key: "create_image", modal: "snapshot" }`.

- [ ] **Step 1: Write the failing test**

Add to the existing `instanceActions` test (find it first; if none covers the registry, add to `InstanceActionsMenu.test.tsx`). Example assertion against the registry:

```ts
import { INSTANCE_ACTIONS } from "./instanceActions"

it("registers a create snapshot action gated by the snapshot policy", () => {
  const action = INSTANCE_ACTIONS.find((a) => a.key === "create_image")
  expect(action).toBeDefined()
  expect(action?.policy).toBe("compute_njq:instance_snapshot")
  expect(action?.modal).toBe("snapshot")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts"`
Expected: FAIL — no `create_image` action.

- [ ] **Step 3: Implement**

In `instanceActions.ts`:
- Add `"create_image"` to the `key` union.
- Add `"snapshot"` to the `modal?` union: `modal?: "editName" | "editTags" | "resetStatus" | "resize" | "snapshot"`.
- Add the registry entry in the `power` group (after `resize`, before `confirm_resize`):

```ts
  {
    key: "create_image",
    label: "Create Snapshot",
    policy: "compute_njq:instance_snapshot",
    group: "power",
    isAvailable: () => true,
    modal: "snapshot",
  },
```

In `InstanceActionsMenu.tsx`:
- Import: `import { SnapshotModal } from "./SnapshotModal"`
- Render (after the `resize` block, ~line 174):

```tsx
      {activeModal === "snapshot" && (
        <SnapshotModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />
      )}
```

- [ ] **Step 4: Run test + typecheck**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"`
Expected: PASS; no new tsc errors.

- [ ] **Step 5: Commit**

```bash
docker exec ws-ide bash -c "cd /workspace/elektra && git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts && git commit -m 'feat(compute): wire create-snapshot action into compute_njq menu'"
```

---

## Final Verification

1. **RSpec (plugin):** `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq"` → all green.
2. **Vitest (plugin):** `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq"` → all green.
3. **Typecheck:** `docker exec elektra bash -c "cd /app && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json"` → no new errors.
4. **Manual (port 8010):** open an instance's action menu → "Create Snapshot" appears only with both roles. Submit a name → modal stays open, shows "Creating snapshot… (saving)", then "Snapshot ready" when the image goes active; the new image shows up in Glance. A backend failure (e.g. quota) shows the error on the form.
