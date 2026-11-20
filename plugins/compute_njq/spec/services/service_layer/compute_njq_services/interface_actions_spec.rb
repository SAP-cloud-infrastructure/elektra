# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::InterfaceActions do
  let(:test_class) do
    Class.new { extend ServiceLayer::ComputeNjqServices::InterfaceActions }
  end

  describe "#attach_interface" do
    it "creates a port then attaches it by port_id" do
      expect(test_class).to receive(:neutron_create_port).with(
        network_id: "n1", subnet_id: "sub1", ip_address: "10.0.0.9", security_groups: ["sg1"]
      ).and_return({ "id" => "p1" })
      expect(test_class).to receive(:nova_attach_interface).with("s1", { "port_id" => "p1" }).and_return({})
      expect(
        test_class.attach_interface("s1", network_id: "n1", subnet_id: "sub1", ip_address: "10.0.0.9", security_groups: ["sg1"])
      ).to eq({ ok: true })
    end

    it "rolls back the created port when the nova attach fails" do
      allow(test_class).to receive(:neutron_create_port).and_return({ "id" => "p1" })
      allow(test_class).to receive(:nova_attach_interface).and_raise(StandardError, "boom")
      expect(test_class).to receive(:neutron_delete_port).with("p1")
      expect { test_class.attach_interface("s1", network_id: "n1") }.to raise_error(StandardError, "boom")
    end

    it "raises a RequestError when network_id is blank" do
      expect {
        test_class.attach_interface("s1", network_id: "")
      }.to raise_error(ComputeNjq::RequestError, /network is required/)
    end
  end

  describe "#detach_interface" do
    it "resolves the port by fixed ip and detaches it" do
      allow(test_class).to receive(:nova_server_os_interfaces).with("s1").and_return(
        [{ "port_id" => "p1", "fixed_ips" => [{ "ip_address" => "10.0.0.9" }] }],
      )
      expect(test_class).to receive(:nova_detach_interface).with("s1", "p1").and_return({})
      expect(test_class.detach_interface("s1", fixed_ip_address: "10.0.0.9")).to eq({ ok: true })
    end

    it "raises a RequestError when no interface matches the fixed ip" do
      allow(test_class).to receive(:nova_server_os_interfaces).and_return([])
      expect {
        test_class.detach_interface("s1", fixed_ip_address: "10.0.0.9")
      }.to raise_error(ComputeNjq::RequestError, /No interface found/)
    end
  end
end
