module MonsoonOpenstackAuth
  module Authorization
    class SecurityViolation < StandardError
      attr_reader :user, :action, :resource, :policy_rules, :involved_roles

      def initialize(user, action, resource, policy)
        @policy       = policy
        @user         = user
        @action       = action
        @resource     = resource
        if action and policy
          @policy_rules = action.is_a?(Array) ? action.collect{|r| policy.rules.get(r)} : policy.rules.get(action)
          @involved_roles = @policy_rules.collect{|r| r.involved_roles}.flatten rescue []
        end
      end

      def message
        action = @action.is_a?(Array) ? @action.join(', ') : @action
        resource_name = if @resource && (!@resource.respond_to?(:keys) or @resource.keys.length>0)
          @resource.to_s
        else
          nil
        end
        
        "#{@user.nil? ? 'User' : @user.name} is not authorized for action #{action}#{" on resource: #{resource_name}" if resource_name}."
      end
    end
    
    class PolicyFileNotFound < StandardError; end
    class PolicyParseError < StandardError; end
    
    class RuleExecutionError < StandardError
      def initialize(rule,locals,params,origin_error=nil)
        @rule = rule
        @locals = locals
        @params = @params
        @origin_error = origin_error
      end
      
      def message
        m = "\"#{@rule.name}\":\"#{@rule.rule}\" \n"
        m += "parsed rule: #{@rule.parsed_rule} \n"
        m += "required_locals: #{@rule.required_locals} \n"
        m += "required_params: #{@rule.required_params} \n"
        m += "given locals: #{@locals} \n"
        m += "given params: #{@params} \n"
        
        if @origin_error
          m += @origin_error.message
          # m += @origin_error.backtrace.join("\n")
        end
        m += "\n"
        m
      end
    end
  end
end