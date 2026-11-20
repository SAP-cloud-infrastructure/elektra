# Floating IP Attach/Detach (compute_njq) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Attach Floating IP and Detach Floating IP actions to the compute_njq instance list-view dropdown, as React modals backed by new BFF endpoints.

**Architecture:** New Neutron service methods + a `FloatingIpActions` mixin on the BFF service; two controller endpoints + routes + a form-options endpoint; two policy rules. Frontend: new Zod schemas, apiClient methods, two optimistic mutation hooks, two action entries (`listOnly`), two modals wired into the shared actions menu. Mirrors the existing resize/snapshot pattern end to end.

**Tech Stack:** Ruby 3.4.8 / Rails 8.1 (Elektron Neutron/Nova clients), React 19 / TypeScript 5, TanStack Query v4, Zod, Vitest 4, RSpec.

**Spec:** `docs/compute-njq/floating-ip-actions-spec.md`

## Global Constraints

- TS/JS: Prettier — 120 cols, 2 spaces, **no semicolons**, double quotes, ES5 trailing commas. Strict TS, functional components with hooks. Code & comments in English.
- TDD throughout: each change RED→GREEN. The full compute_njq vitest suite must stay green; `npx tsc --noEmit -p plugins/compute_njq/tsconfig.json` must not exceed the known **8-error baseline** (router.ts basepath, CreateInstanceForm.tsx, EditNameModal.test, EditTagsModal.test, ResetStatusModal.test, SearchableSelect.test, new.tsx, route.test.tsx).
- Both actions are `listOnly: true` — the detail modal must stay unaffected (guarded by existing surface tests).
- Detach sends only the floating-IP **address**; the id is resolved server-side. No change to the instance detail payload or its Zod schema.
- Allocate-new-then-associate failure: **leave** the orphaned FIP (do not delete); surface the association error.
- Dev commands run in the container: `docker exec elektra bash -c "cd /app && <cmd>"`. Vitest: `pnpm vitest run <path>`. RSpec: `bundle exec rspec <path>`.

## Review Focus

- **Multi-NIC attach:** chosen fixed IP must map to the port whose `fixed_ips[].ip_address` matches — not `ports.first` — when the server has several ports. (Task 2 tests.)
- **Server with zero Neutron ports:** `port_for_fixed_ip` falls back to `ports.first` = nil → attach must raise a clean error, not a nil-dereference. (Task 2 tests.)
- **Detach address not found:** `neutron_floating_ip_by_address` returns nil → endpoint returns a clean `{error}` envelope, not a 500. (Task 2 tests.)
- **Allocate-new failure after create:** associate raises after create → error propagates, FIP is **not** deleted. (Task 2 tests.)
- **Availability by state:** Attach only for `active`/`stopped`; Detach only when `hasFloatingIp`. Neither appears for `error`/`building`/`verify_resize`, and both are `listOnly`. (Task 6 tests.)

---

### Task 1: Neutron service methods

**Files:**
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_services/neutron.rb`
- Test: `plugins/compute_njq/spec/services/compute_njq_services/neutron_floating_ip_spec.rb` (create)

**Interfaces:**
- Consumes: `elektron_neutron` (existing handle), `neutron_floating_ips` (existing), `scoped_project_id` (existing).
- Produces: `neutron_available_floating_ips → Array<Hash>`, `neutron_external_networks → Array<Hash>`, `neutron_ports_for_device(device_id) → Array<Hash>`, `neutron_create_floating_ip(floating_network_id) → Hash`, `neutron_associate_floating_ip(id, port_id:, fixed_ip_address:) → Hash`, `neutron_disassociate_floating_ip(id) → Hash`, `neutron_floating_ip_by_address(address) → Hash | nil`.

- [ ] **Step 1: Write the failing test**

Check an existing compute_njq service spec first (e.g. `plugins/compute_njq/spec/`) to copy the setup/double style. If no RSpec harness exists for this service, mirror the pattern used by the nearest existing spec. The test doubles `elektron_neutron` and asserts the request shapes:

```ruby
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqService do
  # Minimal harness: include the Neutron module on a bare object with a stubbed
  # elektron_neutron + scoped_project_id, matching how the other service specs
  # exercise a single mixin.
  let(:neutron) { double("elektron_neutron") }
  let(:service) do
    Class.new do
      include ServiceLayer::ComputeNjqServices::Neutron
      attr_accessor :elektron_neutron, :scoped_project_id
    end.new.tap { |s| s.elektron_neutron = neutron; s.scoped_project_id = "p1" }
  end

  describe "#neutron_available_floating_ips" do
    it "returns only project FIPs with no port_id" do
      resp = double(body: { "floatingips" => [
        { "id" => "f1", "port_id" => nil, "floating_ip_address" => "1.1.1.1" },
        { "id" => "f2", "port_id" => "", "floating_ip_address" => "1.1.1.2" },
        { "id" => "f3", "port_id" => "port-x", "floating_ip_address" => "1.1.1.3" },
      ] })
      allow(neutron).to receive(:get).with("floatingips", { tenant_id: "p1" }).and_return(resp)
      expect(service.neutron_available_floating_ips.map { |f| f["id"] }).to eq(%w[f1 f2])
    end
  end

  describe "#neutron_associate_floating_ip" do
    it "PUTs port_id and fixed_ip_address" do
      captured = nil
      allow(neutron).to receive(:put) { |path, &blk| captured = [path, blk.call]; double(body: { "floatingip" => {} }) }
      service.neutron_associate_floating_ip("f1", port_id: "port-1", fixed_ip_address: "10.0.0.5")
      expect(captured[0]).to eq("floatingips/f1")
      expect(captured[1]).to eq({ "floatingip" => { "port_id" => "port-1", "fixed_ip_address" => "10.0.0.5" } })
    end
  end

  describe "#neutron_disassociate_floating_ip" do
    it "PUTs nulls for port_id and fixed_ip_address" do
      captured = nil
      allow(neutron).to receive(:put) { |path, &blk| captured = [path, blk.call]; double(body: { "floatingip" => {} }) }
      service.neutron_disassociate_floating_ip("f1")
      expect(captured[1]).to eq({ "floatingip" => { "port_id" => nil, "fixed_ip_address" => nil } })
    end
  end

  describe "#neutron_floating_ip_by_address" do
    it "finds the FIP whose address matches, else nil" do
      resp = double(body: { "floatingips" => [{ "id" => "f1", "floating_ip_address" => "1.1.1.1", "port_id" => "p" }] })
      allow(neutron).to receive(:get).with("floatingips", { tenant_id: "p1" }).and_return(resp)
      expect(service.neutron_floating_ip_by_address("1.1.1.1")["id"]).to eq("f1")
      expect(service.neutron_floating_ip_by_address("9.9.9.9")).to be_nil
    end
  end

  describe "#neutron_external_networks" do
    it "fetches router:external networks" do
      resp = double(body: { "networks" => [{ "id" => "n1" }] })
      allow(neutron).to receive(:get).with("networks", { "router:external" => true }).and_return(resp)
      expect(service.neutron_external_networks.map { |n| n["id"] }).to eq(%w[n1])
    end
  end

  describe "#neutron_ports_for_device" do
    it "filters ports by device_id" do
      resp = double(body: { "ports" => [{ "id" => "port-1" }] })
      allow(neutron).to receive(:get).with("ports", { "device_id" => "s1" }).and_return(resp)
      expect(service.neutron_ports_for_device("s1").map { |p| p["id"] }).to eq(%w[port-1])
    end
  end

  describe "#neutron_create_floating_ip" do
    it "POSTs floating_network_id" do
      captured = nil
      allow(neutron).to receive(:post) { |path, &blk| captured = [path, blk.call]; double(body: { "floatingip" => { "id" => "new" } }) }
      expect(service.neutron_create_floating_ip("n1")["id"]).to eq("new")
      expect(captured).to eq(["floatingips", { "floatingip" => { "floating_network_id" => "n1" } }])
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/compute_njq_services/neutron_floating_ip_spec.rb"`
Expected: FAIL — methods undefined (`NoMethodError`).

- [ ] **Step 3: Implement the methods**

Append to the `Neutron` module in `neutron.rb` (before the closing `end`s):

```ruby
# Project FIPs that are not currently associated (no port_id) — the attach
# modal offers these as free to attach.
def neutron_available_floating_ips
  neutron_floating_ips.select { |fip| fip["port_id"].to_s.empty? }
end

# External networks a FIP may be allocated from.
def neutron_external_networks
  elektron_neutron.get("networks", { "router:external" => true }).body["networks"] || []
end

# The scoped project's Neutron ports for a given server (device_id == server id).
def neutron_ports_for_device(device_id)
  elektron_neutron.get("ports", { "device_id" => device_id }).body["ports"] || []
end

# Allocate a new floating IP on an external network. Returns the raw hash.
def neutron_create_floating_ip(floating_network_id)
  elektron_neutron
    .post("floatingips") { { "floatingip" => { "floating_network_id" => floating_network_id } } }
    .body["floatingip"]
end

# Associate a FIP with a port + fixed IP (PUT floatingips/{id}).
def neutron_associate_floating_ip(id, port_id:, fixed_ip_address:)
  elektron_neutron
    .put("floatingips/#{id}") { { "floatingip" => { "port_id" => port_id, "fixed_ip_address" => fixed_ip_address } } }
    .body["floatingip"]
end

# Disassociate a FIP (PUT floatingips/{id} nulling both fields).
def neutron_disassociate_floating_ip(id)
  elektron_neutron
    .put("floatingips/#{id}") { { "floatingip" => { "port_id" => nil, "fixed_ip_address" => nil } } }
    .body["floatingip"]
end

# Resolve a project FIP hash by its address, or nil.
def neutron_floating_ip_by_address(address)
  neutron_floating_ips.find { |fip| fip["floating_ip_address"] == address }
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/compute_njq_services/neutron_floating_ip_spec.rb"`
Expected: PASS (all examples).

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/neutron.rb \
        plugins/compute_njq/spec/services/compute_njq_services/neutron_floating_ip_spec.rb
git commit -m "feat(compute): add neutron floating-ip associate/disassociate helpers"
```

---

### Task 2: FloatingIpActions service mixin

**Files:**
- Create: `plugins/compute_njq/app/services/service_layer/compute_njq_services/floating_ip_actions.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` (register the mixin)
- Test: `plugins/compute_njq/spec/services/compute_njq_services/floating_ip_actions_spec.rb` (create)

**Interfaces:**
- Consumes (from Task 1): `neutron_create_floating_ip`, `neutron_associate_floating_ip`, `neutron_disassociate_floating_ip`, `neutron_floating_ip_by_address`, `neutron_ports_for_device`.
- Produces: `attach_floating_ip(server_id, floating_ip_id:, floating_network_id:, fixed_ip_address:) → { ok: true }`, `detach_floating_ip(server_id, floating_ip_address:) → { ok: true }`. Both raise on failure (caught by the controller's `handle_api_call`).

- [ ] **Step 1: Write the failing test**

Look at `compute_njq_service.rb` to see how existing mixins are `include`d, and copy the error class the service raises for not-found (search the service dir for the existing `raise`/error style; use the same one — the plan below names it `NotFoundError`, replace with the actual class discovered).

```ruby
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::FloatingIpActions do
  let(:service) do
    Class.new do
      include ServiceLayer::ComputeNjqServices::FloatingIpActions
      attr_accessor :ports, :fip_by_addr
      # Stub the Task-1 Neutron helpers this mixin calls:
      def neutron_create_floating_ip(id) = { "id" => "new-fip" }
      def neutron_associate_floating_ip(id, port_id:, fixed_ip_address:)
        @assoc = { id: id, port_id: port_id, fixed_ip_address: fixed_ip_address }
      end
      attr_reader :assoc
      def neutron_disassociate_floating_ip(id) = (@disassoc = id)
      attr_reader :disassoc
      def neutron_ports_for_device(_id) = ports
      def neutron_floating_ip_by_address(_a) = fip_by_addr
    end.new
  end

  describe "#attach_floating_ip with an existing FIP" do
    it "associates it with the port carrying the chosen fixed IP (multi-NIC)" do
      service.ports = [
        { "id" => "port-a", "fixed_ips" => [{ "ip_address" => "10.0.0.5" }] },
        { "id" => "port-b", "fixed_ips" => [{ "ip_address" => "10.0.0.9" }] },
      ]
      service.attach_floating_ip("s1", floating_ip_id: "f1", floating_network_id: nil, fixed_ip_address: "10.0.0.9")
      expect(service.assoc).to eq({ id: "f1", port_id: "port-b", fixed_ip_address: "10.0.0.9" })
    end
  end

  describe "#attach_floating_ip allocating a new FIP" do
    it "creates then associates the new FIP and does not delete it on associate failure" do
      service.ports = [{ "id" => "port-a", "fixed_ips" => [{ "ip_address" => "10.0.0.5" }] }]
      def service.neutron_associate_floating_ip(*) = raise("boom")
      # No delete helper is called — a stubbed one would fail if invoked.
      expect {
        service.attach_floating_ip("s1", floating_ip_id: nil, floating_network_id: "n1", fixed_ip_address: "10.0.0.5")
      }.to raise_error("boom")
    end
  end

  describe "#attach_floating_ip with no ports" do
    it "raises instead of dereferencing nil" do
      service.ports = []
      expect {
        service.attach_floating_ip("s1", floating_ip_id: "f1", floating_network_id: nil, fixed_ip_address: "10.0.0.5")
      }.to raise_error(/no port/i)
    end
  end

  describe "#detach_floating_ip" do
    it "resolves the id from the address and disassociates" do
      service.fip_by_addr = { "id" => "f9", "floating_ip_address" => "1.2.3.4" }
      service.detach_floating_ip("s1", floating_ip_address: "1.2.3.4")
      expect(service.disassoc).to eq("f9")
    end

    it "raises a not-found error when the address has no FIP" do
      service.fip_by_addr = nil
      expect {
        service.detach_floating_ip("s1", floating_ip_address: "9.9.9.9")
      }.to raise_error(/floating ip/i)
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/compute_njq_services/floating_ip_actions_spec.rb"`
Expected: FAIL — module/methods undefined.

- [ ] **Step 3: Implement the mixin**

`floating_ip_actions.rb`:

```ruby
# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Floating-IP association actions, built on the Neutron helpers. Attach may
    # allocate a new FIP (then leaves it in place if association fails, as the
    # legacy flow does). Detach resolves the FIP id from its address so the
    # frontend only has to send the address.
    module FloatingIpActions
      def attach_floating_ip(server_id, floating_ip_id:, floating_network_id:, fixed_ip_address:)
        fip_id =
          if floating_network_id.to_s != ""
            neutron_create_floating_ip(floating_network_id)["id"]
          else
            floating_ip_id
          end
        port = port_for_fixed_ip(server_id, fixed_ip_address)
        neutron_associate_floating_ip(fip_id, port_id: port["id"], fixed_ip_address: fixed_ip_address)
        { ok: true }
      end

      def detach_floating_ip(server_id, floating_ip_address:)
        fip = neutron_floating_ip_by_address(floating_ip_address)
        raise "Floating IP #{floating_ip_address} not found for this server" if fip.nil?

        neutron_disassociate_floating_ip(fip["id"])
        { ok: true }
      end

      private

      # The server port whose fixed_ips contains the chosen address; falls back
      # to the first port. Raises when the server has no ports.
      def port_for_fixed_ip(server_id, fixed_ip_address)
        ports = neutron_ports_for_device(server_id)
        raise "Server has no network port to attach a floating IP to" if ports.empty?

        ports.find { |p| (p["fixed_ips"] || []).any? { |fi| fi["ip_address"] == fixed_ip_address } } || ports.first
      end
    end
  end
end
```

Register it in `compute_njq_service.rb` next to the other `include ComputeNjqServices::...` lines.

> **Ruling note for the executor:** if the existing service raises a specific
> error class (not bare `RuntimeError`) for not-found/validation, use that class
> in both `raise`s and update the test's `raise_error` matchers to match. Record
> the choice in the ledger.

- [ ] **Step 4: Run tests to verify they pass**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/services/compute_njq_services/floating_ip_actions_spec.rb"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/services/service_layer/compute_njq_services/floating_ip_actions.rb \
        plugins/compute_njq/app/services/service_layer/compute_njq_service.rb \
        plugins/compute_njq/spec/services/compute_njq_services/floating_ip_actions_spec.rb
git commit -m "feat(compute): add floating-ip attach/detach service actions"
```

---

### Task 3: Policy rules, routes, controller endpoints, form options

**Files:**
- Modify: `plugins/compute_njq/config/policy.json`
- Modify: `plugins/compute_njq/config/routes.rb`
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb`
- Modify: `plugins/compute_njq/app/controllers/compute_njq/api/form_options_controller.rb`
- Modify: `plugins/compute_njq/app/services/service_layer/compute_njq_service.rb` (add `form_available_floating_ips` / `form_external_networks` wrappers — or a `FormData` mixin if that's where the other `form_*` live)
- Test: `plugins/compute_njq/spec/controllers/compute_njq/api/instances_controller_spec.rb` (extend or create, matching the existing controller spec style if one exists)

**Interfaces:**
- Consumes (from Task 2): `compute_service.attach_floating_ip`, `compute_service.detach_floating_ip`. From Task 1: the Neutron list helpers.
- Produces: `POST /:scope/compute-njq/api/instances/:id/attach_floating_ip`, `POST .../detach_floating_ip`, `GET .../form_options/floating_ip_options` returning `{ available_floating_ips: [{id, floating_ip_address}], external_networks: [{id, name}] }`.

- [ ] **Step 1: Write the failing test**

First check whether a controller spec exists for compute_njq (`plugins/compute_njq/spec/controllers/...`). If one exists, extend it following its request/auth-stub style. If none exists, prefer a focused service-wrapper test for `form_available_floating_ips`/`form_external_networks` plus a routing spec, rather than standing up a full controller harness:

```ruby
# Routing (always cheap, no harness needed):
require "spec_helper"
RSpec.describe "compute_njq floating ip routes" do
  it "routes attach/detach and floating_ip_options" do
    expect(post: "/x/compute-njq/api/instances/s1/attach_floating_ip")
      .to route_to("compute_njq/api/instances", action: "attach_floating_ip", scope: "x", id: "s1")
    expect(post: "/x/compute-njq/api/instances/s1/detach_floating_ip")
      .to route_to("compute_njq/api/instances", action: "detach_floating_ip", scope: "x", id: "s1")
    expect(get: "/x/compute-njq/api/form_options/floating_ip_options")
      .to route_to("compute_njq/api/form_options", action: "floating_ip_options", scope: "x")
  end
end
```

> If the existing routes resolve under a different controller path/segment than
> `/:scope/compute-njq/api/...`, adjust the expectations to the real mount
> (read `routes.rb` + the existing passing routing spec, if any). Ledger the
> actual paths.

- [ ] **Step 2: Run the routing test to verify it fails**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/routing/floating_ip_routes_spec.rb"`
Expected: FAIL — no route matches.

- [ ] **Step 3: Add policy rules**

In `policy.json`, after `instance_snapshot`:

```json
"compute_njq:instance_attach_floating_ip": "rule:instance_actions",
"compute_njq:instance_detach_floating_ip": "rule:instance_actions",
```

- [ ] **Step 4: Add routes**

In `routes.rb`, inside the `resources :instances` member block (next to the existing `post :snapshot`, `put :resize`, etc.):

```ruby
post :attach_floating_ip
post :detach_floating_ip
```

In the `form_options` block (collection), next to the existing options:

```ruby
get :floating_ip_options
```

- [ ] **Step 5: Add controller actions**

In `instances_controller.rb`:

```ruby
def attach_floating_ip
  return unless authorize!("compute_njq:instance_attach_floating_ip")

  handle_api_call do
    compute_service.attach_floating_ip(
      params.require(:id),
      floating_ip_id: attach_floating_ip_params[:floating_ip_id],
      floating_network_id: attach_floating_ip_params[:floating_network_id],
      fixed_ip_address: attach_floating_ip_params[:fixed_ip_address]
    )
  end
end

def detach_floating_ip
  return unless authorize!("compute_njq:instance_detach_floating_ip")

  handle_api_call do
    compute_service.detach_floating_ip(
      params.require(:id),
      floating_ip_address: detach_floating_ip_params[:floating_ip_address]
    )
  end
end

private

def attach_floating_ip_params
  params.permit(:floating_ip_id, :floating_network_id, :fixed_ip_address)
end

def detach_floating_ip_params
  params.permit(:floating_ip_address)
end
```

(Place the `private` params helpers with the controller's other private methods; don't introduce a second `private` if one exists.)

In `form_options_controller.rb`:

```ruby
def floating_ip_options
  handle_api_call do
    {
      available_floating_ips: compute_service.form_available_floating_ips,
      external_networks: compute_service.form_external_networks,
    }
  end
end
```

In the service (wherever `form_networks` etc. live), add:

```ruby
def form_available_floating_ips
  neutron_available_floating_ips.map { |f| { id: f["id"], floating_ip_address: f["floating_ip_address"] } }
end

def form_external_networks
  neutron_external_networks.map { |n| { id: n["id"], name: n["name"] } }
end
```

- [ ] **Step 6: Run the routing test to verify it passes**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec/routing/floating_ip_routes_spec.rb"`
Expected: PASS.

- [ ] **Step 7: Run the full compute_njq RSpec suite (no regressions)**

Run: `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec"`
Expected: PASS (all).

- [ ] **Step 8: Commit**

```bash
git add plugins/compute_njq/config/policy.json plugins/compute_njq/config/routes.rb \
        plugins/compute_njq/app/controllers/compute_njq/api/instances_controller.rb \
        plugins/compute_njq/app/controllers/compute_njq/api/form_options_controller.rb \
        plugins/compute_njq/app/services/service_layer/compute_njq_service.rb \
        plugins/compute_njq/spec/routing/floating_ip_routes_spec.rb
git commit -m "feat(compute): wire floating-ip attach/detach endpoints and policy"
```

---

### Task 4: Zod schemas + apiClient methods

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/types/floatingIp.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/types/floatingIp.test.ts` (create)
- Modify: `plugins/compute_njq/app/javascript/widgets/app/apiClient.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/apiClient.test.ts` (extend if it exists; otherwise add schema-level coverage only and test apiClient methods via the hooks in Task 5)

**Interfaces:**
- Produces: `FloatingIpOptions` type + `FloatingIpOptionsSchema`; apiClient `instances.attachFloatingIp(id, body)`, `instances.detachFloatingIp(id, body)`, `formOptions.getFloatingIpOptions()`.
- Consumes (Task 3): the three new endpoints.

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, it, expect } from "vitest"
import { FloatingIpOptionsSchema } from "./floatingIp"

describe("FloatingIpOptionsSchema", () => {
  it("parses available FIPs and external networks", () => {
    const parsed = FloatingIpOptionsSchema.parse({
      available_floating_ips: [{ id: "f1", floating_ip_address: "1.1.1.1" }],
      external_networks: [{ id: "n1", name: "ext" }],
    })
    expect(parsed.available_floating_ips[0].floating_ip_address).toBe("1.1.1.1")
    expect(parsed.external_networks[0].name).toBe("ext")
  })

  it("allows a null external-network name", () => {
    const parsed = FloatingIpOptionsSchema.parse({
      available_floating_ips: [],
      external_networks: [{ id: "n1", name: null }],
    })
    expect(parsed.external_networks[0].name).toBeNull()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/types/floatingIp.test.ts"`
Expected: FAIL — cannot resolve `./floatingIp`.

- [ ] **Step 3: Implement the schema**

`floatingIp.ts`:

```ts
import { z } from "zod"

export const AvailableFloatingIpSchema = z.object({
  id: z.string(),
  floating_ip_address: z.string(),
})

export const ExternalNetworkSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
})

export const FloatingIpOptionsSchema = z.object({
  available_floating_ips: z.array(AvailableFloatingIpSchema),
  external_networks: z.array(ExternalNetworkSchema),
})

export type AvailableFloatingIp = z.infer<typeof AvailableFloatingIpSchema>
export type ExternalNetwork = z.infer<typeof ExternalNetworkSchema>
export type FloatingIpOptions = z.infer<typeof FloatingIpOptionsSchema>
```

- [ ] **Step 4: Run it to verify it passes**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/types/floatingIp.test.ts"`
Expected: PASS.

- [ ] **Step 5: Add apiClient methods**

The BFF answers the uniform envelope `{ data: { ok: true } }` for mutations; the
existing methods use the shared `apiClient.post/put/get` helper with a path
**relative** to the compute_njq base (e.g. `"instances/${id}/resize"`,
`"form_options/networks"`), call `checkForApiError(res.data)`, and the mutation
methods resolve to `Promise<void>` (not `{ ok }`). Match that exactly — the
mutations mirror `resizeInstance`, the GET mirrors `getNetworks`.

Add to the `instances` object (after `resizeInstance`), mirroring `resizeInstance`:

```ts
// Attach a floating IP: either an existing free FIP (floating_ip_id) or a new
// one allocated on an external network (floating_network_id). The BFF answers
// { ok: true }; nothing to parse, just surface failures.
attachFloatingIp: (
  id: string,
  body: { floating_ip_id?: string; floating_network_id?: string; fixed_ip_address: string }
): Promise<void> =>
  apiClient
    .post<{ data: { ok: true } }>(`instances/${id}/attach_floating_ip`, body)
    .then((res) => {
      checkForApiError(res.data)
    })
    .catch((err) => {
      throw detailedError(err)
    }),

// Detach a floating IP by address; the BFF resolves the FIP id server-side.
detachFloatingIp: (id: string, body: { floating_ip_address: string }): Promise<void> =>
  apiClient
    .post<{ data: { ok: true } }>(`instances/${id}/detach_floating_ip`, body)
    .then((res) => {
      checkForApiError(res.data)
    })
    .catch((err) => {
      throw detailedError(err)
    }),
```

Add to `formOptions` (after `getNetworks`), mirroring `getNetworks`:

```ts
getFloatingIpOptions: (): Promise<FloatingIpOptions> =>
  apiClient.get<{ data: unknown }>("form_options/floating_ip_options").then((res) => {
    checkForApiError(res.data)
    return parseOrThrow(FloatingIpOptionsSchema, res.data, "floating_ip_options")
  }),
```

Import `{ FloatingIpOptions, FloatingIpOptionsSchema }` from `./types/floatingIp`.

> Note: `FloatingIpOptionsSchema` parses the **inner** payload
> (`{ available_floating_ips, external_networks }`). Confirm whether `getNetworks`
> passes `res.data` (the `{ data: ... }` wrapper) or `res.data.data` to
> `parseOrThrow`, and whether the form-options response is wrapped in a `data`
> key — match that wrapping here (the other `form_options` parsers are the
> reference). Ledger the choice if it differs from the sketch.

- [ ] **Step 6: Run the plugin suite to verify no regressions and types resolve**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json | grep -c 'error TS'"`
Expected: vitest all green; tsc error count `8` (baseline, no new errors).

- [ ] **Step 7: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/types/floatingIp.ts \
        plugins/compute_njq/app/javascript/widgets/app/types/floatingIp.test.ts \
        plugins/compute_njq/app/javascript/widgets/app/apiClient.ts
git commit -m "feat(compute): add floating-ip api client methods and schemas"
```

---

### Task 5: Optimistic mutation hooks

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useAttachFloatingIpMutation.ts`
- Create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useDetachFloatingIpMutation.ts`
- Test: `useAttachFloatingIpMutation.test.tsx`, `useDetachFloatingIpMutation.test.tsx` (create, next to the hooks)

**Interfaces:**
- Consumes (Task 4): `api.instances.attachFloatingIp`, `api.instances.detachFloatingIp`. Existing: `QUERY_KEYS.instances`, `QUERY_KEYS.instanceDetail(id)`, `Instance` type.
- Produces: `useAttachFloatingIpMutation(api, queryClient)`, `useDetachFloatingIpMutation(api, queryClient)` — same `(api, queryClient)` shape as `useCreateSnapshotMutation`.

- [ ] **Step 1: Write the failing test (attach)**

Copy the structure of `useCreateSnapshotMutation.test.tsx` (seed list, assert optimistic transition then invalidation). Transition label: `"associating_floating_ip"`.

```tsx
import { describe, it, expect, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { buildAttachFloatingIpMutationOptions } from "./useAttachFloatingIpMutation"
import { QUERY_KEYS } from "./queryKeys"

const row = (over = {}) => ({ id: "s1", status: { state: "active", transition: null, power_state: "Running" }, ...over })

function seed(qc: QueryClient) {
  qc.setQueryData(QUERY_KEYS.instances, [row()])
}

describe("attach floating ip mutation", () => {
  it("onMutate sets the associating transition and onError restores it", async () => {
    const qc = new QueryClient()
    seed(qc)
    const api = { instances: { attachFloatingIp: vi.fn().mockResolvedValue(undefined) } } as never
    const opts = buildAttachFloatingIpMutationOptions(api, qc)
    const ctx = await opts.onMutate!({ id: "s1", floating_ip_id: "f1", fixed_ip_address: "10.0.0.5" } as never)
    expect((qc.getQueryData(QUERY_KEYS.instances) as never[])[0].status.transition).toBe("associating_floating_ip")
    opts.onError!(new Error("x"), {} as never, ctx as never)
    expect((qc.getQueryData(QUERY_KEYS.instances) as never[])[0].status.transition).toBeNull()
  })

  it("onSettled invalidates the list and the detail", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const api = { instances: { attachFloatingIp: vi.fn() } } as never
    const opts = buildAttachFloatingIpMutationOptions(api, qc)
    opts.onSettled!(undefined, null, { id: "s1" } as never, undefined as never)
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instances })
    expect(spy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.instanceDetail("s1") })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useAttachFloatingIpMutation.test.tsx"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the attach hook**

Model on `useResizeInstanceMutation.ts` (same `(api, queryClient)` factory
shape, optimistic row transition, `onError` rollback, `onSettled` invalidation;
`mutationFn` resolves to `void`):

```ts
import { useMutation, QueryClient, UseMutationOptions } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"
import { Instance } from "../types/instance"

export interface AttachFloatingIpVars {
  id: string
  floating_ip_id?: string
  floating_network_id?: string
  fixed_ip_address: string
}
interface Ctx {
  previous?: Instance[]
}

export function buildAttachFloatingIpMutationOptions(
  api: ComputeApi,
  queryClient: QueryClient
): UseMutationOptions<void, Error, AttachFloatingIpVars, Ctx> {
  return {
    mutationFn: ({ id, floating_ip_id, floating_network_id, fixed_ip_address }) =>
      api.instances.attachFloatingIp(id, { floating_ip_id, floating_network_id, fixed_ip_address }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.instances })
      const previous = queryClient.getQueryData<Instance[]>(QUERY_KEYS.instances)
      queryClient.setQueryData<Instance[]>(QUERY_KEYS.instances, (list) =>
        (list ?? []).map((i) =>
          i.id === id ? { ...i, status: { ...i.status, transition: "associating_floating_ip" } } : i
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

export function useAttachFloatingIpMutation(api: ComputeApi, queryClient: QueryClient) {
  return useMutation(buildAttachFloatingIpMutationOptions(api, queryClient))
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useAttachFloatingIpMutation.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Repeat for the detach hook (RED→GREEN)**

Write `useDetachFloatingIpMutation.test.tsx` identically but: vars `{ id, floating_ip_address }`, transition `"disassociating_floating_ip"`, `mutationFn` calls `api.instances.detachFloatingIp(id, { floating_ip_address })`. Run it (FAIL — module not found), then implement `useDetachFloatingIpMutation.ts` mirroring the attach hook with those three differences, and run again (PASS).

Run (fail): `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/hooks/useDetachFloatingIpMutation.test.tsx"`
Run (pass): same command after implementing.

- [ ] **Step 6: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/hooks/useAttachFloatingIpMutation.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useAttachFloatingIpMutation.test.tsx \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useDetachFloatingIpMutation.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useDetachFloatingIpMutation.test.tsx
git commit -m "feat(compute): add optimistic floating-ip attach/detach mutation hooks"
```

---

### Task 6: Register the two actions (`listOnly`) + `hasFloatingIp`

**Files:**
- Modify: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts`
- Test: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts`
- Possibly modify: `plugins/compute_njq/app/javascript/widgets/app/types/instance.ts` (add `hasFloatingIp` helper if type helpers live there; otherwise keep it in `instanceActions.ts`)

**Interfaces:**
- Consumes: the `Instance` type (`ips: [{ addr, type }]`), existing `INSTANCE_ACTIONS`, `visibleActions`.
- Produces: action keys `attach_floating_ip`, `detach_floating_ip`; modal discriminators `attachFloatingIp`, `detachFloatingIp`; `hasFloatingIp(i)` predicate.

- [ ] **Step 1: Write the failing tests**

Add to `instanceActions.test.ts`:

```ts
it("offers Attach Floating IP for active or stopped, not for error/building", () => {
  const keys = (state: string) =>
    visibleActions(inst({ status: { state, transition: null, power_state: "Running" } }), {}).map((a) => a.key)
  expect(keys("active")).toContain("attach_floating_ip")
  expect(keys("stopped")).toContain("attach_floating_ip")
  expect(keys("error")).not.toContain("attach_floating_ip")
  expect(keys("build")).not.toContain("attach_floating_ip")
})

it("offers Detach Floating IP only when the instance has a floating IP", () => {
  const withFip = inst({ ips: [{ addr: "1.1.1.1", type: "floating" }] } as never)
  const without = inst({ ips: [{ addr: "10.0.0.5", type: "fixed" }] } as never)
  expect(visibleActions(withFip, {}).map((a) => a.key)).toContain("detach_floating_ip")
  expect(visibleActions(without, {}).map((a) => a.key)).not.toContain("detach_floating_ip")
})

it("keeps both floating-ip actions out of the detail surface (list-only)", () => {
  const withFip = inst({ ips: [{ addr: "1.1.1.1", type: "floating" }] } as never)
  const keys = visibleActions(withFip, {}, "detail").map((a) => a.key)
  expect(keys).not.toContain("attach_floating_ip")
  expect(keys).not.toContain("detach_floating_ip")
})

it("exposes the floating-ip modal discriminators", () => {
  const attach = INSTANCE_ACTIONS.find((a) => a.key === "attach_floating_ip")
  const detach = INSTANCE_ACTIONS.find((a) => a.key === "detach_floating_ip")
  expect(attach?.modal).toBe("attachFloatingIp")
  expect(detach?.modal).toBe("detachFloatingIp")
})
```

> Confirm the `inst()` helper's default `ips` and the `Instance` type's `ips`
> item shape (`{ addr, type }`) against `instance.ts`; adjust the `as never`
> casts to the real shape if the helper already types `ips`.

- [ ] **Step 2: Run them to verify they fail**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts"`
Expected: FAIL — keys missing / `hasFloatingIp` undefined.

- [ ] **Step 3: Implement**

Extend the `InstanceAction["key"]` union with `"attach_floating_ip" | "detach_floating_ip"` and `["modal"]` with `"attachFloatingIp" | "detachFloatingIp"`. Add the predicate near `isRunning`/`isParked`:

```ts
const hasFloatingIp = (i: Instance) => (i.ips ?? []).some((ip) => ip.type === "floating")
```

Add two entries to `INSTANCE_ACTIONS` in the `power` group (place them right after `create_image`, keeping the legacy-ish ordering):

```ts
{
  key: "attach_floating_ip",
  label: "Attach Floating IP",
  policy: "compute_njq:instance_attach_floating_ip",
  group: "power",
  isAvailable: (i) => ["active", "stopped"].includes(i.status.state),
  modal: "attachFloatingIp",
  listOnly: true,
},
{
  key: "detach_floating_ip",
  label: "Detach Floating IP",
  policy: "compute_njq:instance_detach_floating_ip",
  group: "power",
  isAvailable: hasFloatingIp,
  modal: "detachFloatingIp",
  listOnly: true,
},
```

- [ ] **Step 4: Run them to verify they pass + full type/suite check**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts"`
Expected: PASS.

Also run the "separates action groups" test file is unaffected — the menu-order test in `InstanceActionsMenu.test.tsx` lists the default/list surface, which now includes the two new power-group items; if that test pins an exact ordered label list, update it to include "Attach Floating IP"/"Detach Floating IP" in the power group (RED→GREEN) in this task.

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.ts plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx"`
Expected: PASS (after updating the ordered-label assertion if present).

- [ ] **Step 5: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.ts \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/instanceActions.test.ts \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.test.tsx
git commit -m "feat(compute): register floating-ip attach/detach actions (list-only)"
```

---

### Task 7: DetachFloatingIpModal + menu wiring

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/DetachFloatingIpModal.tsx`
- Test: `DetachFloatingIpModal.test.tsx` (create)
- Modify: `InstanceActionsMenu.tsx` (mount the modal on `activeModal === "detachFloatingIp"`)

**Interfaces:**
- Consumes (Task 5): `useDetachFloatingIpMutation`. The instance's floating IPs from the list `ips` (`type === "floating"`).
- Produces: `DetachFloatingIpModal({ instance, apiClient, onClose })`.

- [ ] **Step 1: Write the failing test**

Mirror `SnapshotModal.test.tsx` (mock the mutation hook or the apiClient). Build detach first — it needs no form-options fetch, so it's the simpler modal.

```tsx
// Tests:
// 1. "lists the instance's floating IPs as choices" — renders an entry per
//    ips[].type === "floating".
// 2. "preselects the only floating IP and detaches it on submit" — single FIP,
//    submit calls detachFloatingIp(id, { floating_ip_address }) then onClose.
// 3. "requires a selection when the instance has several floating IPs" — two
//    FIPs, submit disabled until one is picked; picks the second, submits with
//    that address.
// 4. "keeps the modal open and shows the error on a failed submit" — mutation
//    rejects, alert shown, onClose not called.
```

Use the same apiClient-mock shape as `SnapshotModal.test.tsx` (`{ instances: { detachFloatingIp: vi.fn() } }`) wrapped in a `QueryClientProvider`.

- [ ] **Step 2: Run it to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/DetachFloatingIpModal.test.tsx"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the modal**

Follow `SnapshotModal.tsx`'s shape (Modal chrome, `useQueryClient`, mutation, error alert that keeps the modal open, Cancel + primary button, `mutation.mutate(vars, { onSuccess: () => onClose() })`). Read the instance's floating IPs from `instance.ips.filter((ip) => ip.type === "floating")`; render a radio list (or a select) of addresses; preselect when there is exactly one. Primary button disabled until a selection exists or while pending.

- [ ] **Step 4: Run it to verify it passes**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/DetachFloatingIpModal.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Wire into the menu**

In `InstanceActionsMenu.tsx`, add next to the `snapshot`/`resize` modal mounts:

```tsx
{activeModal === "detachFloatingIp" && (
  <DetachFloatingIpModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />
)}
```

Import the component at the top. (The `attachFloatingIp` mount is added in Task 8.)

- [ ] **Step 6: Run the plugin suite + tsc**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json | grep -c 'error TS'"`
Expected: vitest green; tsc `8`.

- [ ] **Step 7: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/DetachFloatingIpModal.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/DetachFloatingIpModal.test.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx
git commit -m "feat(compute): add detach floating ip modal"
```

---

### Task 8: AttachFloatingIpModal + menu wiring

**Files:**
- Create: `plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/AttachFloatingIpModal.tsx`
- Test: `AttachFloatingIpModal.test.tsx` (create)
- Possibly create: `plugins/compute_njq/app/javascript/widgets/app/hooks/useFloatingIpOptionsQuery.ts` (a `useQuery` over `api.formOptions.getFloatingIpOptions`, matching the existing `useFormOptionQueries` style) + mock it in the test the way `ResizeModal.test.tsx` mocks `useFlavorsQuery`.
- Modify: `InstanceActionsMenu.tsx` (mount on `activeModal === "attachFloatingIp"`)

**Interfaces:**
- Consumes (Task 4/5): `api.formOptions.getFloatingIpOptions`, `useAttachFloatingIpMutation`; the instance's fixed IPs (from `instance.ips` where `type === "fixed"`).
- Produces: `AttachFloatingIpModal({ instance, apiClient, onClose })`.

- [ ] **Step 1: Write the failing test**

Mirror `ResizeModal.test.tsx` (it fetches options on open). Mock the options query to return a couple of free FIPs + one external network.

```tsx
// Tests:
// 1. "offers existing free floating IPs and an allocate-new option" — renders
//    the free FIP addresses and the external-network choice.
// 2. "attaches an existing FIP to the sole fixed IP" — pick a free FIP; single
//    fixed IP preselected; submit calls attachFloatingIp(id, {
//    floating_ip_id, fixed_ip_address }) (no floating_network_id) then onClose.
// 3. "lets the user pick the target fixed IP on a multi-NIC instance" — two
//    fixed IPs; submit carries the chosen fixed_ip_address.
// 4. "allocates a new FIP when the allocate-new option is chosen" — choose
//    allocate-new + an external network; submit calls attachFloatingIp with
//    { floating_network_id, fixed_ip_address } and no floating_ip_id.
// 5. "keeps the modal open and shows the error on a failed submit".
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/AttachFloatingIpModal.test.tsx"`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the options query hook (if not inlined)**

`useFloatingIpOptionsQuery.ts` following `useFormOptionQueries.ts`:

```ts
import { useQuery } from "@tanstack/react-query"
import { ComputeApi } from "../apiClient"
import { QUERY_KEYS } from "./queryKeys"

export function useFloatingIpOptionsQuery(api: ComputeApi) {
  return useQuery({
    queryKey: QUERY_KEYS.floatingIpOptions,
    queryFn: () => api.formOptions.getFloatingIpOptions(),
  })
}
```

Add `floatingIpOptions` to `QUERY_KEYS` in `queryKeys.ts` (mirror the existing form-option keys).

- [ ] **Step 4: Implement the modal**

Follow `ResizeModal.tsx`: fetch options via the hook; a mode toggle ("Use existing" / "Allocate new"); when existing, a select of `available_floating_ips`; when allocate-new, a select of `external_networks`; a target-fixed-IP select built from `instance.ips.filter((ip) => ip.type === "fixed")` (hidden/auto when exactly one). Submit builds `{ floating_ip_id | floating_network_id, fixed_ip_address }` and calls the attach mutation, closing on success; error alert keeps it open. Disable submit until the required selection(s) exist or while pending.

- [ ] **Step 5: Run it to verify it passes**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/AttachFloatingIpModal.test.tsx"`
Expected: PASS.

- [ ] **Step 6: Wire into the menu**

In `InstanceActionsMenu.tsx`:

```tsx
{activeModal === "attachFloatingIp" && (
  <AttachFloatingIpModal instance={instance} apiClient={apiClient} onClose={() => setActiveModal(null)} />
)}
```

- [ ] **Step 7: Full suite + tsc**

Run: `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json | grep -c 'error TS'"`
Expected: vitest all green; tsc `8`.

- [ ] **Step 8: Commit**

```bash
git add plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/AttachFloatingIpModal.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/AttachFloatingIpModal.test.tsx \
        plugins/compute_njq/app/javascript/widgets/app/routes/instances/-components/InstanceActionsMenu.tsx \
        plugins/compute_njq/app/javascript/widgets/app/hooks/useFloatingIpOptionsQuery.ts \
        plugins/compute_njq/app/javascript/widgets/app/hooks/queryKeys.ts
git commit -m "feat(compute): add attach floating ip modal"
```

---

## Verification (whole feature)

1. **Full JS suite:** `docker exec elektra bash -c "cd /app && pnpm vitest run plugins/compute_njq"` → all green.
2. **Typecheck:** `docker exec elektra bash -c "cd /app && npx tsc --noEmit -p plugins/compute_njq/tsconfig.json | grep -c 'error TS'"` → `8` (baseline, no new).
3. **Ruby suite:** `docker exec elektra bash -c "cd /app && bundle exec rspec plugins/compute_njq/spec"` → all green.
4. **Manual (port 8010, after a Rails restart so the two new policy rules load):** instance list → row cog shows "Attach Floating IP" (active/stopped) and "Detach Floating IP" (only when the VM has a FIP). Attach: pick an existing free FIP or allocate a new one on an external network, pick the target fixed IP (multi-NIC), submit → modal closes → pill shows the associating transition → list refreshes with the FIP. Detach: pick the FIP, submit → closes → FIP gone. Detail modal cog shows neither action.

## Notes

- **Rails restart required** before the actions appear (policy rules are boot-loaded into `window.policyConfig`), same operational note as the snapshot rule.
- This plan builds on the two committed changes (`b84d9880d` snapshot pill, `7a2e91ef2` detail menu) and the committed-later spec `docs/compute-njq/floating-ip-actions-spec.md`.
- Interface actions (Attach/Detach Interface) and Web Console / Edit Security Groups remain separate follow-up blocks.
