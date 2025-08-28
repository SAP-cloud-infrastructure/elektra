module DnsService
  class ZonesController < DnsService::ApplicationController
    before_action ->(id = params[:id]) { load_zone id }, except: %i[index]
    before_action :load_pools, only: %i[index show update create new]
    before_action :load_shared_zones, only: %i[index update create]

    authorization_context "dns_service"
    authorization_required

    def index
      per_page = params[:per_page] || 20

      filter = {}
      @search = nil
      @searchfor = nil

      if params.include?(:search)
        if not params[:search].blank?
          @search = params[:search]
          @searchfor = "#{params[:searchfor]}"
          # surrounding the user submitted search term with wildcards is stupid but the easiest way to make the search intuitive and match partial names
          filter = { @searchfor.downcase() => "*#@search*" }
        else
          params.delete(:search)
          params.delete(:searchfor)
        end
      end

      @zones =
        paginatable(per_page: per_page.to_i) do |pagination_options|
          services.dns_service.zones(
            @admin_option.merge(pagination_options).merge(filter),
          )[
            :items
          ]
        end

      active_requests =
        services.dns_service.zone_transfer_requests(status: "ACTIVE")

      @zone_transfer_requests =
        active_requests.select do |r|
          r.project_id.nil? or r.project_id != @scoped_project_id
        end

      @active_zone_transfer_requests =
        active_requests.inject({}) do |hash, r|
          hash[r.zone_id] = r if r.project_id == @scoped_project_id
          hash
        end

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if request.xhr?
        render partial: "list",
               locals: {
                 zones: @zones,
                 active_zone_transfer_requests: @active_zone_transfer_requests,
                 pools: @pools,
               }
      else
        # comon case, render index page with layout
        render action: :index
      end
    end

    def show
      per_page = params[:per_page] || 20

      filter = {}
      @search = nil
      @searchfor = nil

      if params.include?(:search)
        if not params[:search].blank?
          @search = params[:search]
          @searchfor = "#{params[:searchfor]}"
          # surrounding the user submitted search term with wildcards is stupid but the easiest way to make the search intuitive and match partial names
          filter = { @searchfor.downcase() => "*#@search*" }
        else
          params.delete(:search)
          params.delete(:searchfor)
        end
      end

      @zone =
        services.dns_service.find_zone(params[:id], all_projects: @all_projects)
      all_shared_zones = services.dns_service.shared_zones()

      @shared_with_projects = []
      # check if zone is shared with other projects
      all_shared_zones.each do |shared_zone|
        if @zone.id == shared_zone.zone_id &&
             @scoped_project_id != shared_zone.target_project_id
          project = ObjectCache.where(id: shared_zone.target_project_id).first
          if project
            @shared_with_projects << project.name
          else
            @shared_with_projects << shared_zone.target_project_id
          end
        end
      end

      @recordsets =
        paginatable(per_page: per_page.to_i) do |pagination_options|
          services.dns_service.recordsets(
            params[:id],
            { sort_key: "name" }.merge(@impersonate_option)
              .merge(pagination_options)
              .merge(filter),
          )[
            :items
          ]
        end

      ns_options = { type: "NS" }
      ns_options[:name] = @zone.name if @zone

      @nameservers =
        services.dns_service.recordsets(
          params[:id],
          ns_options.merge(@impersonate_option),
        )[
          :items
        ]

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if request.xhr?
        zone = services.dns_service.find_zone(params[:id], @impersonate_option)
        render partial: "dns_service/zones/recordsets/recordsets",
               locals: {
                 recordsets: @recordsets,
                 zone: zone,
               }
      else
        # comon case, render index page with layout
        render action: :show
      end
    end

    def new
      @zone = services.dns_service.new_zone
      domain_config = DomainConfig.new(@scoped_domain_name)
      disabled_providers = domain_config.disabled_dns_providers?

      # filter disabled DNS providers
      @pools.reject! do |pool|
        pool_label = pool.attributes["attributes"]["label"]
        is_disabled = false
        is_disabled = disabled_providers.include?(pool_label) if disabled_providers
        
        if is_disabled
          Rails.logger.debug("Rejecting pool: #{pool_label} (disabled DNS provider)")
        end
        
        is_disabled
      end
    end

    def create

      # create_zone is located in the concerns/create_zone_helpers
      @zone = create_zone(params[:zone][:name],params[:zone], @scoped_domain_id, @scoped_project_id)

      # do not use @zone.valid?
      # it is broken, calling this method will reset errors and return true
      if @zone.errors.empty? and @zone.id.present?
        flash.now[:notice] = "Zone successfully created."
        respond_to do |format|
          format.html { redirect_to zones_url }
          format.js { render "create", formats: :js }
        end
      else
        render action: :new
      end
    end

    def edit
    end

    def update
      @zone.email = params[:zone][:email]
      @zone.ttl = params[:zone][:ttl]
      @zone.description = params[:zone][:description]

      if @zone.save
        flash.now[:notice] = "Zone successfully updated."
        respond_to do |format|
          format.html { redirect_to zones_url }
          format.js { render "update", formats: :js }
        end
      else
        render action: :edit
      end
    end

    def destroy
      # TODO: if zone cannot be deleted like subzones are existing the error is not handled
      @deleted =
        services.dns_service.delete_zone(params[:id], @impersonate_option)
      respond_to do |format|
        format.js {}
        format.html { redirect_to zones_url }
      end
    end

    private

    def load_pools
      @pools = []
      return unless current_user.is_allowed?("dns_service:pool_list")
      @pools = services.dns_service.pools[:items]
    end

    def load_shared_zones
      @shared_zones = services.dns_service.shared_zones()
    end
  end
end
