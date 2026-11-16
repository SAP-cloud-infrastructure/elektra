# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Neutron (network) access, implemented independently of the networking
    # plugin. Only the slice the instance list needs (floating IPs) lives here.
    module Neutron
      # Floating IPs for the scoped project, returned as raw hashes.
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
    end
  end
end
