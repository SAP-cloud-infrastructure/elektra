# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Maps whitelisted UI action names to the exact Nova POST /servers/{id}/action
    # body. The whitelist IS the security boundary: anything not here is rejected
    # before any backend call. Mirrors the legacy Compute::Server action methods.
    module InstanceActions
      # Straight action_name => Nova body. (start/lock/unlock need extra logic,
      # handled below; they are intentionally absent here.)
      ACTION_BODIES = {
        "stop" => { "os-stop" => nil },
        "reboot" => { "reboot" => { "type" => "SOFT" } },
        "hard_reset" => { "reboot" => { "type" => "HARD" } },
        "pause" => { "pause" => nil },
        "suspend" => { "suspend" => nil },
      }.freeze

      def instance_action(id, action_name)
        if ACTION_BODIES.key?(action_name)
          nova_server_action(id, ACTION_BODIES[action_name])
        elsif action_name == "start"
          start_instance(id)
        elsif action_name == "lock"
          nova_set_locked_metadata(id, "true")
          nova_server_action(id, { "lock" => nil })
        elsif action_name == "unlock"
          nova_server_action(id, { "unlock" => nil })
          nova_set_locked_metadata(id, "false")
        else
          raise ComputeNjq::RequestError, "Unknown instance action: #{action_name}"
        end
        { ok: true }
      end

      def terminate_instance(id)
        nova_delete_server(id)
        { ok: true }
      end

      private

      # "Start" means different Nova verbs depending on how the server is parked,
      # matching the legacy Compute::Server#start branch.
      def start_instance(id)
        status = (nova_server(id)["status"] || "").downcase
        body =
          case status
          when "paused" then { "unpause" => nil }
          when "suspended" then { "resume" => nil }
          else { "os-start" => nil }
          end
        nova_server_action(id, body)
      end
    end
  end
end
