module MonsoonOpenstackAuth
  module Authentication
    class AuthSession
      attr_reader :user

      class << self
        TWO_FACTOR_AUTHENTICATION = 'two_factor_authentication'

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

            # If SSO enforcement is on and a valid certificate was presented but Keystone rejected the user,
            # raise NotAuthorized so the caller can show a 403 instead of redirecting to the login form
            if MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso? &&
               session.certificate_valid_but_no_keystone_permissions?(controller)
              raise MonsoonOpenstackAuth::Authentication::NotAuthorized.new(
                "Valid certificate authentication but no OpenStack domain/project access"
              )
            end

            # raise error if options contains the flag
            raise MonsoonOpenstackAuth::Authentication::NotAuthenticated if raise_error

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
          if MonsoonOpenstackAuth.configuration.two_factor_authentication_method.call(username, passcode)
            set_two_factor_cookie(controller)
            true
          else
            false
          end
        end

        # clear session if request session is presented
        def logout(controller, domain)
          delete_cross_dashboard_cookie(controller)
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
          return false unless controller.request.cookies[TWO_FACTOR_AUTHENTICATION]

          crypt = ActiveSupport::MessageEncryptor.new(Rails.application.secret_key_base[0..31])
          value = begin
            crypt.decrypt_and_verify(controller.request.cookies[TWO_FACTOR_AUTHENTICATION])
          rescue StandardError
            nil
          end
          value == 'valid'
        end

        # set cookie for two factor authentication
        def set_two_factor_cookie(controller)
          crypt = ActiveSupport::MessageEncryptor.new(Rails.application.secret_key_base[0..31])
          value = crypt.encrypt_and_sign('valid')
          controller.response.set_cookie(TWO_FACTOR_AUTHENTICATION,
                                         {
                                           value: value,
                                           expires: Time.now + 4.hours,
                                           path: '/',
                                           domain: '.cloud.sap',
                                           secure: Rails.env.production?,
                                           httponly: true,
                                           same_site: :lax
                                         })
        end

        # Set cross-dashboard auth token cookie for SSO
        # This cookie enables authentication between Elektra and Aurora with wildcard domain
        def set_cross_dashboard_cookie(controller, token)
          return unless token && token[:value]

          cookie_name = Rails.configuration.cross_dashboard_cookie_name

          # Extract global domain (e.g., ".qa-de-1.cloud.sap" from "dashboard.qa-de-1.cloud.sap")
          host = controller.request.host
          parts = host.split('.')
          global_domain = if parts.length > 2
                            ".#{parts[-3..-1].join('.')}"  # Returns ".qa-de-1.cloud.sap"
                          else
                            ".#{host}"  # Fallback to current host
                          end

          # Calculate expiry from token
          expires = if token[:expires_at]
                      DateTime.parse(token[:expires_at])
                    else
                      Time.now + 24.hours  # Fallback expiry
                    end

          # Set the cross-dashboard auth token cookie (unencoded)
          controller.response.set_cookie(cookie_name,
                                         {
                                           value: token[:value],
                                           expires: expires,
                                           path: '/',
                                           domain: global_domain,
                                           secure: Rails.env.production?,
                                           httponly: true,
                                           same_site: :lax
                                         })
        end

        # Delete cross-dashboard auth token cookie on logout
        def delete_cross_dashboard_cookie(controller)
          cookie_name = Rails.configuration.cross_dashboard_cookie_name

          # Extract global domain
          host = controller.request.host
          parts = host.split('.')
          global_domain = if parts.length > 2
                            ".#{parts[-3..-1].join('.')}"
                          else
                            ".#{host}"
                          end

          # Delete the cookie by setting it with past expiry
          controller.response.set_cookie(cookie_name,
                                         {
                                           value: '',
                                           expires: 1.year.ago,
                                           path: '/',
                                           domain: global_domain
                                         })
        end
      end

      def initialize(controller, scope = {})
        @controller = controller
        @scope = scope

        # get api client
        @api_client = MonsoonOpenstackAuth.api_client
        @debug = MonsoonOpenstackAuth.configuration.debug?
      end

      def authenticated?
        return true if validate_session_token
        return true if validate_access_key
        return true if validate_sso_certificate

        false
      end

      def rescope_token(requested_scope = @scope)
        return unless current_token and !@scope.empty?

        token = current_token
        return unless token && token_valid?(token)

        domain = token[:domain]
        project = token[:project]

        if requested_scope[:project]
          return if project && project['id'] == requested_scope[:project]

          # scope= {project: {domain:{id: @scope[:domain]},id: @scope[:project]}}
          scope = if requested_scope[:domain]
                    { project: { domain: { id: requested_scope[:domain] }, id: requested_scope[:project] } }
                  elsif requested_scope[:domain_name]
                    { project: { domain: { name: requested_scope[:domain_name] }, id: requested_scope[:project] } }
                  end
        elsif requested_scope[:domain]
          return if domain && domain['id'] == requested_scope[:domain] && (project.nil? or project['id'].nil?)

          scope = { domain: { id: requested_scope[:domain] } }
        elsif requested_scope[:domain_name]
          return if domain && domain['name'] == requested_scope[:domain_name] && (project.nil? or project['id'].nil?)

          scope = { domain: { name: requested_scope[:domain_name] } }
        else

          # scope is empty -> no domain and project provided
          # return if token scope is also empty
          return if domain.nil? and project.nil?

          # did not return -> get new unscoped token
          scope = 'unscoped'
        end

        begin
          MonsoonOpenstackAuth.logger.info 'rescope token.' if @debug
          # scope has changed -> get new scoped token
          token = @api_client.authenticate_with_token(token[:value], scope)
          create_user_from_token(token)
          cache_token(token, update_cross_dashboard_cookie: true)
        rescue StandardError => e
          unless scope == 'unscoped'
            raise MonsoonOpenstackAuth::Authentication::NotAuthorized.new("User has no access to the requested scope: #{e}")
          end

          scope = nil
          retry
        end
      end

      def validate_session_token
        return true if @token && token_valid?(@token)

        # Try to get token from session first (fast path), then cross-dashboard cookie, then HTTP header
        session_token = @controller.session[:auth_token_value]
        cross_dashboard_token = read_cross_dashboard_cookie
        auth_token_value = session_token || cross_dashboard_token || @controller.request.headers['HTTP_X_AUTH_TOKEN']

        unless auth_token_value
          MonsoonOpenstackAuth.logger.info 'validate_session_token -> auth token not presented.' if @debug
          return false
        end

        # Track which token source was used
        token_source = if session_token && auth_token_value == session_token
                         :session
                       elsif cross_dashboard_token && auth_token_value == cross_dashboard_token
                         :cross_dashboard_cookie
                       else
                         :http_header
                       end

        # Validate auth token and check domain match
        begin
          token = @api_client.validate_token(auth_token_value)

          if token
            # Check if token's domain matches the requested scope
            unless token_domain_matches_scope_domain?(token)
              MonsoonOpenstackAuth.logger.info "Token scope mismatch (source: #{token_source}), rejecting token." if @debug

              # If the mismatched token came from cross-dashboard cookie, delete it
              # This prevents repeated authentication failures with stale cookies
              if token_source == :cross_dashboard_cookie
                MonsoonOpenstackAuth.logger.info 'Deleting stale cross-dashboard cookie due to scope mismatch.' if @debug
                self.class.delete_cross_dashboard_cookie(@controller)
              end

              return false
            end

            # token is valid and domain matches -> create user from token and save token in session store
            create_user_from_token(token)

            # Only update cross-dashboard cookie if the token value is different from what's already in the cookie
            should_update_cookie = session_token.present? && session_token != cross_dashboard_token
            cache_token(token, update_cross_dashboard_cookie: should_update_cookie)

            if logged_in?
              MonsoonOpenstackAuth.logger.info("validate_auth_token -> successful (username=#{@user.name}).") if @debug
              return true
            end
          else
            # Token validation returned nil - token is expired, invalid, or doesn't exist
            # Clear the stale token from session/cookie to force re-authentication
            MonsoonOpenstackAuth.logger.info "Token validation failed (token is nil), clearing stale tokens (source: #{token_source})." if @debug

            if token_source == :session || (token_source == :cross_dashboard_cookie && session_token == cross_dashboard_token)
              # Clear session token if it's the source or if it matches the failed cross-dashboard token
              @controller.session[:auth_token_value] = nil
            end

            if token_source == :cross_dashboard_cookie
              # Delete cross-dashboard cookie
              self.class.delete_cross_dashboard_cookie(@controller)
            end
          end
          # rescue Excon::Errors::Unauthorized, Fog::Identity::OpenStack::NotFound => e
          # MonsoonOpenstackAuth.logger.error "token validation failed #{e}."
          # end
        rescue StandardError => e
          class_name = e.class.name
          if class_name.start_with?('Excon', 'Fog')
            MonsoonOpenstackAuth.logger.error "token validation failed (exception: #{e}), clearing stale tokens (source: #{token_source})."

            # Clear stale tokens on validation failure
            if token_source == :session || (token_source == :cross_dashboard_cookie && session_token == cross_dashboard_token)
              @controller.session[:auth_token_value] = nil
            end

            if token_source == :cross_dashboard_cookie
              self.class.delete_cross_dashboard_cookie(@controller)
            end
          else
            MonsoonOpenstackAuth.logger.error "unknown error #{e}."
            raise e
          end
        end

        MonsoonOpenstackAuth.logger.info 'validate_auth_token -> failed.' if @debug
        false
      end

      def validate_sso_certificate
        headers = {}

        # return false if not allowed.
        unless MonsoonOpenstackAuth.configuration.sso_auth_allowed?
          MonsoonOpenstackAuth.logger.info 'validate_sso_certificate -> not allowed.' if @debug
          return false
        end

        # return false if invalid sso certificate.
        unless @controller.request.env['HTTP_SSL_CLIENT_VERIFY'] == 'SUCCESS'
          MonsoonOpenstackAuth.logger.info 'validate_sso_certificate -> certificate has not been verified.' if @debug
          return false
        end
        headers['SSL-Client-Verify'] = @controller.request.env['HTTP_SSL_CLIENT_VERIFY']

        # get x509 certificate
        certificate = @controller.request.env['HTTP_SSL_CLIENT_CERT']
        # return false if no certificate given.
        if certificate.nil? or certificate.empty?
          MonsoonOpenstackAuth.logger.info 'validate_sso_certificate -> certificate is missing.' if @debug
          return false
        end
        headers['SSL-Client-Cert'] = @controller.request.env['HTTP_SSL_CLIENT_CERT']

        # set user domain request headers
        if @scope[:domain_name]
          headers['X-User-Domain-Name'] = @scope[:domain_name]
        elsif @scope[:domain]
          headers['X-User-Domain-Id'] = @scope[:domain]
        end
        scope = 'unscoped'

        # authenticate user as external user
        begin
          token = @api_client.authenticate_external_user(headers, scope)
          # create user from token and save token in session store
          create_user_from_token(token)
          cache_token(token, update_cross_dashboard_cookie: true)
        rescue StandardError => e
          MonsoonOpenstackAuth.logger.error "external user authentication failed #{e}."
        end

        if logged_in?
          MonsoonOpenstackAuth.logger.info "validate_sso_certificate -> successful (username=#{@user.name})." if @debug
          return true
        end

        MonsoonOpenstackAuth.logger.info 'validate_sso_certificate -> failed.' if @debug
        false
      end

      def validate_access_key
        unless MonsoonOpenstackAuth.configuration.access_key_auth_allowed?
          MonsoonOpenstackAuth.logger.info 'validate_access_key -> not allowed.' if @debug
          return false
        end

        access_key = params[:access_key] || params[:rails_auth_token]
        if access_key
          token = @api_client.authenticate_with_access_key(access_key)
          return false unless token

          create_user_from_token(token)
          cache_token(token, update_cross_dashboard_cookie: true)

          if logged_in?
            MonsoonOpenstackAuth.logger.info "validate_access_key -> successful (username=#{@user.name})." if @debug
            return true
          end

        end
        false
      end

      # Read cross-dashboard authentication cookie for SSO
      def read_cross_dashboard_cookie
        cookie_name = Rails.configuration.cross_dashboard_cookie_name
        @controller.request.cookies[cookie_name]
      end

      # Check if the token's scope matches the requested scope
      # Returns true if scopes match or if no scope check is needed, false otherwise
      def token_domain_matches_scope_domain?(token)
        return false unless token

        # If no scope is requested, any valid token is acceptable
        return true if @scope.empty?

        # Extract domain and project IDs from token
        token_domain_id = token.dig(:project, :domain, :id) || token.dig(:project, :domain, 'id') || token.dig(:domain, :id) || token.dig(:domain, 'id')
        token_domain_name = token.dig(:project, :domain, :name) || token.dig(:project, :domain, 'name') || token.dig(:domain, :name) || token.dig(:domain, 'name')
        token_project_id = token.dig(:project, :id) || token.dig(:project, 'id')

        # If scope requests a specific project, check both project and domain
        if @scope[:project]
          # Project must match
          return false unless token_project_id == @scope[:project]

          # Domain must also match if specified
          if @scope[:domain]
            return token_domain_id == @scope[:domain]
          elsif @scope[:domain_name]
            return token_domain_name == @scope[:domain_name]
          end

          # Project matches and no domain specified in scope -> accept
          return true
        end

        # If scope requests a domain (without project), check domain
        if @scope[:domain]
          return token_domain_id == @scope[:domain]
        elsif @scope[:domain_name]
          return token_domain_name == @scope[:domain_name]
        end

        # If token has a domain but scope doesn't specify one -> mismatch
        if token_domain_id.present? || token_domain_name.present?
          return false
        end

        # No specific scope requirements, accept the token
        true
      rescue StandardError => e
        MonsoonOpenstackAuth.logger.error "Failed to check token scope match: #{e}" if @debug
        false  # On error, reject the token
      end

      def cache_token(new_token, update_cross_dashboard_cookie: true)
        @token = new_token
        # Store token value in session for cookie-based sessions
        @controller.session[:auth_token_value] = new_token[:value] if new_token
        # Only update cross-dashboard cookie on initial login, not on rescope
        self.class.set_cross_dashboard_cookie(@controller, new_token) if new_token && update_cross_dashboard_cookie
      end

      def current_token
        @token
      end

      def token_valid?(token)
        return false unless token
        !!token[:expires_at] && DateTime.parse(token[:expires_at]) > Time.now
      end

      def create_user_from_token(token)
        @user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token)
      end

      def logged_in?
        !user.nil?
      end

      ############ LOGIN FORM FUCNTIONALITY ##################
      def login_form_user(username, password)
        begin
          # create auth token
          token = @api_client.authenticate_with_credentials(username, password, @scope)
          cache_token(token, update_cross_dashboard_cookie: true)
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
          cache_token(token, update_cross_dashboard_cookie: true)
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

      # Returns true when a valid SSL client certificate was presented (HTTP_SSL_CLIENT_VERIFY == SUCCESS)
      # but the user is not authenticated in Elektra (no Keystone role assignments).
      #
      # @param controller [ActionController::Base]
      # @return [Boolean]
      def certificate_valid_but_no_keystone_permissions?(controller)
        return false unless MonsoonOpenstackAuth.configuration.sso_auth_allowed?
        return false unless controller.request.env['HTTP_SSL_CLIENT_VERIFY'] == 'SUCCESS'

        certificate = controller.request.env['HTTP_SSL_CLIENT_CERT']
        return false if certificate.nil? || certificate.empty?

        true
      end
    end
  end
end
