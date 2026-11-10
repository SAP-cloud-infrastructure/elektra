# frozen_string_literal: true

module ServiceLayer
  module ComputeNgServices
    # Neutron (network) access, implemented independently of the networking
    # plugin. Only the slice the instance list needs (floating IPs) lives here.
    module Neutron
      # Floating IPs for the scoped project, returned as raw hashes.
      def neutron_floating_ips
        filter = scoped_project_id ? { tenant_id: scoped_project_id } : {}
        elektron_neutron.get("floatingips", filter).body["floatingips"] || []
      end
    end
  end
end
