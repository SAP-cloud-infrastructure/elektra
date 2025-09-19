require "excon"

module MonsoonOpenstackAuth
  module ConnectionDriver
    class Default < MonsoonOpenstackAuth::ConnectionDriver::Interface
      class << self
        attr_accessor :api_endpoint, :ssl_verify_peer, :ssl_ca_path, :ssl_ca_file
        @@endpoint_mutex = Mutex.new
        @@conection_options_mutex = Mutex.new

        def connection_options
          return @connection_options if @connection_options

          @@conection_options_mutex.synchronize do
            @connection_options = { ssl_verify_peer: (ssl_verify_peer.nil? ? true : ssl_verify_peer) }
            @connection_options[:ssl_ca_file] = ssl_ca_file unless ssl_ca_file.nil?
            @connection_options[:ssl_ca_path] = ssl_ca_path unless ssl_ca_path.nil?
            @connection_options[:debug_request] = @connection_options[:debug_response] = MonsoonOpenstackAuth.configuration.debug_api_calls
          end

          @connection_options
        end

        def endpoint
          return @endpoint if @endpoint
          begin
            @@endpoint_mutex.synchronize do
              version = URI(api_endpoint).path.split('/')[1]
              @endpoint = URI.join(api_endpoint, "/#{version}/auth/tokens").to_s
            end
            @endpoint
          rescue => e
            Rails.logger.info("api_endpoint: #{api_endpoint}")
            raise MalformedApiEndpoint.new(e)
          end
        end
      end

      def initialize
        unless self.class.api_endpoint
          raise MonsoonOpenstackAuth::ConnectionDriver::ConfigurationError.new('No API endpoint provided!')
        end

        @connection = ::Excon.new(self.class.endpoint,self.class.connection_options)
      end

      def authenticate(auth_params, headers = {})
        if MonsoonOpenstackAuth.configuration.debug
          MonsoonOpenstackAuth.logger.info "MonsoonOpenstackAuth#authenticate, #{filter_params(auth_params)}"
        end

        headers = headers.merge({'Content-Type' => 'application/json'})
        result = @connection.post( body: auth_params.to_json, headers: headers)

        if result and result.respond_to?(:status)
          if result.status>=500
            raise MonsoonOpenstackAuth::ConnectionDriver::AuthenticationError.new(result.body,result.status)
          end
        end

        body = JSON.parse(result.body)

        unless body['token']
          message = body['error']['message'] rescue "Response does not contain token. #{body.to_s}"
          code = body['error']['code'] rescue nil
          error = MonsoonOpenstackAuth::ConnectionDriver::AuthenticationError.new(message,code)
          raise error
        end

        token = body['token']
        token['value'] = result.headers['X-Subject-Token']
        HashWithIndifferentAccess.new(token)
      end

      def validate_token(auth_token)
        cache.fetch key:auth_token,scope:nil do
          begin
            headers = {
              'Content-Type' => 'application/json',
              'X-Auth-Token' => auth_token,
              'X-Subject-Token' => auth_token
            }

            result = @connection.get( headers: headers)
            token = JSON.parse(result.body)['token']
            token['value'] = result.headers['X-Subject-Token']
            HashWithIndifferentAccess.new(token)
          rescue =>e
            MonsoonOpenstackAuth.logger.error e.to_s
            nil
          end
        end
      end

      def authenticate_with_credentials(username,password, user_domain_params=nil)
        # build auth hash
        auth = { auth: { identity: { methods: ['password'], password:{} } } }

        # Do not set scope. User may not registered yet and so no member of the domain.
        # Using scope will fail the authentication for new users.
        # build domain params. Authenticate user in given domain.
        if user_domain_params # scope is given
          domain_params = if user_domain_params[:domain]
            { domain: { id: user_domain_params[:domain] } }
          elsif user_domain_params[:domain_name]
            { domain: { name: user_domain_params[:domain_name] } }
          else
            {}
          end
          # try to authenticate with user name and password for given scope
          auth[:auth][:identity][:password] = { user:{ name: username,password: password }.merge(domain_params) }
        else # scope is nil
          # try to authenticate with user id and password
          auth[:auth][:identity][:password] = { user:{ id: username,password: password } }
        end

        # obsolete
        #auth[:auth][:scope] = domain_params if user_domain_params and user_domain_params[:scoped_token]

        if user_domain_params
          if user_domain_params[:scoped_token]==true
            auth[:auth][:scope] = domain_params
          elsif user_domain_params[:scoped_token].is_a?(Hash)
            auth[:auth][:scope] = user_domain_params[:scoped_token]
          end
        end

        # if domain name and id are the same, we do not know which one is id or name
        # so we have to try both
        result = authenticate(auth) rescue nil
        if result.nil?  
          # replace auth[:auth][:identity][:password][:user][:domain][:name] with id
          domain = auth[:auth][:identity][:password][:user][:domain]
          if domain[:name]
            domain[:id] = domain.delete(:name)
            result = authenticate(auth)
          end
        end
        return result
      end

      def authenticate_with_token(token, scope=nil)
        auth = {auth:{identity: {methods: ['token'],token:{ id: token}}}}
        auth[:auth][:scope]=scope if scope
        authenticate(auth)
      end

      def revoke_token(token)
        headers = {
          'Content-Type' => 'application/json',
          'X-Auth-Token' => token,
          'X-Subject-Token' => token
        }

        result = @connection.delete( headers: headers)
      end

      def authenticate_external_user(headers, scope=nil)
        auth = { auth: { identity: {methods: ['external'], external:{}}}}
        if scope
          auth[:auth][:scope] = scope
        else
          auth[:auth][:scope] = 'unscoped'
        end

        authenticate(auth, headers)
      end

      def authenticate_with_access_key(access_key, scope=nil)
        auth = {auth:{identity: {methods: ['access-key'],access_key:{key:access_key}}}}
        auth[:auth][:scope]=scope if scope
        authenticate(auth)
      rescue Excon::Errors::Unauthorized
      end

      protected

        def cache
          impl = MonsoonOpenstackAuth.configuration.token_cache
          impl.new
        end

        def filter_params(params,filters=[:password])
          filter = lambda do |hash,f=[:password]|
            hash.inject({}){|h,(k,v)| h[k] = v.is_a?(Hash) ? filter[v,f] : (f.include?(k.to_sym) && v.is_a?(String) ? "FILTERED" : v); h }
          end
          filter[params,filters]
        end

    end
  end
end
