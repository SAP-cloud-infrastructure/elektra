module ServiceLayer
  module KubernetesNgServices
    # This module implements Openstack Domain API
    module Clusters

      def list_clusters(project_id)
        namespace = "garden-#{project_id}"
        response = elektron_gardener.get("apis/core.gardener.cloud/v1beta1/namespaces/#{namespace}/shoots")
        clusters = response&.body&.dig("items") || []
        return clusters
      end
      
    end
  end
end