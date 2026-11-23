# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::SecurityGroupActions do
  let(:test_class) do
    Class.new { extend ServiceLayer::ComputeNjqServices::SecurityGroupActions }
  end

  describe "#set_instance_security_groups" do
    it "sets the deduped set on every port of the instance" do
      allow(test_class).to receive(:neutron_ports_for_device).with("srv1").and_return(
        [{ "id" => "p1" }, { "id" => "p2" }],
      )
      expect(test_class).to receive(:neutron_update_port).with("p1", security_groups: ["sg-a", "sg-b"])
      expect(test_class).to receive(:neutron_update_port).with("p2", security_groups: ["sg-a", "sg-b"])

      expect(
        test_class.set_instance_security_groups("srv1", security_groups: ["sg-a", "sg-b", "sg-a"]),
      ).to eq({ ok: true })
    end

    it "raises a RequestError when the set is empty" do
      expect {
        test_class.set_instance_security_groups("srv1", security_groups: [])
      }.to raise_error(ComputeNjq::RequestError, /at least one security group/)
    end

    it "raises a RequestError when the instance has no ports" do
      allow(test_class).to receive(:neutron_ports_for_device).with("srv1").and_return([])
      expect {
        test_class.set_instance_security_groups("srv1", security_groups: ["sg-a"])
      }.to raise_error(ComputeNjq::RequestError, /no ports found/)
    end
  end
end
