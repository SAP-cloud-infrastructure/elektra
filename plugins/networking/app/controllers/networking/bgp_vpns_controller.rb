# frozen_string_literal: true

module Networking
  # Implements Network actions
  class BgpVpnsController < AjaxController
    # set policy context
    authorization_context "networking"
    # enforce permission checks. This will automatically
    # investigate the rule name.
    authorization_required only: %i[index create destroy]

    def index
      code, bgp_vpns = services.networking.bgp_vpns()

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if code.to_i >= 400
        render json: { errors: bgp_vpns }, status: code
      else
        # extend items with domain id, needed for url generation
        projectsCache = {}
        if @active_project 
          projectsCache[@active_project.id] = @active_project
        end

        bgp_vpns["bgpvpns"].each do |item|
          
          if projectsCache.key?(item["project_id"])
            item["domain_id"] = projectsCache[item["project_id"]].domain_name
          else
            project = services.identity.find_project(item["project_id"])
            projectsCache[item["project_id"]] = project if project    
            item["domain_id"] = project.domain_id if project
          end
        end
        render json: bgp_vpns
      end
    end

    def create
      code, bgp_vpn = services.networking.create_bgp_vpn(params.require(:name))

      if code.to_i >= 400
        render json: { errors: bgp_vpn.body }, status: code
      else
        bgp_vpn = bgp_vpn.body
        # extend items with domain id, needed for url generation
        project = services.identity.find_project(bgp_vpn["bgpvpn"]["project_id"])
        bgp_vpn["bgpvpn"]["domain_id"] = project.domain_id if project
        render json: bgp_vpn
      end
    end

    def destroy
      code, bgp_vpn = services.networking.delete_bgp_vpn(params.require(:id))

      if code.to_i >= 400
        render json: { errors: bgp_vpn }, status: code
      else
        head :ok
      end
    end

    def routers
      # load all avilable routers
      routers =
        services.networking.routers(
          limit: 500,
          fields: %i[external_gateway_info id name project_id],
        )
      # load all port owned by router_interface
      ports =
        services.networking.ports(
          limit: 500,
          device_owner: "network:router_interface",
          fields: %i[device_id network_id],
        )
      # load all project subnets
      subnets =
        services.networking.subnets(
          limit: 500,
          fields: %i[name cidr network_id project_id id],
        )

      routers.each do |router|
        ports
          .select { |port| port.device_id === router.id }
          .each do |port|
            router.subnets =
              subnets.select { |subnet| subnet.network_id === port.network_id }
          end
      end

      render json: { routers: routers }
    rescue Elektron::Errors::ApiResponse => e
      ender json: { errors: e.messages.join(", ") }
    end

    def router_associations
      code, router_associations =
        services.networking.router_associations(params[:id])

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if code.to_i >= 400
        render json: { errors: router_associations }, status: code
      else
        render json: router_associations
      end
    end

    def create_router_association
      code, router_association =
        services.networking.create_router_association(
          params[:id],
          params[:router_id],
        )

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if code.to_i >= 400
        render json: { errors: router_association }, status: code
      else
        render json: router_association
      end
    end

    def destroy_router_association
      code, errors =
        services.networking.delete_router_association(
          params[:id],
          params[:router_association_id],
        )

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if code.to_i >= 400
        render json: { errors: errors }, status: code
      else
        head code
      end
    end
  end
end
