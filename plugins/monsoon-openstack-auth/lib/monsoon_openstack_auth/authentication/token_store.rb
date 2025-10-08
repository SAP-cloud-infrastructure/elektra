module MonsoonOpenstackAuth
  module Authentication
    class TokenStore
      @@store_mutex = Mutex.new
      @@tokens_mutex = Mutex.new

      SESSION_NAME = :monsoon_openstack_auth_token

      def initialize(session)
        @session = session
        @@store_mutex.synchronize do
          @session[SESSION_NAME] ||= {}
          @session[SESSION_NAME][:tokens] ||= {}
          @session[SESSION_NAME][:current_token_values] ||= {}
          @tokens = @session[SESSION_NAME][:tokens]
          @current_token_values = @session[SESSION_NAME][:current_token_values]
        end
      end

      def dump
        @session[SESSION_NAME]
      end

      def restore(dump)
        @@store_mutex.synchronize do
          @session[SESSION_NAME] = dump
        end
      end

      def delete_all_tokens
        @tokens = @session[SESSION_NAME][:tokens] = {}
        @current_token_values = @session[SESSION_NAME][:current_token_values] = {}
      end

      def current_token(domain)
        value = @current_token_values[domain]
        return nil unless value
        token = find_by_value(value)
        if token and !token_valid?(token)
          delete_token(token) and return nil
        end
        token
      end

      def set_token(token)
        token = HashWithIndifferentAccess.new(token) unless token.is_a?(HashWithIndifferentAccess)
        key = token["value"]
        user_domain = token.fetch("user",{}).fetch("domain",{})
        @current_token_values[user_domain["id"]] = @current_token_values[user_domain["name"]] = key
        # if token with this auth token value is presented do nothin and return the token
        return token if find_by_value(key)

        scope = if token["project"]
          {domain_id: token["project"]["domain"]["id"], project_id: token["project"]["id"]}
        elsif token["domain"]
          {domain_id: token["domain"]["id"]}
        else
          nil
        end
        existing_token = find_by_scope(scope)

        @@tokens_mutex.synchronize do
          if existing_token
            @tokens.delete(existing_token["value"])
          end
          @tokens[key]=token
        end
      end

      def find_all_by_user_domain(domain)
        @tokens.values.select do |token|
          user_domain = token.fetch("user",{}).fetch("domain",{})
          user_domain["id"]==domain or user_domain["name"]==domain
        end
      end

      def delete_all_by_user_domain(domain)
        tokens = find_all_by_user_domain(domain)
        tokens.each{|token| delete_token(token)}
      end

      def find_by_scope(scope={})
        scope={domain_id:nil,domain_name:nil,project_id:nil,project_name:nil} unless scope
        found_token = nil
        @tokens.values.each do |token|
          if scope[:project_id]
            if token["project"] and token["project"]["id"]==scope[:project_id]
              found_token = token
            end
          elsif scope[:project_name]
            if token["project"]
              if token["project"]["name"]==scope[:project_name]
                if token["project"]["domain"]["id"]==scope[:domain_id] or token["project"]["domain"]["name"]==scope[:domain_name]
                  found_token = token
                end
              end
            end
          elsif scope[:domain_name]
            if token["domain"]
              if token["domain"]["name"]==scope[:domain_name]
                found_token = token
              end
            end
          elsif scope[:domain_id]
            if token["domain"]
              if token["domain"]["id"]==scope[:domain_id]
                found_token = token
              end
            end
          else
            if token["project"].nil? and token["domain"].nil?
              found_token = token
            end
          end
        end

        if found_token and !token_valid?(found_token)
          delete_token(found_token) and return nil
        end

        return found_token
      end

      def find_by_value(auth_token)
        found_token = @tokens[auth_token]
        if found_token and !token_valid?(found_token)
          delete_token(found_token) and return nil
        end
        return found_token
      end

      def token_valid?(token)
        token[:expires_at] and DateTime.parse(token[:expires_at]) > Time.now
      end

      def delete_token(token)
        @@tokens_mutex.synchronize do
          @tokens.delete(token[:value])
        end
      end
    end
  end
end
