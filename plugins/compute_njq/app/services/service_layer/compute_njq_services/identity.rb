# frozen_string_literal: true

module ServiceLayer
  module ComputeNjqServices
    # Keystone (identity) access, implemented independently of the identity
    # plugin. Only the slice the instance detail needs (resolving a project id
    # to a display name) lives here.
    module Identity
      # Resolves a project id to its name, or nil when it cannot be looked up.
      # The legacy Project row shows the name (and, cross-project, the id too);
      # this returns the raw name and the caller decides on presentation.
      def identity_project(id)
        return nil if id.blank?

        elektron_identity.get("projects/#{id}").body["project"]
      rescue Elektron::Errors::ApiResponse
        nil
      end
    end
  end
end
