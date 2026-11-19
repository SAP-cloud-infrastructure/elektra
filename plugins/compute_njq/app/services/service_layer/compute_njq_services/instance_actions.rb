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
        "confirm_resize" => { "confirmResize" => nil },
        "revert_resize" => { "revertResize" => nil },
      }.freeze

      # The only vm_states an admin may force via os-resetState. Any other value
      # is rejected before reaching Nova — we never forward an arbitrary state.
      RESET_STATES = %w[active error].freeze

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

      # Rename a server. Nova's PUT /servers/{id} accepts a "name" attribute;
      # we reject a blank name client-side and here rather than making a pointless
      # backend call.
      def update_instance(id, name)
        name = name.to_s.strip
        raise ComputeNjq::RequestError, "Name must not be blank" if name.empty?

        nova_update_server(id, { "name" => name })
        { ok: true }
      end

      # Replace the full tag set. Trims, drops blanks and dedupes so the UI's
      # free-text chips can't send junk; an empty list is allowed and clears all
      # tags.
      def set_instance_tags(id, tags)
        clean = Array(tags).map { |t| t.to_s.strip }.reject(&:empty?).uniq
        nova_set_server_tags(id, clean)
        { ok: true }
      end

      # Resize a server to a new flavor. Nova's os-resize takes a flavorRef; we
      # reject a blank flavor here rather than making a pointless backend call.
      def resize_instance(id, flavor_id)
        flavor_id = flavor_id.to_s.strip
        raise ComputeNjq::RequestError, "Flavor must not be blank" if flavor_id.empty?

        nova_server_action(id, { "resize" => { "flavorRef" => flavor_id } })
        { ok: true }
      end

      # Admin-only recovery: force the server's vm_state via os-resetState. Only
      # active/error are permitted; anything else is rejected before Nova.
      def reset_instance_status(id, state)
        raise ComputeNjq::RequestError, "Invalid reset state: #{state}" unless RESET_STATES.include?(state)

        nova_server_action(id, { "os-resetState" => { "state" => state } })
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
