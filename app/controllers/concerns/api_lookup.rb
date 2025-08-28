module ApiLookup
  # include Services

  SERVICE_METHOD_MAP = {
  "domain" => [
    "identity",
    { method_name: 'find_domain', params: [":term"] },
    { method_name: 'domains', params: [{ name: ":term" }] }
  ],
  "inquiry" => [
    "inquiry",
    { method_name: 'get_inquiry', params: [":term"] }
  ],
  "group" => [
    "identity",
    { method_name: 'find_group', params: [":term"] },
    { method_name: 'groups', params: [{ name: ":term" }] }
  ],
  "os_credential" => [
    "identity",
    { method_name: 'find_credential', params: [":term"] },
    { method_name: 'credentials', params: [{ user_id: ":term" }] },
    { method_name: 'credentials', params: [{ type: ":term" }] }
  ],
  "project" => [
    "identity",
    { method_name: 'find_project', params: [":term"] },
    { method_name: 'projects', params: [{ name: ":term" }] }
  ],
  "role" => [
    "identity",
    { method_name: 'find_role', params: [":term"] },
    { method_name: 'roles', params: [{ name: ":term" }] }
  ],
  "user" => [
    "identity",
    { method_name: 'find_user', params: [":term"] },
    { method_name: 'users', params: [{ name: ":term" }] }
  ],
  "server" => [
    "compute",
    { method_name: 'find_server', params: [":term"] },
    { method_name: 'servers', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'servers', params: [{ name: ":term" }] }
  ],
  "flavor" => [
    "compute",
    { method_name: 'find_flavor', params: [":term"] },
    { method_name: 'flavors', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'flavors', params: [{ name: ":term" }] }
  ],
  "flavor_metadata" => [
    "compute",
    { method_name: 'find_flavor_metadata', params: [":term"] }
  ],
  "hypervisor" => [
    "compute",
    { method_name: 'find_hypervisor', params: [":term"] },
    { method_name: 'hypervisors', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'hypervisors', params: [{ name: ":term" }] }
  ],
  "keypair" => [
    "compute",
    { method_name: 'find_keypair', params: [":term"] }
  ],
  "volume" => [
    "block_storage",
    { method_name: 'find_volume', params: [":term"] },
    { method_name: 'volumes', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'volumes', params: [{ name: ":term" }] }
  ],
  "snapshot" => [
    "block_storage",
    { method_name: 'find_snapshot', params: [":term"] },
    { method_name: 'snapshots', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'snapshots', params: [{ name: ":term" }] }
  ],
  "network" => [
    "networking",
    { method_name: 'find_network', params: [":term"] },
    { method_name: 'networks', params: [{ name: ":term" }] }
  ],
  "subnet" => [
    "networking",
    { method_name: 'find_subnet', params: [":term"] },
    { method_name: 'subnets', params: [{ name: ":term" }] },
    { method_name: 'subnets', params: [{ network_id: ":term" }] }
  ],
  "floatingip" => [
    "networking",
    { method_name: 'find_floating_ip', params: [":term"] },
    { method_name: 'floating_ips', params: [{ floating_ip_address: ":term" }] }
  ],
  "port" => [
    "networking",
    { method_name: 'find_port', params: [":term"] },
    { method_name: 'ports', params: [{ name: ":term" }] },
    { method_name: 'ports', params: [{ fixed_ips: "ip_address=:term" }] }
  ],
  "network_rbac" => [
    "networking",
    { method_name: 'find_rbac', params: [":term"] },
    { method_name: 'rbacs', params: [{ object_id: ":term" }] },
    { method_name: 'rbacs', params: [{ object_type: ":term" }] }
  ],
  "router" => [
    "networking",
    { method_name: 'find_router', params: [":term"] },
    { method_name: 'routers', params: [{ name: ":term" }] }
  ],
  "security_group" => [
    "networking",
    { method_name: 'find_security_group', params: [":term"] },
    { method_name: 'security_groups', params: [{ name: ":term" }] }
  ],
  "security_group_rule" => [
    "networking",
    { method_name: 'find_security_group_rule', params: [":term"] },
    { method_name: 'security_group_rules', params: [{ protocol: ":term" }] },
    { method_name: 'security_group_rules', params: [{ direction: ":term" }] },
    { method_name: 'security_group_rules', params: [{ remote_group_id: ":term" }] }
  ],
  "zone" => [
    "dns_service",
    { method_name: 'find_zone', params: [":term"] },
    { method_name: 'zones', params: [{ name: ":term", all_projects: true }] },
    { method_name: 'zones', params: [{ name: ":term" }] }
  ],
  "pool" => [
    "dns_service",
    { method_name: 'find_pool', params: [":term"] },
    { method_name: 'pools', params: [{ name: ":term", all_projects: true }] },
    { method_name: 'pools', params: [{ name: ":term" }] }
  ],
  "recordset" => [
    "dns_service",
    { method_name: 'find_recordset', params: [":term"] },
    { method_name: 'recordsets', params: [{ name: ":term", all_projects: true }] },
    { method_name: 'recordsets', params: [{ type: ":term", all_projects: true }] },
    { method_name: 'recordsets', params: [{ name: ":term" }] },
    { method_name: 'recordsets', params: [{ type: ":term" }] }
  ],
  "image" => [
    "image",
    { method_name: 'find_image', params: [":term"] },
    { method_name: 'images', params: [{ name: ":term" }] }
  ],
  "secret" => [
    "key_manager",
    { method_name: 'find_secret', params: [":term"] },
    { method_name: 'secrets', params: [{ name: ":term" }] }
  ],
  "container" => [
    "key_manager",
    { method_name: 'find_container', params: [":term"] },
    { method_name: 'containers', params: [{ name: ":term" }] }
  ],
  "loadbalancer" => [
    "lbaas2",
    { method_name: 'find_loadbalancer', params: [":term"] },
    { method_name: 'loadbalancers', params: [{ name: ":term" }] }
  ],
  "lb_listener" => [
    "lbaas2",
    { method_name: 'find_listener', params: [":term"] },
    { method_name: 'listeners', params: [{ name: ":term" }] }
  ],
  "lb_pool" => [
    "lbaas2",
    { method_name: 'find_pool', params: [":term"] },
    { method_name: 'pools', params: [{ name: ":term" }] }
  ],
  "lb_healthmonitor" => [
    "lbaas2",
    { method_name: 'find_healthmonitor', params: [":term"] },
    { method_name: 'healthmonitors', params: [{ name: ":term" }] }
  ],
  "storage_container" => [
    "object_storage",
    { method_name: 'container_metadata', params: [":term"] }
  ],
  "share" => [
    "shared_filesystem_storage",
    { method_name: 'find_share', params: [":term"] },
    { method_name: 'shares', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'shares', params: [{ name: ":term" }] }
  ],
  "share_network" => [
    "shared_filesystem_storage",
    { method_name: 'find_share_network', params: [":term"] },
    { method_name: 'share_networks', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'share_networks', params: [{ name: ":term" }] }
  ],
  "share_snapshot" => [
    "shared_filesystem_storage",
    { method_name: 'snapshots_detail', params: [":term"] },
    { method_name: 'snapshots', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'snapshots', params: [{ name: ":term" }] }
  ],
  "share_security_service" => [
    "shared_filesystem_storage",
    { method_name: 'find_security_service', params: [":term"] },
    { method_name: 'security_services', params: [{ name: ":term", all_tenants: true }] },
    { method_name: 'security_services', params: [{ name: ":term" }] }
  ]
}.freeze

  # This method tries to find an object by id or name via API
  def api_search(service_manager, object_type, term)
    service_name, methods = service_and_methods(object_type)

    # service = object_service(service_name)
    unless service_manager.respond_to?(service_name)
      raise StandardError, "Service #{service_name} could not be found."
    end
    service = service_manager.send(service_name)

    # encode term to a valid URL format
    term = URI.encode_www_form_component(term)

    methods.each do |m|
      # replace :term in values 
      transformed_params = m[:params].map do |param|
        if param.is_a?(Hash)
          param.transform_values { |value| value == ":term" ? term : value }
        elsif param.is_a?(String) && param == ":term"
          term.dup
        else
          param
        end
      end

      found_items = service.public_send(m[:method_name], *transformed_params)

      if found_items
        items =
          if found_items.is_a?(Hash)
            found_items[:items]
          elsif found_items.is_a?(Array)
            found_items
          else
            [found_items]
          end
        return { items: items, service_call: "#{service_name}->#{m[:method_name]}(#{transformed_params})" }
      end
    end

    { items: [], service_call: "" }
  end

  def service_and_methods(object_type)
    object_service_values = SERVICE_METHOD_MAP[object_type]
    if object_service_values.blank?
      raise StandardError, "#{object_type} is not supported."
    end

    [object_service_values.first, object_service_values[1..-1]]
  end
end
