# frozen_string_literal: true

require_dependency 'monsoon_openstack_auth/application_controller'

module MonsoonOpenstackAuth
  # Sessions Handler
  class SessionsController < ActionController::Base
    before_action :load_auth_params, except: %i[destroy consume_auth_token]

    def new
      unless MonsoonOpenstackAuth.configuration.form_auth_allowed?
        redirect_to main_app.root_path, alert: 'Not allowed!'
        return
      end

      MonsoonOpenstackAuth::Authentication::AuthSession.logout(
        self, (@domain_id || @domain_name)
      )

      @keystone_endpoint = keystone_tokens_url
    end

    def consume_auth_token
      domain_fid = params[:domain_fid]
      domain_id = params[:domain_id]

      # Determine the URL to redirect the user after login
      after_login_url = if safe_redirect_url?(params[:after_login]) 
        params[:after_login]
      else 
        # default after login url
        main_app.root_url(domain_id: domain_id)
      end

      auth_token = params[:auth_token]
      auth_token = decode_auth_token(auth_token) if request.get?
      # Attempt to create an authentication session using the provided token
      auth_session = MonsoonOpenstackAuth::Authentication::AuthSession.create_from_auth_token(self, auth_token)

      if auth_session.nil? || !auth_session.logged_in?
        redirect_to new_session_path(domain_fid: domain_fid, domain_id: domain_id), alert: 'Invalid token.' and return
      else
        redirect_to after_login_url
      end
    end

    def create
      unless MonsoonOpenstackAuth.configuration.form_auth_allowed?
        redirect_to main_app.root_path, alert: 'Not allowed!'
        return
      end

      if MonsoonOpenstackAuth.configuration.enforce_natural_user
        # Define the default pattern for natural user names
        default_name_pattern = /\A[DCIdci]\d*\z/

        # Check if a custom pattern for natural user names is configured
        matches = if MonsoonOpenstackAuth.configuration.natural_user_name_pattern
                    begin
                      @username =~ MonsoonOpenstackAuth.configuration.natural_user_name_pattern
                    rescue RegexpError
                      false # Handle invalid regex errors gracefully
                    end
                  end

        # Ensure the username matches either the default or configured pattern
        unless matches || @username =~ default_name_pattern
          @error = 'Only natural users are allowed to login to the dashboard!'
          flash.now[:alert] = @error
          render action: :new
          return
        end
      end
      # Determine the URL to redirect the user after login
      after_login_url = if safe_redirect_url?(params[:after_login])
        params[:after_login]
      else
        main_app.root_url(domain_id: @domain_id || @domain_name)
      end

      # When password_session_auth_allowed is false, call create_from_login_form to validate
      # credentials (and trigger password sync if applicable), but redirect back to login
      # instead of proceeding.
      unless MonsoonOpenstackAuth.configuration.password_session_auth_allowed?
        begin
          auth_session = MonsoonOpenstackAuth::Authentication::AuthSession
                         .create_from_login_form(
                           self, @username, @password,
                           domain_id: @domain_id, domain_name: @domain_name
                         )

          if auth_session
            MonsoonOpenstackAuth::Authentication::AuthSession.logout(self, @domain_id || @domain_name)
            flash.now[:notice] = if params[:password_sync]
                                   'Password validation successful. Please use Single Sign-On to access the dashboard.'
                                 else
                                   'Password login is disabled. Please use Single Sign-On to access the dashboard.'
                                 end
            render action: :new
          else
            @error = 'Invalid username/password combination.'
            flash.now[:alert] = @error
            render action: :new
          end
        rescue StandardError => e
          @error = e.message
          flash.now[:alert] = @error
          render action: :new
        end
        return
      end

      # Normal password login flow
      auth_session = MonsoonOpenstackAuth::Authentication::AuthSession
                     .create_from_login_form(
                       self, @username, @password,
                       domain_id: @domain_id, domain_name: @domain_name
                     )

      if auth_session
        if !@two_factor || MonsoonOpenstackAuth::Authentication::AuthSession.two_factor_cookie_valid?(self)
          redirect_to after_login_url
        else
          render action: :two_factor
        end
      else
        @error = 'Invalid username/password combination.'
        flash.now[:alert] = @error
        render action: :new
      end
    rescue StandardError => e
      @error = e.message
      flash.now[:alert] = @error
      render action: :new
    end

    def two_factor
      session = MonsoonOpenstackAuth::Authentication::AuthSession.load_user_from_session(
        self, domain: @domain_id, domain_name: @domain_name
      )
      @username = session.user.name if session && session.user
    end

    def check_passcode
      after_login_url = params[:after_login] || main_app.root_url(
        domain_id: @domain_id || @domain_name
      )

      @error = begin
        session = MonsoonOpenstackAuth::Authentication::AuthSession.load_user_from_session(
          self, domain: @domain_id, domain_name: @domain_name
        )

        if session.user.name != @username
          "Provided user doesn't match logged in user"
        elsif !MonsoonOpenstackAuth::Authentication::AuthSession.check_two_factor(self, @username, @passcode)
          'Invalid user or SecurID passcode.'
        else
          nil
        end
      rescue StandardError => e
        e.message
      end

      if @error
        flash.now[:alert] = @error
        render action: :two_factor
      else
        redirect_to after_login_url
      end
    end

    def destroy        
      MonsoonOpenstackAuth::Authentication::AuthSession.logout(self, params[:domain_name])
      logout_url = params[:redirect_to]
      logout_url = main_app.root_url unless safe_redirect_url?(logout_url)
      redirect_to logout_url
    end

    private

      def keystone_tokens_url
        endpoint = ENV['MONSOON_OPENSTACK_AUTH_API_PUBLIC_ENDPOINT'].presence ||
                  ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']
        return nil if endpoint.blank?

        base_uri = URI.parse(endpoint)
        # base_uri.origin already includes the scheme (e.g., "https://example.com")
        origin = base_uri.origin || "#{base_uri.scheme}://#{base_uri.host}#{":#{base_uri.port}" if base_uri.port && !standard_port?(base_uri)}"
        "#{origin.chomp('/')}/v3/auth/tokens"
      rescue URI::InvalidURIError
        nil
      end

      def standard_port?(uri)
        (uri.scheme == 'http' && uri.port == 80) || (uri.scheme == 'https' && uri.port == 443)
      end

      def load_auth_params
        @username = params[:username]
        @password = params[:password]
        @passcode = params[:passcode]
        @domain_id = params[:domain_id].presence
        @domain_name = params[:domain_name].presence || params[:domain_fid]
        @two_factor = params[:two_factor].to_s == 'true'
      end

      def decode_auth_token(encoded_token)
        @verifier = ActiveSupport::MessageVerifier.new(Rails.application.secret_key_base)
        @verifier.verify(encoded_token)
      rescue ActiveSupport::MessageVerifier::InvalidSignature
        nil # Return nil if the token is invalid
      end

      def safe_redirect_url?(url)
        return false if url.blank?
        
        begin
          uri = URI.parse(url)
          # Allow relative URLs and URLs from your domain
          uri.host.nil? || uri.host == request.host
        rescue URI::InvalidURIError
          false
        end
      end
  end
end
