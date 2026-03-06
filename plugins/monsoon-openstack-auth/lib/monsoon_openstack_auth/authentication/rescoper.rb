module MonsoonOpenstackAuth
  module Authentication
    class Rescoper
      def initialize(api_client, token_validator, scope, debug)
        @api_client = api_client
        @token_validator = token_validator
        @scope = scope
        @debug = debug
      end

      def rescope_token(requested_scope = @scope)
        return unless @token_validator.current_token and !@scope.empty?

        token = @token_validator.current_token
        return unless token && @token_validator.token_valid?(token)

        domain =  token[:domain]
        project = token[:project]

        if requested_scope[:project]
          return if project && project['id'] == requested_scope[:project]

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
          @token_validator.create_user_from_token(token)
          @token_validator.cache_token(token)
        rescue StandardError => e
          unless scope == 'unscoped'
            raise MonsoonOpenstackAuth::Authentication::NotAuthorized.new("User has no access to the requested scope: #{e}")
          end

          scope = nil
          retry
        end
      end
    end
  end
end
