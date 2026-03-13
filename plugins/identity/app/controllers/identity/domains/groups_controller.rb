# frozen_string_literal: true

module Identity
  module Domains
    # This class implements Group actions
    class GroupsController < ::DashboardController
      before_action :check_feature_enabled

      def show
      enforce_permissions("identity:group_get", domain_id: @scoped_domain_id)
      @group = services.identity.find_group(params[:id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      @group_members = services.identity.group_members(params[:id])
    end

    def index
      enforce_permissions("identity:group_list", domain_id: @scoped_domain_id)
      @groups = services.identity.groups(domain_id: @scoped_domain_id)

      respond_to do |format|
        format.html { render :index } # or whatever to simply render html
        format.json { render json: @groups.to_json }
      end
    end

    def new_member
      @group = services.identity.find_group(params[:group_id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      enforce_permissions("identity:group_add_member", domain_id: @group.domain_id)
    end

    def add_member
      @group = services.identity.find_group(params[:group_id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      enforce_permissions("identity:group_add_member", domain_id: @group.domain_id)

      @group_members = services.identity.group_members(params[:group_id])

      @user =
        if params[:user_name].blank?
          nil
        else
          begin
            service_user
              .identity
              .users({domain_id: @scoped_domain_id, name: params[:user_name]})
              .first
          rescue StandardError
            service_user.identity.find_user(params[:user_name])
          end
        end

      if @user.nil? || @user.id.nil?
        @error = "User not found."
        render action: :new_member
      elsif @group_members.find { |user| user.id == @user.id }
        @error = "User is already a member of this domain."
        render action: :new_member
      elsif @user.domain_id != @scoped_domain_id
        @error = "User is not a member of this domain."
        render action: :new_member
      else
        services.identity.add_group_member(@group.id, @user.id)
        audit_logger.info(
          current_user,
          "has added user #{@user.name} (#{@user.id})",
          "to",
          @group,
        )
        flash[:notice] = "User '#{@user.name}' successfully added to group '#{@group.name}'."
        redirect_to domains_group_path(domain_id: @scoped_domain_id, id: @group.id)
      end
    end

    def remove_member
      @group = services.identity.find_group(params[:group_id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      enforce_permissions("identity:group_remove_member", domain_id: @group.domain_id)

      # Get user info before removing for flash message
      user_id = params[:id]
      begin
        @user = services.identity.find_user(user_id)
        user_display_name = @user&.name || user_id
      rescue
        user_display_name = user_id
      end

      services.identity.remove_group_member(@group.id, user_id)
      audit_logger.info(
        current_user,
        "has removed user #{user_id}",
        "from",
        @group,
      )
      flash[:notice] = "User '#{user_display_name}' successfully removed from group '#{@group.name}'."
      redirect_to domains_group_path(domain_id: @scoped_domain_id, id: @group.id)
    end

    def new
      enforce_permissions("identity:group_create", domain_id: @scoped_domain_id)
      @group = services.identity.new_group
    end

    def create
      enforce_permissions("identity:group_create", domain_id: @scoped_domain_id)
      @group =
        services.identity.new_group(
          params[:group].merge(domain_id: @scoped_domain_id),
        )
      if @group.save
        audit_logger.info(current_user, "has created", @group)
        flash[:notice] = "Group '#{@group.name}' successfully created."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
      else
        render action: :new
      end
    end

    def edit
      @group = services.identity.find_group(params[:id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      enforce_permissions("identity:group_update", domain_id: @group.domain_id)
    end

    def update
      @group = services.identity.find_group(params[:id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      enforce_permissions("identity:group_update", domain_id: @scoped_domain_id)

      if @group.update(params[:group])
        audit_logger.info(current_user, "has updated", @group)
        flash[:notice] = "Group '#{@group.name}' successfully updated."
        redirect_to domains_group_path(domain_id: @scoped_domain_id, id: @group.id)
      else
        render action: :edit
      end
    end

    def destroy
      @group = services.identity.find_group(params[:id])

      unless @group
        flash[:error] = "Group not found."
        redirect_to domains_groups_path(domain_id: @scoped_domain_id)
        return
      end

      enforce_permissions("identity:group_delete", domain_id: @scoped_domain_id)

      if @group.destroy
        audit_logger.info(current_user, "has deleted", @group)
        flash[:notice] = "Group successfully deleted."
      else
        flash[:error] = @group.errors.full_messages.to_sentence
      end
      redirect_to domains_groups_path(domain_id: @scoped_domain_id)
    end

    private

    def check_feature_enabled
      if @domain_config&.feature_hidden?('group_management')
        flash[:error] = "Group management is not available for this domain."
        redirect_to main_app.domain_home_path(domain_id: @scoped_domain_id)
      end
    end
  end
end
end
