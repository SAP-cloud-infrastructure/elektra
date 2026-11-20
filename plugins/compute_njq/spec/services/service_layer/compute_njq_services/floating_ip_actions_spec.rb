# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::FloatingIpActions do
  let(:test_class) do
    Class.new do
      include ServiceLayer::ComputeNjqServices::FloatingIpActions

      attr_accessor :ports, :fip_by_addr, :assoc, :disassoc

      # Stub the Neutron helpers this mixin builds on (added in Task 1).
      def neutron_create_floating_ip(_floating_network_id) = { "id" => "new-fip" }

      def neutron_associate_floating_ip(id, port_id:, fixed_ip_address:)
        @assoc = { id: id, port_id: port_id, fixed_ip_address: fixed_ip_address }
      end

      def neutron_disassociate_floating_ip(id) = (@disassoc = id)

      def neutron_ports_for_device(_device_id) = ports

      def neutron_floating_ip_by_address(_address) = fip_by_addr
    end.new
  end

  describe "#attach_floating_ip with an existing FIP" do
    it "associates it with the port carrying the chosen fixed IP (multi-NIC)" do
      test_class.ports = [
        { "id" => "port-a", "fixed_ips" => [{ "ip_address" => "10.0.0.5" }] },
        { "id" => "port-b", "fixed_ips" => [{ "ip_address" => "10.0.0.9" }] },
      ]
      test_class.attach_floating_ip("s1", floating_ip_id: "f1", floating_network_id: nil, fixed_ip_address: "10.0.0.9")
      expect(test_class.assoc).to eq({ id: "f1", port_id: "port-b", fixed_ip_address: "10.0.0.9" })
    end
  end

  describe "#attach_floating_ip allocating a new FIP" do
    it "creates then associates the new FIP and does not delete it on associate failure" do
      test_class.ports = [{ "id" => "port-a", "fixed_ips" => [{ "ip_address" => "10.0.0.5" }] }]
      def test_class.neutron_associate_floating_ip(*) = raise("boom")
      # No delete helper exists on the stub; invoking one would raise NoMethodError.
      expect do
        test_class.attach_floating_ip("s1", floating_ip_id: nil, floating_network_id: "n1", fixed_ip_address: "10.0.0.5")
      end.to raise_error("boom")
    end
  end

  describe "#attach_floating_ip with no ports" do
    it "raises instead of dereferencing nil" do
      test_class.ports = []
      expect do
        test_class.attach_floating_ip("s1", floating_ip_id: "f1", floating_network_id: nil, fixed_ip_address: "10.0.0.5")
      end.to raise_error(ComputeNjq::RequestError, /no.*port/i)
    end
  end

  describe "#detach_floating_ip" do
    it "resolves the id from the address and disassociates" do
      test_class.fip_by_addr = { "id" => "f9", "floating_ip_address" => "1.2.3.4" }
      test_class.detach_floating_ip("s1", floating_ip_address: "1.2.3.4")
      expect(test_class.disassoc).to eq("f9")
    end

    it "raises a not-found error when the address has no FIP" do
      test_class.fip_by_addr = nil
      expect do
        test_class.detach_floating_ip("s1", floating_ip_address: "9.9.9.9")
      end.to raise_error(ComputeNjq::RequestError, /floating ip/i)
    end
  end
end
