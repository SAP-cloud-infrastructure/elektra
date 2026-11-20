# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::InstanceAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::InstanceAssembler
      # The service provides cached_lookup; in unit tests just yield (no cache).
      def self.cached_lookup(_name)
        yield
      end
    end
  end

  let(:server) do
    {
      "id" => "s1",
      "name" => "web-01",
      "status" => "ACTIVE",
      "OS-EXT-STS:task_state" => nil,
      "created" => "2026-01-01T00:00:00Z",
      "flavor" => { "id" => "f1" },
      "image" => { "id" => "i1" },
      "addresses" => {
        "private" => [
          { "addr" => "10.0.0.5", "OS-EXT-IPS:type" => "fixed" },
          { "addr" => "203.0.113.9", "OS-EXT-IPS:type" => "floating" },
        ],
      },
    }
  end

  before do
    allow(test_class).to receive(:nova_flavors).and_return([{ "id" => "f1", "name" => "m1.small" }])
    allow(test_class).to receive(:glance_images).and_return([{ "id" => "i1", "name" => "ubuntu-24.04" }])
    # Default: no Neutron floating IPs, so the fixed->floating merge is a no-op
    # and the address-derived cases below are unaffected.
    allow(test_class).to receive(:neutron_floating_ips).and_return([])
  end

  describe "#list_instances" do
    before { allow(test_class).to receive(:nova_servers).and_return([server]) }

    it "returns UI-shaped hashes with resolved flavor and image names" do
      result = test_class.list_instances
      expect(result.size).to eq(1)
      instance = result.first

      expect(instance[:id]).to eq("s1")
      expect(instance[:name]).to eq("web-01")
      expect(instance[:flavor]).to eq({ id: "f1", name: "m1.small" })
      expect(instance[:image]).to eq({ id: "i1", name: "ubuntu-24.04" })
    end

    it "exposes the availability zone from OS-EXT-AZ:availability_zone" do
      allow(test_class).to receive(:nova_servers).and_return([server.merge("OS-EXT-AZ:availability_zone" => "qa-de-1a")])
      expect(test_class.list_instances.first[:availability_zone]).to eq("qa-de-1a")
    end

    it "prefers the embedded flavor original_name over the catalog lookup" do
      allow(test_class).to receive(:nova_servers).and_return(
        [server.merge("flavor" => { "original_name" => "g_c8_m16" })],
      )
      flavor = test_class.list_instances.first[:flavor]
      expect(flavor[:name]).to eq("g_c8_m16")
    end

    it "prefers the image name from server metadata over the Glance catalog" do
      allow(test_class).to receive(:nova_servers).and_return(
        [server.merge("metadata" => { "image_name" => "gardenlinux-prod" })],
      )
      expect(test_class.list_instances.first[:image][:name]).to eq("gardenlinux-prod")
    end

    it "maps the semantic status" do
      instance = test_class.list_instances.first
      expect(instance[:status][:state]).to eq("active")
      expect(instance[:status][:transition]).to be_nil
    end

    it "includes the human power-state label derived from OS-EXT-STS:power_state" do
      allow(test_class).to receive(:nova_servers).and_return([server.merge("OS-EXT-STS:power_state" => 1)])
      expect(test_class.list_instances.first[:status][:power_state]).to eq("Running")
    end

    it "falls back to 'No State' when the power_state code is missing or unknown" do
      expect(test_class.list_instances.first[:status][:power_state]).to eq("No State")
      allow(test_class).to receive(:nova_servers).and_return([server.merge("OS-EXT-STS:power_state" => 99)])
      expect(test_class.list_instances.first[:status][:power_state]).to eq("No State")
    end

    it "lists fixed IPs from Nova and floating IPs from Neutron" do
      # Fixed IPs come from Nova's addresses; the floating IP is derived from the
      # Neutron fixed->floating map (Neutron is the source of truth for FIPs, so
      # a stale Nova floating entry never drives the list). Here both agree.
      allow(test_class).to receive(:neutron_floating_ips).and_return(
        [{ "fixed_ip_address" => "10.0.0.5", "floating_ip_address" => "203.0.113.9" }],
      )
      instance = test_class.list_instances.first
      expect(instance[:ips]).to eq(
        [
          { addr: "10.0.0.5", type: "fixed" },
          { addr: "203.0.113.9", type: "floating" },
        ],
      )
    end

    it "drops a floating IP that Nova still reports but Neutron no longer associates" do
      # After a detach, Neutron nulls the FIP's fixed_ip_address immediately but
      # Nova's addresses lag and still list the FIP as floating. Neutron is the
      # source of truth, so the list must NOT show the detached FIP.
      allow(test_class).to receive(:neutron_floating_ips).and_return([]) # nothing associated
      ips = test_class.list_instances.first[:ips]
      expect(ips).to eq([{ addr: "10.0.0.5", type: "fixed" }])
      expect(ips).not_to include({ addr: "203.0.113.9", type: "floating" })
    end

    it "surfaces a floating IP from Neutron that Nova's addresses do not yet report" do
      # A freshly-associated FIP: Neutron knows it (fixed_ip_address matches the
      # server's fixed 10.0.0.5), but Nova's cached addresses have not caught up,
      # so only the fixed IP is in server["addresses"].
      nova_only_fixed = server.merge(
        "addresses" => { "private" => [{ "addr" => "10.0.0.5", "OS-EXT-IPS:type" => "fixed" }] },
      )
      allow(test_class).to receive(:nova_servers).and_return([nova_only_fixed])
      allow(test_class).to receive(:neutron_floating_ips).and_return(
        [{ "fixed_ip_address" => "10.0.0.5", "floating_ip_address" => "198.51.100.7" }],
      )

      ips = test_class.list_instances.first[:ips]
      expect(ips).to include({ addr: "198.51.100.7", type: "floating" })
      expect(ips).to include({ addr: "10.0.0.5", type: "fixed" })
    end

    it "lists a floating IP from Neutron exactly once" do
      # Neutron associates a FIP with 10.0.0.5; it must appear once (and Nova's
      # own floating entry for the same addr must not produce a duplicate).
      allow(test_class).to receive(:neutron_floating_ips).and_return(
        [{ "fixed_ip_address" => "10.0.0.5", "floating_ip_address" => "203.0.113.9" }],
      )
      ips = test_class.list_instances.first[:ips]
      expect(ips.count { |ip| ip == { addr: "203.0.113.9", type: "floating" } }).to eq(1)
    end

    it "derives the list floating-IP map fresh (not from the 10-minute cache)" do
      # A just-attached FIP must show immediately, so the list reads Neutron
      # directly rather than through cached_lookup. If the map were cached, the
      # raw neutron_floating_ips would not be hit on this list load.
      expect(test_class).to receive(:neutron_floating_ips).and_return([])
      test_class.list_instances
    end

    it "handles boot-from-volume servers where Nova returns image as an empty string" do
      # Nova (microversion 2.67) reports "image" => "" for volume-booted
      # instances, not a Hash. The assembler must not call #dig on a String.
      allow(test_class).to receive(:nova_servers).and_return([server.merge("image" => "")])
      instance = test_class.list_instances.first
      expect(instance[:image]).to eq({ id: nil, name: nil })
    end

    it "handles a server where Nova returns flavor as an empty string" do
      allow(test_class).to receive(:nova_servers).and_return([server.merge("flavor" => "")])
      instance = test_class.list_instances.first
      expect(instance[:flavor]).to eq({ id: nil, name: nil })
    end

    it "returns [] when there are no servers (and skips the join calls)" do
      allow(test_class).to receive(:nova_servers).and_return([])
      expect(test_class).not_to receive(:nova_flavors)
      expect(test_class.list_instances).to eq([])
    end

    it "emits plain data only — never HTML/markup strings" do
      instance = test_class.list_instances.first
      expect(instance.to_s).not_to match(/<[a-z]/i)
    end
  end

  describe "status mapping" do
    it "maps SHUTOFF to stopped, ERROR to error, BUILD to building" do
      {
        "SHUTOFF" => "stopped",
        "ERROR" => "error",
        "BUILD" => "building",
        "REBOOT" => "reboot",
      }.each do |raw, expected|
        allow(test_class).to receive(:nova_servers).and_return([server.merge("status" => raw)])
        expect(test_class.list_instances.first[:status][:state]).to eq(expected)
      end
    end

    it "maps VERIFY_RESIZE and RESIZED to the verify_resize state" do
      %w[VERIFY_RESIZE RESIZED].each do |raw|
        allow(test_class).to receive(:nova_servers).and_return([server.merge("status" => raw)])
        expect(test_class.list_instances.first[:status][:state]).to eq("verify_resize")
      end
    end

    it "exposes the fault message for an errored server" do
      allow(test_class).to receive(:nova_servers).and_return(
        [server.merge("status" => "ERROR", "fault" => { "message" => "No valid host was found" })],
      )
      expect(test_class.list_instances.first[:status][:fault_message]).to eq("No valid host was found")
    end

    it "has no fault message for a non-errored server" do
      allow(test_class).to receive(:nova_servers).and_return([server])
      expect(test_class.list_instances.first[:status][:fault_message]).to be_nil
    end

    it "passes through an active Nova task_state as the transition" do
      allow(test_class).to receive(:nova_servers).and_return(
        [server.merge("OS-EXT-STS:task_state" => "spawning")],
      )
      expect(test_class.list_instances.first[:status][:transition]).to eq("spawning")
    end
  end

  describe "#find_instance" do
    it "assembles a single instance" do
      allow(test_class).to receive(:nova_server).with("s1").and_return(server)
      expect(test_class.find_instance("s1")[:id]).to eq("s1")
    end

    it "returns nil when the server is not found" do
      allow(test_class).to receive(:nova_server).with("missing").and_return(nil)
      expect(test_class.find_instance("missing")).to be_nil
    end
  end

  describe "locked flag" do
    it "passes through a true locked flag" do
      allow(test_class).to receive(:nova_servers).and_return([server.merge("locked" => true)])
      expect(test_class.list_instances.first[:locked]).to eq(true)
    end

    it "defaults locked to false when Nova omits it" do
      allow(test_class).to receive(:nova_servers).and_return([server])
      expect(test_class.list_instances.first[:locked]).to eq(false)
    end
  end
end
