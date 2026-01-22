# frozen_string_literal: true

module Identity
  module Domains
    # User actions
    class UsersController < DashboardController
      def index
        enforce_permissions("identity:user_list", domain_id: @scoped_domain_id)
        @users = services.identity.users({domain_id: @scoped_domain_id})

        respond_to do |format|
          format.html { render :index } # or whatever to simply render html
          format.json { render json: @users.to_json }
        end
      end

      def enable
        enforce_permissions(
          "identity:user_update",
          domain_id: @scoped_domain_id,
        )
        @user = services.identity.new_user
        @user.id = params[:user_id]
        @user.enabled = true

        if @user.save
          flash.now[:notice] = "User #{@user.name} has been enabled!"
        else
          flash.now[:error] = "User #{@user.name} could not be enabled!"
        end

        respond_to do |format|
          format.html { redirect_to action: :index }
          format.js { render action: :update, format: :js }
        end
      end

      def disable
        enforce_permissions(
          "identity:user_update",
          domain_id: @scoped_domain_id,
        )
        @user = services.identity.new_user
        @user.id = params[:user_id]
        @user.enabled = false
        if @user.save
          flash.now[:notice] = "User #{@user.name} has been disabled!"
        else
          flash.now[:error] = "User #{@user.name} could not be disabled!"
        end

        respond_to do |format|
          format.html { redirect_to action: :index }
          format.js { render action: :update, format: :js }
        end
      end

      def show
      end
    end
  end
end
