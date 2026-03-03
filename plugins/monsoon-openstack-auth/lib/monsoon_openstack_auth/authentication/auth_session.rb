module MonsoonOpenstackAuth
  module Authentication
    class AuthSession
      attr_reader :session_store

      class << self
        def encryption_key
          TwoFactorAuth.encryption_key
        end

        def load_user_from_session(controller, scope_and_options = {})
          session = AuthSession.new(controller, scope_and_options)
          session.validate_session_token
          session
        end

        # check if valid token, basic auth, sso or session token is presented
        def check_authentication(controller, scope_and_options = {})
          raise_error = scope_and_options.delete(:raise_error)
          two_factor = scope_and_options.delete(:two_factor)
          # deactivate tfa unless enabled
          two_factor = false unless MonsoonOpenstackAuth.configuration.two_factor_enabled?
          # activate tfa in any case, if the header x-enable-tfa is set

          # This is a hack. After switching to SAP-ID service (OIDC) we are faced with the
          # problem that if SAP-ID (which runs in Converged Cloud) fails, we have no way
          # to log into dashboard. For this case we have created a second ingress,
          # which sets the header "x-enable-tfa" for the domain dashboard-rsa...
          # However, we use the "-snippet" annotation for this. This will be switched off soon.
          # Therefore only the last possibility remains to check the host for "dashboard-rsa".
          host = controller.request.host || ''
          if controller.request.headers['x-enable-tfa'] == 'true' || controller.request.headers['x-enable-tfa'] == true ||
             (MonsoonOpenstackAuth.configuration.rsa_dns && host.start_with?(MonsoonOpenstackAuth.configuration.rsa_dns))
            two_factor = true
          end

          session = AuthSession.new(controller, scope_and_options)

          if session.authenticated?
            if !two_factor or two_factor_cookie_valid?(controller)
              # return session if already authenticated and two factor is ok
              session
            else
              # redirect to two factor login form
              url_options = { after_login: session.after_login_url }
              url_options[:domain_fid] = controller.params[:domain_id] if controller.params[:domain_id]
              url_options[:domain_id] = scope_and_options[:domain]
              url_options[:domain_name] = scope_and_options[:domain_name]
              controller.redirect_to controller.monsoon_openstack_auth.two_factor_path(url_options)
              nil
            end
          else
            # not authenticated!
            # raise error if options contains the flag
            raise MonsoonOpenstackAuth::Authentication::NotAuthorized if raise_error

            # try to redirect to login form
            login_url = session.redirect_to_login_form_url
            # redirect to login form or root path
            if login_url
              controller.redirect_to login_url, two_factor: two_factor
            else
              controller.redirect_to(controller.main_app.root_path, notice: 'User is not authenticated!')
            end

            nil
          end
        end

        # create user from form and authenticate
        def create_from_login_form(controller, username, password, options = {})
          options ||= {}
          domain_id = options[:domain_id]
          domain_name = options[:domain_name]

          scope = if domain_id && !domain_id.empty?
                    { domain: domain_id }
                  elsif domain_name && !domain_name.empty?
                    { domain_name: domain_name }
                  else
                    nil
                  end

          # reset session-id for Session Fixation
          reset_session(controller)

          session = AuthSession.new(controller, scope)
          session.login_form_user(username, password)
        end

        # create user from auth token and authenticate
        def create_from_auth_token(controller, auth_token)
          # reset session-id for Session Fixation
          reset_session(controller)
          session = AuthSession.new(controller)
          session.login_auth_token(auth_token)
          session
        end

        def check_two_factor(controller, username, passcode)
          TwoFactorAuth.check_two_factor(controller, username, passcode)
        end

        # clear session_store if request session is presented
        def logout(controller, domain)
          reset_session(controller)
        end

        def reset_session(controller)
          # Store CSRF token before reset
          csrf_token = controller.session[:_csrf_token]

          # Full session reset (regenerates session ID)
          controller.reset_session

          # Restore CSRF token
          controller.session[:_csrf_token] = csrf_token
        end

        def session_id_presented?(controller)
          # not controller.request.session_options[:id].blank?
          return false unless controller.request.session.respond_to?(:id)

          !(controller.request.session.blank? && controller.request.session.id.blank?)
        end

        # check if cookie for two factor authentication is valid
        def two_factor_cookie_valid?(controller)
          TwoFactorAuth.two_factor_cookie_valid?(controller)
        end

        # set cookie for two factor authentication
        def set_two_factor_cookie(controller)
          TwoFactorAuth.set_two_factor_cookie(controller)
        end
      end

      def initialize(controller, scope = {})
        @controller = controller
        @scope = scope

        # get api client
        @api_client = MonsoonOpenstackAuth.api_client
        @debug = MonsoonOpenstackAuth.configuration.debug?
        @token_validator = TokenValidator.new(@api_client, @controller, @scope, @debug)
        @rescoper = Rescoper.new(@api_client, @token_validator, @scope, @debug)
      end

      def user
        @token_validator.user
      end

      def authenticated?
        return true if validate_session_token
        return true if validate_access_key
        return true if validate_sso_certificate

        false
      end

      def rescope_token(requested_scope = @scope)
        @rescoper.rescope_token(requested_scope)
      end

      def validate_session_token
        @token_validator.validate_session_token
      end

      def validate_sso_certificate
        @token_validator.validate_sso_certificate
      end

      def validate_access_key
        @token_validator.validate_access_key
      end

      def cache_token(new_token)
        @token_validator.cache_token(new_token)
      end

      def current_token
        @token_validator.current_token
      end

      def token_valid?(token)
        @token_validator.token_valid?(token)
      end

      def create_user_from_token(token)
        @token_validator.create_user_from_token(token)
      end

      def logged_in?
        !user.nil?
      end

      ############ LOGIN FORM FUCNTIONALITY ##################
      def login_form_user(username, password)
        begin
          # create auth token
          token = @api_client.authenticate_with_credentials(username, password, @scope)
          cache_token(token)
          # create auth user from token
          create_user_from_token(token)
          # success -> return true
          true
        rescue StandardError => e
          MonsoonOpenstackAuth.logger.error "login_form_user -> failed. #{e}"
          MonsoonOpenstackAuth.logger.error e.backtrace.join("\n") if @debug
          # error -> return false
          false
        end
      end

      # login with auth token
      def login_auth_token(auth_token)
        return false unless auth_token
        begin
          # create auth token
          token = @api_client.authenticate_with_token(auth_token)
          cache_token(token)
          # create auth user from token
          create_user_from_token(token)
          # success -> return true
          true
        rescue StandardError => e
          MonsoonOpenstackAuth.logger.error "login_auth_token -> failed. #{e}"
          MonsoonOpenstackAuth.logger.error e.backtrace.join("\n") if @debug
          # error -> return false
          false
        end
      end

      def after_login_url
        MonsoonOpenstackAuth.configuration.login_redirect_url || @controller.params[:after_login] || @controller.request.env['REQUEST_URI']
      end

      def redirect_to_login_form_url
        return nil unless MonsoonOpenstackAuth.configuration.form_auth_allowed?

        url_params = { after_login: after_login_url }
        # assume that current parameter domain_id of the controller is the
        # friendly id. This parameter is used as url prefix which is used as
        # session cookie path.
        url_params[:domain_fid] = @controller.params[:domain_id] if @controller.params[:domain_id]

        if @scope[:domain_name]
          @controller.monsoon_openstack_auth.login_path(url_params.merge(domain_name: @scope[:domain_name]))
        else
          @controller.monsoon_openstack_auth.new_session_path(url_params.merge(domain_id: @scope[:domain]))
        end
      end

      def params
        @controller.params
      end
    end
  end
end
