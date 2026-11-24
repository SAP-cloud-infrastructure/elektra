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

      # The security groups Nova associates with a server. These carry only the
      # id/name; full rules are re-fetched from Neutron (mirrors the legacy
      # load_security_groups behaviour).
      def nova_server_security_groups(id)
        elektron_nova.get("servers/#{id}/os-security-groups").body["security_groups"] || []
      end

      # Raw Nova server-action call: POST /servers/{id}/action with the given
      # body (e.g. { "os-start" => nil }, { "reboot" => { "type" => "HARD" } }).
      # Callers (the aggregator) own the action->body mapping.
      def nova_server_action(id, body)
        elektron_nova.post("servers/#{id}/action") { body }.body
      end

      # Modern remote-console API (microversion >= 2.6). Returns the raw
      # remote_console hash { "protocol", "type", "url" } for the requested
      # console protocol/type.
      def nova_remote_console(server_id, protocol:, type:)
        elektron_nova
          .post("servers/#{server_id}/remote-consoles") { { "remote_console" => { "protocol" => protocol, "type" => type } } }
          .body["remote_console"]
      end

      # Terminate: Nova deletes a server with DELETE /servers/{id} (NOT an
      # /action call).
      def nova_delete_server(id)
        elektron_nova.delete("servers/#{id}").body
      end

      # Legacy lock-simulation compatibility: set the `locked` metadata key so
      # list views that still read metadata stay consistent with the native
      # locked flag.
      def nova_set_locked_metadata(id, value)
        elektron_nova.put("servers/#{id}/metadata/locked") { { "meta" => { "locked" => value } } }.body
      end

      # Updates mutable server attributes (currently just name) via Nova's
      # PUT /servers/{id}, which expects the attrs wrapped under "server".
      def nova_update_server(id, attrs)
        elektron_nova.put("servers/#{id}") { { server: attrs } }.body["server"]
      end

      # Replaces the complete tag set (Nova PUT /servers/{id}/tags, microversion
      # 2.26+). Nova echoes the resulting {"tags":[...]}.
      def nova_set_server_tags(id, tags)
        elektron_nova.put("servers/#{id}/tags") { { "tags" => tags } }.body
      end

      # Lists the server's attached network interfaces. Nova microversion 2.67+.
      def nova_server_os_interfaces(id)
        elektron_nova.get("servers/#{id}/os-interface").body["interfaceAttachments"] || []
      end

      # Attaches a network interface to a server. Nova expects the port specification
      # wrapped under "interfaceAttachment". Returns the attached interface.
      def nova_attach_interface(id, attributes)
        elektron_nova.post("servers/#{id}/os-interface") { { "interfaceAttachment" => attributes } }.body["interfaceAttachment"]
      end

      # Detaches a network interface from a server by port_id.
      def nova_detach_interface(id, port_id)
        elektron_nova.delete("servers/#{id}/os-interface/#{port_id}").body
      end
    end
  end
end
