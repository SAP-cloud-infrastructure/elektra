# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Aggregates Nova + Glance + Neutron data into UI-ready instance hashes.
    #
    # This is the "backend-for-frontend" seam: it emits plain data (never
    # markup), including a *semantic* status; the React layer decides colour,
    # icon and pill from that semantic value.
    module InstanceAssembler
      def list_instances(filter = {})
        servers = nova_servers(filter)
        return [] if servers.empty?

        flavor_names = flavor_names_by_id
        image_names = image_names_by_id
        # Built fresh (not via the 10-minute cached map) so a just-associated FIP
        # shows in the list immediately, before Nova's addresses catch up.
        floating_by_fixed = floating_ips_by_server_fixed_ip_fresh

        servers.map { |server| assemble_instance(server, flavor_names, image_names, floating_by_fixed) }
      end

      def find_instance(id)
        server = nova_server(id)
        return nil unless server

        assemble_instance(server, flavor_names_by_id, image_names_by_id, floating_ips_by_server_fixed_ip_fresh)
      end

      private

      def assemble_instance(server, flavor_names, image_names, floating_by_fixed = {})
        # Nova reports "flavor"/"image" as a Hash when present, but as an empty
        # string for boot-from-volume instances — guard before digging.
        flavor = server["flavor"]
        image = server["image"]
        flavor_id = flavor.is_a?(Hash) ? flavor["id"] : nil
        image_id = image.is_a?(Hash) ? image["id"] : nil

        {
          id: server["id"],
          name: server["name"],
          status: semantic_status(server),
          availability_zone: server["OS-EXT-AZ:availability_zone"],
          flavor: { id: flavor_id, name: flavor_name(flavor, flavor_id, flavor_names) },
          image: { id: image_id, name: image_name(server, image_id, image_names) },
          ips: instance_ips(server, floating_by_fixed),
          created: server["created"],
          # Native Nova attribute at microversion 2.9+ (we run 2.67). Drives the
          # Lock/Unlock action gating in the UI; default to not-locked when a
          # server record predates the attribute.
          locked: server["locked"] == true,
        }
      end

      # Image display name, mirroring the legacy list: the name baked into the
      # server metadata (metadata.image_name) wins, then the Glance catalog name.
      def image_name(server, image_id, image_names)
        metadata = server["metadata"]
        from_metadata = metadata.is_a?(Hash) ? metadata["image_name"].presence : nil
        from_metadata || (image_id ? image_names[image_id] : nil)
      end

      # Flavor display name, mirroring the legacy list: Nova embeds the flavor
      # (microversion 2.47+) with "original_name"; fall back to the catalog name
      # resolved by id for older payloads.
      def flavor_name(flavor, flavor_id, flavor_names)
        embedded = flavor.is_a?(Hash) ? flavor["original_name"].presence : nil
        embedded || (flavor_id ? flavor_names[flavor_id] : nil)
      end

      # Maps Nova's raw vm/task state into a small, stable vocabulary the UI
      # knows how to render. Colour/icon mapping stays on the client.
      #
      # `power_state` is the human label the pill shows (e.g. "Running"),
      # derived from Nova's OS-EXT-STS:power_state; `state` is the vm_state that
      # drives the pill colour, matching the legacy compute list where the pill
      # reads the power state but is tinted by the status.
      def semantic_status(server)
        task_state = server["OS-EXT-STS:task_state"]
        vm_state = (server["status"] || "").downcase

        state =
          case vm_state
          when "active" then "active"
          when "shutoff" then "stopped"
          when "error" then "error"
          when "build" then "building"
          # Nova reports the "waiting for the user to confirm a resize" state as
          # VERIFY_RESIZE (sometimes RESIZED). It is not an in-flight task, it
          # needs an explicit confirm/revert, so the UI flags it specially.
          when "verify_resize", "resized" then "verify_resize"
          else vm_state.presence || "unknown"
          end

        {
          state: state,
          transition: task_state,
          power_state: power_state_string(server["OS-EXT-STS:power_state"]),
          fault_message: fault_message(server),
        }
      end

      # The Nova fault message for an errored server (shown e.g. in the status
      # tooltip). Only present when the server is in ERROR state; falls back to
      # a placeholder when Nova reports an error without a message.
      def fault_message(server)
        return nil unless (server["status"] || "").downcase == "error"

        fault = server["fault"]
        return "Sorry but for some reason there was no error message found :-/" unless fault.is_a?(Hash)

        fault["message"]
      end

      # Nova OS-EXT-STS:power_state code -> human label, mirroring
      # Compute::Server#power_state_string in the legacy plugin.
      POWER_STATES = {
        1 => "Running",
        2 => "Blocked",
        3 => "Paused",
        4 => "Shut down",
        5 => "Shut off",
        6 => "Crashed",
        7 => "Suspended",
        8 => "Failed",
        9 => "Building",
      }.freeze

      def power_state_string(code)
        POWER_STATES[code] || "No State"
      end

      # Flattens a server's addresses into a simple list of { addr:, type: }
      # entries. Fixed IPs come from Nova's addresses; floating IPs come solely
      # from the Neutron fixed->floating map (mirrors the detail view, which also
      # ignores Nova's floating entries). Neutron is the source of truth for FIP
      # association, and Nova's network_info lags both associate and disassociate
      # — so reading FIPs from Neutron makes a just-attached FIP appear and a
      # just-detached FIP disappear immediately, instead of trailing Nova.
      def instance_ips(server, floating_by_fixed = {})
        ips = []
        seen_floating = []
        (server["addresses"] || {}).each_value do |entries|
          Array(entries).each do |entry|
            # Skip Nova's floating entries entirely — Neutron drives those below.
            next if entry["OS-EXT-IPS:type"] == "floating"

            addr = entry["addr"]
            next unless addr

            ips << { addr: addr, type: "fixed" }

            floating = floating_by_fixed[addr]
            next if floating.nil? || seen_floating.include?(floating)

            ips << { addr: floating, type: "floating" }
            seen_floating << floating
          end
        end
        ips
      end

      # The following three lookups are cached (project/region-scoped, see
      # ComputeNjqService#cached_lookup) so list polling stays cheap: only the
      # small derived maps are stored, not the full Nova/Glance/Neutron payloads.

      def flavor_names_by_id
        cached_lookup("flavor_names") do
          nova_flavors.each_with_object({}) { |f, acc| acc[f["id"]] = f["name"] }
        end
      end

      def image_names_by_id
        cached_lookup("image_names") do
          glance_images.each_with_object({}) { |i, acc| acc[i["id"]] = i["name"] }
        end
      end

      # Maps a fixed IP address to its associated floating IP, so the assembler
      # can attach floating IPs that Nova does not report inline. Cached variant
      # for the detail view (opened on demand, tolerates the 10-minute TTL).
      def floating_ips_by_server_fixed_ip
        cached_lookup("floating_ip_map") do
          build_floating_ips_by_server_fixed_ip(neutron_floating_ips)
        end
      end

      # Uncached variant for the list: a just-associated FIP must appear on the
      # next refetch, so the list reads Neutron directly instead of the cached
      # map (which could be up to 10 minutes stale).
      def floating_ips_by_server_fixed_ip_fresh
        build_floating_ips_by_server_fixed_ip(neutron_floating_ips)
      end

      def build_floating_ips_by_server_fixed_ip(floating_ips)
        floating_ips.each_with_object({}) do |fip, acc|
          fixed = fip["fixed_ip_address"]
          acc[fixed] = fip["floating_ip_address"] if fixed
        end
      end
    end
  end
end
