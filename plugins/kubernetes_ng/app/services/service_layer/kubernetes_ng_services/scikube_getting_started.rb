# frozen_string_literal: true

module ServiceLayer
  module KubernetesNgServices
    # This module provides access to the SciKube getting started ConfigMap
    module ScikubeGettingStarted

      def scikube_getting_started_markdown
        namespace = "gardener-system-public"
        configmap_name = "scikube-getting-started-markdown"

        response = elektron_gardener.get("api/v1/namespaces/#{namespace}/configmaps/#{configmap_name}")

        if response&.body.is_a?(Hash)
          # Extract the data section from the ConfigMap
          data = response.body.dig('data') || {}

          {
            name: response.body.dig('metadata', 'name'),
            namespace: response.body.dig('metadata', 'namespace'),
            data: data
          }
        else
          nil
        end
      rescue Elektron::Errors::ApiResponse => e
        Rails.logger.error("Failed to fetch SciKube getting started ConfigMap: #{e.message}")
        nil
      end

    end
  end
end
