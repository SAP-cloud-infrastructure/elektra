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
    end
  end
end
