module MonsoonOpenstackAuth
  module Authentication
    class AuthSession
      attr_reader :session_store, :user

      class << self
        TWO_FACTOR_AUTHENTICATION = 'two_factor_authentication'

        def load_user_from_session(controller, scope_and_options = {})
          session = AuthSession.new(controller, token_store(controller), scope_and_options)
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

          token_store = token_store(controller)
          session = AuthSession.new(controller, token_store, scope_and_options)

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
          options ||= options
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

          session = AuthSession.new(controller, token_store(controller), scope)
          session.login_form_user(username, password)
        end

        # create user from auth token and authenticate
        def create_from_auth_token(controller, auth_token)
          # reset session-id for Session Fixation
          reset_session(controller)
          session = AuthSession.new(controller, token_store(controller))
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

        # clear session_store if request session is presented
        def logout(controller, domain)
          token_store = token_store(controller)
          if token_store
            if domain
              token_store.delete_all_by_user_domain(domain)
            else
              token_store.delete_all_tokens
            end
          end
          reset_session(controller)
        end

        def reset_session(controller)
          token_store = token_store(controller)
          return unless token_store

          dump = token_store.dump
          controller.send('reset_session')
          token_store.restore(dump)
        end

        def session_id_presented?(controller)
          # not controller.request.session_options[:id].blank?
          return false unless controller.request.session.respond_to?(:id)

          !(controller.request.session.blank? && controller.request.session.id.blank?)
        end

        def token_store(controller)
          # return nil if request session id isn't provided
          return nil unless session_id_presented?(controller)

          # return session store
          TokenStore.new(controller.session)
        end

        # check if cookie for two factor authentication is valid
        def two_factor_cookie_valid?(controller)
          return false unless controller.request.cookies[TWO_FACTOR_AUTHENTICATION]

          crypt = ActiveSupport::MessageEncryptor.new(Rails.application.secrets.secret_key_base[0..31])
          value = begin
            crypt.decrypt_and_verify(controller.request.cookies[TWO_FACTOR_AUTHENTICATION])
          rescue StandardError
            nil
          end
          value == 'valid'
        end

        # set cookie for two factor authentication
        def set_two_factor_cookie(controller)
          crypt = ActiveSupport::MessageEncryptor.new(Rails.application.secrets.secret_key_base[0..31])
          value = crypt.encrypt_and_sign('valid')
          controller.response.set_cookie(TWO_FACTOR_AUTHENTICATION,
                                         { value: value, expires: Time.now + 4.hours, path: '/', domain: '.cloud.sap' })
        end
      end

      def initialize(controller, token_store, scope = {})
        @controller = controller
        @token_store = token_store
        @scope = scope

        # get api client
        @api_client = MonsoonOpenstackAuth.api_client
        @debug = MonsoonOpenstackAuth.configuration.debug?
      end

      def authenticated?
        return true if validate_session_token
        return true if validate_auth_token
        return true if validate_access_key
        return true if validate_sso_certificate

        true if validate_http_basic
      end

      def rescope_token(requested_scope = @scope)
        return unless @token_store and !@scope.empty? # and @session_store.token_valid? and !@scope.empty?

        token = current_valid_token
        return unless token

        # token = @session_store.token
        domain =  token[:domain]
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
          save_in_token_store(token)
        rescue StandardError => e
          unless scope == 'unscoped'
            raise MonsoonOpenstackAuth::Authentication::NotAuthorized.new("User has no access to the requested scope: #{e}")
          end

          scope = nil
          retry
        end
      end

      def validate_auth_token
        # return false if not allowed.
        unless MonsoonOpenstackAuth.configuration.token_auth_allowed?
          MonsoonOpenstackAuth.logger.info 'validate_auth_token -> not allowed.' if @debug
          return false
        end

        # didn't return -> token auth is allowed!
        auth_token = @controller.request.headers['HTTP_X_AUTH_TOKEN']

        unless auth_token
          MonsoonOpenstackAuth.logger.info 'validate_auth_token -> auth token not presented.' if @debug
          return false
        end

        # didn't return -> auth token is presented
        if @token_store
          token = @token_store.find_by_value(auth_token)
          # if token exists create user
          create_user_from_token(token) if token

          if logged_in?
            if @debug
              MonsoonOpenstackAuth.logger.info 'validate_auth_token -> successful (session token is equal to auth token).'
            end
            return true
          end
        end

        # didn't return -> validate auth token
        begin
          token = @api_client.validate_token(auth_token)
          if token
            # token is valid -> create user from token and save token in session store
            create_user_from_token(token)
            save_in_token_store(token)

            if logged_in?
              MonsoonOpenstackAuth.logger.info("validate_auth_token -> successful (username=#{@user.name}).") if @debug
              return true
            end
          end
          # rescue Excon::Errors::Unauthorized, Fog::Identity::OpenStack::NotFound => e
          # MonsoonOpenstackAuth.logger.error "token validation failed #{e}."
          # end
        rescue StandardError => e
          class_name = e.class.name
          if class_name.start_with?('Excon') or class_name.start_with?('Fog')
            MonsoonOpenstackAuth.logger.error "token validation failed #{e}."
          else
            MonsoonOpenstackAuth.logger.error "unknown error #{e}."
            raise e
          end
        end

        MonsoonOpenstackAuth.logger.info 'validate_auth_token -> failed.' if @debug
        false
      end

      def validate_http_basic
        # return false if not allowed.
        unless MonsoonOpenstackAuth.configuration.basic_auth_allowed?
          MonsoonOpenstackAuth.logger.info 'validate_http_basic -> not allowed.' if @debug
          return false
        end

        # basic auth is allowed
        begin
          basic_auth_presented = false
          user = nil
          @controller.authenticate_with_http_basic do |username, password|
            # basic auth is presented
            basic_auth_presented = true
            MonsoonOpenstackAuth.logger.info "validate_http_basic -> username=#{username}." if @debug
            token = @api_client.authenticate_with_credentials(username, password)
            create_user_from_token(token)
            save_in_token_store(token)
          end

          unless basic_auth_presented
            MonsoonOpenstackAuth.logger.info 'validate_http_basic -> basic auth header not presented.' if @debug
            return false
          end

          if logged_in?
            MonsoonOpenstackAuth.logger.info "validate_http_basic -> successful (username=#{@user.name})." if @debug
            return true
          end
        rescue StandardError => e
          MonsoonOpenstackAuth.logger.info "basic auth failed: #{e}."
        end
        # basic auth authentication failed
        MonsoonOpenstackAuth.logger.info 'validate_http_basic -> failed.' if @debug
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

        # # evaluate auth scope
        # if @scope[:project]
        #   scope= if @scope[:domain]
        #            {project: {domain:{id: @scope[:domain]},id: @scope[:project]}}
        #          elsif @scope[:domain_name]
        #            {project: {domain:{name: @scope[:domain_name]},id: @scope[:project]}}
        #          end
        # elsif @scope[:domain]
        #   scope = {domain:{id: @scope[:domain]}}
        # elsif @scope[:domain_name]
        #   scope = {domain:{name:@scope[:domain_name]}}
        # else
        #   scope = 'unscoped'
        # end
        scope = 'unscoped'

        # authenticate user as external user
        begin
          token = @api_client.authenticate_external_user(headers, scope)
          # create user from token and save token in session store
          create_user_from_token(token)
          save_in_token_store(token)
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

      def validate_session_token
        unless @token_store
          MonsoonOpenstackAuth.logger.info 'validate_session_token -> token store not presented.' if @debug
          return false
        end

        token = current_valid_token

        if token
          create_user_from_token(token)
          if logged_in?
            MonsoonOpenstackAuth.logger.info "validate_session_token -> successful (username=#{@user.name})." if @debug
            return true
          end
        end

        MonsoonOpenstackAuth.logger.info 'validate_session_token -> failed.' if @debug
        false
      end

      def validate_access_key
        unless MonsoonOpenstackAuth.configuration.access_key_auth_allowed?
          MonsoonOpenstackAuth.logger.info 'validate_access_key -> not allowed.' if @debug
          return false
        end

        user = nil

        access_key = params[:access_key] || params[:rails_auth_token]
        if access_key
          token = @api_client.authenticate_with_access_key(access_key)
          return false unless token

          create_user_from_token(token)
          save_in_token_store(token)

          if logged_in?
            MonsoonOpenstackAuth.logger.info "validate_access_key -> successful (username=#{@user.name})." if @debug
            return true
          end

        end
        false
      end

      def save_in_token_store(token)
        @token_store.set_token(token) if @token_store
      end

      def current_valid_token
        return nil unless @scope

        @token_store.current_token(@scope[:domain] || @scope[:domain_name]) if @token_store
      end

      def create_user_from_token(token)
        @user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token)
      end

      def logged_in?
        !user.nil?
      end

      ############ LOGIN FORM FUCNTIONALITY ##################
      def login_form_user(username, password)
        unless @token_store
          MonsoonOpenstackAuth.logger.info 'login_form_user -> token store not presented.' if @debug
          return false
        end

        begin
          # create auth token
          token = @api_client.authenticate_with_credentials(username, password, @scope)
          # save token in session
          save_in_token_store(token)
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
        unless @token_store
          MonsoonOpenstackAuth.logger.info 'login_auth_token -> token store not presented.' if @debug
          return false
        end

        return false unless auth_token
        begin
          # create auth token
          token = @api_client.authenticate_with_token(auth_token)
          # save token in session
          save_in_token_store(token)
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
