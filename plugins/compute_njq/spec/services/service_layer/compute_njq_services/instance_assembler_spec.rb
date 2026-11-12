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

    it "lists each IP from the server addresses, tagged with its Nova type" do
      instance = test_class.list_instances.first
      expect(instance[:ips]).to eq(
        [
          { addr: "10.0.0.5", type: "fixed" },
          { addr: "203.0.113.9", type: "floating" },
        ],
      )
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
end
