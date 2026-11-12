# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Assembles the full instance *detail* (everything the legacy Show modal
    # rendered) into a single UI-ready hash. Like InstanceAssembler, this is the
    # BFF seam: it emits plain data (never markup), aggregating Nova + Neutron +
    # Glance + Cinder + Keystone server-side so the React detail view mirrors the
    # legacy HAML tabs without reaching into any other plugin's service layer.
    #
    # Shape (keys map 1:1 to the legacy tabs):
    #   { id, name, status, fault_message, availability_zone, created, updated,
    #     host, project:{...}, tags, specs:{...}, ip_addresses:[...],
    #     security_groups:[...], key_name, metadata:{...}, volumes:[...] }
    module InstanceDetailAssembler
      def find_instance_detail(id)
        server = nova_server(id)
        return nil unless server

        attached = attached_volumes_for(server)

        {
          id: server["id"],
          name: server["name"],
          status: semantic_status(server),
          fault_message: fault_message(server),
          availability_zone: server["OS-EXT-AZ:availability_zone"],
          created: server["created"],
          updated: server["updated"],
          host: server["OS-EXT-SRV-ATTR:host"].presence,
          project: detail_project(server),
          tags: Array(server["tags"]),
          specs: detail_specs(server, attached),
          ip_addresses: detail_ip_addresses(server),
          security_groups: detail_security_groups(id),
          key_name: server["key_name"].presence,
          metadata: detail_metadata(server),
          volumes: detail_volumes(attached),
        }
      end

      private

      # --- Information tab -----------------------------------------------------

      def detail_project(server)
        tenant_id = server["tenant_id"]
        return { id: tenant_id, name: nil, same_scope: true } if tenant_id.nil?

        project = identity_project(tenant_id)
        {
          id: tenant_id,
          name: project&.dig("name"),
          same_scope: tenant_id == scoped_project_id,
        }
      end

      # --- Specs tab -----------------------------------------------------------

      def detail_specs(server, attached)
        flavor = server["flavor"]
        return nil unless flavor.is_a?(Hash)

        root_disk_size = flavor["disk"]
        root_device = server["OS-EXT-SRV-ATTR:root_device_name"]
        if root_device
          root_volume = attached.find { |v| v && v.dig("attachments", 0, "device") == root_device }
          root_disk_size = root_volume["size"] if root_volume
        end

        {
          flavor: flavor["original_name"],
          ram: flavor["ram"],
          vcpus: flavor["vcpus"],
          root_disk_size: root_disk_size,
          root_disk_device: root_device,
        }
      end

      # --- IP Addresses tab ----------------------------------------------------
      #
      # Groups the server's addresses by network name; for each fixed IP, the
      # matching floating IP (if any) is attached. Mirrors the legacy
      # network_ips_map(instance_ips(...)) output as plain data.
      def detail_ip_addresses(server)
        floating_by_fixed = floating_ips_by_server_fixed_ip
        grouped = Hash.new { |h, k| h[k] = [] }

        (server["addresses"] || {}).each do |network_name, entries|
          Array(entries).each do |entry|
            next if entry["OS-EXT-IPS:type"] == "floating"

            addr = entry["addr"]
            next unless addr

            grouped[network_name] << {
              fixed: { addr: addr, mac: entry["OS-EXT-IPS-MAC:mac_addr"] },
              floating: floating_by_fixed[addr] ? { addr: floating_by_fixed[addr] } : nil,
            }
          end
        end

        grouped.map { |network_name, ips| { network_name: network_name, ips: ips } }
      end

      # --- Security Groups tab -------------------------------------------------

      def detail_security_groups(server_id)
        all_groups = neutron_security_groups
        group_name_by_id = all_groups.each_with_object({}) { |g, acc| acc[g["id"]] = g["name"] }

        ids = nova_server_security_groups(server_id).map { |sg| sg["id"] }.compact.uniq
        ids.filter_map do |id|
          group = neutron_security_group(id)
          next unless group

          project = identity_project(group["project_id"] || group["tenant_id"])
          {
            id: group["id"],
            name: group["name"],
            project_name: project&.dig("name"),
            rules: Array(group["security_group_rules"]).map { |r| rule_to_s(r, group_name_by_id) },
          }
        end
      end

      # Renders a security-group rule to the exact string the legacy
      # Networking::SecurityGroupRule#to_s produced.
      def rule_to_s(rule, group_name_by_id)
        min = rule["port_range_min"]
        max = rule["port_range_max"]
        port =
          if min.blank? && max.blank?
            "any port"
          elsif min.blank?
            max
          elsif max.blank?
            min
          elsif min == max
            min
          else
            "#{min}-#{max}"
          end

        ethertype = rule["ethertype"]
        protocol = rule["protocol"] || "any protocol"
        direction = rule["direction"] == "ingress" ? "from" : "to"

        remote =
          if rule["remote_ip_prefix"].blank? && rule["remote_group_id"].blank?
            (ethertype || "").downcase == "ipv4" ? "0.0.0.0/0" : "::/0"
          elsif rule["remote_ip_prefix"].blank?
            group_name_by_id[rule["remote_group_id"]] || rule["remote_group_id"]
          else
            rule["remote_ip_prefix"]
          end

        "ALLOW #{ethertype} #{protocol} #{port} #{direction} #{remote}"
      end

      # --- Metadata tab --------------------------------------------------------

      def detail_metadata(server)
        metadata = server["metadata"].is_a?(Hash) ? server["metadata"] : {}
        image = server["image"]
        image_id = image.is_a?(Hash) ? image["id"] : image.presence

        image_name = metadata["image_name"].presence
        image_name ||= image_names_by_id[image_id] if image_id

        extra =
          metadata.reject { |k, _| %w[id image_name].include?(k.to_s) }
                  .map { |k, v| { key: k.to_s, value: v.to_s.presence } }

        { image_name: image_name.presence, image_id: image_id, extra: extra }
      end

      # --- Volumes tab ---------------------------------------------------------

      def attached_volumes_for(server)
        ids = Array(server["os-extended-volumes:volumes_attached"]).map { |v| v["id"] }.compact
        ids.map { |id| cinder_volume(id) }
      end

      def detail_volumes(attached)
        attached.compact.map do |vol|
          {
            id: vol["id"],
            name: vol["name"],
            device: vol.dig("attachments", 0, "device"),
            size: vol["size"],
          }
        end
      end
    end
  end
end
