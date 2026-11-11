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
        floating_ips = floating_ips_by_server_fixed_ip

        servers.map { |server| assemble_instance(server, flavor_names, image_names, floating_ips) }
      end

      def find_instance(id)
        server = nova_server(id)
        return nil unless server

        assemble_instance(server, flavor_names_by_id, image_names_by_id, floating_ips_by_server_fixed_ip)
      end

      private

      def assemble_instance(server, flavor_names, image_names, floating_ips)
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
          flavor: { id: flavor_id, name: flavor_names[flavor_id] },
          image: { id: image_id, name: image_names[image_id] },
          ips: instance_ips(server, floating_ips),
          created: server["created"],
        }
      end

      # Maps Nova's raw vm/task state into a small, stable vocabulary the UI
      # knows how to render. Colour/icon mapping stays on the client.
      def semantic_status(server)
        task_state = server["OS-EXT-STS:task_state"]
        vm_state = (server["status"] || "").downcase

        state =
          case vm_state
          when "active" then "active"
          when "shutoff" then "stopped"
          when "error" then "error"
          when "build" then "building"
          else vm_state.presence || "unknown"
          end

        { state: state, transition: task_state }
      end

      # Flattens a server's addresses into fixed + floating IP lists.
      def instance_ips(server, floating_ips_by_fixed)
        fixed = []
        floating = []

        (server["addresses"] || {}).each_value do |entries|
          Array(entries).each do |entry|
            ip = entry["addr"]
            next unless ip

            if entry["OS-EXT-IPS:type"] == "floating"
              floating << ip
            else
              fixed << ip
              floating << floating_ips_by_fixed[ip] if floating_ips_by_fixed[ip]
            end
          end
        end

        { fixed: fixed.uniq, floating: floating.uniq }
      end

      def flavor_names_by_id
        nova_flavors.each_with_object({}) { |f, acc| acc[f["id"]] = f["name"] }
      end

      def image_names_by_id
        glance_images.each_with_object({}) { |i, acc| acc[i["id"]] = i["name"] }
      end

      # Maps a fixed IP address to its associated floating IP, so the assembler
      # can attach floating IPs that Nova does not report inline.
      def floating_ips_by_server_fixed_ip
        neutron_floating_ips.each_with_object({}) do |fip, acc|
          fixed = fip["fixed_ip_address"]
          acc[fixed] = fip["floating_ip_address"] if fixed
        end
      end
    end
  end
end
