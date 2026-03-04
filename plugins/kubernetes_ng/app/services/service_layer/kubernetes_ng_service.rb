# frozen_string_literal: true

module ServiceLayer
  # kubernetesNG implements the bff for the gardener API
  class KubernetesNgService < Core::ServiceLayer::Service
    attr_accessor :scoped_project_id, :scoped_region, :service_name

    include KubernetesNgServices::CloudProfiles
    include KubernetesNgServices::Clusters
    include KubernetesNgServices::Permissions

    # Map service_name to actual Gardener service names
    SERVICE_NAME_MAPPING = {
      'prod' => 'persephone-prod',
      'canary' => 'persephone-canary',
      'qa' => 'gardener'
    }.freeze

    def available?(service_name_or_action = nil)
      service_to_check = SERVICE_NAME_MAPPING[service_name_or_action.to_s]
      return false unless service_to_check
      elektron.service?(service_to_check)
    end

    # Return a scoped version of this service with project_id, region, and service_name set
    # Usage: services.kubernetes_ng.scoped(project_id, region, service_name).list_clusters
    def scoped(project_id, region, service_name = nil)
      @scoped_project_id = project_id
      @scoped_region = region
      @service_name = service_name
      self
    end

    # elektron adds automaticaly the X-Auth-Token openstack header for auth
    # but the kubernetes api uses another auth header than openstack
    # thats why we add a new authorization header here
    def elektron_gardener
      region = ENV["MONSOON_DASHBOARD_REGION"]
      mapped_service_name = gardener_service_name

      @elektron_identity ||=
        elektron.service(
          mapped_service_name,
           headers:{
            "Authorization":"Bearer #{region}:#{elektron.token}"
          }
        )
    end

    private

    # Get the actual Gardener service name based on the service_name
    # e.g., 'prod' => 'persephone-prod', 'canary' => 'persephone-canary'
    def gardener_service_name
      SERVICE_NAME_MAPPING[@service_name]
    end

    # Build the Gardener namespace for a given project and region
    def garden_namespace
      "garden-#{scoped_region}-#{scoped_project_id}"
    end

  end
end
