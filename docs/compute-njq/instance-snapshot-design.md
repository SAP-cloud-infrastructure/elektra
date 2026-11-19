# Instance Snapshot (Create Image) for compute_njq — Design

## Context

Creating a snapshot of an instance means asking Nova to capture the server's
current disk as a new **Glance image**. In the legacy compute plugin this is the
"Create Image / Snapshot" form: a single `name` field, gated by two roles, that
posts `createImage` and closes. The new compute_njq plugin needs the same
capability, but with one deliberate behavioural change requested by the team:

> **The modal must not auto-close.** After submitting, it stays open, shows
> progress while the snapshot is being built, and only then shows a success
> state. The user closes it manually.

This makes Snapshot the first compute_njq modal with its own lifecycle and
server-status polling — unlike ResizeModal / EditNameModal, which fire a
mutation and close immediately.

Snapshot is the next step-3 ("complex form modal") operation in
[`lifecycle-actions-design.md`](lifecycle-actions-design.md). Web Console is
intentionally deferred.

## Why `createImage` is asynchronous

`POST /servers/{id}/action {"createImage": {...}}` returns almost immediately
with only an acknowledgement — **it does not return the finished image**. Nova
starts a background task; the new Glance image then transitions through
`queued → saving → active` (or a terminal failure: `killed`, `deleted`,
`error`). "Wait until the snapshot is finished with progress, then success"
therefore means: capture the new image's id, then poll its Glance `status`
until it reaches a terminal state.

## Scope & behaviour

- **Trigger:** a new instance action `createImage`, label **"Create Snapshot"**,
  registered in the client action registry and gated server-side.
- **Input:** a single `name` field. Metadata is `{}` — this is true legacy
  parity (the legacy `new_snapshot.html.haml` form has only a name input).
- **Policy gate (both roles, legacy parity):**
  `compute:image_admin` **AND** `object_storage:container_create`. In OpenStack
  policy terms (verified against existing `plugins/*/config/policy.json`):
  `role:image_admin and (role:admin or role:objectstore_admin)`. When the user
  lacks the rights, the action is not offered (client) and rejected (server).
- **No auto-close.** After the `createImage` POST the modal stays open and runs
  a small state machine:
  1. **`form`** — name input + "Create Snapshot" button.
  2. **`creating`** — the POST returned an `image_id`; show a progress
     indicator and poll the image status (`queued`/`saving`). No submit button.
  3. **`success`** — the image reached `active`; green success state. The user
     closes the modal manually.
  4. **`error`** — the POST failed, or the image reached a terminal failure
     status (`killed`/`deleted`/`error`); show an error alert, return to `form`
     so the user can retry.

## How the new image is identified

`createImage` returns the new image's URL in the HTTP **`Location`** response
header (`.../images/{id}`). Elektron exposes the raw response header:
`Elektron::Containers::Response` has `attr_accessor :header`, populated from the
underlying `Net::HTTPResponse` (so `response.header["Location"]` indexes
case-insensitively). The service extracts the last path segment as the id.

**Fallback:** if no `Location` header is present, look the image up by name via
Glance (`glance_images("name" => name)`) and take the newest by `created_at`.
This keeps the flow working even if a backend omits the header.

> Verification note: the exact header accessor (`response.header["Location"]`)
> is pinned by a RED test in the implementation plan, since the legacy code does
> not read this header and we should not assume the shape untested.

## Status polling

Per the chosen approach, status is read through a **generic image endpoint**,
not an instance-coupled one — it is reusable for future image features and not
tied to the snapshot flow.

- **BFF read:** reuse the existing `glance_image(id)` service method
  (`GET images/{id}`), shaped down to `{ id, name, status }`.
- **Terminal states:** `active` → success (stop polling);
  `killed` / `deleted` / `error` → error (stop polling); anything else
  (`queued`, `saving`, …) → keep polling.
- **Client:** a TanStack Query with `refetchInterval` (~2s), `enabled` only in
  the `creating` state, that disables its own interval once a terminal status is
  observed.

## Architecture

### 1. Service layer

New module `compute_njq_services/snapshot.rb`, `include`d into
`compute_njq_service.rb` (it spans Nova + Glance, so it is its own module rather
than part of `instance_actions.rb`):

```ruby
# Create a snapshot (Glance image) of a server. Nova's createImage action
# returns the new image's URL in the Location response header; we extract the
# id so the client can poll its status. Falls back to a name lookup when the
# header is absent.
def create_instance_snapshot(id, name)
  name = name.to_s.strip
  raise ComputeNjq::RequestError, "Snapshot name must not be blank" if name.empty?

  response = elektron_nova.post("servers/#{id}/action") do
    { "createImage" => { "name" => name, "metadata" => {} } }
  end
  image_id = image_id_from_location(response) || newest_image_id_by_name(name)
  { image_id: image_id }
end

# Image status shaped for the client's snapshot poll.
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
  images = glance_images("name" => name)
  images.max_by { |i| i["created_at"].to_s }&.dig("id")
end
```

(`glance_image` and `glance_images` already exist in `glance.rb`.)

### 2. Controller & routes

Creating the snapshot is an instance action (stays in `InstancesController`);
only the status poll is generic.

```ruby
# POST /:scope/compute-njq/api/instances/:id/snapshot   body { snapshot: { name } }
def snapshot
  return unless authorize!("compute_njq:instance_snapshot")

  handle_api_call { compute_service.create_instance_snapshot(params.require(:id), snapshot_params[:name]) }
end

# private
def snapshot_params
  params.require(:snapshot).permit(:name).to_h.symbolize_keys
end
```

New generic `ImagesController`:

```ruby
# GET /:scope/compute-njq/api/images/:id  → { image: { id, name, status } }
def show
  return unless authorize!("compute_njq:image_get")

  handle_api_call { { image: compute_service.find_image_status(params.require(:id)) } }
end
```

Routes:

```ruby
resources :instances, ... do
  member do
    post :snapshot
    # ... existing members ...
  end
end
resources :images, only: %i[show]
```

### 3. Policy

```json
"compute_njq:instance_snapshot": "role:image_admin and (role:admin or role:objectstore_admin)",
"compute_njq:image_get": "@"
```

The two role terms mirror the legacy gate (`compute:image_admin` AND
`object_storage:container_create`), expressed with the same `role:` atoms used
in `plugins/image/config/policy.json` and
`plugins/object_storage/config/policy.json`.

### 4. Frontend

- **`instanceActions.ts`:** add
  `{ key: "createImage", label: "Create Snapshot", policy: "compute_njq:instance_snapshot", group: <appropriate>, modal: "snapshot", isAvailable: ... }`.
  Extend the `modal?` discriminator union with `"snapshot"`.
- **`InstanceActionsMenu.tsx`:** map `modal === "snapshot"` → `SnapshotModal`.
- **API client:** `instances.createSnapshot(id, name) → { image_id }` and
  `images.getStatus(id) → { id, name, status }` (Zod-validated).
- **Hooks:** `useCreateSnapshot()` mutation; `useImageStatusQuery(apiClient,
  imageId, { enabled })` with `refetchInterval` disabled on terminal status.
- **`SnapshotModal.tsx`:** state machine `form | creating | success | error`:
  - `form`: name input + "Create Snapshot".
  - `creating`: shared `InlineLoading` + "Creating snapshot… (`<status>`)".
  - `success`: green alert "Snapshot ready", Close button.
  - `error`: alert with the message, back to `form`.
  - status mapping: `active → success`;
    `killed`/`deleted`/`error → error`; otherwise keep polling.

## Error handling

- Blank name → `ComputeNjq::RequestError` (400) before any backend call;
  surfaced in the modal.
- `createImage` POST failure (quota, policy, backend) → upstream status passed
  through `handle_api_call`; modal shows the error and stays on `form`.
- Image never resolvable (no `Location`, no name match) → `image_id` is `nil`;
  the modal treats a missing id as an error state rather than polling forever.
- Terminal failure status from Glance → `error` state.

## Testing (TDD — each RED first)

**Service spec** (`snapshot_spec.rb` or the service spec):
- `create_instance_snapshot` extracts `image_id` from the `Location` header
  (pins `response.header["Location"]`).
- falls back to the newest image by name when no header is present.
- blank name raises `ComputeNjq::RequestError` and makes no backend call.
- `find_image_status` shapes Glance output to `{ id, name, status }`; returns
  `nil` for a missing image.

**Controller spec** (`instances_controller_spec.rb`, new `images_controller_spec.rb`):
- `POST #snapshot` is policy-gated (403 + no service call without the right),
  forwards `name`, returns `{ image_id }`.
- `ImagesController#show` is reachable and returns the shaped status.

**Vitest** (`SnapshotModal.test.tsx`, `useImageStatusQuery` test):
- submitting moves `form → creating` and does **not** close the modal.
- `creating` shows the loading indicator and the current status text.
- a polled `active` status moves `creating → success`.
- a terminal failure status moves `creating → error`.
- `useImageStatusQuery` is enabled only in the `creating` state and stops once a
  terminal status is observed.

## Scope / notes

- One new generic read endpoint (`images#show`), one new instance member action
  (`instances#snapshot`), two policy rules.
- Reuses `glance_image`/`glance_images` — no new Elektron client.
- Web Console remains out of scope.
- Open verification points (resolved in the plan via RED tests / existing-rule
  inspection, not blockers for this design): the exact `Location` header
  accessor, and that the cross-plugin `role:` atoms resolve in the njq policy
  context.
