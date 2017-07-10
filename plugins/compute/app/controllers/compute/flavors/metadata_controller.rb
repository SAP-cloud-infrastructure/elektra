module Compute
  module Flavors
    class MetadataController < Image::ApplicationController
    
      def index
        @flavor = services_ng.compute.flavor(params[:flavor_id])
        @metadata = services_ng.compute.flavor_metadata(params[:flavor_id])
      end
    
      # TODO: after creating the metadate the list in the modal window is wrong
      def create
        @metadata = services_ng.compute.new_flavor_metadata(params[:flavor_id])
        @metadata.add(params[:spec])
      end
    
      def destroy
        @metadata = services_ng.compute.new_flavor_metadata(params[:flavor_id])
        @metadata.remove(params[:key])
      end
    
    end
  end
end