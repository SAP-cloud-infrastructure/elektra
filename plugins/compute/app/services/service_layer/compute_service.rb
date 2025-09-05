# frozen_string_literal: true

module ServiceLayer
  # This class implements the Openstack compute api
  class ComputeService < Core::ServiceLayer::Service
    include ComputeServices::Flavor
    include ComputeServices::HostAggregate
    include ComputeServices::Hypervisor
    include ComputeServices::Image
    include ComputeServices::Keypair
    include ComputeServices::OsInterface
    include ComputeServices::SecurityGroup
    include ComputeServices::Server
    include ComputeServices::Service
    include ComputeServices::Volume
    include ComputeServices::OsServerGroup

    MICROVERSION = "2.67"

    def available?(_action_name_sym = nil)
      elektron.service?("compute")
    end

    def elektron_compute
      @elektron_identity ||=
        elektron.service(
          "compute",
          http_client: {
            read_timeout: 180,
          },
          headers: {
            "X-OpenStack-Nova-API-Version" => MICROVERSION,
          },
        )
    end

    def usage(filter = {})
      elektron_compute
        .get("limits", filter)
        .map_to("body.limits.absolute") do |limits|
          Compute::Usage.new(self, limits)
        end
    end

    def availability_zones
      elektron_compute
        .get("os-availability-zone")
        .map_to("body.availabilityZoneInfo") do |data|
          Compute::AvailabilityZone.new(self, data)
        end
    end
  end
end
