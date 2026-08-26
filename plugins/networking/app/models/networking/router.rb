# frozen_string_literal: true

module Networking
  # represents the Openstack Router
  class Router < Core::ServiceLayer::Model
    validates :name, presence: { message: "Please provide a name" }
    validates :availability_zone_hints, presence: { message: "is required for VPNaaS routers" }, if: :vpnaas_flavor?

    attr_accessor :internal_subnets, :flavor_name

    def vpnaas_flavor?
      flavor_name.to_s.downcase.include?("vpnaas")
    end

    def ip_subnet_objects
      return @ip_subnet_objects if @ip_subnet_objects
      return unless external_gateway_info
      return unless external_gateway_info["external_fixed_ips"]

      ip_infos = external_gateway_info["external_fixed_ips"]
      ip_infos = [ip_infos] unless ip_infos.is_a?(Array)

      @ip_subnet_objects =
        ip_infos.each_with_object({}) do |ip_info, hash|
          subnet = @service.cached_subnet(ip_info["subnet_id"])
          next unless subnet
          hash[ip_info["ip_address"]] = subnet
        end
    end

    def network_object
      return unless external_gateway_info
      return unless external_gateway_info["network_id"]
      @service.cached_network(external_gateway_info["network_id"])
    end

    def external_ip
      external_gateway_info["external_fixed_ips"]
        .collect { |ips| ips["ip_address"] }
        .join(", ")
    rescue StandardError
      nil
    end

    def add_interfaces(interface_ids)
      rescue_api_errors { @service.add_router_interfaces(id, interface_ids) }
    end

    def remove_interfaces(interface_ids)
      rescue_api_errors { @service.remove_router_interfaces(id, interface_ids) }
    end

    def external_subnet_ids
      external_fixed_ips = external_gateway_info.fetch("external_fixed_ips", [])
      external_fixed_ips.collect do |external_fixed_ip|
        external_fixed_ip["subnet_id"]
      end
    end

    def external_gateway_info
      read("external_gateway_info") || {}
    end

    def hosting_device
      read("routerhost:hosting_device")
    end

    def role
      read("routerrole:role")
    end

    def ha_enabled?
      read("cisco_ha:enabled")
    end

    def ha_details
      read("cisco_ha:details") || {}
    end

    def redundancy_routers
      ha_details.fetch("redundancy_routers", [])
    end
  end
end
