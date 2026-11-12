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

      # GET /:scope/compute-njq/api/instances/:id/detail
      # The full instance detail (all legacy Show tabs), aggregated server-side.
      def detail
        handle_api_call do
          { instance: compute_service.find_instance_detail(params.require(:id)) }
        end
      end

      # GET /:scope/compute-njq/api/instances/:id/metrics
      # vROps / Thanos sizing recommendations + VMware guest-tools status,
      # proxied through the BFF so the React layer consumes plain JSON.
      def metrics
        handle_api_call do
          id = params.require(:id)
          {
            metrics: {
              cpu_recommendation: compute_service.thanos_cpu_recommendation(id),
              memory_recommendation: compute_service.thanos_memory_recommendation(id),
              guest_tools: compute_service.thanos_guest_tools(id),
            },
          }
        end
      end

      private

      # Only the filters the UI actually offers are accepted.
      def filter_params
        params.permit(:name, :status).to_h.symbolize_keys.reject { |_, v| v.blank? }
      end
    end
  end
end
