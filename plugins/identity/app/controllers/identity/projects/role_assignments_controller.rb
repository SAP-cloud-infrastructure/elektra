# frozen_string_literal: true

module Identity
  module Projects
    class RoleAssignmentsController < Identity::ApplicationController
      include Identity::RestrictedRoles

      def index
        respond_to do |format|
          format.html {}
          format.json do
            # use cloud admin! This is needed for users who has only the member role
            # and so can't request role assignments
            role_assignments =
              cloud_admin.identity.role_assignments(
                "scope.project.id" => params[:scope_project_id],
                :include_names => true,
              )
            render json: {
                     roles: group_and_extend_role_assignments(role_assignments),
                   }
          end
        end
      end

      def update
        scope_project_id = params[:scope_project_id]
        user_id = params[:user_id]
        group_id = params[:group_id]
        new_roles = params[:roles]
        new_role_assignments = []

        begin
          URI.parse(user_id)
        rescue URI::InvalidURIError
          render json: { errors: "Invalid user ID format do not use special characters" }
          return
        end

        # render empty list if no project id provided
        render json: { roles: [] } && return if scope_project_id.blank?

        if user_id.present?
          # try to load user.
          # render an error if user could not be found
          # Cloud admin is important for the user lookup!
          user =
            cloud_admin.identity.find_user(user_id) ||
              cloud_admin
                .identity
                .users(name: user_id, domain_id: @scoped_domain_id)
                .first
          unless user
            render json: { errors: "Could not find user with id #{user_id}" }
            return
          end
          # update user role assignments
          new_role_assignments =
            update_project_role_assignments(
              scope_project_id,
              "user",
              user.id,
              new_roles,
            )
        elsif group_id.present?
          # try to load group.
          # render an error if group could not be found
          group =
            cloud_admin.identity.find_group(group_id) ||
              cloud_admin
                .identity
                .groups(name: group_id, domain_id: @scoped_domain_id)
                .first

          unless group
            render json: { errors: "Could not find group with id #{group_id}" }
            return
          end
          new_role_assignments =
            update_project_role_assignments(
              scope_project_id,
              "group",
              group.id,
              new_roles,
            )
        end

        render json: { roles: new_role_assignments }
      end

      private

      # This method removes obsolete and assigns new roles to project.
      def update_project_role_assignments(
        scope_project_id,
        member_type,
        member_id,
        new_roles
      )
        # only user and group project role assignments are allowed
        unless %w[user group].include?(member_type)
          raise StandardError, "Unknown member type"
        end

        filter_options = {
          "scope.project.id" => scope_project_id,
          "#{member_type}.id" => member_id,
        }

        # get current project member role assignments from API
        # Cloud admin is important! If user removes himself from the
        # project role assignments, so he cant request role assignments.
        current_role_assignments =
          cloud_admin.identity.role_assignments(filter_options)

        # get role ids from current role assignments
        current_roles =
          current_role_assignments.collect do |role_assignment|
            role_assignment.role["id"]
          end

        available_role_ids = available_roles.collect(&:id)
        # calculate differences
        roles_to_be_added = new_roles - current_roles
        roles_to_be_removed = current_roles - new_roles

        # add new member roles to project
        roles_to_be_added.each do |role_id|
          next unless available_role_ids.include?(role_id)

          # important: use current user (services.) to grant new roles
          services.identity.send(
            "grant_project_#{member_type}_role!",
            scope_project_id,
            member_id,
            role_id,
          )
        end

        # remove obsolete user roles from project
        roles_to_be_removed.each do |role_id|
          next unless available_role_ids.include?(role_id)
          # important: use current user (services.) to revoke roles
          services.identity.send(
            "revoke_project_#{member_type}_role!",
            scope_project_id,
            member_id,
            role_id,
          )
        end

        # reload uproject member role assignments
        # here we can use cloud admin again.
        new_role_assignments =
          cloud_admin.identity.role_assignments(
            filter_options.merge(include_names: true),
          )

        group_and_extend_role_assignments(new_role_assignments)
      end

      # This method groups role assignments by user and group.
      # Further it extends role and member descriptions using data from cache.
      # Returns an array of maps.
      def group_and_extend_role_assignments(role_assignments)
        member_ids =
          role_assignments
            .collect { |ra| (ra.user || ra.group || {})["id"] }
            .uniq

        # get user or group descriptions from cache
        # map: id => description
        member_descriptions =
          ObjectCache
            .where(id: member_ids)
            .pluck(:id, :payload)
            .each_with_object({}) do |data, map|
              map[data[0]] = data[1]["description"]
            end

        role_assignments
          .each_with_object({}) do |ra, map|
            member_type = ""
            member_type = "user" if ra.user.present?
            member_type = "group" if ra.group.present?
            member = (ra.user || ra.group || {})

            role_name = ra.role["name"]
            # extend role description using translations
            ra.role["description"] = I18n.t(
              "roles.#{role_name}",
              default: role_name.try(:titleize),
            ) + " (#{role_name})"

            member["description"] = member_descriptions[member["id"]]
            # build the map: member id => {member, roles}
            map[member["id"]] ||= {}
            map[member["id"]][member_type] = member
            map[member["id"]]["roles"] ||= []
            map[member["id"]]["roles"] << ra.role
          end
          .values
      end
    end
  end
end
