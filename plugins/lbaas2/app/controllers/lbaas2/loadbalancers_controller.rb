# frozen_string_literal: true

module Lbaas2
  class LoadbalancersController < ::AjaxController
    authorization_context "lbaas2"
    authorization_required

    def index
      # get paginated loadbalancers
      limit = (params[:limit] || 19).to_i
      sort_key = (params[:sort_key] || "name")
      sort_dir = (params[:sort_dir] || "asc")
      pagination_options = {
        sort_key: sort_key,
        sort_dir: sort_dir,
        limit: limit + 1,
      }
      pagination_options[:marker] = params[:marker] if params[:marker]
      loadbalancers =
        services.lbaas2.loadbalancers(
          { project_id: @scoped_project_id }.merge(pagination_options),
        )

      extend_lb_data(loadbalancers)

      render json: {
               loadbalancers: loadbalancers,
               has_next: loadbalancers.length > limit,
               limit: limit,
               sort_key: sort_key,
               sort_dir: sort_dir,
             }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def show
      loadbalancer = services.lbaas2.find_loadbalancer(params[:id])
      extend_lb_data([loadbalancer])

      render json: { loadbalancer: loadbalancer }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def device
      device = services.lbaas2.loadbalancer_device(params[:id])

      render json: { device: device }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def destroy
      loadbalancer = services.lbaas2.new_loadbalancer
      loadbalancer.id = params[:id]

      if loadbalancer.destroy
        audit_logger.info(current_user, "has deleted", loadbalancer)
        head 202
      else
        render json: { errors: loadbalancer.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def status_tree
      statuses = services.lbaas2.loadbalancer_statuses(params[:id])
      render json: { statuses: statuses }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def private_networks
      # get project networks
      private_networks =
        services
          .networking
          .project_networks(@scoped_project_id)
          .delete_if { |n| n.attributes["router:external"] == true }

      # transform data for a select input
      select_private_networks =
        private_networks.map { |pn| { label: pn.name, value: pn.id } }

      render json: { private_networks: select_private_networks }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def subnets
      private_network = services.networking.find_network!(params[:id])
      subnets = private_network.subnet_objects || []
      select_subnets =
        subnets.map { |sb| { label: "#{sb.name} (#{sb.cidr})", value: sb.id } }

      render json: { subnets: select_subnets }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def create
      # add project id
      lbParams = params[:loadbalancer].merge(project_id: @scoped_project_id)
      loadbalancer = services.lbaas2.new_loadbalancer(lbParams)
      if loadbalancer.save
        audit_logger.info(current_user, "has created", loadbalancer)
        # extend lb data with chached data
        extend_lb_data([loadbalancer])
        render json: loadbalancer
      else
        render json: { errors: loadbalancer.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def update
      lbParams = params[:loadbalancer]
      loadbalancer = services.lbaas2.new_loadbalancer(lbParams)

      if loadbalancer.update
        audit_logger.info(current_user, "has updated", loadbalancer)
        extend_lb_data([loadbalancer])
        render json: loadbalancer
      else
        render json: { errors: loadbalancer.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def attach_fip
      # get loadbalancer
      loadbalancer = services.lbaas2.find_loadbalancer(params[:id])
      vip_port_id = loadbalancer.vip_port_id

      # update floating ip with the new assigned interface ip
      floating_ip = services.networking.new_floating_ip
      floating_ip.id = params[:floating_ip]
      floating_ip.port_id = vip_port_id

      if floating_ip.save
        audit_logger.info(
          current_user,
          "has attached",
          floating_ip,
          "to loadbalancer",
          params[:id],
        )

        loadbalancer.floating_ip = floating_ip
        # extend lb data with chached data
        extend_lb_data([loadbalancer])
        render json: { loadbalancer: loadbalancer }
      else
        render json: { errors: floating_ip.errors }, status: 422
      end
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def detach_fip
      # get loadbalancer
      loadbalancer = services.lbaas2.find_loadbalancer(params[:id])
      floating_ip = services.networking.detach_floatingip(params[:floating_ip])

      audit_logger.info(
        current_user,
        "has detached",
        floating_ip,
        "from loadbalancer",
        params[:id],
      )
      # extend lb data with chached data
      extend_lb_data([loadbalancer])
      render json: { loadbalancer: loadbalancer }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def fips
      grouped_fips = {}
      networks = {}
      subnets = {}
      services
        .networking
        .project_floating_ips(@scoped_project_id)
        .each do |fip|
          next unless fip.fixed_ip_address.nil?

          unless networks[fip.floating_network_id]
            networks[
              fip.floating_network_id
            ] = services.networking.find_network(fip.floating_network_id)
          end
          next if networks[fip.floating_network_id].nil?

          net = networks[fip.floating_network_id]
          if !net.subnets.blank?
            net.subnets.each do |subid|
              subnets[subid] = services.networking.find_subnet(
                subid,
              ) unless subnets[subid]
              sub = subnets[subid]
              cidr = NetAddr.parse_net(sub.cidr)
              parsed_fip = NetAddr.parse_ip(fip.floating_ip_address)
              # Skip if IP versions differ (e.g. IPv4 CIDR vs IPv6 FIP)
              next unless cidr.version == parsed_fip.version && cidr.contains(parsed_fip)

              grouped_fips[sub.name] ||= []
              # add the description to the label ip
              label = fip.floating_ip_address
              label =
                "#{label} (#{fip.description})" unless fip.description.blank?
              grouped_fips[sub.name] << { label: label, value: fip.id }
              break
            end
          else
            grouped_fips[net.name] ||= []
            # add the description to the label ip
            label = fip.floating_ip_address
            label =
              "#{label} (#{fip.description})" unless fip.description.blank?
            grouped_fips[net.name] << { label: label, value: fip.id }
          end
        end

      # transform to grouped select options
      selectGroupedIPs =
        grouped_fips.sort.map { |k, v| { label: k, options: v } }

      render json: { fips: selectGroupedIPs }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def availability_zones
      availability_zones = services.lbaas2.availability_zones()
      # transform to select options
      select_availability_zones =
        availability_zones.map do |az|
          { label: az["name"], value: az["name"], enabled: az["enabled"] }
        end

      render json: { availability_zones: select_availability_zones }
    rescue Elektron::Errors::ApiResponse => e
      render json: { errors: e.message }, status: e.code
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    def ciphers
      allow_ciphers = OctaviaConfig["cipher_suites"]["allow_list"]
      litener_default_ciphers =
        OctaviaConfig["cipher_suites"]["default"]["listeners"]
      pool_default_ciphers = OctaviaConfig["cipher_suites"]["default"]["pools"]
      select_allow_ciphers = allow_ciphers.map { |c| { label: c, value: c } }
      select_listener_ciphers =
        litener_default_ciphers.map { |c| { label: c, value: c } }
      select_pool_ciphers =
        pool_default_ciphers.map { |c| { label: c, value: c } }
      render json: {
               allowCiphers: select_allow_ciphers,
               listenerDefaultCiphers: select_listener_ciphers,
               poolDefaultCiphers: select_pool_ciphers,
             }
    rescue Exception => e
      render json: { errors: e.message }, status: "500"
    end

    protected

    def extend_lb_data(lbs)
      # get project fips per api
      fips = services.networking.project_floating_ips(@scoped_project_id)

      # attach fips and subnets
      lbs.each do |lb|
        # fips
        lb.floating_ip =
          fips.select { |fip| fip.port_id == lb.vip_port_id }.first
        # get subnet from cache if exists
        unless lb.vip_subnet_id.blank?
          lb.subnet_from_cache true
          lb.subnet = services.networking.cached_subnet(lb.vip_subnet_id)
          unless lb.subnet
            lb.subnet = services.networking.subnets(id: lb.vip_subnet_id).first
            lb.subnet_from_cache false
          end
        end

        # get cached listeners
        lb.listeners = [] if lb.listeners.blank?
        lb.cached_listeners =
          ObjectCache
            .where(id: lb.listeners.map { |l| l[:id] })
            .each_with_object({}) { |l, map| map[l[:id]] = l }

        # get cached pools
        lb.pools = [] if lb.pools.blank?
        lb.cached_pools =
          ObjectCache
            .where(id: lb.pools.map { |p| p[:id] })
            .each_with_object({}) { |p, map| map[p[:id]] = p }
      end
    end
  end
end
