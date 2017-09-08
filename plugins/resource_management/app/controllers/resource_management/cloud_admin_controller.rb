require_dependency "resource_management/application_controller"

module ResourceManagement
  class CloudAdminController < ::ResourceManagement::ApplicationController

    before_action :load_domain_resource, only: [:edit, :cancel, :update]
    before_action :load_cluster_resource, only: [:edit_capacity, :update_capacity, :cancel, :update]
    before_action :load_inquiry, only: [:review_request, :approve_request]

    authorization_required

    def index
      @cluster = services_ng.resource_management.find_current_cluster
      @view_services = @cluster.services

      @areas = @cluster.services.map(&:area).uniq
    end

    def show_area(area = nil)
      @area = area || params.require(:area).to_sym

      # which services belong to this area?
      @cluster = services_ng.resource_management.find_current_cluster()
      @view_services = @cluster.services.select { |srv| srv.area.to_sym == @area }
      raise ActiveRecord::RecordNotFound, "unknown area #{@area}" if @view_services.empty?

      @areas = @cluster.services.map(&:area).uniq
    end

    def edit_capacity
      # please do not delete
    end

    def update_capacity
      new_value = params.require(:new_style_resource)[:capacity]
      if new_value.blank?
        new_value = -1
      else
        begin
          new_value = @cluster_resource.data_type.parse(new_value)
        rescue => e
          @cluster_resource.add_validation_error(:capacity, 'is invalid: ' + e.message)
        end
      end

      @cluster_resource.capacity = new_value
      @cluster_resource.comment  = params[:new_style_resource][:comment] || ''
      unless @cluster_resource.save
        render action: :edit_capacity
      end
    end

    def edit
      # please do not delete
    end

    def cancel
      respond_to do |format|
        format.js { render action: 'update' }
      end
    end

    def update
      # set new quota value
      old_quota = @domain_resource.quota
      begin
        @domain_resource.quota = @domain_resource.data_type.parse(params.require(:value))
      rescue ArgumentError => e
        render plain: e.message, status: :bad_request
        return
      end

      unless @domain_resource.save
        render plain: @domain_resource.errors.full_messages.to_sentence, status: :bad_request
        return
      end

      # make sure that usage bars are rendered with correct quota sum
      @cluster_resource.domains_quota += @domain_resource.quota - old_quota

      respond_to do |format|
        format.js
      end
    end

    def review_request
      @desired_quota = @inquiry.payload['desired_quota']

      # calculate projected cluster status after approval
      @cluster_resource_projected = @cluster_resource.clone
      @cluster_resource_projected.domains_quota += @desired_quota - @domain_resource.quota
    end

    def approve_request
      old_quota = @domain_resource.quota
      begin
        @domain_resource.quota = @domain_resource.data_type.parse(params.require(:new_style_resource).require(:quota))
      rescue ArgumentError => e
        @domain_resource.add_validation_error(:approved_quota, 'is invalid: ' + e.message)
      end

      if @domain_resource.save
        comment = "New domain quota is #{@domain_resource.data_type.format(@domain_resource.quota)}"
        if params[:new_style_resource][:comment].present?
          comment += ", comment from approver: #{params[:new_style_resource][:comment]}"
        end
        services.inquiry.set_inquiry_state(@inquiry.id, :approved, comment)
      else
        @domain_resource.quota = old_quota
        self.review_request
        render action: 'review_request'
      end
    end

    def details
      @sort_order  = params[:sort_order] || 'asc'
      @sort_column = params[:sort_column] || ''
      sort_by = @sort_column.gsub("_column", "")

      @service_type  = params.require(:service).to_sym
      @resource_name = params.require(:resource).to_sym

      cluster = services_ng.resource_management.find_current_cluster(service: @service_type.to_s, resource: @resource_name.to_s)
      @cluster_resource = cluster.resources.first or raise ActiveRecord::RecordNotFound, "no data for cluster"
      domains = services_ng.resource_management.list_domains(service: @service_type.to_s, resource: @resource_name.to_s)
      @domain_resources = domains.map { |d| d.resources.first }.reject(&:nil?)

      # show danger and warning projects on top if no sort by is given
      if sort_by.empty?
        @domain_resources.sort_by! do |res|
          # warn about domains with projects_quota or usage exceeding domain quota
          sort_order = res.quota < [res.projects_quota, res.usage].max ? 0 : 1
          # sort domains by warning level, then by name
          [ sort_order, (res.domain_name || res.domain_id).downcase ]
        end
      else
        sort_method = sort_by.to_sym
        @domain_resources.sort_by! { |r| [ r.send(sort_method), r.sortable_name ] }
        @domain_resources.reverse! if @sort_order.downcase == 'desc'
      end

      # prepare the domains table
      @domain_resources = Kaminari.paginate_array(@domain_resources).page(params[:page]).per(6)

      respond_to do |format|
        format.html
        format.js
      end

    end

    private

    def load_domain_resource
      enforce_permissions(":resource_management:cloud_admin_list")
      domain = services_ng.resource_management.find_domain(
        params.require(:id),
        service:  [ params.require(:service) ],
        resource: [ params.require(:resource) ],
      ) or raise ActiveRecord::RecordNotFound, "domain #{params[:domain]} not found"
      @domain_resource = domain.resources.first or raise ActiveRecord::RecordNotFound, "resource not found"
    end

    def load_cluster_resource
      cluster = services_ng.resource_management.find_current_cluster(
        service:  [ params.require(:service) ],
        resource: [ params.require(:resource) ],
      ) or raise ActiveRecord::RecordNotFound, "cluster not found"
      @cluster_resource = cluster.resources.first or raise ActiveRecord::RecordNotFound, "resource not found"
    end

    def load_inquiry
      @inquiry = services.inquiry.get_inquiry(params[:inquiry_id])
      unless @inquiry
        render html: 'Could not find inquiry!'
        return
      end

      enforce_permissions("resource_management:cloud_admin_approve_request", {inquiry: {requester_uid: @inquiry.requester.uid}})

      # load additional data
      data = @inquiry.payload.symbolize_keys
      raise ArgumentError, "inquiry #{@inquiry.id} has not been migrated to new format!" if data.include?(:resource_id)

      @domain_resource = services_ng.resource_management.find_domain(
        @inquiry.domain_id,
        service:  [ data[:service]  ],
        resource: [ data[:resource] ],
      ).resources.first or raise ActiveRecord::RecordNotFound

      @cluster_resource = services_ng.resource_management.find_current_cluster(
        service:  [ data[:service]  ],
        resource: [ data[:resource] ],
      ).resources.first or raise ActiveRecord::RecordNotFound
    end

  end
end
