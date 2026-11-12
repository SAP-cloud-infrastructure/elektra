# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
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

      # Flavor catalog as raw hashes. The InstanceAssembler caches the derived
      # id->name map rather than this full list, so this stays a plain fetch.
      def nova_flavors
        elektron_nova.get("flavors/detail").body["flavors"] || []
      end

      # The security groups Nova associates with a server. These carry only the
      # id/name; full rules are re-fetched from Neutron (mirrors the legacy
      # load_security_groups behaviour).
      def nova_server_security_groups(id)
        elektron_nova.get("servers/#{id}/os-security-groups").body["security_groups"] || []
      end
    end
  end
end
