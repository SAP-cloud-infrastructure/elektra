# frozen_string_literal: true

module MonsoonOpenstackAuth
  # Sessions Handler
  class SessionsController < ActionController::Base
    layout 'login'

    before_action :load_auth_params, except: %i[destroy consume_auth_token]

    def new
      unless MonsoonOpenstackAuth.configuration.form_auth_allowed?
        redirect_to root_path, alert: 'Not allowed!'
        return
      end

      MonsoonOpenstackAuth::Authentication::AuthSession.logout(
        self, (@domain_id || @domain_name)
      )
    end

    def consume_auth_token
      domain_id = params[:domain_id]
      # Determine the URL to redirect the user after login
      after_login_url = safe_redirect_url(params[:after_login]) || root_url(domain_id: domain_id)
  

      auth_token = params[:auth_token]
      auth_token = decode_auth_token(auth_token) if request.get?
      # Attempt to create an authentication session using the provided token
      auth_session = MonsoonOpenstackAuth::Authentication::AuthSession.create_from_auth_token(self, auth_token)

      if auth_session.nil? || !auth_session.logged_in?
        redirect_to :new_session, alert: 'Invalid token.' and return
      else
        redirect_to after_login_url
      end
    end

    def create
      unless MonsoonOpenstackAuth.configuration.form_auth_allowed?
        redirect_to root_path, alert: 'Not allowed!'
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
      after_login_url = params[:after_login] || root_url(
        domain_id: @domain_id || @domain_name
      )

      # Attempt to create an authentication session using the provided credentials
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
      after_login_url = params[:after_login] || root_url(
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
      MonsoonOpenstackAuth::Authentication::AuthSession.logout(
        self, params[:domain_name]
      )
      logout_url = safe_redirect_url(params[:redirect_to]) || root_url
      redirect_to logout_url
    end

    private

    def load_auth_params
      @username = params[:username]
      @password = params[:password]
      @passcode = params[:passcode]
      @domain_id = params[:domain_id]
      @domain_name = params[:domain_name]
      @two_factor = params[:two_factor].to_s == 'true'
    end

    def decode_auth_token(encoded_token)
      @verifier = ActiveSupport::MessageVerifier.new(Rails.application.secret_key_base)
      @verifier.verify(encoded_token)
    rescue ActiveSupport::MessageVerifier::InvalidSignature
      nil # Return nil if the token is invalid
    end

    def safe_redirect_url(url)
      return nil if url.blank?
      
      begin
        uri = URI.parse(url)
        
        # Only allow relative URLs or URLs from the same host
        if uri.relative? || (uri.host == request.host)
          # Additional validation: ensure it's a valid path
          return url if valid_internal_path?(url)
        end
      rescue URI::InvalidURIError
        Rails.logger.warn "Invalid redirect URL attempted: #{url}"
      end
      
      nil
    end

    def valid_internal_path?(url)
      # Add your application-specific path validation
      # For example, ensure it starts with a valid route prefix
      return false unless url.start_with?('/')
      
      # Reject URLs with suspicious patterns
      return false if url.include?('..')
      return false if url.include?('//')
      
      true
    end
  end
end
