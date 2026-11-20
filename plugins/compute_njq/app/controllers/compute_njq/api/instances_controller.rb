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

      # POST /:scope/compute-njq/api/instances/:id/snapshot  body { snapshot: { name } }
      # Creates a Glance image (snapshot) of the server. Returns the new image id
      # so the client can poll its status until it becomes active.
      def snapshot
        return unless authorize!("compute_njq:instance_snapshot")

        handle_api_call { compute_service.create_instance_snapshot(params.require(:id), snapshot_params[:name]) }
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

      # POST /:scope/compute-njq/api/instances/:id/attach_floating_ip
      # Associate an existing FIP (floating_ip_id) or allocate a new one on an
      # external network (floating_network_id), then bind it to the port carrying
      # fixed_ip_address.
      def attach_floating_ip
        return unless authorize!("compute_njq:instance_attach_floating_ip")

        handle_api_call do
          compute_service.attach_floating_ip(
            params.require(:id),
            floating_ip_id: attach_floating_ip_params[:floating_ip_id],
            floating_network_id: attach_floating_ip_params[:floating_network_id],
            fixed_ip_address: attach_floating_ip_params[:fixed_ip_address],
          )
        end
      end

      # POST /:scope/compute-njq/api/instances/:id/detach_floating_ip
      # Disassociate the FIP identified by its address from the server.
      def detach_floating_ip
        return unless authorize!("compute_njq:instance_detach_floating_ip")

        handle_api_call do
          compute_service.detach_floating_ip(
            params.require(:id),
            floating_ip_address: detach_floating_ip_params[:floating_ip_address],
          )
        end
      end

      # POST /:scope/compute-njq/api/instances/:id/attach_interface
      # Attach a new port: body { network_id, subnet_id?, ip_address?, security_groups? }.
      def attach_interface
        return unless authorize!("compute_njq:instance_attach_interface")

        handle_api_call do
          compute_service.attach_interface(
            params.require(:id),
            network_id: attach_interface_params[:network_id],
            subnet_id: attach_interface_params[:subnet_id],
            ip_address: attach_interface_params[:ip_address],
            security_groups: Array(attach_interface_params[:security_groups]),
          )
        end
      end

      # POST /:scope/compute-njq/api/instances/:id/detach_interface
      # Detach a port identified by its fixed IP: body { fixed_ip_address }.
      def detach_interface
        return unless authorize!("compute_njq:instance_detach_interface")

        handle_api_call do
          compute_service.detach_interface(
            params.require(:id),
            fixed_ip_address: detach_interface_params[:fixed_ip_address],
          )
        end
      end

      # GET /:scope/compute-njq/api/instances/:id/attached_interfaces
      # List the server's live, detachable interfaces.
      def attached_interfaces
        handle_api_call do
          { attached_interfaces: compute_service.form_attached_interfaces(params.require(:id)) }
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

      # Only the filters the UI actually offers are accepted. The scope params
      # (domain_id/project_id) ride along on every routed request and are handled
      # by the scope controller, not here — drop them before permit so they are
      # not logged as unpermitted.
      def filter_params
        scoped_params.permit(:name, :status).to_h.symbolize_keys.reject { |_, v| v.blank? }
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

      # Snapshot: only the image name is accepted; metadata is always {} (legacy
      # parity with the name-only new_snapshot form).
      def snapshot_params
        params.require(:snapshot).permit(:name).to_h.symbolize_keys
      end

      # Attach FIP: either an existing FIP id or an external network id to
      # allocate from, plus the fixed IP the FIP binds to.
      def attach_floating_ip_params
        scoped_params.permit(:floating_ip_id, :floating_network_id, :fixed_ip_address)
      end

      # Detach FIP: the floating IP address to disassociate.
      def detach_floating_ip_params
        scoped_params.permit(:floating_ip_address)
      end

      # Attach interface: network is required; subnet, ip, security_groups are optional.
      def attach_interface_params
        scoped_params.permit(:network_id, :subnet_id, :ip_address, security_groups: [])
      end

      # Detach interface: the fixed IP address identifying the port to remove.
      def detach_interface_params
        scoped_params.permit(:fixed_ip_address)
      end

      # Edit Tags: the full replacement tag list. Defaults to [] so an omitted
      # list clears all tags (matched by the service's empty-list handling).
      def tags_params
        scoped_params.permit(tags: []).to_h.fetch(:tags, [])
      end

      # params with the ever-present scope keys (domain_id/project_id) removed.
      # These are routing/scope concerns handled by the scope controller; top-
      # level permit calls would otherwise log them as unpermitted on every
      # request.
      def scoped_params
        params.except(:domain_id, :project_id)
      end
    end
  end
end
