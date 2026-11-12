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
    include ComputeNjqServices::Cinder
    include ComputeNjqServices::Identity
    include ComputeNjqServices::Thanos
    include ComputeNjqServices::InstanceAssembler
    include ComputeNjqServices::InstanceDetailAssembler

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

    # TTL for the "mostly static" lookup data (flavors, image catalog, floating
    # IPs). These change rarely, so caching them keeps list polling cheap: a
    # refresh then only re-fetches the servers from Nova instead of also hitting
    # Glance + Neutron + the flavor catalog on every poll.
    LOOKUP_CACHE_TTL = 10.minutes

    # Memoise a value in Rails.cache under a project/region-scoped key, so cached
    # lookups never leak across tenants or regions.
    def cached_lookup(name, &block)
      key = "compute_njq/#{scoped_region}/#{scoped_project_id}/#{name}"
      Rails.cache.fetch(key, expires_in: LOOKUP_CACHE_TTL, &block)
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

    def elektron_cinder
      @elektron_cinder ||= elektron.service("volumev3")
    end

    def elektron_identity
      @elektron_identity ||= elektron.service("identity", path_prefix: "/v3")
    end
  end
end
