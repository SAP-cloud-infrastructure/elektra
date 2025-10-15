# frozen_string_literal: true

module Networking
  # Implements Port actions
  class PortsController < DashboardController
    # set policy context
    authorization_context "networking"
    # enforce permission checks. This will automatically
    # investigate the rule name.
    authorization_required only: %i[index create]

    def index
      per_page = params[:per_page] || 30

      ports =
        paginatable(per_page: per_page) do |pagination_options|
          services.networking.ports(
            { sort_key: "id" }.merge(pagination_options),
          )
        end

      # render json: { ports: ports, has_next: @pagination_has_next }
      if request.xhr?
        render json: { ports: ports, has_next: @pagination_has_next }
      else
        # common case, render index page with layout
        render action: :index
      end
    end

    def show
      port = services.networking.find_port(params[:id])
      enforce_permissions("::networking:port_get", port: port)
      render json: port
    end

    def create
      # for now it is allowed to create a port only for fixed ips.
      # Other ports are created automatically by compute or neutron.
      port = services.networking.new_port
      # mark as fixed ip
      port.name = Networking::Port::FIXED_IP_PORT_NAME
      port.network_id = params[:port][:network_id]
      port.description = params[:port][:description] unless params[:port][
        :description
      ].blank?
      port.fixed_ips = [
        {
          subnet_id: params[:port][:subnet_id],
          ip_address: params[:port][:ip_address],
        },
      ]
      port.security_groups = params[:port][:security_groups] unless params[
        :port
      ][
        :security_groups
      ].blank?

      if port.save
        render json: port
      else
        render json: { errors: port.errors }
      end
    end

    def update
      # for now it is allowed to create a port only for fixed ips.
      # Other ports are created automatically by compute or neutron.
      port = services.networking.find_port(params[:id])
      # mark as fixed ip
      port.description = params[:port][:description]
      port.security_groups = params[:port][:security_groups]

      if port.save
        render json: port
      else
        render json: { errors: port.errors }
      end
    end

    def destroy
      port = services.networking.new_port
      port.id = params[:id]

      if port.destroy
        head :no_content
      else
        render json: { errors: port.errors }
      end
    end

    def networks
      render json: {
               networks:
                 services.networking.networks("router:external" => false),
             }
    end

    def subnets
      render json: { subnets: services.networking.subnets }
    end

    def security_groups
      render json: { security_groups: services.networking.security_groups }
    end
  end
end
