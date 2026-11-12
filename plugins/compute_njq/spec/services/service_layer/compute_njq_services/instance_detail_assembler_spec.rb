# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::InstanceDetailAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::InstanceAssembler
      extend ServiceLayer::ComputeNjqServices::InstanceDetailAssembler
      def self.scoped_project_id = "project_1"
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
      "OS-EXT-AZ:availability_zone" => "az-a",
      "OS-EXT-SRV-ATTR:host" => "node-42",
      "OS-EXT-SRV-ATTR:root_device_name" => "/dev/vda",
      "created" => "2026-01-01T00:00:00Z",
      "updated" => "2026-01-02T00:00:00Z",
      "tenant_id" => "project_1",
      "key_name" => "my-key",
      "tags" => %w[prod web],
      "flavor" => { "id" => "f1", "original_name" => "m1.small", "ram" => 2048, "vcpus" => 2, "disk" => 20 },
      "image" => { "id" => "i1" },
      "metadata" => { "owner" => "team-a" },
      "addresses" => {
        "private" => [
          { "addr" => "10.0.0.5", "OS-EXT-IPS:type" => "fixed", "OS-EXT-IPS-MAC:mac_addr" => "aa:bb" },
          { "addr" => "203.0.113.9", "OS-EXT-IPS:type" => "floating" },
        ],
      },
      "os-extended-volumes:volumes_attached" => [{ "id" => "v1" }],
    }
  end

  before do
    allow(test_class).to receive(:nova_server).with("s1").and_return(server)
    allow(test_class).to receive(:glance_images).and_return([{ "id" => "i1", "name" => "ubuntu-24.04" }])
    allow(test_class).to receive(:neutron_floating_ips).and_return(
      [{ "fixed_ip_address" => "10.0.0.5", "floating_ip_address" => "203.0.113.9" }],
    )
    allow(test_class).to receive(:nova_server_security_groups).with("s1").and_return([{ "id" => "sg1" }])
    allow(test_class).to receive(:neutron_security_groups).and_return(
      [{ "id" => "sg1", "name" => "default" }, { "id" => "sg2", "name" => "db" }],
    )
    allow(test_class).to receive(:neutron_security_group).with("sg1").and_return(
      {
        "id" => "sg1",
        "name" => "default",
        "project_id" => "project_1",
        "security_group_rules" => [
          { "ethertype" => "IPv4", "protocol" => "tcp", "port_range_min" => 22, "port_range_max" => 22,
            "direction" => "ingress", "remote_ip_prefix" => "0.0.0.0/0" },
          { "ethertype" => "IPv4", "protocol" => nil, "direction" => "ingress", "remote_group_id" => "sg2" },
        ],
      },
    )
    allow(test_class).to receive(:cinder_volume).with("v1").and_return(
      { "id" => "v1", "name" => "root-vol", "size" => 50, "attachments" => [{ "device" => "/dev/vda" }] },
    )
    allow(test_class).to receive(:identity_project).and_return({ "name" => "Demo Project" })
  end

  subject(:detail) { test_class.find_instance_detail("s1") }

  it "returns nil when the server is not found" do
    allow(test_class).to receive(:nova_server).with("missing").and_return(nil)
    expect(test_class.find_instance_detail("missing")).to be_nil
  end

  describe "information" do
    it "maps the top-level fields" do
      expect(detail[:id]).to eq("s1")
      expect(detail[:name]).to eq("web-01")
      expect(detail[:availability_zone]).to eq("az-a")
      expect(detail[:host]).to eq("node-42")
      expect(detail[:created]).to eq("2026-01-01T00:00:00Z")
      expect(detail[:updated]).to eq("2026-01-02T00:00:00Z")
      expect(detail[:key_name]).to eq("my-key")
      expect(detail[:tags]).to eq(%w[prod web])
    end

    it "marks the project as same-scope and resolves its name" do
      expect(detail[:project]).to eq(id: "project_1", name: "Demo Project", same_scope: true)
    end

    it "has no fault message for a non-error status" do
      expect(detail[:fault_message]).to be_nil
    end

    it "extracts the fault message for an error status" do
      allow(test_class).to receive(:nova_server).with("s1").and_return(
        server.merge("status" => "ERROR", "fault" => { "message" => "boom" }),
      )
      expect(detail[:fault_message]).to eq("boom")
    end

    it "falls back to a placeholder message for an error status without a fault" do
      allow(test_class).to receive(:nova_server).with("s1").and_return(server.merge("status" => "ERROR"))
      expect(detail[:fault_message]).to match(/no error message found/)
    end
  end

  describe "specs" do
    it "uses the root volume size over the flavor disk when a root device matches" do
      expect(detail[:specs]).to eq(
        flavor: "m1.small", ram: 2048, vcpus: 2, root_disk_size: 50, root_disk_device: "/dev/vda",
      )
    end

    it "is nil for boot-from-volume servers where Nova returns flavor as a string" do
      allow(test_class).to receive(:nova_server).with("s1").and_return(server.merge("flavor" => ""))
      expect(detail[:specs]).to be_nil
    end
  end

  describe "ip_addresses" do
    it "groups by network and attaches the floating IP to its fixed IP" do
      expect(detail[:ip_addresses]).to eq(
        [
          {
            network_name: "private",
            ips: [{ fixed: { addr: "10.0.0.5", mac: "aa:bb" }, floating: { addr: "203.0.113.9" } }],
          },
        ],
      )
    end
  end

  describe "security_groups" do
    it "renders the rule strings exactly like the legacy SecurityGroupRule#to_s" do
      sg = detail[:security_groups].first
      expect(sg[:name]).to eq("default")
      expect(sg[:rules]).to eq(
        ["ALLOW IPv4 tcp 22 from 0.0.0.0/0", "ALLOW IPv4 any protocol any port from db"],
      )
    end
  end

  describe "metadata" do
    it "resolves the image name from Glance and lists the extra entries" do
      expect(detail[:metadata][:image_name]).to eq("ubuntu-24.04")
      expect(detail[:metadata][:image_id]).to eq("i1")
      expect(detail[:metadata][:extra]).to eq([{ key: "owner", value: "team-a" }])
    end
  end

  describe "volumes" do
    it "resolves attached volumes to name/device/size" do
      expect(detail[:volumes]).to eq(
        [{ id: "v1", name: "root-vol", device: "/dev/vda", size: 50 }],
      )
    end
  end

  it "emits plain data only — never HTML/markup strings" do
    expect(detail.to_s).not_to match(/<[a-z]/i)
  end
end
