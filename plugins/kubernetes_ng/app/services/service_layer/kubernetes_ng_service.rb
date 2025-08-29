# frozen_string_literal: true

module ServiceLayer
  # kubernetesNG implements the bff for the gardener API
  class KubernetesNgService < Core::ServiceLayer::Service

    include KubernetesNgServices::CloudProfile
    include KubernetesNgServices::Clusters

    def available?(_action_name_sym = nil)
      elektron.service?("gardener")
    end

    # elektron adds automaticaly the X-Auth-Token openstack header for auth
    # but the kubernetes api uses another auth header than openstack
    # thats why we add a new authorization header here
    def elektron_gardener
      @elektron_identity ||=
        elektron.service(
          "gardener",
           headers:{
            "Authorization":"Bearer #{elektron.token}"
          }
        )
    end

  end
end
