# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Neutron (network) access, implemented independently of the networking
    # plugin. Only the slices the instance list + detail need live here.
    module Neutron
      # Floating IPs for the scoped project, returned as raw hashes. The
      # InstanceAssembler caches the small derived fixed->floating map rather
      # than this full list, so this stays a plain fetch.
      def neutron_floating_ips
        filter = scoped_project_id ? { tenant_id: scoped_project_id } : {}
        elektron_neutron.get("floatingips", filter).body["floatingips"] || []
      end

      # Private, attachable networks for the scoped project (no external networks).
      def neutron_networks
        elektron_neutron.get("networks", { "router:external" => false }).body["networks"] || []
      end

      # Security groups visible to the scoped project (shared SGs included — no tenant filter).
      def neutron_security_groups
        elektron_neutron.get("security-groups").body["security_groups"] || []
      end

      # Full detail (including rules) for a single security group, or nil when
      # it cannot be resolved. The instance detail re-fetches each of a server's
      # security groups from Neutron because Nova's os-security-groups payload
      # does not carry the complete rule set.
      def neutron_security_group(id)
        elektron_neutron.get("security-groups/#{id}").body["security_group"]
      rescue Elektron::Errors::ApiResponse
        nil
      end

      # All subnets visible to the project, as raw hashes. The create form embeds
      # the whole list and filters it client-side by network_id (like the legacy
      # form), so this is an unfiltered fetch.
      def neutron_subnets
        elektron_neutron.get("subnets").body["subnets"] || []
      end

      # Name under which a reserved "fixed IP allocation" port is created by the
      # networking plugin's reserve-IP feature. The create form offers these as
      # pre-reserved IPs to attach to (mirrors the legacy fixed_ip_ports).
      FIXED_IP_PORT_NAME = "fixed_ip_allocation"

      # Pre-reserved fixed-IP ports for the project: Neutron ports named
      # "fixed_ip_allocation". Selecting one attaches the instance to that
      # existing port instead of asking Nova for a fresh IP.
      def neutron_fixed_ip_ports
        elektron_neutron.get("ports", { "name" => FIXED_IP_PORT_NAME }).body["ports"] || []
      end

      # Creates a Neutron port on the given network, optionally pinned to a
      # subnet (the instance then boots attached to this port). Returns the raw
      # port hash. Used for the "advanced network options" boot path.
      def neutron_create_port(network_id:, subnet_id: nil, ip_address: nil, security_groups: [])
        port = { "network_id" => network_id }
        if subnet_id.present?
          fixed = { "subnet_id" => subnet_id }
          fixed["ip_address"] = ip_address if ip_address
          port["fixed_ips"] = [fixed]
        end
        port["security_groups"] = security_groups if security_groups.present?
        elektron_neutron.post("ports") { { "port" => port } }.body["port"]
      end

      # Best-effort delete of a port we created, used to roll back when the
      # subsequent server create fails. Never raises.
      def neutron_delete_port(id)
        elektron_neutron.delete("ports/#{id}")
      rescue Elektron::Errors::ApiResponse
        nil
      end

      # Project FIPs that are not currently associated (no port_id) — the attach
      # modal offers these as free to attach.
      def neutron_available_floating_ips
        neutron_floating_ips.select { |fip| fip["port_id"].to_s.empty? }
      end

      # External networks a floating IP may be allocated from.
      def neutron_external_networks
        elektron_neutron.get("networks", { "router:external" => true }).body["networks"] || []
      end

      # The scoped project's Neutron ports for a server (device_id == server id),
      # used to find the port that carries a chosen fixed IP when associating.
      def neutron_ports_for_device(device_id)
        elektron_neutron.get("ports", { "device_id" => device_id }).body["ports"] || []
      end

      # Replace the security-group set on a port (PUT ports/{id}). Editing an
      # instance's security groups writes the full desired set to each of its
      # ports — SG membership lives on the Neutron port in this plugin.
      def neutron_update_port(port_id, security_groups:)
        elektron_neutron
          .put("ports/#{port_id}") { { "port" => { "security_groups" => Array(security_groups) } } }
          .body["port"]
      end

      # Allocate a new floating IP on an external network. Returns the raw hash.
      def neutron_create_floating_ip(floating_network_id)
        elektron_neutron
          .post("floatingips") { { "floatingip" => { "floating_network_id" => floating_network_id } } }
          .body["floatingip"]
      end

      # Associate a FIP with a port + fixed IP (PUT floatingips/{id}).
      def neutron_associate_floating_ip(id, port_id:, fixed_ip_address:)
        elektron_neutron
          .put("floatingips/#{id}") { { "floatingip" => { "port_id" => port_id, "fixed_ip_address" => fixed_ip_address } } }
          .body["floatingip"]
      end

      # Disassociate a FIP (PUT floatingips/{id} nulling both fields).
      def neutron_disassociate_floating_ip(id)
        elektron_neutron
          .put("floatingips/#{id}") { { "floatingip" => { "port_id" => nil, "fixed_ip_address" => nil } } }
          .body["floatingip"]
      end

      # Resolve a project FIP hash by its address, or nil.
      def neutron_floating_ip_by_address(address)
        neutron_floating_ips.find { |fip| fip["floating_ip_address"] == address }
      end
    end
  end
end
