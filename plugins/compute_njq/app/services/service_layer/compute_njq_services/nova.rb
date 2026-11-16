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

      # Flavor catalog keyed by id, used to resolve a server's flavor name/specs.
      def nova_flavors
        elektron_nova.get("flavors/detail").body["flavors"] || []
      end

      # Keypairs for the scoped project; Nova wraps each entry under "keypair".
      def nova_keypairs
        (elektron_nova.get("os-keypairs").body["keypairs"] || []).map { |k| k["keypair"] }
      end

      # Availability zones (name + state); the create form only needs available ones.
      def nova_availability_zones
        elektron_nova.get("os-availability-zone").body["availabilityZoneInfo"] || []
      end

      # Creates a server. Nova expects the attributes wrapped under "server".
      def nova_create_server(payload)
        elektron_nova.post("servers") { { server: payload } }.body["server"]
      end
    end
  end
end
