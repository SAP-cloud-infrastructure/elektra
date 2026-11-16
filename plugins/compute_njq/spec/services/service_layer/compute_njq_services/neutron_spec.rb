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
      allow(test_class).to receive(:scoped_project_id).and_return("p1")
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
end
