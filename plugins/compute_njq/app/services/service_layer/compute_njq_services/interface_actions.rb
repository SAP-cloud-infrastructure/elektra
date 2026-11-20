# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Attach/detach a network interface (Neutron port) to a Nova server.
    #
    # Attach creates the port first (carrying network/subnet/fixed-ip/SG), then
    # attaches it to Nova by port_id — if the Nova attach fails the orphaned port
    # is rolled back. Detach resolves the port_id from the server's live
    # os-interfaces by the chosen fixed IP.
    module InterfaceActions
      def attach_interface(server_id, network_id:, subnet_id: nil, ip_address: nil, security_groups: [])
        raise ComputeNjq::RequestError, "network is required" if network_id.to_s == ""

        port = neutron_create_port(
          network_id: network_id, subnet_id: subnet_id, ip_address: ip_address, security_groups: security_groups,
        )
        begin
          nova_attach_interface(server_id, { "port_id" => port["id"] })
        rescue StandardError => e
          # Best-effort rollback of the port we just created; never mask the
          # original failure with a rollback error.
          begin
            neutron_delete_port(port["id"])
          rescue StandardError
            nil
          end
          raise e
        end
        { ok: true }
      end

      def detach_interface(server_id, fixed_ip_address:)
        interfaces = nova_server_os_interfaces(server_id)
        match = interfaces.find do |iface|
          Array(iface["fixed_ips"]).any? { |f| f["ip_address"] == fixed_ip_address }
        end
        raise ComputeNjq::RequestError, "No interface found for #{fixed_ip_address}" if match.nil?

        nova_detach_interface(server_id, match["port_id"])
        { ok: true }
      end
    end
  end
end
