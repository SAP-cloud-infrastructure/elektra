RESOURCE_MAPPING = {
  "clusters" => "shoots",
  "cloud_profiles" => "cloudprofiles",
  "clusters_admin_kubeconfig" => { resource: "shoots", subresource: "adminkubeconfig" }
}

module KubernetesNg
  class PermissionsController < Api::BaseController
    def index
      handle_api_call(auto_render: false) do
        resource = params[:resource]
        verb = params[:verb]

        # return all permissions for all resources
        if resource.nil?
          permissions = RESOURCE_MAPPING.values.map do |value|
            res, sub = extract_resource(value)
            kubernetes_service.list_permissions_by_project_and_resource(res, sub)
          end
          render json: permissions
          return
        end
        # Map the resource to the appropriate value
        mapped_resource, mapped_subresource = extract_resource(
          RESOURCE_MAPPING[resource] || resource
        )

        # return all permissions for the mapped resource
        if verb.nil?
          render json: kubernetes_service.list_permissions_by_project_and_resource(mapped_resource, mapped_subresource)
        else
          # return permission (as boolean) for the mapped resource and verb
          render json: kubernetes_service.get_permission_by_project_and_resource_and_verb(mapped_resource, verb, mapped_subresource)
        end
      end
    end

    private

    # Normalize mapping entries ex: ("shoots" or {resource:, subresource:})
    def extract_resource(entry)
      if entry.is_a?(Hash)
        [entry[:resource], entry[:subresource]]
      else
        [entry, nil]
      end
    end

  end
end
