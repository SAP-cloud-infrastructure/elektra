# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Floating-IP association actions, built on the Neutron helpers. Attach may
    # allocate a new FIP (and leaves it in place if association fails, as the
    # legacy flow does). Detach resolves the FIP id from its address so the
    # frontend only has to send the address.
    module FloatingIpActions
      def attach_floating_ip(server_id, floating_ip_id:, floating_network_id:, fixed_ip_address:)
        fip_id =
          if floating_network_id.to_s != ""
            neutron_create_floating_ip(floating_network_id)["id"]
          else
            floating_ip_id
          end
        port = port_for_fixed_ip(server_id, fixed_ip_address)
        neutron_associate_floating_ip(fip_id, port_id: port["id"], fixed_ip_address: fixed_ip_address)
        { ok: true }
      end

      def detach_floating_ip(_server_id, floating_ip_address:)
        fip = neutron_floating_ip_by_address(floating_ip_address)
        raise ComputeNjq::RequestError, "Floating IP #{floating_ip_address} not found for this server" if fip.nil?

        neutron_disassociate_floating_ip(fip["id"])
        { ok: true }
      end

      private

      # The server port whose fixed_ips contains the chosen address; falls back
      # to the first port. Raises when the server has no ports.
      def port_for_fixed_ip(server_id, fixed_ip_address)
        ports = neutron_ports_for_device(server_id)
        raise ComputeNjq::RequestError, "Server has no network port to attach a floating IP to" if ports.empty?

        ports.find { |p| (p["fixed_ips"] || []).any? { |fi| fi["ip_address"] == fixed_ip_address } } || ports.first
      end
    end
  end
end
