# Create-Instance Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a happy-path "create instance" flow to `compute_njq` — a BFF that serves searchable, lazily-loaded form options and a `POST /api/instances` endpoint, plus a React dialog that consumes them.

**Architecture:** New read endpoints (`flavors`, `images`, `keypairs`, `networks`, `security_groups`, `availability_zones`) extend the existing autonomous `ComputeNjqService` mixins; images support server-side `?q=`/marker search, the rest are client-side searchable. A single `ServerCreateAssembler` turns the validated UI payload into the Nova `POST /servers` body. The React dialog is a file-based TanStack route with one lazy query per field and a create mutation that invalidates the instance list.

**Tech Stack:** Ruby 3.4 / Rails 8.1, Elektron OpenStack client (Nova µv 2.67), RSpec · React 19, TanStack Router/Query v4, Zod 4, Bootstrap 5, Vitest 4.

**Spec:** `docs/compute-njq/create-instance-spec.md`

## Global Constraints

- **Autonomy (core rule):** no `services.networking`/`image`/`block_storage`/`identity` calls in `plugins/compute_njq`. Use only the plugin's own `elektron_nova`/`elektron_neutron`/`elektron_glance` handles. Acceptance: `grep -rn "services\.\(networking\|image\|block_storage\|identity\)" plugins/compute_njq` → no hits.
- **Language:** all code, comments, specs in English.
- **BFF shape:** every API action goes through `handle_api_call` and returns `{ <resource>: ... }`; errors are the `{ error, code, message }` envelope.
- **No HTML-as-JSON:** the BFF returns plain data; React decides markup.
- **v1 scope:** exactly one instance per create. `max_count = 1` is set in exactly one place (`ServerCreateAssembler`).
- **JS/TS:** Prettier (120 cols, 2 spaces, no semicolons, double quotes); strict TS; functional components; Zod `safeParse` at runtime per endpoint.
- **Nova microversion:** `2.67` (already set on `elektron_nova`).
- **Dev container:** RSpec via `bin/workspace bundle exec rspec <path>`, JS tests via `bin/workspace pnpm test <path>`.

## Review Focus

- **Empty option lists** (project has no keypairs / no private networks): the dialog must still open and show an empty, non-broken select rather than crash — covered in Task 12 (`SearchableSelect` empty-message test) and Task 13 (form) tests.
- **Image search with no `q`** (first open) vs. a `q` that matches nothing: the BFF must return the first page resp. an empty `images` array + `next_marker: null`, not error — covered in Task 3 (`glance_images` with filter) and Task 7 (controller) tests.
- **Create with a missing required field** reaching the BFF despite client validation: `ServerCreateAssembler` must raise `ComputeNjq::RequestError` → HTTP 400, not build a half-payload — covered in Task 5 (assembler raises) and Task 8 (controller 400 envelope).
- **Upstream Nova error on create** (quota exceeded, invalid flavor/image combo): must pass through with the original status code via the envelope, form stays open — covered in Task 8 (controller passes the 403 through) and Task 13 (form shows `alert-danger` on mutation error).
- **`user_data` present:** must be Base64-encoded exactly once in the Nova payload — covered in Task 5 (`ServerCreateAssembler`).

---

## File Structure

**Backend (Ruby):**
- `plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb` — add `nova_keypairs`, `nova_availability_zones`, `nova_create_server`.
- `.../compute_njq_services/neutron.rb` — add `neutron_networks`, `neutron_security_groups`.
- `.../compute_njq_services/glance.rb` — extend `glance_images` with `q`/`marker`/`limit` + marker.
- `.../compute_njq_services/form_options_assembler.rb` — **new**: map raw hashes → structured option shapes.
- `.../compute_njq_services/server_create_assembler.rb` — **new**: validate payload → Nova `POST /servers` body.
- `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` — include the two new mixins.
- `plugins/compute_njq/app/controllers/compute_njq/api/form_options_controller.rb` — **new**: `flavors`/`images`/`keypairs`/`networks`/`security_groups`/`availability_zones`.
- `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb` — add `create`.
- `plugins/compute_njq/config/routes.rb` — new api routes.
- `plugins/compute_njq/config/policy.json` — add `compute_njq:instance_create`.

**Frontend (TS/React):**
- `.../widgets/app/types/formOptions.ts` — **new**: Zod schemas for flavor/image/keypair/network/secgroup/az.
- `.../widgets/app/types/createInstance.ts` — **new**: create payload schema.
- `.../widgets/app/apiClient.ts` — add `formOptions` + `instances.create`.
- `.../widgets/app/hooks/queryKeys.ts` — add form-option keys.
- `.../widgets/app/hooks/useFormOptionQueries.ts` — **new**: one lazy query per resource + images infinite.
- `.../widgets/app/hooks/useCreateInstanceMutation.ts` — **new**.
- `.../widgets/app/routes/instances/-components/SearchableSelect.tsx` — **new**: reusable searchable dropdown.
- `.../widgets/app/routes/instances/-components/CreateInstanceForm.tsx` — **new**.
- `.../widgets/app/routes/instances/new.tsx` — **new**: file-based route.
- `.../widgets/app/routes/instances/index.tsx` — add "Create New" button.

---

### Task 1: Nova mixin — keypairs & availability zones

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`

**Interfaces:**
- Consumes: `elektron_nova` (existing handle).
- Produces: `nova_keypairs -> Array<Hash>` (raw `keypair` hashes), `nova_availability_zones -> Array<Hash>` (raw `availabilityZoneInfo` hashes).

- [ ] **Step 1: Write the failing tests** — append to `nova_spec.rb`:

```ruby
describe "#nova_keypairs" do
  it "returns the keypair hashes unwrapped" do
    allow(elektron_nova).to receive(:get).with("os-keypairs").and_return(
      double("response", body: { "keypairs" => [{ "keypair" => { "name" => "my-key" } }] }),
    )
    expect(test_class.nova_keypairs).to eq([{ "name" => "my-key" }])
  end

  it "returns [] when there are no keypairs" do
    allow(elektron_nova).to receive(:get).with("os-keypairs").and_return(
      double("response", body: {}),
    )
    expect(test_class.nova_keypairs).to eq([])
  end
end

describe "#nova_availability_zones" do
  it "returns the availabilityZoneInfo array" do
    allow(elektron_nova).to receive(:get).with("os-availability-zone").and_return(
      double("response", body: { "availabilityZoneInfo" => [{ "zoneName" => "az-1" }] }),
    )
    expect(test_class.nova_availability_zones).to eq([{ "zoneName" => "az-1" }])
  end
end
```

(The `test_class`/`elektron_nova` `let`s follow the existing `glance_spec.rb` pattern; ensure `nova_spec.rb` has `let(:test_class) { Class.new { extend ServiceLayer::ComputeNjqServices::Nova } }` and a mocked `elektron_nova`.)

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`
Expected: FAIL (`nova_keypairs`/`nova_availability_zones` undefined).

- [ ] **Step 3: Implement** — add to the `Nova` module:

```ruby
# Keypairs for the scoped project; Nova wraps each entry under "keypair".
def nova_keypairs
  (elektron_nova.get("os-keypairs").body["keypairs"] || []).map { |k| k["keypair"] }
end

# Availability zones (name + state); the create form only needs available ones.
def nova_availability_zones
  elektron_nova.get("os-availability-zone").body["availabilityZoneInfo"] || []
end
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb
git commit -m "feat(compute): add nova keypairs and availability zones to compute_njq"
```

---

### Task 2: Neutron mixin — networks & security groups

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/neutron.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/neutron_spec.rb`

**Interfaces:**
- Consumes: `elektron_neutron`.
- Produces: `neutron_networks -> Array<Hash>` (attachable networks: `router:external == false`; tenant/shared scoping is already enforced by Neutron via the authenticated token, so no client-side tenant filter is applied), `neutron_security_groups -> Array<Hash>`.

- [ ] **Step 1: Write the failing tests** — append to `neutron_spec.rb`:

```ruby
describe "#neutron_networks" do
  it "requests non-external networks and returns them" do
    allow(elektron_neutron).to receive(:get).with("networks", { "router:external" => false }).and_return(
      double("response", body: { "networks" => [{ "id" => "n1", "name" => "private" }] }),
    )
    expect(test_class.neutron_networks).to eq([{ "id" => "n1", "name" => "private" }])
  end
end

describe "#neutron_security_groups" do
  it "returns the security groups array" do
    allow(elektron_neutron).to receive(:get).with("security-groups").and_return(
      double("response", body: { "security_groups" => [{ "id" => "sg1", "name" => "default" }] }),
    )
    expect(test_class.neutron_security_groups).to eq([{ "id" => "sg1", "name" => "default" }])
  end
end
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/neutron_spec.rb`
Expected: FAIL (methods undefined).

- [ ] **Step 3: Implement** — add to the `Neutron` module:

```ruby
# Private, attachable networks for the scoped project (no external networks).
def neutron_networks
  elektron_neutron.get("networks", { "router:external" => false }).body["networks"] || []
end

# Security groups visible to the scoped project (shared SGs included — no tenant filter).
def neutron_security_groups
  elektron_neutron.get("security-groups").body["security_groups"] || []
end
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/neutron_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/neutron.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/neutron_spec.rb
git commit -m "feat(compute): add neutron networks and security groups to compute_njq"
```

---

### Task 3: Glance mixin — image search & pagination

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/glance.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/glance_spec.rb`

**Interfaces:**
- Consumes: `elektron_glance`.
- Produces: `glance_images(filter = {}) -> Array<Hash>` (unchanged signature; now passes through `name`/`marker`/`limit` filter keys to Glance). The mixin stays a **thin passthrough** — it does not interpret `q`. Mapping the UI's `q` to a Glance `name` filter (only when present) happens in the Task 7 controller.

- [ ] **Step 1: Write the failing test** — append to `glance_spec.rb`:

```ruby
describe "#glance_images with a filter" do
  it "forwards the filter (name, marker, limit) to Glance" do
    allow(elektron_glance).to receive(:get).with("images", { "limit" => 50, "name" => "ubuntu" }).and_return(
      double("response", body: { "images" => [{ "id" => "i1", "name" => "ubuntu" }] }),
    )
    expect(test_class.glance_images({ "limit" => 50, "name" => "ubuntu" })).to eq(
      [{ "id" => "i1", "name" => "ubuntu" }],
    )
  end
end
```

- [ ] **Step 2: Run test, verify it fails**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/glance_spec.rb`
Expected: FAIL (the existing `glance_images` is stubbed only for `("images", {})`; this proves the filter is forwarded).

- [ ] **Step 3: Confirm/adjust implementation** — `glance_images` already takes `filter = {}` and forwards it:

```ruby
def glance_images(filter = {})
  elektron_glance.get("images", filter).body["images"] || []
end
```

No change needed if it already matches; if the signature lacks `filter`, add it.

- [ ] **Step 4: Run test, verify it passes**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/glance_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/glance.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/glance_spec.rb
git commit -m "test(compute): cover glance_images filter forwarding in compute_njq"
```

---

### Task 4: FormOptionsAssembler — structured option shapes

**Files:**
- Create: `plugins/compute_njq/app/services/service_layer/compute_njq_services/form_options_assembler.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` (include mixin)
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/form_options_assembler_spec.rb`

**Interfaces:**
- Consumes: `nova_flavors`, `nova_keypairs`, `nova_availability_zones`, `neutron_networks`, `neutron_security_groups`, `glance_images`.
- Produces:
  - `form_flavors -> [{ id:, name:, vcpus:, ram:, disk:, hypervisor_type: }]`
  - `form_keypairs -> [{ name: }]`
  - `form_availability_zones -> [{ name: }]` (available only)
  - `form_networks -> [{ id:, name: }]`
  - `form_security_groups -> [{ id:, name: }]`
  - `form_images(q:, marker:, limit:) -> { images: [{ id:, name:, visibility:, hypervisor_type:, min_disk:, size: }], next_marker: String|nil }`

- [ ] **Step 1: Write the failing tests** — new spec:

```ruby
# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::FormOptionsAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::FormOptionsAssembler
    end
  end

  describe "#form_flavors" do
    it "maps raw nova flavors to the structured shape" do
      allow(test_class).to receive(:nova_flavors).and_return([
        { "id" => "f1", "name" => "m1.small", "vcpus" => 2, "ram" => 2048, "disk" => 20,
          "extra_specs" => { "capabilities:hypervisor_type" => "QEMU" } },
      ])
      expect(test_class.form_flavors).to eq([
        { id: "f1", name: "m1.small", vcpus: 2, ram: 2048, disk: 20, hypervisor_type: "kvm" },
      ])
    end
  end

  describe "#form_keypairs" do
    it "maps to name-only" do
      allow(test_class).to receive(:nova_keypairs).and_return([{ "name" => "k1" }])
      expect(test_class.form_keypairs).to eq([{ name: "k1" }])
    end
  end

  describe "#form_availability_zones" do
    it "keeps only available zones, mapped to name" do
      allow(test_class).to receive(:nova_availability_zones).and_return([
        { "zoneName" => "az-1", "zoneState" => { "available" => true } },
        { "zoneName" => "az-2", "zoneState" => { "available" => false } },
      ])
      expect(test_class.form_availability_zones).to eq([{ name: "az-1" }])
    end
  end

  describe "#form_networks" do
    it "maps to id + name" do
      allow(test_class).to receive(:neutron_networks).and_return([{ "id" => "n1", "name" => "private" }])
      expect(test_class.form_networks).to eq([{ id: "n1", name: "private" }])
    end
  end

  describe "#form_security_groups" do
    it "maps to id + name" do
      allow(test_class).to receive(:neutron_security_groups).and_return([{ "id" => "sg1", "name" => "default" }])
      expect(test_class.form_security_groups).to eq([{ id: "sg1", name: "default" }])
    end
  end

  describe "#form_images" do
    it "maps images and returns the last id as next_marker when a full page is returned" do
      allow(test_class).to receive(:glance_images).with({ "limit" => 2 }).and_return([
        { "id" => "i1", "name" => "ubuntu", "visibility" => "public", "os_hash_value" => nil,
          "hypervisor_type" => "kvm", "min_disk" => 10, "size" => 1024 },
        { "id" => "i2", "name" => "debian", "visibility" => "public",
          "hypervisor_type" => "kvm", "min_disk" => 10, "size" => 2048 },
      ])
      result = test_class.form_images(limit: 2)
      expect(result[:images].first).to eq(
        { id: "i1", name: "ubuntu", visibility: "public", hypervisor_type: "kvm", min_disk: 10, size: 1024 },
      )
      expect(result[:next_marker]).to eq("i2")
    end

    it "returns next_marker nil when fewer than limit images come back" do
      allow(test_class).to receive(:glance_images).with({ "limit" => 50, "name" => "zzz" }).and_return([])
      expect(test_class.form_images(q: "zzz", limit: 50)).to eq({ images: [], next_marker: nil })
    end
  end
end
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/form_options_assembler_spec.rb`
Expected: FAIL (`uninitialized constant ...FormOptionsAssembler`).

- [ ] **Step 3: Implement** — create the mixin:

```ruby
# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Maps raw Nova/Neutron/Glance hashes into the lean, structured option shapes
    # the create form consumes. No label/markup generation — the UI decides
    # presentation. This replaces the legacy grouped_* helpers' string-label logic
    # with explicit fields (hypervisor_type etc.) the React layer filters on.
    module FormOptionsAssembler
      # Nova reports hypervisor via extra_specs; normalise to a small vocabulary.
      HYPERVISOR_MAP = {
        "QEMU" => "kvm",
        "CH" => "kvm",
        "VMware vCenter Server" => "vmware",
        "ironic" => "baremetal",
      }.freeze

      def form_flavors
        nova_flavors.map do |f|
          raw_hv = f.dig("extra_specs", "capabilities:hypervisor_type")
          {
            id: f["id"],
            name: f["name"],
            vcpus: f["vcpus"],
            ram: f["ram"],
            disk: f["disk"],
            hypervisor_type: HYPERVISOR_MAP[raw_hv],
          }
        end
      end

      def form_keypairs
        nova_keypairs.map { |k| { name: k["name"] } }
      end

      def form_availability_zones
        nova_availability_zones
          .select { |az| az.dig("zoneState", "available") }
          .map { |az| { name: az["zoneName"] } }
      end

      def form_networks
        neutron_networks.map { |n| { id: n["id"], name: n["name"] } }
      end

      def form_security_groups
        neutron_security_groups.map { |sg| { id: sg["id"], name: sg["name"] } }
      end

      # q → Glance name filter; marker/limit → pagination. next_marker is the last
      # image id when a full page was returned, else nil (end of list).
      def form_images(q: nil, marker: nil, limit: 50)
        filter = { "limit" => limit }
        filter["name"] = q if q.present?
        filter["marker"] = marker if marker.present?

        raw = glance_images(filter)
        images = raw.map do |i|
          {
            id: i["id"],
            name: i["name"],
            visibility: i["visibility"],
            hypervisor_type: i["hypervisor_type"],
            min_disk: i["min_disk"],
            size: i["size"],
          }
        end

        { images: images, next_marker: raw.length == limit ? raw.last["id"] : nil }
      end
    end
  end
end
```

Then include it in `compute_njq_service.rb` alongside the existing mixins:

```ruby
include ComputeNjqServices::FormOptionsAssembler
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/form_options_assembler_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/form_options_assembler.rb \
        plugins/compute_njq/app/services/service_layer/compute_njq_service.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/form_options_assembler_spec.rb
git commit -m "feat(compute): add FormOptionsAssembler to compute_njq"
```

---

### Task 5: ServerCreateAssembler — payload validation & Nova mapping

**Files:**
- Create: `plugins/compute_njq/app/services/service_layer/compute_njq_services/server_create_assembler.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` (include mixin)
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/server_create_assembler_spec.rb`

**Interfaces:**
- Consumes: `nova_create_server(payload)` (Task 6), `ComputeNjq::RequestError`.
- Produces: `create_instance(attrs) -> Hash` (the created server body). `attrs` keys: `name`, `flavor_id`, `image_id`, `keypair`, `availability_zone`, `network_id`, `security_groups` (Array<String>), `user_data` (String|nil).

- [ ] **Step 1: Write the failing tests** — new spec:

```ruby
# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::ServerCreateAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::ServerCreateAssembler
    end
  end

  let(:valid_attrs) do
    {
      "name" => "web-01",
      "flavor_id" => "f1",
      "image_id" => "i1",
      "keypair" => "my-key",
      "availability_zone" => "az-1",
      "network_id" => "n1",
      "security_groups" => ["default"],
      "user_data" => "hello",
    }
  end

  describe "#create_instance" do
    it "builds the Nova payload and posts it" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end

      result = test_class.create_instance(valid_attrs)

      expect(result).to eq({ "id" => "s1" })
      expect(captured["name"]).to eq("web-01")
      expect(captured["flavorRef"]).to eq("f1")
      expect(captured["imageRef"]).to eq("i1")
      expect(captured["key_name"]).to eq("my-key")
      expect(captured["availability_zone"]).to eq("az-1")
      expect(captured["max_count"]).to eq(1)
      expect(captured["min_count"]).to eq(1)
      expect(captured["security_groups"]).to eq([{ "name" => "default" }])
      expect(captured["networks"]).to eq([{ "uuid" => "n1" }])
    end

    it "base64-encodes user_data exactly once" do
      allow(test_class).to receive(:nova_create_server) { |p| p }
      payload = test_class.create_instance(valid_attrs)
      expect(payload["user_data"]).to eq(Base64.strict_encode64("hello"))
    end

    it "omits user_data when blank" do
      allow(test_class).to receive(:nova_create_server) { |p| p }
      payload = test_class.create_instance(valid_attrs.merge("user_data" => ""))
      expect(payload).not_to have_key("user_data")
    end

    it "raises RequestError when a required field is missing" do
      expect { test_class.create_instance(valid_attrs.merge("flavor_id" => "")) }
        .to raise_error(ComputeNjq::RequestError, /flavor/)
    end

    it "rejects a name ending in dot+number" do
      expect { test_class.create_instance(valid_attrs.merge("name" => "web.1")) }
        .to raise_error(ComputeNjq::RequestError, /name/)
    end
  end
end
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/server_create_assembler_spec.rb`
Expected: FAIL (`uninitialized constant ...ServerCreateAssembler`).

- [ ] **Step 3: Implement** — create the mixin:

```ruby
# frozen_string_literal: true

require "base64"

module ServiceLayer
  module ComputeNjqServices
    # The single write-side transformation seam: validates the UI payload and
    # builds the Nova POST /servers body. This consolidates logic the legacy
    # plugin scattered across the controller and Compute::Server#attributes_for_create.
    module ServerCreateAssembler
      REQUIRED = %w[name flavor_id image_id keypair network_id].freeze
      # A Nova name must not look like "foo.123" (mirrors the legacy model rule).
      NAME_FORBIDDEN = /\A.*\.\d+\z/

      def create_instance(attrs)
        validate!(attrs)
        nova_create_server(build_payload(attrs))
      end

      private

      def validate!(attrs)
        REQUIRED.each do |key|
          raise ComputeNjq::RequestError, "#{key.sub('_id', '')} is required" if attrs[key].blank?
        end
        if attrs["name"].to_s.match?(NAME_FORBIDDEN)
          raise ComputeNjq::RequestError, "name must not end with a dot followed by a number"
        end
      end

      def build_payload(attrs)
        payload = {
          "name" => attrs["name"],
          "flavorRef" => attrs["flavor_id"],
          "imageRef" => attrs["image_id"],
          "key_name" => attrs["keypair"],
          "availability_zone" => attrs["availability_zone"],
          "max_count" => 1, # v1: exactly one instance. Single place to lift later.
          "min_count" => 1,
          "networks" => [{ "uuid" => attrs["network_id"] }],
        }
        payload["user_data"] = Base64.strict_encode64(attrs["user_data"]) if attrs["user_data"].present?

        groups = Array(attrs["security_groups"]).reject(&:blank?)
        payload["security_groups"] = groups.map { |name| { "name" => name } } if groups.any?

        payload.delete_if { |_k, v| v.blank? && v != 1 }
      end
    end
  end
end
```

Then include it in `compute_njq_service.rb`:

```ruby
include ComputeNjqServices::ServerCreateAssembler
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/server_create_assembler_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/server_create_assembler.rb \
        plugins/compute_njq/app/services/service_layer/compute_njq_service.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/server_create_assembler_spec.rb
git commit -m "feat(compute): add ServerCreateAssembler to compute_njq"
```

---

### Task 6: Nova mixin — create_server

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb`
- Test: `plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb`

**Interfaces:**
- Produces: `nova_create_server(payload) -> Hash` (posts `{ server: payload }` to `servers`, returns the created `server` body).

- [ ] **Step 1: Write the failing test** — append to `nova_spec.rb`:

```ruby
describe "#nova_create_server" do
  it "posts the payload wrapped under :server and returns the created server" do
    allow(elektron_nova).to receive(:post).with("servers").and_yield.and_return(
      double("response", body: { "server" => { "id" => "s1" } }),
    )
    expect(test_class.nova_create_server({ "name" => "web-01" })).to eq({ "id" => "s1" })
  end
end
```

(If `.and_yield` + block assertion is awkward, assert via a captured block instead; the production code uses `post("servers") { { server: payload } }`.)

- [ ] **Step 2: Run test, verify it fails**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb -e nova_create_server`
Expected: FAIL (undefined).

- [ ] **Step 3: Implement** — add to the `Nova` module:

```ruby
# Creates a server. Nova expects the attributes wrapped under "server".
def nova_create_server(payload)
  elektron_nova.post("servers") { { server: payload } }.body["server"]
end
```

- [ ] **Step 4: Run test, verify it passes**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb -e nova_create_server`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/nova.rb \
        plugins/compute_njq/spec/services/service_layer/compute_njq_services/nova_spec.rb
git commit -m "feat(compute): add nova_create_server to compute_njq"
```

---

### Task 7: FormOptions controller + routes

**Files:**
- Create: `plugins/compute_njq/app/controllers/compute_njq/api/form_options_controller.rb`
- Modify: `plugins/compute_njq/config/routes.rb`
- Test: `plugins/compute_njq/spec/controllers/api/form_options_controller_spec.rb`

**Interfaces:**
- Consumes: `compute_service` (from `Api::BaseController`), the `form_*` methods (Task 4).
- Produces: `GET api/form_options/flavors|keypairs|networks|security_groups|availability_zones` → `{ <resource>: [...] }`; `GET api/form_options/images?q=&marker=&limit=` → `{ images: [...], next_marker: ... }`.

- [ ] **Step 1: Write the failing tests** — new spec (mirror `instances_controller_spec.rb` setup: `routes { ComputeNjq::Engine.routes }`, `stub_authentication`, `services_mock`, `scoped_service`):

```ruby
# frozen_string_literal: true
require "spec_helper"

RSpec.describe ComputeNjq::Api::FormOptionsController, type: :controller do
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
      "Project", default_params[:domain_id], default_params[:project_id], default_params[:project_id],
    )
  end

  before do
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    allow(controller).to receive(:current_region).and_return("qa-de-1")
    controller.instance_variable_set(:@scoped_project_id, "project_123")
    allow(compute_service).to receive(:scoped).and_return(scoped_service)
  end

  it "returns flavors" do
    allow(scoped_service).to receive(:form_flavors).and_return([{ id: "f1", name: "m1.small" }])
    get :flavors, params: default_params
    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)).to eq("flavors" => [{ "id" => "f1", "name" => "m1.small" }])
  end

  it "returns images with search params and next_marker" do
    allow(scoped_service).to receive(:form_images).with(q: "ubuntu", marker: nil, limit: 50)
      .and_return({ images: [{ id: "i1" }], next_marker: nil })
    get :images, params: default_params.merge(q: "ubuntu")
    expect(response).to have_http_status(:success)
    body = JSON.parse(response.body)
    expect(body["images"]).to eq([{ "id" => "i1" }])
    expect(body["next_marker"]).to be_nil
  end

  it "returns keypairs" do
    allow(scoped_service).to receive(:form_keypairs).and_return([{ name: "k1" }])
    get :keypairs, params: default_params
    expect(JSON.parse(response.body)).to eq("keypairs" => [{ "name" => "k1" }])
  end
end
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/controllers/api/form_options_controller_spec.rb`
Expected: FAIL (`uninitialized constant ...FormOptionsController` / no route).

- [ ] **Step 3: Implement** — create the controller:

```ruby
# frozen_string_literal: true

module ComputeNjq
  module Api
    # Serves the create-form dropdown data. Small lists are returned whole (the
    # UI searches them client-side); images support server-side search + paging.
    class FormOptionsController < Api::BaseController
      def flavors
        handle_api_call { { flavors: compute_service.form_flavors } }
      end

      def keypairs
        handle_api_call { { keypairs: compute_service.form_keypairs } }
      end

      def networks
        handle_api_call { { networks: compute_service.form_networks } }
      end

      def security_groups
        handle_api_call { { security_groups: compute_service.form_security_groups } }
      end

      def availability_zones
        handle_api_call { { availability_zones: compute_service.form_availability_zones } }
      end

      def images
        handle_api_call do
          compute_service.form_images(
            q: params[:q].presence,
            marker: params[:marker].presence,
            limit: (params[:limit] || 50).to_i,
          )
        end
      end
    end
  end
end
```

Add to `config/routes.rb` inside `namespace :api`:

```ruby
get "form_options/flavors", to: "form_options#flavors"
get "form_options/images", to: "form_options#images"
get "form_options/keypairs", to: "form_options#keypairs"
get "form_options/networks", to: "form_options#networks"
get "form_options/security_groups", to: "form_options#security_groups"
get "form_options/availability_zones", to: "form_options#availability_zones"
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/controllers/api/form_options_controller_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/controllers/compute_njq/api/form_options_controller.rb \
        plugins/compute_njq/config/routes.rb \
        plugins/compute_njq/spec/controllers/api/form_options_controller_spec.rb
git commit -m "feat(compute): add form_options BFF endpoints to compute_njq"
```

---

### Task 8: instances#create endpoint + policy

**Files:**
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb`
- Modify: `plugins/compute_njq/config/routes.rb`
- Modify: `plugins/compute_njq/config/policy.json`
- Test: `plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb`

**Interfaces:**
- Consumes: `compute_service.create_instance(attrs)` (Task 5).
- Produces: `POST api/instances` → `{ instance: <created> }`; 400 on `ComputeNjq::RequestError`; upstream status on Nova errors.

- [ ] **Step 1: Write the failing tests** — append to `instances_controller_spec.rb`:

```ruby
describe "POST #create" do
  let(:create_params) do
    { name: "web-01", flavor_id: "f1", image_id: "i1", keypair: "my-key",
      availability_zone: "az-1", network_id: "n1", security_groups: ["default"], user_data: "" }
  end

  it "creates the instance and returns it" do
    allow(scoped_service).to receive(:create_instance).and_return({ "id" => "s1", "name" => "web-01" })
    post :create, params: default_params.merge(create_params)
    expect(response).to have_http_status(:success)
    expect(JSON.parse(response.body)).to eq("instance" => { "id" => "s1", "name" => "web-01" })
  end

  it "passes the permitted attributes to the service" do
    captured = nil
    allow(scoped_service).to receive(:create_instance) { |a| captured = a; { "id" => "s1" } }
    post :create, params: default_params.merge(create_params)
    expect(captured["name"]).to eq("web-01")
    expect(captured["security_groups"]).to eq(["default"])
  end

  it "renders a 400 envelope when the service rejects the payload" do
    allow(scoped_service).to receive(:create_instance).and_raise(ComputeNjq::RequestError.new("flavor is required"))
    post :create, params: default_params.merge(create_params.merge(flavor_id: ""))
    expect(response).to have_http_status(:bad_request)
    expect(JSON.parse(response.body)).to include("error" => "Request Error", "code" => 400)
  end

  it "passes through an upstream Nova quota error with its status" do
    allow(scoped_service).to receive(:create_instance).and_raise(
      Elektron::Errors::ApiResponse.new(double(code: 403, body: { "message" => "Quota exceeded" })),
    )
    post :create, params: default_params.merge(create_params)
    expect(response).to have_http_status(403)
    expect(JSON.parse(response.body)["code"]).to eq(403)
  end
end
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb -e "POST #create"`
Expected: FAIL (no `create` action / route).

- [ ] **Step 3: Implement** — add the action to `instances_controller.rb`:

```ruby
# POST /:scope/compute-njq/api/instances
def create
  handle_api_call { { instance: compute_service.create_instance(create_params) } }
end
```

Add a private helper next to `filter_params`:

```ruby
def create_params
  params.permit(
    :name, :flavor_id, :image_id, :keypair, :availability_zone, :network_id, :user_data,
    security_groups: [],
  ).to_h.stringify_keys
end
```

Update the route (`only: %i[index show]` → add `:create`):

```ruby
resources :instances, only: %i[index show create]
```

Add to `policy.json`:

```json
"compute_njq:instance_create": "@"
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb`
Expected: PASS (all, old + new).

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
        plugins/compute_njq/config/routes.rb plugins/compute_njq/config/policy.json \
        plugins/compute_njq/spec/controllers/api/instances_controller_spec.rb
git commit -m "feat(compute): add POST instances create endpoint to compute_njq"
```

---

### Task 9: Frontend types — form options & create payload (Zod)

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/types/formOptions.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/types/createInstance.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/types/formOptions.test.ts`

**Interfaces:**
- Produces: `FlavorSchema`, `ImageSchema`, `KeypairSchema`, `NetworkSchema`, `SecurityGroupSchema`, `AvailabilityZoneSchema`; response schemas `FlavorsResponseSchema` (`{ flavors }`), `ImagesResponseSchema` (`{ images, next_marker }`), etc.; types `Flavor`, `Image`, … `CreateInstancePayload`.

- [ ] **Step 1: Write the failing test**:

```ts
import { describe, it, expect } from "vitest"
import { FlavorSchema, ImagesResponseSchema, CreateInstanceSchema } from "./formOptions"
import { CreateInstancePayloadSchema } from "./createInstance"

describe("formOptions schemas", () => {
  it("accepts a valid flavor", () => {
    const parsed = FlavorSchema.safeParse({
      id: "f1", name: "m1.small", vcpus: 2, ram: 2048, disk: 20, hypervisor_type: "kvm",
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts an images response with next_marker null", () => {
    const parsed = ImagesResponseSchema.safeParse({ images: [], next_marker: null })
    expect(parsed.success).toBe(true)
  })
})

describe("CreateInstancePayloadSchema", () => {
  it("rejects a name ending in dot+number", () => {
    const parsed = CreateInstancePayloadSchema.safeParse({
      name: "web.1", flavor_id: "f1", image_id: "i1", keypair: "k", network_id: "n1",
      security_groups: [], user_data: "",
    })
    expect(parsed.success).toBe(false)
  })

  it("requires flavor_id", () => {
    const parsed = CreateInstancePayloadSchema.safeParse({
      name: "web-01", flavor_id: "", image_id: "i1", keypair: "k", network_id: "n1",
      security_groups: [], user_data: "",
    })
    expect(parsed.success).toBe(false)
  })
})
```

Note: `CreateInstanceSchema` import in the first `describe` is a typo guard — remove it; the test only needs `FlavorSchema`, `ImagesResponseSchema`, `CreateInstancePayloadSchema`.

- [ ] **Step 2: Run test, verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/types/formOptions.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `formOptions.ts`:

```ts
import { z } from "zod"

export const FlavorSchema = z.object({
  id: z.string(),
  name: z.string(),
  vcpus: z.number().nullable(),
  ram: z.number().nullable(),
  disk: z.number().nullable(),
  hypervisor_type: z.string().nullable(),
})

export const ImageSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  visibility: z.string().nullable(),
  hypervisor_type: z.string().nullable(),
  min_disk: z.number().nullable(),
  size: z.number().nullable(),
})

export const KeypairSchema = z.object({ name: z.string() })
export const NetworkSchema = z.object({ id: z.string(), name: z.string().nullable() })
export const SecurityGroupSchema = z.object({ id: z.string(), name: z.string() })
export const AvailabilityZoneSchema = z.object({ name: z.string() })

export const FlavorsResponseSchema = z.object({ flavors: z.array(FlavorSchema) })
export const ImagesResponseSchema = z.object({
  images: z.array(ImageSchema),
  next_marker: z.string().nullable(),
})
export const KeypairsResponseSchema = z.object({ keypairs: z.array(KeypairSchema) })
export const NetworksResponseSchema = z.object({ networks: z.array(NetworkSchema) })
export const SecurityGroupsResponseSchema = z.object({ security_groups: z.array(SecurityGroupSchema) })
export const AvailabilityZonesResponseSchema = z.object({
  availability_zones: z.array(AvailabilityZoneSchema),
})

export type Flavor = z.infer<typeof FlavorSchema>
export type Image = z.infer<typeof ImageSchema>
export type Keypair = z.infer<typeof KeypairSchema>
export type Network = z.infer<typeof NetworkSchema>
export type SecurityGroup = z.infer<typeof SecurityGroupSchema>
export type AvailabilityZone = z.infer<typeof AvailabilityZoneSchema>
```

`createInstance.ts`:

```ts
import { z } from "zod"

const NAME_FORBIDDEN = /^.*\.\d+$/

export const CreateInstancePayloadSchema = z.object({
  name: z.string().min(1).refine((n) => !NAME_FORBIDDEN.test(n), {
    message: "Name must not end with a dot followed by a number",
  }),
  flavor_id: z.string().min(1),
  image_id: z.string().min(1),
  keypair: z.string().min(1),
  availability_zone: z.string().optional(),
  network_id: z.string().min(1),
  security_groups: z.array(z.string()),
  user_data: z.string(),
})

export type CreateInstancePayload = z.infer<typeof CreateInstancePayloadSchema>
```

- [ ] **Step 4: Run test, verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/types/formOptions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/types/formOptions.ts \
        plugins/compute_njq/app/javascript/widgets/app/types/createInstance.ts \
        plugins/compute_njq/app/javascript/widgets/app/types/formOptions.test.ts
git commit -m "feat(compute): add form-option and create-instance zod schemas to compute_njq"
```

---

### Task 10: apiClient — formOptions + instances.create

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`

**Interfaces:**
- Consumes: `createAjaxHelper` `get`/`post`, the Task-9 schemas, existing `checkForApiError`/`parseOrThrow`.
- Produces: `api.formOptions.getFlavors()`, `getImages({ q?, marker?, limit? })` (→ `{ images, next_marker }`), `getKeypairs()`, `getNetworks()`, `getSecurityGroups()`, `getAvailabilityZones()`; `api.instances.create(payload) -> Instance`.

- [ ] **Step 1: Write the failing tests** — extend `apiClient.test.ts` (mock now needs `post` too):

```ts
// Update the mock near the top:
// const mockGet = vi.fn(); const mockPost = vi.fn()
// vi.mock("lib/ajax_helper", () => ({ createAjaxHelper: () => ({ get: mockGet, post: mockPost }) }))

describe("formOptions", () => {
  it("returns validated flavors", async () => {
    mockGet.mockResolvedValue({
      data: { flavors: [{ id: "f1", name: "m1.small", vcpus: 2, ram: 2048, disk: 20, hypervisor_type: "kvm" }] },
    })
    const result = await api.formOptions.getFlavors()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("f1")
  })

  it("returns images with next_marker", async () => {
    mockGet.mockResolvedValue({ data: { images: [], next_marker: null } })
    const result = await api.formOptions.getImages({ q: "ubuntu" })
    expect(result.images).toEqual([])
    expect(result.next_marker).toBeNull()
  })
})

describe("instances.create", () => {
  it("posts the payload and returns the created instance", async () => {
    mockPost.mockResolvedValue({ data: { instance: validInstance } })
    const result = await api.instances.create({
      name: "web-01", flavor_id: "f1", image_id: "i1", keypair: "k",
      network_id: "n1", security_groups: [], user_data: "",
    })
    expect(result.id).toBe("s1")
  })

  it("throws the error envelope on failure", async () => {
    mockPost.mockResolvedValue({ data: { error: "API Error", code: 403, message: "Quota exceeded" } })
    await expect(
      api.instances.create({ name: "x", flavor_id: "f1", image_id: "i1", keypair: "k", network_id: "n1", security_groups: [], user_data: "" }),
    ).rejects.toThrow(/Quota exceeded \(HTTP 403\)/)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`
Expected: FAIL (`formOptions`/`create` undefined; `mockPost` not wired).

- [ ] **Step 3: Implement** — in `apiClient.ts`, import the schemas and add inside `createComputeApi`:

```ts
const formOptionsApi = {
  getFlavors: () =>
    apiClient.get<{ data: unknown }>("form_options/flavors").then((res) => {
      checkForApiError(res.data)
      return parseOrThrow(FlavorsResponseSchema, res.data, "flavors").flavors
    }),
  getImages: (opts: { q?: string; marker?: string; limit?: number } = {}) =>
    apiClient
      .get<{ data: unknown }>("form_options/images", { params: cleanParams(opts) })
      .then((res) => {
        checkForApiError(res.data)
        return parseOrThrow(ImagesResponseSchema, res.data, "images")
      }),
  getKeypairs: () =>
    apiClient.get<{ data: unknown }>("form_options/keypairs").then((res) => {
      checkForApiError(res.data)
      return parseOrThrow(KeypairsResponseSchema, res.data, "keypairs").keypairs
    }),
  getNetworks: () =>
    apiClient.get<{ data: unknown }>("form_options/networks").then((res) => {
      checkForApiError(res.data)
      return parseOrThrow(NetworksResponseSchema, res.data, "networks").networks
    }),
  getSecurityGroups: () =>
    apiClient.get<{ data: unknown }>("form_options/security_groups").then((res) => {
      checkForApiError(res.data)
      return parseOrThrow(SecurityGroupsResponseSchema, res.data, "security_groups").security_groups
    }),
  getAvailabilityZones: () =>
    apiClient.get<{ data: unknown }>("form_options/availability_zones").then((res) => {
      checkForApiError(res.data)
      return parseOrThrow(AvailabilityZonesResponseSchema, res.data, "availability_zones").availability_zones
    }),
}
```

Add `create` to `instanceApi`:

```ts
create: (payload: CreateInstancePayload): Promise<Instance> =>
  apiClient.post<{ data: { instance: Instance } }>("instances", { instance: payload }).then((res) => {
    checkForApiError(res.data)
    return parseOrThrow(InstanceResponseSchema, res.data, "instance").instance
  }),
```

Add a small helper near the top of the module and return `formOptions: formOptionsApi` from `createComputeApi`:

```ts
// Drops undefined/empty values so they are not serialised as query params.
function cleanParams(opts: Record<string, unknown>): Record<string, string> {
  return Object.entries(opts).reduce((acc, [k, v]) => {
    if (v !== undefined && v !== null && v !== "") acc[k] = String(v)
    return acc
  }, {} as Record<string, string>)
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/apiClient.ts \
        plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts
git commit -m "feat(compute): add form-option and create api methods to compute_njq client"
```

---

### Task 11: Query hooks + keys

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/hooks/queryKeys.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useFormOptionQueries.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useCreateInstanceMutation.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/hooks/useFormOptionQueries.test.tsx`

**Interfaces:**
- Produces: `useFlavorsQuery(api, { enabled })`, `useKeypairsQuery`, `useNetworksQuery`, `useSecurityGroupsQuery`, `useAvailabilityZonesQuery`, `useImagesQuery(api, { q, enabled })`, `useCreateInstanceMutation(api, queryClient)`.

- [ ] **Step 1: Write the failing test** (wrap in a QueryClientProvider; assert a disabled query does not fetch and an enabled one returns data):

```tsx
import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFlavorsQuery } from "./useFormOptionQueries"

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe("useFlavorsQuery", () => {
  it("does not fetch while disabled", () => {
    const api = { formOptions: { getFlavors: vi.fn() } } as never
    renderHook(() => useFlavorsQuery(api, { enabled: false }), { wrapper: wrapper() })
    expect((api as never as { formOptions: { getFlavors: ReturnType<typeof vi.fn> } }).formOptions.getFlavors)
      .not.toHaveBeenCalled()
  })

  it("fetches when enabled", async () => {
    const getFlavors = vi.fn().mockResolvedValue([{ id: "f1" }])
    const api = { formOptions: { getFlavors } } as never
    const { result } = renderHook(() => useFlavorsQuery(api, { enabled: true }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data).toEqual([{ id: "f1" }]))
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/hooks/useFormOptionQueries.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — add keys to `queryKeys.ts`:

```ts
export const QUERY_KEYS = {
  instances: ["instances"] as const,
  instance: (id: string) => ["instance", id] as const,
  flavors: ["form", "flavors"] as const,
  keypairs: ["form", "keypairs"] as const,
  networks: ["form", "networks"] as const,
  securityGroups: ["form", "security_groups"] as const,
  availabilityZones: ["form", "availability_zones"] as const,
  images: (q: string) => ["form", "images", q] as const,
} as const
```

`useFormOptionQueries.ts`:

```ts
import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

const SHARED = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const

export function useFlavorsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.flavors, queryFn: () => api.formOptions.getFlavors(), enabled, ...SHARED })
}
export function useKeypairsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.keypairs, queryFn: () => api.formOptions.getKeypairs(), enabled, ...SHARED })
}
export function useNetworksQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.networks, queryFn: () => api.formOptions.getNetworks(), enabled, ...SHARED })
}
export function useSecurityGroupsQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.securityGroups, queryFn: () => api.formOptions.getSecurityGroups(), enabled, ...SHARED })
}
export function useAvailabilityZonesQuery(api: ComputeApi, { enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: QUERY_KEYS.availabilityZones, queryFn: () => api.formOptions.getAvailabilityZones(), enabled, ...SHARED })
}
export function useImagesQuery(api: ComputeApi, { q, enabled }: { q: string; enabled: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.images(q),
    queryFn: () => api.formOptions.getImages({ q: q || undefined }),
    enabled,
    ...SHARED,
  })
}
```

`useCreateInstanceMutation.ts`:

```ts
import { useMutation, QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { CreateInstancePayload } from "../types/createInstance"

export function useCreateInstanceMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation({
    mutationFn: (payload: CreateInstancePayload) => api.instances.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.instances }),
  })
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/hooks/useFormOptionQueries.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/hooks/
git commit -m "feat(compute): add form-option query hooks and create mutation to compute_njq"
```

---

### Task 12: SearchableSelect component

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SearchableSelect.tsx`
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SearchableSelect.test.tsx`

**Interfaces:**
- Produces: `SearchableSelect<T>({ options, value, onChange, getLabel, getValue, onSearch?, isLoading?, placeholder, emptyMessage })`. When `onSearch` is provided the parent owns filtering (server-side, images); otherwise it filters `options` client-side by `getLabel` substring.

- [ ] **Step 1: Write the failing tests**:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SearchableSelect } from "./SearchableSelect"

const options = [{ id: "a", name: "ubuntu" }, { id: "b", name: "debian" }]
const common = {
  options,
  value: null as string | null,
  getLabel: (o: { name: string }) => o.name,
  getValue: (o: { id: string }) => o.id,
  placeholder: "Select…",
  emptyMessage: "Nothing here",
}

describe("SearchableSelect", () => {
  it("filters options client-side by the typed query", () => {
    render(<SearchableSelect {...common} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText("Select…"))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "ubu" } })
    expect(screen.getByText("ubuntu")).toBeInTheDocument()
    expect(screen.queryByText("debian")).not.toBeInTheDocument()
  })

  it("shows the empty message when there are no options", () => {
    render(<SearchableSelect {...common} options={[]} onChange={vi.fn()} />)
    fireEvent.click(screen.getByText("Select…"))
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })

  it("calls onSearch instead of filtering locally when provided", () => {
    const onSearch = vi.fn()
    render(<SearchableSelect {...common} onChange={vi.fn()} onSearch={onSearch} />)
    fireEvent.click(screen.getByText("Select…"))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "xyz" } })
    expect(onSearch).toHaveBeenCalledWith("xyz")
  })

  it("fires onChange with the option value when an option is picked", () => {
    const onChange = vi.fn()
    render(<SearchableSelect {...common} onChange={onChange} />)
    fireEvent.click(screen.getByText("Select…"))
    fireEvent.click(screen.getByText("debian"))
    expect(onChange).toHaveBeenCalledWith("b")
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SearchableSelect.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `SearchableSelect.tsx`:

```tsx
import { useEffect, useRef, useState } from "react"

interface SearchableSelectProps<T> {
  options: T[]
  value: string | null
  onChange: (value: string) => void
  getLabel: (option: T) => string
  getValue: (option: T) => string
  // When provided, the parent owns filtering (server-side search, e.g. images).
  onSearch?: (query: string) => void
  isLoading?: boolean
  placeholder: string
  emptyMessage: string
}

export function SearchableSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  onSearch,
  isLoading,
  placeholder,
  emptyMessage,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  // Debounce server-side search so typing does not fire a request per keystroke.
  useEffect(() => {
    if (!onSearch) return
    const id = setTimeout(() => onSearch(query), 300)
    return () => clearTimeout(id)
  }, [query, onSearch])

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // Local filtering only when the parent did not take over search.
  const visible = onSearch
    ? options
    : options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))

  const selectedLabel = value != null ? options.find((o) => getValue(o) === value && true) : undefined
  const buttonText = selectedLabel ? getLabel(selectedLabel) : placeholder

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="btn btn-default dropdown-toggle w-100 text-start"
        onClick={() => setOpen((o) => !o)}
      >
        {buttonText}
      </button>
      {open && (
        <div className="dropdown-menu show w-100 p-2">
          <input
            type="text"
            className="form-control mb-2"
            value={query}
            placeholder="Search…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-muted px-2 py-1">{emptyMessage}</div>
          ) : (
            <ul className="list-group list-group-flush">
              {visible.map((o) => (
                <li
                  key={getValue(o)}
                  className="list-group-item list-group-item-action"
                  role="option"
                  aria-selected={getValue(o) === value}
                  onClick={() => {
                    onChange(getValue(o))
                    setOpen(false)
                  }}
                >
                  {getLabel(o)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SearchableSelect.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SearchableSelect.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/SearchableSelect.test.tsx
git commit -m "feat(compute): add SearchableSelect component to compute_njq"
```

---

### Task 13: CreateInstanceForm component

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/CreateInstanceForm.tsx`
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/CreateInstanceForm.test.tsx`

**Interfaces:**
- Consumes: the Task-11 hooks, `SearchableSelect`, `CreateInstancePayloadSchema`, `useCreateInstanceMutation`.
- Produces: `CreateInstanceForm({ api, queryClient, onSuccess })`. Renders name, flavor, image, keypair, network, security-groups (multi), AZ, user_data. Each select is lazy (its query `enabled` only once opened). Submit disabled until `CreateInstancePayloadSchema` passes. On mutation error shows an `alert-danger`; on success calls `onSuccess`.

- [ ] **Step 1: Write the failing tests** (mock the hooks module; assert disabled submit, validation error on bad name, and error alert on mutation failure):

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { CreateInstanceForm } from "./CreateInstanceForm"

vi.mock("../../../hooks/useFormOptionQueries", () => ({
  useFlavorsQuery: () => ({ data: [{ id: "f1", name: "m1.small" }], isLoading: false }),
  useImagesQuery: () => ({ data: { images: [{ id: "i1", name: "ubuntu" }], next_marker: null }, isLoading: false }),
  useKeypairsQuery: () => ({ data: [{ name: "k1" }], isLoading: false }),
  useNetworksQuery: () => ({ data: [{ id: "n1", name: "private" }], isLoading: false }),
  useSecurityGroupsQuery: () => ({ data: [{ id: "sg1", name: "default" }], isLoading: false }),
  useAvailabilityZonesQuery: () => ({ data: [{ name: "az-1" }], isLoading: false }),
}))

const mutate = vi.fn()
let mutationState = { mutate, isPending: false, isError: false, error: null as Error | null }
vi.mock("../../../hooks/useCreateInstanceMutation", () => ({
  useCreateInstanceMutation: () => mutationState,
}))

const api = {} as never
const queryClient = new QueryClient()

describe("CreateInstanceForm", () => {
  it("keeps submit disabled until required fields are valid", () => {
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled()
  })

  it("shows an error alert when the mutation fails", () => {
    mutationState = { mutate, isPending: false, isError: true, error: new Error("Quota exceeded (HTTP 403)") }
    render(<CreateInstanceForm api={api} queryClient={queryClient} onSuccess={vi.fn()} />)
    expect(screen.getByText(/Quota exceeded/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/CreateInstanceForm.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** — `CreateInstanceForm.tsx`:

```tsx
import { useState } from "react"
import { QueryClient } from "@tanstack/react-query"
import { ComputeApi } from "../../../apiClient"
import { SearchableSelect } from "./SearchableSelect"
import { CreateInstancePayloadSchema, CreateInstancePayload } from "../../../types/createInstance"
import { useCreateInstanceMutation } from "../../../hooks/useCreateInstanceMutation"
import {
  useFlavorsQuery,
  useImagesQuery,
  useKeypairsQuery,
  useNetworksQuery,
  useSecurityGroupsQuery,
  useAvailabilityZonesQuery,
} from "../../../hooks/useFormOptionQueries"

interface Props {
  api: ComputeApi
  queryClient: QueryClient
  onSuccess: () => void
}

const EMPTY = {
  name: "",
  flavor_id: "",
  image_id: "",
  keypair: "",
  availability_zone: "",
  network_id: "",
  security_groups: [] as string[],
  user_data: "",
}

export function CreateInstanceForm({ api, queryClient, onSuccess }: Props) {
  const [form, setForm] = useState(EMPTY)
  // A field's query only runs once its dropdown has been opened (lazy).
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [imageQuery, setImageQuery] = useState("")

  const set = (key: keyof typeof EMPTY, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }))
  const open = (key: string) => setOpened((o) => ({ ...o, [key]: true }))

  const flavors = useFlavorsQuery(api, { enabled: !!opened.flavor })
  const images = useImagesQuery(api, { q: imageQuery, enabled: !!opened.image })
  const keypairs = useKeypairsQuery(api, { enabled: !!opened.keypair })
  const networks = useNetworksQuery(api, { enabled: !!opened.network })
  const securityGroups = useSecurityGroupsQuery(api, { enabled: !!opened.secgroup })
  const azs = useAvailabilityZonesQuery(api, { enabled: !!opened.az })

  const mutation = useCreateInstanceMutation(api, queryClient)

  const parsed = CreateInstancePayloadSchema.safeParse(form)
  const nameError =
    form.name !== "" && !parsed.success
      ? parsed.error.issues.find((i) => i.path[0] === "name")?.message
      : undefined

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed.success) return
    mutation.mutate(parsed.data as CreateInstancePayload, { onSuccess })
  }

  return (
    <form onSubmit={submit}>
      {mutation.isError && (
        <div className="alert alert-danger" role="alert">
          {mutation.error?.message ?? "Failed to create the instance."}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Name</label>
        <input
          type="text"
          className={`form-control ${nameError ? "is-invalid" : ""}`}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {nameError && <div className="invalid-feedback">{nameError}</div>}
      </div>

      <div className="mb-3" onClick={() => open("flavor")}>
        <label className="form-label">Flavor</label>
        <SearchableSelect
          options={flavors.data ?? []}
          value={form.flavor_id || null}
          onChange={(v) => set("flavor_id", v)}
          getLabel={(f) => f.name}
          getValue={(f) => f.id}
          isLoading={flavors.isLoading}
          placeholder="Select a flavor…"
          emptyMessage="No flavors available"
        />
      </div>

      <div className="mb-3" onClick={() => open("image")}>
        <label className="form-label">Image</label>
        <SearchableSelect
          options={images.data?.images ?? []}
          value={form.image_id || null}
          onChange={(v) => set("image_id", v)}
          getLabel={(i) => i.name ?? i.id}
          getValue={(i) => i.id}
          onSearch={setImageQuery}
          isLoading={images.isLoading}
          placeholder="Select an image…"
          emptyMessage="No images found"
        />
      </div>

      <div className="mb-3" onClick={() => open("keypair")}>
        <label className="form-label">Key Pair</label>
        <SearchableSelect
          options={keypairs.data ?? []}
          value={form.keypair || null}
          onChange={(v) => set("keypair", v)}
          getLabel={(k) => k.name}
          getValue={(k) => k.name}
          isLoading={keypairs.isLoading}
          placeholder="Select a key pair…"
          emptyMessage="No key pairs available"
        />
      </div>

      <div className="mb-3" onClick={() => open("network")}>
        <label className="form-label">Network</label>
        <SearchableSelect
          options={networks.data ?? []}
          value={form.network_id || null}
          onChange={(v) => set("network_id", v)}
          getLabel={(n) => n.name ?? n.id}
          getValue={(n) => n.id}
          isLoading={networks.isLoading}
          placeholder="Select a network…"
          emptyMessage="No networks available"
        />
      </div>

      <div className="mb-3" onClick={() => open("secgroup")}>
        <label className="form-label">Security Groups</label>
        <select
          multiple
          className="form-control"
          value={form.security_groups}
          onChange={(e) =>
            set(
              "security_groups",
              Array.from(e.target.selectedOptions, (o) => o.value),
            )
          }
        >
          {(securityGroups.data ?? []).map((sg) => (
            <option key={sg.id} value={sg.name}>
              {sg.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3" onClick={() => open("az")}>
        <label className="form-label">Availability Zone</label>
        <SearchableSelect
          options={azs.data ?? []}
          value={form.availability_zone || null}
          onChange={(v) => set("availability_zone", v)}
          getLabel={(z) => z.name}
          getValue={(z) => z.name}
          isLoading={azs.isLoading}
          placeholder="Any availability zone…"
          emptyMessage="No availability zones"
        />
      </div>

      <div className="mb-3">
        <label className="form-label">User Data</label>
        <textarea
          className="form-control"
          rows={4}
          value={form.user_data}
          onChange={(e) => set("user_data", e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={!parsed.success || mutation.isPending}>
        {mutation.isPending ? "Creating…" : "Create"}
      </button>
    </form>
  )
}
```

Note: multi-select security groups use a native `<select multiple>` (not
`SearchableSelect`, which is single-value in v1). The `onClick` on each field
wrapper marks the field "opened" so its lazy query runs on first interaction.

- [ ] **Step 4: Run tests, verify they pass**

Run: `bin/workspace pnpm test plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/CreateInstanceForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/CreateInstanceForm.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/CreateInstanceForm.test.tsx
git commit -m "feat(compute): add CreateInstanceForm component to compute_njq"
```

---

### Task 14: Route wiring — `new` route + "Create New" button

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/new.tsx`
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/index.tsx`

**Interfaces:**
- Consumes: `CreateInstanceForm`, the route context (`apiClient`), `useQueryClient`, `useNavigate`.
- Produces: route `/instances/new` rendering the form in a BS5 modal/panel; on success navigates to `/instances`. The index gains a button linking to `/instances/new`.

- [ ] **Step 1: Add the "Create New" button** to `index.tsx` above the table:

```tsx
import { Link } from "@tanstack/react-router"
// …inside the returned JSX, before <InstanceTable>:
<div className="toolbar mb-3">
  <Link to="/instances/new" className="btn btn-primary">Create New</Link>
</div>
```

- [ ] **Step 2: Create the `new.tsx` route**:

```tsx
import { createFileRoute, useRouteContext, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { CreateInstanceForm } from "./-components/CreateInstanceForm"

export const Route = createFileRoute("/instances/new")({
  component: NewInstance,
})

function NewInstance() {
  const { apiClient } = useRouteContext({ from: Route.id })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <h4>Create New Instance</h4>
      </div>
      <div className="panel-body">
        <CreateInstanceForm
          api={apiClient}
          queryClient={queryClient}
          onSuccess={() => navigate({ to: "/instances" })}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Let esbuild regenerate the route tree** — the route tree (`routeTree.gen.ts`) is generated by the esbuild TanStack Router plugin on build/watch. Run a build so the new route is registered:

Run: `bin/workspace pnpm build` (or rely on the running `start-js` watch).
Expected: `routeTree.gen.ts` now includes `/instances/new`; no manual edit.

- [ ] **Step 4: Typecheck, lint, run the full frontend suite**

Run: `bin/workspace pnpm typecheck && bin/workspace pnpm lint && bin/workspace pnpm test plugins/compute_njq`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/new.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/index.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routeTree.gen.ts
git commit -m "feat(compute): wire create-instance route and button in compute_njq"
```

---

### Task 15: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Autonomy check**

Run: `grep -rn "services\.\(networking\|image\|block_storage\|identity\)" plugins/compute_njq`
Expected: no hits.

- [ ] **Step 2: Full Ruby suite**

Run: `bin/workspace bundle exec rspec plugins/compute_njq/spec`
Expected: PASS.

- [ ] **Step 3: Full JS suite + typecheck + lint + format check**

Run: `bin/workspace pnpm test plugins/compute_njq && bin/workspace pnpm typecheck && bin/workspace pnpm lint && bin/workspace pnpm check-format`
Expected: PASS.

- [ ] **Step 4: Manual smoke (dev container)** — start Rails + JS, open `/:domain/:project/compute-njq`, click "Create New", confirm the dialog opens immediately, each dropdown loads on open, image search queries the server, and a create either succeeds (list refreshes) or surfaces the error inline.

- [ ] **Step 5: No commit** (verification task). Report results.
