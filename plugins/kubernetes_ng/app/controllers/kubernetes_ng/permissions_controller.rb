RESOURCE_MAPPING = {
  "clusters" => "shoots",
  "cloud_profiles" => "cloudprofiles"
}

module KubernetesNg
  class PermissionsController < ApplicationController
    def index
      resource = params[:resource]
      verb = params[:verb]

      # return all permissions for all resources
      if resource.nil?
        permissions = RESOURCE_MAPPING.map do |_, value|
          services.kubernetes_ng.list_permissions_by_project_and_resource(@scoped_project_id, value)
        end
        render json: permissions
        return
      end
      # Map the resource to the appropriate value
      mapped_resource = RESOURCE_MAPPING[resource] || resource
      # return all permissions for the mapped resource
      if verb.nil?
        render json: services.kubernetes_ng.list_permissions_by_project_and_resource(@scoped_project_id, mapped_resource)
      else
        # return permission (as boolean) for the mapped resource and verb
        render json: services.kubernetes_ng.get_permission_by_project_and_resource_and_verb(@scoped_project_id, mapped_resource, verb)
      end
    end
  end
end
