module Compute
  class FlavorsController < ::DashboardController

    authorization_context 'compute'
    authorization_required

    def index
      @flavors = paginatable(per_page: 15) do |pagination_options|
        services_ng.compute.flavors({is_public: 'None'}.merge(pagination_options))
      end
    end

    def new
      @flavor = services_ng.compute.new_flavor
    end

    def create
      @flavor = services_ng.compute.new_flavor(params[:flavor])
      if @flavor.save
        respond_to do |format|
          format.html{redirect_to plugin('compute').flavors_url}
          format.js { render action: :create, format: :js}
        end
      else
        render action: :new
      end
    end
    
    def edit
      @flavor = services_ng.compute.flavor(params[:id])
    end
    
    def update
      @flavor = services_ng.compute.flavor(params[:id])
      @flavor.attributes = params[:flavor]
      if @flavor.save
        respond_to do |format|
          format.html{redirect_to plugin('compute').flavors_url}
          format.js { render action: :update, format: :js}
        end
      else
        render action: :new        
      end
    end

    def destroy
      @flavor = services_ng.compute.flavor(params[:id])
      @error = 'Could not delete Flavor' unless @flavor.destroy
      
      respond_to do |format|
        format.html { 
          flash.now[:error] = @error if @error 
          redirect_to plugin('compute').flavors_url
        }
        format.js {render action: :destroy, format: :js}
      end  
    end
  end
end
