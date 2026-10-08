# frozen_string_literal: true

module ServiceLayer
  module KubernetesNgServices
    # This module provides access to the gardener-info ConfigMap
    module GardenerInfo

      # Fetch Gardener version from gardener-info ConfigMap
      def gardener_info
        # Fetch from gardener-system-public namespace (not garden_namespace)
        # This is a system-wide public namespace, not project-specific
        response = elektron_gardener.get("api/v1/namespaces/gardener-system-public/configmaps/gardener-info")

        return nil unless response&.body.is_a?(Hash)

        # Extract the data section from the ConfigMap
        data = response.body.dig('data') || {}

        # Parse the gardenerAPIServer YAML string if present
        gardener_api_server = data['gardenerAPIServer']
        return nil unless gardener_api_server

        begin
          parsed = YAML.safe_load(gardener_api_server)
          {
            version: parsed['version']
          }
        rescue => e
          Rails.logger.error("Failed to parse gardenerAPIServer data: #{e.message}")
          nil
        end
      rescue Elektron::Errors::ApiResponse => e
        Rails.logger.error("Failed to fetch gardener-info ConfigMap: #{e.message}")
        nil
      end

    end
  end
end
