module ServiceLayer
  module KubernetesNgServices
    # This module implements Openstack Domain API
    module Permissions
      def list_permissions_by_project_and_resource(project_id, resource, subresource = nil)
        ["list", "get", "create", "update", "delete"].to_h do |verb|
          [verb, get_permission_by_project_and_resource_and_verb(project_id, resource, verb, subresource)]
        end
      end
      
      def get_permission_by_project_and_resource_and_verb(project_id, resource, verb, subresource = nil)
        response = elektron_gardener.post("apis/authorization.k8s.io/v1/selfsubjectaccessreviews") do
          {
            kind: "SelfSubjectAccessReview",
            apiVersion: "authorization.k8s.io/v1",
            metadata: { creationTimestamp: nil },
            spec: {
              resourceAttributes: {
                namespace: "garden-#{project_id}",
                verb: verb,
                resource: resource,
                subresource: subresource,
                group: "core.gardener.cloud",
              },
            },
          }
        end
        return response.body["status"]["allowed"] || false
      end
    end
  end
end
