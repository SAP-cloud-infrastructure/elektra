# frozen_string_literal: true

module ServiceLayer
  module NetworkingServices
    # Implements Openstack FloatingIp
    module FloatingIp
      def floatingip_map
        @floatingip_map ||= class_map_proc(Networking::FloatingIp)
      end

      def project_floating_ips(project_id, filter = {})
        next_link = true
        tries = 10
        marker = nil
        floatingips = []

        # because of pagination we have to loop over pages to get all fips
        loop do
          response =
            elektron_networking.get(
              "floatingips",
              {
                tenant_id: project_id,
                project_id: project_id,
                marker: marker,
              }.merge(filter),
            )
          links = response.body["floatingips_links"]
          next_link =
            links && links.find { |link| link["rel"] == "next" } && true
          tries -= 1
          floatingips += response.body["floatingips"]
          marker = floatingips.last["id"] unless floatingips.blank?

          break if !next_link || tries <= 0
        end

        # map ip values to models
        floatingips.each_with_object([]) do |fip, array|
          fip_project_id = fip["tenant_id"] || fip["project_id"]
          next unless fip_project_id == project_id

          array << floatingip_map.call(fip)
        end
      end

      def floating_ips(filter = {})
        elektron_networking.get("floatingips", filter).map_to(
          "body.floatingips",
          &floatingip_map
        )
      end

      def detach_floatingip(floating_ip_id)
        elektron_networking
          .put("floatingips/#{floating_ip_id}") do
            { "floatingip" => { port_id: nil } }
          end
          .map_to("body.floatingip", &floatingip_map)
      end

      def new_floating_ip(attributes = {})
        floatingip_map.call(attributes)
      end

      def find_floating_ip!(id)
        return nil unless id
        elektron_networking.get("floatingips/#{id}").map_to(
          "body.floatingip",
          &floatingip_map
        )
      end

      def find_floating_ip(id)
        find_floating_ip!(id)
      rescue Elektron::Errors::ApiResponse
        nil
      end

      ################## Model Interface ##################
      def create_floating_ip(attributes)
        elektron_networking
          .post("floatingips") { { "floatingip" => attributes } }
          .body[
          "floatingip"
        ]
      end

      def update_floating_ip(id, attributes)
        elektron_networking
          .put("floatingips/#{id}") { { "floatingip" => attributes } }
          .body[
          "floatingip"
        ]
      end

      def delete_floating_ip(id)
        elektron_networking.delete("floatingips/#{id}")
      end
    end
  end
end
