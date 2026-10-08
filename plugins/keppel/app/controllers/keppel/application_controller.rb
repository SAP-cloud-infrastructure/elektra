# frozen_string_literal: true

module Keppel
  class ApplicationController < DashboardController
    def show
      @can_view = current_user.is_allowed?("keppel:account:show")
      @can_edit = current_user.is_allowed?("keppel:account:edit")
      @is_admin = current_user.is_allowed?("keppel:account:admin")

      @js_data = {
        # data required to access the Keppel API
        token: current_user.token,
        keppel_api: current_user.service_url("keppel"),
        project_id: @scoped_project_id,
        # permission flags for the UI rendering
        can_edit: @can_edit,
        is_admin: @is_admin,
        has_experimental_features:
          @scoped_project_name == "cc-demo" &&
            @scoped_domain_name == "monsoon3",
        # used to display instructions for how to use the Docker CLI with Keppel
        docker_cli_username:
          "#{current_user.name}@#{current_user.user_domain_name}/#{@scoped_project_name}@#{@scoped_domain_name}",
        # used to disable swift storage links when the application uses ceph.
        uses_ceph_storage: %w[qa-de-1 eu-de-3].include?(current_region),
      }
    end
  end
end
