module MonsoonOpenstackAuth
  module Authentication
    class TokenValidator
      attr_reader :token, :user

      def initialize(api_client, controller, scope, debug)
        @api_client = api_client
        @controller = controller
        @scope = scope
        @debug = debug
      end

      def validate_session_token
        return true if @token && token_valid?(@token)

        # Try to get token from HTTP header or session
        auth_token_value = @controller.request.headers['HTTP_X_AUTH_TOKEN'] ||
                           @controller.session[:auth_token_value]

        unless auth_token_value
          MonsoonOpenstackAuth.logger.info 'validate_session_token -> auth token not presented.' if @debug
          return false
        end

        # didn't return -> validate auth token
        begin
          token = @api_client.validate_token(auth_token_value)
          if token
            # token is valid -> create user from token and save token in session store
            create_user_from_token(token)
            cache_token(token)

            if logged_in?
              MonsoonOpenstackAuth.logger.info("validate_auth_token -> successful (username=#{@user.name}).") if @debug
              return true
            end
          end
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
          cache_token(token)

          if logged_in?
            MonsoonOpenstackAuth.logger.info "validate_access_key -> successful (username=#{@user.name})." if @debug
            return true
          end

        end
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
          cache_token(token)
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

      def cache_token(new_token)
        @token = new_token
        # Store token value in session for cookie-based sessions
        @controller.session[:auth_token_value] = new_token[:value] if new_token
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

      private

      def params
        @controller.params
      end
    end
  end
end
