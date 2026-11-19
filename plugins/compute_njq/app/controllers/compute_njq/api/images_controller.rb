# frozen_string_literal: true

module ComputeNjq
  module Api
    # Generic image reads. Currently serves the snapshot status poll; kept
    # separate from InstancesController so it stays reusable for future image
    # features rather than coupled to the snapshot flow.
    class ImagesController < Api::BaseController
      # GET /:scope/compute-njq/api/images/:id  → { image: { id, name, status } }
      def show
        return unless authorize!("compute_njq:image_get")

        handle_api_call { { image: compute_service.find_image_status(params.require(:id)) } }
      end
    end
  end
end
