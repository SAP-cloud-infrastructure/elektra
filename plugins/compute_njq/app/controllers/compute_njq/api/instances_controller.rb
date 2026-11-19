# frozen_string_literal: true

module ComputeNjq
  module Api
    class InstancesController < Api::BaseController
      # Maps the lifecycle action_name sent by the client to the policy rule
      # that gates it. Mirrors the client-side registry in instanceActions.ts:
      # the client gates the UI, this gates the request. Unknown action names
      # fall back to instance_update (the service still whitelists the action).
      ACTION_POLICY_RULES = {
        "start" => "compute_njq:instance_update",
        "stop" => "compute_njq:instance_update",
        "reboot" => "compute_njq:instance_update",
        "pause" => "compute_njq:instance_update",
        "suspend" => "compute_njq:instance_update",
        "hard_reset" => "compute_njq:instance_hard_reset",
        "lock" => "compute_njq:instance_lock",
        "unlock" => "compute_njq:instance_unlock",
      }.freeze
      DEFAULT_ACTION_POLICY_RULE = "compute_njq:instance_update"
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
        return unless authorize!("compute_njq:instance_create")

        handle_api_call { { instance: compute_service.create_instance(create_params) } }
      end

      # PATCH/PUT /:scope/compute-njq/api/instances/:id  (edit name)
      def update
        return unless authorize!("compute_njq:instance_update")

        handle_api_call { compute_service.update_instance(params.require(:id), update_params[:name]) }
      end

      # PUT /:scope/compute-njq/api/instances/:id/tags  (replace the tag set)
      def set_tags
        return unless authorize!("compute_njq:instance_tags")

        handle_api_call { compute_service.set_instance_tags(params.require(:id), tags_params) }
      end

      # POST /:scope/compute-njq/api/instances/:id/reset_status  (admin recovery)
      def reset_status
        return unless authorize!("compute_njq:instance_reset_status")

        handle_api_call { compute_service.reset_instance_status(params.require(:id), params.require(:state)) }
      end

      # PUT /:scope/compute-njq/api/instances/:id/resize  (change flavor)
      def resize
        return unless authorize!("compute_njq:instance_update")

        handle_api_call { compute_service.resize_instance(params.require(:id), params.require(:flavor_id)) }
      end

      # POST /:scope/compute-njq/api/instances/:id/action
      # Generic lifecycle action. The service whitelists action_name and maps it
      # to the Nova server-action body.
      def action
        action_name = params.require(:action_name)
        rule = ACTION_POLICY_RULES.fetch(action_name, DEFAULT_ACTION_POLICY_RULE)
        return unless authorize!(rule)

        handle_api_call do
          compute_service.instance_action(params.require(:id), action_name)
        end
      end

      # DELETE /:scope/compute-njq/api/instances/:id  (terminate)
      def destroy
        return unless authorize!("compute_njq:instance_delete")

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

      # Server-side policy gate for mutating lifecycle actions. The client-side
      # policy engine only gates the UI; a hand-crafted request would otherwise
      # reach the service unchecked. Returns true when allowed; otherwise renders
      # a 403 envelope (matching handle_api_call's shape) and returns false so
      # the caller aborts before touching the service.
      def authorize!(rule)
        return true if current_user.is_allowed?(rule, policy_target)

        render json: {
          error: "Forbidden",
          code: 403,
          message: "You are not allowed to perform this action.",
        }, status: :forbidden
        false
      end

      # The policy target for the scoped request: the domain/project the user is
      # acting in. Mirrors ScopeController's @policy_default_params target.
      def policy_target
        { target: { scoped_domain_name: @scoped_domain_name, scoped_project_name: @scoped_project_name } }
      end

      # Only the filters the UI actually offers are accepted.
      def filter_params
        params.permit(:name, :status).to_h.symbolize_keys.reject { |_, v| v.blank? }
      end

      def create_params
        params.require(:instance).permit(
          :name, :flavor_id, :image_id, :keypair, :availability_zone, :network_id, :user_data,
          :custom_root_disk, :custom_root_disk_size, :volume_type, :subnet_id, :fixed_ip,
          security_groups: [],
        ).to_h.stringify_keys
      end

      # Edit Name: only the name is mutable here.
      def update_params
        params.require(:instance).permit(:name).to_h.symbolize_keys
      end

      # Edit Tags: the full replacement tag list. Defaults to [] so an omitted
      # list clears all tags (matched by the service's empty-list handling).
      def tags_params
        params.permit(tags: []).to_h.fetch(:tags, [])
      end
    end
  end
end
