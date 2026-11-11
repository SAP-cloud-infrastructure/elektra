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
end
