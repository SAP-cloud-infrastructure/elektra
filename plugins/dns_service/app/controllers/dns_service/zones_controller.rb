module DnsService
  class ZonesController < DnsService::ApplicationController
    before_action ->(id = params[:id]) { load_zone id }, except: [:index]
    before_action :load_pools, only: [:index, :show, :update, :create]

    authorization_context 'dns_service'
    authorization_required 

    def index
      @zones = paginatable(per_page: 20) do |pagination_options|
        services.dns_service.zones(@admin_option.merge(pagination_options))
      end

      active_requests = services.dns_service.zone_transfer_requests(status: 'ACTIVE')

      @zone_transfer_requests = active_requests.select do |r|
        r.project_id.nil? or r.project_id!=@scoped_project_id
      end

      @active_zone_transfer_requests = active_requests.inject({}) do |hash,r|
        hash[r.zone_id] = r if r.project_id==@scoped_project_id
        hash
      end

      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if request.xhr?
        render partial: 'list', locals: {zones: @zones, active_zone_transfer_requests: @active_zone_transfer_requests, pools: @pools}
      else
        # comon case, render index page with layout
        render action: :index
      end
    end

    def show
      @recordsets = paginatable(per_page: 20) do |pagination_options|
        services.dns_service.recordsets(
          {
            zone_id: params[:id],
            sort_key: 'name'
          }.merge(@impersonate_option).merge(pagination_options)
        )
      end

      @nameservers = services.dns_service.recordsets(
        {
          zone_id: params[:id],
          type: 'NS'
        }.merge(@impersonate_option)
      )
    end

    def new
      @zone = services.dns_service.new_zone
    end

    def create
      @zone = services.dns_service.new_zone(params[:zone])

      if @zone.save
        flash.now[:notice] = "Zone successfully created."
        respond_to do |format|
          format.html{redirect_to zones_url}
          format.js {render 'create.js'}
        end
      else
        render action: :new
      end
    end

    def edit
    end

    def update
      @zone.attributes = params[:zone].merge(@impersonate_option)

      if @zone.save
        flash.now[:notice] = "Zone successfully updated."
        respond_to do |format|
          format.html{redirect_to zones_url}
          format.js {render 'update.js'}
        end
      else
        render action: :edit
      end
    end

    def destroy
      @zone = services.dns_service.delete_zone(params[:id], @impersonate_option)
      respond_to do |format|
        format.js{}
        format.html{redirect_to zones_url  }
      end
    end

    private

    def load_pools
      @pools = current_user.is_allowed?("dns_service:pool_list") ? services.dns_service.pools : []
    end
  end
end
