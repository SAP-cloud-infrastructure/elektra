# frozen_string_literal: true

require_dependency 'monsoon_openstack_auth/application_controller'

module MonsoonOpenstackAuth
  # Password sync handler.
  #
  # Lets a user whose password was rotated (per company policy) synchronize the
  # new password to the backend. Validating the credentials against Keystone
  # triggers the sync as a side effect; this controller never creates a session.
  #
  # The flow is intentionally separate from the login form so that it stays
  # available even when password login is disabled (SSO-only regions).
  class PasswordSyncController < ActionController::Base
    before_action :load_params

    # Throttle to limit brute-force / Keystone load. Each submit performs up to
    # two Keystone calls, so keep the window small.
    rate_limit to: 5, within: 1.minute, only: :create,
               with: -> { render_rate_limited }

    def new
      # Renders the sync form (see view). No session side effects.
    end

    def create
      result = MonsoonOpenstackAuth::Authentication::PasswordSync.new.call(@user_id, @password)

      case result.status
      when MonsoonOpenstackAuth::Authentication::PasswordSync::SUCCESS
        @synced = true
        flash.now[:notice] = result.message
      when MonsoonOpenstackAuth::Authentication::PasswordSync::SERVICE_UNAVAILABLE
        @service_unavailable = true
        flash.now[:alert] = result.message
      else # INVALID_CREDENTIALS
        @error = result.message
        flash.now[:alert] = result.message
      end

      render action: :new
    end

    private

    def load_params
      @user_id = params[:username].to_s.strip
      @password = params[:password].to_s
    end

    def render_rate_limited
      @service_unavailable = true
      flash.now[:alert] = 'Too many attempts. Please wait a moment and try again.'
      render action: :new, status: :too_many_requests
    end
  end
end
