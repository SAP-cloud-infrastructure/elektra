# frozen_string_literal: true

module ServiceLayer
  module NetworkingServices
    # Implements Openstack Port
    module Port
      def port_map
        @port_map ||= class_map_proc(Networking::Port)
      end

      def ports(filter = {})
        elektron_networking.get("ports", filter).map_to("body.ports", &port_map)
      end

      # Load ports in a bounded batch, following Neutron's marker pagination.
      #
      # Neutron caps a single response at its configured `pagination_max_limit`
      # (e.g. 500), which is usually smaller than the number of ports, so a
      # single `limit` request is not enough. We follow the `ports_links`
      # `rel == "next"` relation (using the last id as marker) and accumulate
      # pages until we have gathered `limit` ports or there is no next page.
      #
      # Returns a hash: { ports: [...], has_next: bool, marker: "<last id>" }.
      # `has_next` is true when more ports exist beyond this batch; `marker` is
      # the id to pass as `start_marker` to fetch the following batch.
      #
      # `sort_key` and `sort_dir` must be provided together for marker-based
      # pagination; sending `sort_key` alone results in a 400 Bad Request.
      def ports_batch(limit: 5000, start_marker: nil, filter: {})
        max_pages = 1000 # safety cap against an endless loop
        marker = start_marker
        raw_ports = []
        has_next = false

        loop do
          options = { sort_key: "id", sort_dir: "asc" }.merge(filter)
          options[:marker] = marker if marker

          response = elektron_networking.get("ports", options)
          page = response.body["ports"] || []
          raw_ports += page

          links = response.body["ports_links"]
          api_has_next = links && links.any? { |link| link["rel"] == "next" }
          marker = page.last["id"] unless page.empty?
          max_pages -= 1

          # Reached the requested batch size but more ports still exist.
          if raw_ports.length >= limit && api_has_next
            has_next = true
            break
          end

          break if !api_has_next || page.empty? || max_pages <= 0
        end

        # Trim to the requested limit (the last page may overshoot it).
        if raw_ports.length > limit
          raw_ports = raw_ports[0, limit]
          has_next = true
        end

        # `raw_ports` holds raw attribute hashes; read the marker id with [] and
        # only map to model objects for the returned list.
        last_marker = raw_ports.empty? ? nil : raw_ports.last["id"]

        {
          ports: raw_ports.map { |attrs| port_map.call(attrs) },
          has_next: has_next,
          marker: last_marker,
        }
      end

      def new_port(attributes = {})
        port_map.call(attributes)
      end

      def find_port!(id)
        return nil unless id
        elektron_networking.get("ports/#{id}").map_to("body.port", &port_map)
      end

      def find_port(id)
        find_port!(id)
      rescue Elektron::Errors::ApiResponse
        nil
      end

      def fixed_ip_ports(filter = {})
        @fixed_ip_ports ||=
          ports({ name: Networking::Port::FIXED_IP_PORT_NAME }.merge(filter))
        # @fixed_ip_ports ||= ports({status: 'DOWN'}.merge(filter)).select do |port|
        #   port.device_id.blank? &&
        #   port.device_owner.blank? &&
        #   !port.fixed_ips.blank?
        # end
      end

      ################### Model Interface #############
      def create_port(attributes)
        elektron_networking.post("ports") { { "port" => attributes } }.body[
          "port"
        ]
      end

      def update_port(id, attributes)
        elektron_networking
          .put("ports/#{id}") { { "port" => attributes } }
          .body[
          "port"
        ]
      end

      def delete_port(id)
        elektron_networking.delete("ports/#{id}")
      end
    end
  end
end
