# frozen_string_literal: true

module Networking
  # Implements Openstack Port
  class Port < Core::ServiceLayer::Model
    DEVICE_OWNER_INSTANCE = "instance"
    DEVICE_OWNER_LOADBALANCER = "loadbalancer"
    FIXED_IP_PORT_NAME = "fixed_ip_allocation"

    DEVICE_OWNER_MAP = {
      "compute:" => DEVICE_OWNER_INSTANCE,
      "neutron:LOADBALANCER" => DEVICE_OWNER_LOADBALANCER,
    }.freeze

    def network_object
      @network_object ||= @service.find_network(network_id)
    end

    def owner_type
      DEVICE_OWNER_MAP.each do |key, type|
        return type if device_owner.to_s.start_with?(key)
      end
      "unknown"
    end

    def fixed_ip_port?
      name == FIXED_IP_PORT_NAME
    end

    def attributes_for_create
      {
        "admin_state_up" => read("admin_state_up"),
        "allowed_address_pairs" => read("allowed_address_pairs"),
        "binding:host_id" => read("binding:host_id"),
        "binding:profile" => read("binding:profile"),
        "binding:vnic_type" => read("binding:vnic_type"),
        "description" => read("description"),
        "device_id" => read("device_id"),
        "device_owner" => read("device_owner"),
        "dns_domain" => read("dns_domain"),
        "dns_name" => read("dns_name"),
        "extra_dhcp_opts" => read("extra_dhcp_opts"),
        "fixed_ips" => read("fixed_ips"),
        "mac_address" => read("mac_address"),
        "name" => read("name"),
        "network_id" => read("network_id"),
        "port_security_enabled" => read("port_security_enabled"),
        "project_id" => read("project_id"),
        "security_groups" => read("security_groups"),
        "tenant_id" => read("tenant_id"),
      }.delete_if { |_k, v| v.nil? }
    end

    def binding_host_id
      read("binding:host_id") || ""
    end

    def attributes_for_update
      {
        # 'admin_state_up' => read('admin_state_up'),
        # 'allowed_address_pairs' => read('allowed_address_pairs'),
        # 'binding:host_id' => read('binding:host_id'),
        # 'binding:profile' => read('binding:profile'),
        # 'binding:vnic_type' => read('binding:vnic_type'),
        # 'data_plane_status' => read('data_plane_status'),
        "name" => read("name") || "",
        "description" => read("description") || "",
        # 'device_id' => read('device_id'),
        # 'device_owner' => read('device_owner'),
        # 'dns_domain' => read('dns_domain'),
        # 'dns_name' => read('dns_name'),
        # 'extra_dhcp_opts' => read('extra_dhcp_opts'),
        # 'fixed_ips' => read('fixed_ips'),
        # 'mac_address' => read('mac_address'),
        # 'port_security_enabled' => read('port_security_enabled'),
        "security_groups" => (read("security_groups") || []),
      }
    end
  end
end
