# frozen_string_literal: true

module ServiceLayer
  # kubernetesNG implements the bff for the gardener API
  class KubernetesNgService < Core::ServiceLayer::Service
    attr_accessor :scoped_project_id, :scoped_region, :landscape_name

    include KubernetesNgServices::CloudProfiles
    include KubernetesNgServices::Clusters
    include KubernetesNgServices::Permissions
    include KubernetesNgServices::GardenerApi

    def available?(landscape_name_or_action = nil)
      service_to_check = KubernetesNg.service_for(landscape_name_or_action.to_s)
      return false unless service_to_check
      elektron.service?(service_to_check)
    end

    # Return a scoped version of this service with project_id, region, and landscape_name set
    # Usage: services.kubernetes_ng.scoped(project_id, region, landscape_name).list_clusters
    def scoped(project_id, region, landscape_name = nil)
      @scoped_project_id = project_id
      @scoped_region = region
      @landscape_name = landscape_name
      self
    end

    # elektron adds automaticaly the X-Auth-Token openstack header for auth
    # but the kubernetes api uses another auth header than openstack
    # thats why we add a new authorization header here
    def elektron_gardener

      # Cache per landscape to avoid issues when landscape changes
      @elektron_gardener_cache ||= {}
      @elektron_gardener_cache[gardener_service_name] ||= begin
        # Try internal interface (default) first
        service = elektron.service(
          gardener_service_name,
          headers:{
            "Authorization":"Bearer #{region}:#{elektron.token}"
          }
        )
        # Verify the internal endpoint is available
        service.endpoint_url
        service
      rescue Elektron::Errors::ServiceEndpointUnavailable
        # Persephone runs in a different cluster, so fallback to public interface
        elektron.service(
          gardener_service_name,
          interface: "public",
          headers:{
            "Authorization":"Bearer #{region}:#{elektron.token}"
          }
        )
      end
    end

    private

    # Get the actual Gardener service name based on the landscape_name
    # e.g., 'prod' => 'persephone-prod', 'canary' => 'persephone-canary'
    # Raises error if landscape_name is invalid
    def gardener_service_name
      mapped_name = KubernetesNg.service_for(@landscape_name)
      valid_options = KubernetesNg.user_facing_landscapes.join(', ')
      raise KubernetesNg::LandscapeError, "Invalid or missing landscape name: #{@landscape_name.inspect}. Valid options: #{valid_options}" if mapped_name.nil?
      mapped_name
    end

    # Build the Gardener namespace for a given project and region
    def garden_namespace
      "garden-#{scoped_region}-#{scoped_project_id}"
    end

    # Get the current region
    def region
      ENV["MONSOON_DASHBOARD_REGION"]
    end

  end
end
