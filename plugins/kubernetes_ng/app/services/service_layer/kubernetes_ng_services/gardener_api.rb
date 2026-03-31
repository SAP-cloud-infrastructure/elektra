# frozen_string_literal: true

module ServiceLayer
  module KubernetesNgServices
    module GardenerApi
      class KubeconfigGenerationError < StandardError; end

      def gardener_api_kubeconfig
        # This allows CLI tools to authenticate against the Gardener API
        # Note: Token expiration is controlled by OpenStack Keystone, not by this kubeconfig
        build_garden_kubeconfig
      end

      private

      # Build a kubeconfig for accessing the garden cluster API
      def build_garden_kubeconfig
        # Get the Gardener API endpoint URL
        api_url = elektron_gardener.endpoint_url

        # Get current user’s token
        token = elektron.token

        # Build the kubeconfig structure
        kubeconfig = {
          "apiVersion" => "v1",
          "kind" => "Config",
          "clusters" => [
            {
              "name" => "garden",
              "cluster" => {
                "server" => api_url
              }
            }
          ],
          "contexts" => [
            {
              "name" => "garden",
              "context" => {
                "cluster" => "garden",
                "user" => "garden-user",
                "namespace" => garden_namespace
              }
            }
          ],
          "current-context" => "garden",
          "users" => [
            {
              "name" => "garden-user",
              "user" => {
                "token" => "#{region}:#{token}"
              }
            }
          ]
        }

        # Convert to YAML
        kubeconfig.to_yaml
      rescue => e
        Rails.logger.error("Failed to build garden kubeconfig: #{e.message}")
        raise KubeconfigGenerationError, "Failed to generate kubeconfig: #{e.message}"
      end

    end
  end
end
