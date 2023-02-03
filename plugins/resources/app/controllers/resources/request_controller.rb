# frozen_string_literal: true

module Resources
  class RequestController < DashboardController
    before_action :check_authorization

    # This part of plugins/resources bridges back into the "old" world of
    # plugins/resource_management by creating inquiries in the same way that
    # the old plugin does.
    # TODO move all the request handling into this plugin (and refactor towards
    # using React)

    def project
      limes_data =
        services.resources.get_project(@scoped_domain_id, @scoped_project_id)
      foreach_resource_in(
        params["project"] || {},
        limes_data,
      ) do |srv, res, new_quota|
        srv_type = srv["type"]
        area = srv["area"] || srv_type

        res_name = res["name"]
        old_quota = res["quota"]
        data_type = Core::DataType.from_unit_name(res["unit"] || "")

        base_url =
          plugin("resource_management").admin_area_path(
            area: area,
            domain_id: @scoped_domain_id,
            project_id: nil,
          )
        overlay_url =
          plugin("resource_management").admin_review_request_path(
            project_id: nil,
          )

        inquiry =
          services.inquiry.create_inquiry(
            "project_quota",
            "project #{@scoped_domain_name}/#{@scoped_project_name}: #{new_quota - old_quota >= 0 ? "add" : "reduce by"} #{data_type.format((new_quota - old_quota).abs)} #{srv_type}/#{res_name}",
            current_user,
            { service: srv_type, resource: res_name, desired_quota: new_quota },
            service_user.identity.list_scope_resource_admins(
              domain_id: @scoped_domain_id,
            ),
            {
              approved: {
                name: "Approve",
                action: "#{base_url}?overlay=#{overlay_url}",
              },
            },
            nil,
            { domain_name: @scoped_domain_name, region: current_region },
          )
        if inquiry.errors?
          render json: { errors: inquiry.errors.full_messages.join("\n") }
          return
        end
      end

      head :no_content
    end

    def domain
      cloud_admin_domain =
        cloud_admin
          .identity
          .domains(name: Rails.configuration.cloud_admin_domain)
          .first
      cloud_admin_domain_id =
        (
          if cloud_admin_domain.blank?
            Rails.configuration.cloud_admin_domain
          else
            cloud_admin_domain.id
          end
        )

      limes_data = services.resources.get_domain(@scoped_domain_id)
      foreach_resource_in(
        params["domain"] || {},
        limes_data,
      ) do |srv, res, new_quota|
        srv_type = srv["type"]
        area = srv["area"] || srv_type

        res_name = res["name"]
        old_quota = res["quota"]
        data_type = Core::DataType.from_unit_name(res["unit"] || "")

        base_url =
          plugin("resource_management").cloud_admin_area_path(
            area: area,
            domain_id: Rails.configuration.cloud_admin_domain,
            project_id: Rails.configuration.cloud_admin_project,
          )
        overlay_url =
          plugin("resource_management").cloud_admin_review_request_path(
            domain_id: Rails.configuration.cloud_admin_domain,
            project_id: Rails.configuration.cloud_admin_project,
          )

        inquiry =
          services.inquiry.create_inquiry(
            "domain_quota",
            "domain #{@scoped_domain_name}: #{new_quota - old_quota >= 0 ? "add" : "reduce by"} #{data_type.format((new_quota - old_quota).abs)} #{srv_type}/#{res_name}",
            current_user,
            { service: srv_type, resource: res_name, desired_quota: new_quota },
            cloud_admin.identity.list_cloud_resource_admins,
            {
              approved: {
                name: "Approve",
                action: "#{base_url}?overlay=#{overlay_url}",
              },
            },
            nil, #requester domain id
            { domain_name: @scoped_domain_name, region: current_region },
            cloud_admin_domain_id, #approver domain id
          )
        if inquiry.errors?
          render json: { errors: inquiry.errors.full_messages.join("\n") }
          return
        end
      end

      head :no_content
    end

    private

    def foreach_resource_in(request, limes_data, &block)
      (request["services"] || []).each do |srv_request|
        srv_type = srv_request["type"] or
          raise ArgumentError, "service type missing"
        srv = limes_data["services"].find { |s| s["type"] == srv_type }
        raise ArgumentError, "unknown service: #{srv_type}" unless srv

        (srv_request["resources"] || []).each do |res_request|
          res_name = res_request["name"] or
            raise ArgumentError, "resource name missing in #{srv_type}"
          res = srv["resources"].find { |r| r["name"] == res_name }
          unless res
            raise ArgumentError, "unknown resource: #{srv_type}/#{res_name}"
          end

          new_quota = res_request["quota"] or
            raise ArgumentError, "quota missing for #{srv_type}/#{res_name}"
          block.call(srv, res, new_quota)
        end
      end
    end

    def check_authorization
      # NOTE: If this looks odd to you, have a look at the big comment in the
      # ApplicationController.
      auth_params =
        {
          project_id: @scoped_project_id,
          domain_id: @scoped_domain_id,
        }.reject { |k, v| v.nil? }
      scope = @scoped_project_id ? "project" : "domain"
      enforce_permissions(
        "::resources:#{scope}:edit",
        { selected: auth_params },
      )
    end
  end
end
