# frozen_string_literal: true

module ServiceLayer
  # kubernetesNG implements the bff for the gardener API
  class KubernetesNgService < Core::ServiceLayer::Service
    attr_accessor :scoped_project_id, :scoped_region

    include KubernetesNgServices::CloudProfiles
    include KubernetesNgServices::Clusters
    include KubernetesNgServices::Permissions

    def available?(_action_name_sym = nil)
      elektron.service?("gardener")
    end

    # Return a scoped version of this service with project_id and region set
    # Usage: services.kubernetes_ng.scoped(project_id, region).list_clusters
    def scoped(project_id, region)
      @scoped_project_id = project_id
      @scoped_region = region
      self
    end

    # elektron adds automaticaly the X-Auth-Token openstack header for auth
    # but the kubernetes api uses another auth header than openstack
    # thats why we add a new authorization header here
    def elektron_gardener
      region = ENV["MONSOON_DASHBOARD_REGION"]
      @elektron_identity ||=
        elektron.service(
          "gardener",
           headers:{
            "Authorization":"Bearer #{region}:#{elektron.token}"
          }
        )
    end

    private

    # Build the Gardener namespace for a given project and region
    def garden_namespace
      "garden-#{scoped_region}-#{scoped_project_id}"
    end

  end
end
