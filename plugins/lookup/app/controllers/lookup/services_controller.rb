# frozen_string_literal: true

require_dependency "lookup/application_controller"

module Lookup
  class ServicesController < ApplicationController
    DOMAIN_SERVICE_METHOD_MAP = {
      "domain" => %w[identity find_domain],
      "inquiry" => %w[inquiry get_inquiry],
    }.freeze

    PROJECT_SERVICE_METHOD_MAP = {
      "group" => %w[identity find_group],
      "os_credential" => %w[identity find_credential],
      "project" => %w[identity find_project],
      "role" => %w[identity find_role],
      "user" => %w[identity find_user],
      "server" => %w[compute find_server],
      "flavor" => %w[compute find_flavor],
      "flavor_metadata" => %w[compute find_flavor_metadata],
      "hypervisor" => %w[compute find_hypervisor],
      #'server_image' => %w[compute find_image],
      "keypair" => %w[compute find_keypair],
      "volume" => %w[block_storage find_volume],
      "snapshot" => %w[block_storage find_snapshot],
      "network" => %w[networking find_network],
      "subnet" => %w[networking find_subnet],
      "floating_ip" => %w[networking find_floating_ip],
      "port" => %w[networking find_port],
      "network_rbac" => %w[networking find_rbac],
      "router" => %w[networking find_router],
      "security_group" => %w[networking find_security_group],
      "security_group_rule" => %w[networking find_security_group_rule],
      #'dns_zone' => %w[dns_service find_zone],
      "dns_pool" => %w[dns_service find_pool],
      "image" => %w[image find_image],
      "inquiry" => %w[inquiry get_inquiry],
      "secret" => %w[key_manager find_secret],
      "container" => %w[key_manager find_container],
      "loadbalancer" => %w[lbaas2 find_loadbalancer],
      "lb_listener" => %w[lbaas2 find_listener],
      "lb_pool" => %w[lbaas2 find_pool],
      "lb_healthmonitor" => %w[lbaas2 find_healthmonitor],
      # "storage_container" => %w[object_storage container_metadata],
      "share" => %w[shared_filesystem_storage find_share],
      "share_network" => %w[shared_filesystem_storage find_share_network],
      "share_snapshot" => %w[shared_filesystem_storage snapshots_detail],
      "share_security_service" => %w[
        shared_filesystem_storage
        find_security_service
      ],
    }.freeze

    def find
      service_name, method_name = service_and_method_name(params[:object_type])

      unless service_name
        return(
          render(json: { error: "#{params[:object_type]} is not supported." })
        )
      end

      begin
        object =
          object_service(service_name).send(method_name, params[:object_id])
        render json: object
      rescue => e
        render json:
                 e.respond_to?(:type) ?
                   e.type :
                   e.respond_to?(:code_type) ? e.code_type : e.message
      end
    end

    def object_types
      return render(json: PROJECT_SERVICE_METHOD_MAP.keys) if @scoped_project_id
      return render(json: DOMAIN_SERVICE_METHOD_MAP.keys) if @scoped_domain_id
      render(json: [])
    end

    protected

    def object_service(name)
      return services.send(name) if services.respond_to?(name)
      services.send(name)
    end

    def service_and_method_name(object_type)
      return PROJECT_SERVICE_METHOD_MAP[object_type] if @scoped_project_id
      return DOMAIN_SERVICE_METHOD_MAP[object_type] if @scoped_domain_id
      [nil, nil]
    end
  end
end
