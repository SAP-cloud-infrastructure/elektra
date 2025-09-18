# frozen_string_literal: true

module ServiceLayer
  module IdentityServices
    # This module implements Openstack User API
    module User
      def user_map
        @puser_map ||= class_map_proc(Identity::User)
      end

      def users(filter = {}, **args)
        format = args[:format] 
        response = elektron_identity.get("users", filter)
        
        case format
        when :json
          response.body["users"].to_json
        when :raw
          response.body["users"]
        else
          response.map_to("body.users", &user_map)
        end
      end

      def find_user!(id, **args )
        format = args[:format] 
        response = elektron_identity.get("users/#{id}")
        case format
        when :json
          response.body["user"].to_json
        when :raw
          response.body["user"]
        else
          response.map_to("body.user", &user_map)
        end    
      end

      def find_user(id, **args)
        find_user!(id,**args)
      rescue Elektron::Errors::ApiResponse
        nil
      end

      def new_user(attributes = {})
        user_map.call(attributes)
      end

      # Users who have the role admin in ccadmin
      def list_ccadmins
        domain = domains(name: Rails.configuration.cloud_admin_domain).first
        return [] unless domain
        list_scope_admins(domain_id: domain.id)
      end

      # Users who have the role cloud_resource_admin in ccadmin/cloud_admin
      def list_cloud_resource_admins
        domain = domains(name: Rails.configuration.cloud_admin_domain).first
        return [] unless domain
        project =
          projects(
            domain_id: domain.id,
            name: Rails.configuration.cloud_admin_project,
          ).first
        return [] unless project
        list_scope_resource_admins(
          { project_id: project.id },
          "cloud_resource_admin",
        )
      end

      def list_scope_resource_admins(scope = {}, role_name = "resource_admin")
        role = find_role_by_name(role_name)
        list_scope_assigned_users(scope.merge(role: role))
      end

      # Returns admins for the given scope (e.g. project_id: PROJECT_ID,
      # domain_id: DOMAIN_ID)
      # This method looks recursively for project, parent_projects and
      # domain admins until it finds at least one.
      # It should always return a non empty list (at least the domain admins).
      def list_scope_admins(scope = {})
        role = find_role_by_name("admin")
        list_scope_assigned_users(scope.merge(role: role))
      end

      def role_assignments_to_users(ras)
        ras.each_with_object([]) do |r, array|
          next if r.user["id"] == Rails.application.config.service_user_id
          admin = find_user(r.user["id"])
          array << admin if admin
        end
      end

      # Returns assigned users for the given scope and role (e.g.
      # project_id: PROJECT_ID, domain_id: DOMAIN_ID, role: ROLE)
      # This method looks recursively for assigned users of project,
      # parent_projects and domain.
      def list_scope_assigned_users(options = {})
        admins = []
        project_id = options[:project_id]
        domain_id = options[:domain_id]
        role = options[:role]
        raise_error = options[:raise_error]

        # do nothing if role is nil
        return admins if role.nil?

        begin
          if project_id
            # get role_assignments for this project_id
            ras =
              role_assignments(
                "scope.project.id" => project_id,
                "role.id" => role.id,
                :effective => true,
                :include_subtree => true,
              )

            # load users (not very performant but there is no other option
            # to get users by ids)
            admins.concat(role_assignments_to_users(ras))

            if admins.length.zero?
              # load project
              project = find_project(project_id)
              if project
                # try to get admins recursively by parent_id
                admins =
                  list_scope_assigned_users(
                    project_id: project.parent_id,
                    role: role,
                  )
              end
            end
          elsif domain_id
            # get role_assignments for this domain_id
            ras =
              role_assignments(
                "scope.domain.id" => domain_id,
                "role.id" => role.id,
                :effective => true,
              )
            # load users
            admins.concat(role_assignments_to_users(ras))
          end
        rescue => e
          raise e if raise_error
        end

        admins.delete_if { |a| a.id.nil? } # delete crap
      end

      ############### MODEL INTERFACE ####################

      # This method is used by model.
      # It has to return the data hash.
      def create_user(attributes = {})
        elektron_identity.post("users") { { user: attributes } }.body["user"]
      end

      # This method is used by model.
      # It has to return the data hash.
      def update_user(id, attributes)
        elektron_identity.put("users/#{id}") { { user: attributes } }.body[
          "user"
        ]
      end

      # This method is used by model.
      def delete_user(id)
        elektron_identity.delete("users/#{id}")
      end
    end
  end
end
