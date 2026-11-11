# frozen_string_literal: true

module ServiceLayer
  # Backend-for-Frontend for the compute_njq plugin.
  #
  # This service is deliberately self-contained: it builds its own Elektron
  # handles for every OpenStack backend it needs (Nova, Neutron, Glance) and
  # never calls into other plugins' service layers. The cost is some redundancy
  # with the networking/image services; the benefit is that changes to those
  # plugins cannot break compute_njq.
  #
  # Feature logic lives in the ComputeNjqServices::* mixins; cross-backend
  # aggregation lives in InstanceAssembler.
  class ComputeNjqService < Core::ServiceLayer::Service
    NOVA_MICROVERSION = "2.67"

    include ComputeNjqServices::Nova
    include ComputeNjqServices::Neutron
    include ComputeNjqServices::Glance
    include ComputeNjqServices::InstanceAssembler

    attr_reader :scoped_project_id, :scoped_region

    # Fluent per-request scope injector, called from the controller.
    def scoped(project_id, region)
      @scoped_project_id = project_id
      @scoped_region = region
      self
    end

    def available?(_action = nil)
      elektron.service?("compute")
    end

    # --- Elektron handles (one per backend, correctly named) ---------------

    def elektron_nova
      @elektron_nova ||= elektron.service(
        "compute",
        http_client: { read_timeout: 180 },
        headers: { "X-OpenStack-Nova-API-Version" => NOVA_MICROVERSION },
      )
    end

    def elektron_neutron
      @elektron_neutron ||= elektron.service("network", path_prefix: "/v2.0")
    end

    def elektron_glance
      @elektron_glance ||= elektron.service("image", path_prefix: "/v2")
    end
  end
end
