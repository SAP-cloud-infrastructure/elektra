module MonsoonOpenstackAuth
  module Authorization
    class UserAuthorizer
      def initialize(user)
        @user = user
        @policy = nil
      end

      def is_allowed?(actions, params = {})
        unless params.is_a? Hash
          params_hash = Hash.new
          params_hash[params.class.name.downcase.to_sym] = params
        else
          params_hash = params
        end
        policy = load_policy
        result = if MonsoonOpenstackAuth.configuration.authorization.trace_enabled
                   policy_trace = policy.enforce_with_trace(actions, params_hash)
                   policy_trace.print
                   policy_trace.result
                 else
                   policy.enforce(actions, params_hash)
                 end
        return result
      end

      def required_roles(rules)
        load_policy.involved_roles(rules)
      end

      private

      def load_policy
        @policy ||= MonsoonOpenstackAuth.policy_engine.policy(@user)
      end
    end
  end
end
