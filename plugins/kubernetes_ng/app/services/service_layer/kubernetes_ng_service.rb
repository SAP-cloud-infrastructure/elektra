# frozen_string_literal: true

module ServiceLayer
  # This class implements the Openstack compute api
  class KubernetesNgService < Core::ServiceLayer::Service

    def available?(_action_name_sym = nil)
      byebug
      elektron.service?("gardener")
    end

    def elektron_gardener
      @elektron_identity ||=
        elektron.service(
          "gardener"
        )
    end
  end
end
