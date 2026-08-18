# frozen_string_literal: true

module ServiceLayer
  module NetworkingServices
    # Implements Neutron Network Flavors API
    module Flavor
      def flavor_map
        @flavor_map ||= class_map_proc(Networking::Flavor)
      end

      def flavors(filter = {})
        elektron_networking.get("flavors", filter).map_to(
          "body.flavors",
          &flavor_map
        )
      rescue Elektron::Errors::ApiResponse
        []
      end

      def find_flavor(id)
        return nil unless id
        elektron_networking.get("flavors/#{id}").map_to(
          "body.flavor",
          &flavor_map
        )
      rescue Elektron::Errors::ApiResponse
        nil
      end
    end
  end
end
