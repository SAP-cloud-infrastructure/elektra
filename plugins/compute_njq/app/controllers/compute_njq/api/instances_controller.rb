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

      # POST /:scope/compute-njq/api/instances/:id/action
      # Generic lifecycle action. The service whitelists action_name and maps it
      # to the Nova server-action body.
      def action
        handle_api_call do
          compute_service.instance_action(params.require(:id), params.require(:action_name))
        end
      end

      # DELETE /:scope/compute-njq/api/instances/:id  (terminate)
      def destroy
        handle_api_call { compute_service.terminate_instance(params.require(:id)) }
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

      def create_params
        params.require(:instance).permit(
          :name, :flavor_id, :image_id, :keypair, :availability_zone, :network_id, :user_data,
          :custom_root_disk, :custom_root_disk_size,
          security_groups: [],
        ).to_h.stringify_keys
      end
    end
  end
end
