# frozen_string_literal: true

module ServiceLayer
  module ComputeNgServices
    # Nova (compute) access. Returns raw response hashes — the UI shaping is
    # done by the InstanceAssembler, not here.
    module Nova
      # Detailed server list. Nova filters server-side on name/status.
      def nova_servers(filter = {})
        elektron_nova.get("servers/detail", filter).body["servers"] || []
      end

      def nova_server(id)
        elektron_nova.get("servers/#{id}").body["server"]
      end

      # Flavor catalog keyed by id, used to resolve a server's flavor name/specs.
      def nova_flavors
        elektron_nova.get("flavors/detail").body["flavors"] || []
      end
    end
  end
end
