# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNgServices::InstanceAssembler do
  let(:test_class) { Class.new { extend ServiceLayer::ComputeNgServices::InstanceAssembler } }

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
    allow(test_class).to receive(:neutron_floating_ips).and_return(
      [{ "fixed_ip_address" => "10.0.0.5", "floating_ip_address" => "203.0.113.9" }],
    )
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

    it "maps the semantic status" do
      instance = test_class.list_instances.first
      expect(instance[:status]).to eq({ state: "active", transition: nil })
    end

    it "separates fixed and floating IPs and dedupes the attached floating IP" do
      instance = test_class.list_instances.first
      expect(instance[:ips][:fixed]).to eq(["10.0.0.5"])
      expect(instance[:ips][:floating]).to eq(["203.0.113.9"])
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
