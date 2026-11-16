# frozen_string_literal: true

module ComputeNjq
  module Api
    class InstancesController < Api::BaseController
      # GET /:scope/compute-njq/api/instances
      # Returns the aggregated instance list (Nova + Neutron + Glance), already
      # shaped for the UI by the InstanceAssembler.
      def index
        handle_api_call do
          { instances: compute_service.list_instances(filter_params) }
        end
      end

      # GET /:scope/compute-njq/api/instances/:id
      def show
        handle_api_call do
          { instance: compute_service.find_instance(params.require(:id)) }
        end
      end

      # POST /:scope/compute-njq/api/instances
      def create
        handle_api_call { { instance: compute_service.create_instance(create_params) } }
      end

      private

      # Only the filters the UI actually offers are accepted.
      def filter_params
        params.permit(:name, :status).to_h.symbolize_keys.reject { |_, v| v.blank? }
      end

      def create_params
        params.permit(
          :name, :flavor_id, :image_id, :keypair, :availability_zone, :network_id, :user_data,
          security_groups: [],
        ).to_h.stringify_keys
      end
    end
  end
end
