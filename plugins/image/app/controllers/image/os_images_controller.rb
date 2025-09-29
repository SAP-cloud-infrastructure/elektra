module Image
  class OsImagesController < ::Image::ApplicationController
    # before_action :load_visibility, only: [:index, :show]

    def index
      @images =
        paginatable(per_page: 15) do |pagination_options|
          services.image.images(filter_params.merge(pagination_options))
        end
      
      # this is relevant in case an ajax paginate call is made.
      # in this case we don't render the layout, only the list!
      if request.xhr?
        render partial: "list", locals: { images: @images }
      else
        # comon case, render index page with layout
        render action: :index
      end
    end

    def show
      @image = services.image.find_image(params[:id])

      properties = @image.attributes.clone.stringify_keys
      known_attributes = %w[
        name
        id
        status
        visibility
        protected
        size
        container_format
        disk_format
        created_at
        updated_at
        owner
      ]
      known_attributes.each { |known| properties.delete(known) }
      additional_properties = properties.delete("properties")
      properties.merge!(additional_properties) if additional_properties

      @properties = properties.sort_by { |k, _v| k }
    end

    def new
    end

    def create
      render plain: "create"
    end

    def edit
    end

    def update
      render plain: "update"
    end

    def destroy
      @image = services.image.find_image(params[:id])
      @success = (@image && @image.destroy)
    end

    protected

    def filter_params
      raise "has to be implemented in subclass"
    end
  end
end
