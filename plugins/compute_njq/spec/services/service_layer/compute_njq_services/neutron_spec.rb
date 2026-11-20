# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Neutron do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::Neutron
      def self.scoped_project_id = "p1"
    end
  end

  let(:elektron_neutron) do
    double("elektron_neutron").tap do |mock|
      allow(mock).to receive(:get).with("floatingips", { tenant_id: "p1" }).and_return(
        double("response", body: { "floatingips" => [{ "floating_ip_address" => "1.2.3.4" }] }),
      )
    end
  end

  before { allow(test_class).to receive(:elektron_neutron).and_return(elektron_neutron) }

  describe "#neutron_floating_ips" do
    it "scopes the query to the project and returns the list" do
      expect(test_class.neutron_floating_ips).to eq([{ "floating_ip_address" => "1.2.3.4" }])
    end

    it "returns [] when no floating IPs exist" do
      allow(elektron_neutron).to receive(:get).with("floatingips", { tenant_id: "p1" }).and_return(
        double("response", body: {}),
      )
      expect(test_class.neutron_floating_ips).to eq([])
    end
  end

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

  describe "#neutron_subnets" do
    it "returns all subnets" do
      allow(elektron_neutron).to receive(:get).with("subnets").and_return(
        double("response", body: { "subnets" => [{ "id" => "s1", "cidr" => "10.0.0.0/24" }] }),
      )
      expect(test_class.neutron_subnets).to eq([{ "id" => "s1", "cidr" => "10.0.0.0/24" }])
    end
  end

  describe "#neutron_fixed_ip_ports" do
    it "fetches ports named fixed_ip_allocation" do
      allow(elektron_neutron).to receive(:get).with("ports", { "name" => "fixed_ip_allocation" }).and_return(
        double("response", body: { "ports" => [{ "id" => "p1" }] }),
      )
      expect(test_class.neutron_fixed_ip_ports).to eq([{ "id" => "p1" }])
    end
  end

  describe "#neutron_create_port" do
    it "posts a port with network, subnet fixed_ip and security groups" do
      captured = nil
      allow(elektron_neutron).to receive(:post).with("ports") do |&blk|
        captured = blk.call
        double("response", body: { "port" => { "id" => "p1" } })
      end

      result = test_class.neutron_create_port(network_id: "n1", subnet_id: "s1", security_groups: ["sg1"])

      expect(result).to eq({ "id" => "p1" })
      expect(captured).to eq({
        "port" => {
          "network_id" => "n1",
          "fixed_ips" => [{ "subnet_id" => "s1" }],
          "security_groups" => ["sg1"],
        },
      })
    end

    it "omits fixed_ips and security_groups when not provided" do
      captured = nil
      allow(elektron_neutron).to receive(:post).with("ports") do |&blk|
        captured = blk.call
        double("response", body: { "port" => { "id" => "p2" } })
      end

      test_class.neutron_create_port(network_id: "n1")
      expect(captured).to eq({ "port" => { "network_id" => "n1" } })
    end
  end

  describe "#neutron_delete_port" do
    it "deletes the port and swallows API errors" do
      expect(elektron_neutron).to receive(:delete).with("ports/p1")
      test_class.neutron_delete_port("p1")

      allow(elektron_neutron).to receive(:delete).with("ports/bad").and_raise(
        Elektron::Errors::ApiResponse.new(double(code: 404, body: {})),
      )
      expect { test_class.neutron_delete_port("bad") }.not_to raise_error
    end
  end

  describe "#neutron_available_floating_ips" do
    it "returns only project FIPs with no port_id" do
      allow(elektron_neutron).to receive(:get).with("floatingips", { tenant_id: "p1" }).and_return(
        double("response", body: { "floatingips" => [
          { "id" => "f1", "port_id" => nil, "floating_ip_address" => "1.1.1.1" },
          { "id" => "f2", "port_id" => "", "floating_ip_address" => "1.1.1.2" },
          { "id" => "f3", "port_id" => "port-x", "floating_ip_address" => "1.1.1.3" },
        ] }),
      )
      expect(test_class.neutron_available_floating_ips.map { |f| f["id"] }).to eq(%w[f1 f2])
    end
  end

  describe "#neutron_external_networks" do
    it "fetches router:external networks" do
      allow(elektron_neutron).to receive(:get).with("networks", { "router:external" => true }).and_return(
        double("response", body: { "networks" => [{ "id" => "n1" }] }),
      )
      expect(test_class.neutron_external_networks.map { |n| n["id"] }).to eq(%w[n1])
    end
  end

  describe "#neutron_ports_for_device" do
    it "filters ports by device_id" do
      allow(elektron_neutron).to receive(:get).with("ports", { "device_id" => "s1" }).and_return(
        double("response", body: { "ports" => [{ "id" => "port-1" }] }),
      )
      expect(test_class.neutron_ports_for_device("s1").map { |p| p["id"] }).to eq(%w[port-1])
    end
  end

  describe "#neutron_create_floating_ip" do
    it "POSTs floating_network_id and returns the floatingip hash" do
      captured = nil
      allow(elektron_neutron).to receive(:post).with("floatingips") do |&blk|
        captured = blk.call
        double("response", body: { "floatingip" => { "id" => "new" } })
      end
      expect(test_class.neutron_create_floating_ip("n1")["id"]).to eq("new")
      expect(captured).to eq({ "floatingip" => { "floating_network_id" => "n1" } })
    end
  end

  describe "#neutron_associate_floating_ip" do
    it "PUTs port_id and fixed_ip_address" do
      captured = nil
      allow(elektron_neutron).to receive(:put).with("floatingips/f1") do |&blk|
        captured = blk.call
        double("response", body: { "floatingip" => {} })
      end
      test_class.neutron_associate_floating_ip("f1", port_id: "port-1", fixed_ip_address: "10.0.0.5")
      expect(captured).to eq({ "floatingip" => { "port_id" => "port-1", "fixed_ip_address" => "10.0.0.5" } })
    end
  end

  describe "#neutron_disassociate_floating_ip" do
    it "PUTs nulls for port_id and fixed_ip_address" do
      captured = nil
      allow(elektron_neutron).to receive(:put).with("floatingips/f1") do |&blk|
        captured = blk.call
        double("response", body: { "floatingip" => {} })
      end
      test_class.neutron_disassociate_floating_ip("f1")
      expect(captured).to eq({ "floatingip" => { "port_id" => nil, "fixed_ip_address" => nil } })
    end
  end

  describe "#neutron_floating_ip_by_address" do
    it "finds the FIP whose address matches, else nil" do
      allow(elektron_neutron).to receive(:get).with("floatingips", { tenant_id: "p1" }).and_return(
        double("response", body: { "floatingips" => [
          { "id" => "f1", "floating_ip_address" => "1.1.1.1", "port_id" => "p" },
        ] }),
      )
      expect(test_class.neutron_floating_ip_by_address("1.1.1.1")["id"]).to eq("f1")
      expect(test_class.neutron_floating_ip_by_address("9.9.9.9")).to be_nil
    end
  end
end
