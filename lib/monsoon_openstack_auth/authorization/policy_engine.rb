require 'json'
require 'singleton'

module MonsoonOpenstackAuth
  module Authorization
    class PolicyEngine

      DEFAULT_RULE_NAME = 'default'

      def initialize(policy_hash)
        @rules = RulesContainer.new
        @js_rules = {}
        @required_locals = []
        parse_rules(policy_hash)
      end

      def policy(current_user)
        Policy.new(@rules, current_user, @js_rules)
      end

      protected

      def parse_rules(policy_hash)
        begin
          policy_hash.each do |name, rule|
            parsed_rule = Rule.parse(policy_hash,@rules, name, rule)
            @rules.add(name, parsed_rule)
            @js_rules[name] = parsed_rule.js_parsed_rule
            @required_locals += parsed_rule.required_locals
          end

        rescue => e
          raise PolicyParseError.new("Could not parse policy json #{e}")
        end

        @required_locals = @required_locals.uniq
        unsupported_locals = (@required_locals.uniq - Policy::LOCALS.keys)
        # policy contains unsupported variable names
        if unsupported_locals.length > 0
          raise PolicyParseError.new("Policy contains unsupported variable names #{unsupported_locals}")
        end

      end

      class RulesContainer
        def initialize
          @hash = Hash.new
        end

        def add(name, rule)
          @hash[name]=rule
        end

        def get(name)
          # Return default rule unless the requested rule name is presented.
          # Default rule can be defined in policy file or the default rule from Rule is used.
          # The Rule.default_rule returns false on execute.
          (@hash[name] || @hash[DEFAULT_RULE_NAME] || Rule.default_rule)
        end

        delegate :each, :keys, :size, to: :@hash
      end

      class Policy

        attr_reader :user, :rules

        LOCALS = {
            'roles' => lambda { |current_user| current_user.role_names },
            'domain_id' => lambda { |current_user| current_user.domain_id },
            'domain_name' => lambda { |current_user| current_user.domain_name },
            'is_admin' => lambda { |current_user| false }, # we don't support admin tokens that bypass authorization checks
            'project_id' => lambda { |current_user| current_user.project_id },
            'project_domain_id' => lambda { |current_user| current_user.project_domain_id },
            'user_id' => lambda { |current_user| current_user.id },
            'token.is_admin_project' => lambda { |current_user| current_user.is_admin_project_token? }
        }

        class << self
          def locals(current_user)
            result = {}
            LOCALS.each { |name, proc| result[name]=proc.call(current_user) }
            result
          end
        end

        def initialize(rules, current_user,js_rules=nil)
          @rules = rules
          @js_rules = js_rules
          @user = current_user
          @locals = Policy.locals(@user)
        end

        def involved_roles(rule_names)
          policy_rules = if rule_names.is_a?(Array)
                           rule_names.collect { |name| rules.get(name) }
                         else
                           [rules.get(rule_names)]
                         end
          policy_rules.collect(&:involved_roles).flatten
        end

        def to_js
          unless @js_policy
            @js_policy = {
              rules: @js_rules,
              locals: @locals
            }.to_json
          end
          return @js_policy
        end

        def enforce_with_trace(rule_names=[], params = {})
          params = ::MonsoonOpenstackAuth::Authorization::PolicyParams.build(params)

          trace = ExecutionTrace.new

          result = true
          rule_names = [rule_names] unless rule_names.is_a?(Array)
          rule_names.each do |name|
            res = @rules.get(name).execute(@locals, params, trace)
            #res = begin @rules.get(name).execute(@locals,params,trace); rescue RuleExecutionError; false; end
            result &= res
            MonsoonOpenstackAuth.logger.info("Rule enforced [#{name}]:#{res}. Token => {:user_id => #{@locals['user_id']}, :domain_id => #{@locals['domain_id']}, :project_id => #{@locals['project_id']}}. Target =>  #{params if params}")
          end

          trace
        end

        def rules
          @rules
        end

        def enforce(rule_names=[], params = {})
          params = ::MonsoonOpenstackAuth::Authorization::PolicyParams.build(params)

          result = true
          rule_names = [rule_names] unless rule_names.is_a?(Array)
          rule_names.each do |name|
            res = @rules.get(name).execute(@locals, params)
            #res = begin @rules.get(name).execute(@locals,params); rescue RuleExecutionError; false; end
            result &= res
          end
          result
        end
      end

      class ExecutionTrace
        attr_reader :next
        attr_accessor :rule, :result, :locals, :params

        def initialize(rule=nil, result=nil)
          @rule=rule
          @result = result
          @next=[]
        end

        def root?
          @rule.nil?
        end

        def to_s(pre="\t", after="")
          out = "\033[33m#{pre}locals: #{self.locals}#{after}\033[0m"
          out += "\033[33m#{pre}params: #{(self.params||{})}#{after}\033[0m\n"
          out += to_s_recursive(self, pre, after)
          out
        end

        def print
          MonsoonOpenstackAuth.logger.info "" "
                                           \n\033[33m===============RULE TRACE=============\033[0m
            \n#{self.to_s("\t", "\n")}
                                           \n\033[33m=================================\033[0m
          " ""
        end

        protected
        def to_s_recursive(trace, pre, after, level=0)
          prefix = ""
          level.times { prefix+=pre }
          out = "\033[33m#{prefix}#{trace.rule.name}: #{trace.rule.rule} -> #{trace.result}#{after}\033[0m" if trace.rule
          trace.next.each { |t| out += to_s_recursive(t, pre, after, level+1) }
          out
        end
      end

      class Rule
        attr_reader :name, :rule, :parsed_rule, :required_locals, :required_params, :resolved_rule, :involved_roles, :js_parsed_rule

        class << self
          def parse(policy_hash,all_rules, name, rule)

            ############ normalize rule ############
            # replace %(text)s with params["text"]
            parsed_rule = rule.gsub(/%\(/, 'params["').gsub(/\)s/, '"]')

            # replace "(" and ")" with " ( " and " ) "
            parsed_rule.gsub!(/\s*(?<bracket>\(|\))\s*/, ' \k<bracket> ')
            # replace "or" and "and" with " or " and " and "
            parsed_rule.gsub!(/\s+(?<operator>or|\bor\b|and|\band\b)\s+/i, ' \k<operator> ')
            # remove spaces betwenn ":" and text
            parsed_rule.gsub!(/\s*(?<colon>:)\s*/, '\k<colon>')
            ############# end #############

            # replace params["param1.param2.param3"] with (params["param1"].param2.param3 rescue false)
            parsed_rule.gsub!(/params\["(?<param>[^\.|\]]+)(?<attributes>(\.[^\]]+)+)"\]/, 'params["\k<param>"]\k<attributes>')
            # replace params["param"] with params["param".to_sym]
            parsed_rule.gsub!(/params\["(?<param>[^\]]+)"\]/, 'params["\k<param>".to_sym]')
            # replace "True" and "@" and empty rule with "true"
            parsed_rule.gsub!(/^$/, 'true')
            parsed_rule.gsub!(/True|@/i, 'true')
            # replace "False" and "!" with "false"
            parsed_rule.gsub!(/False|!/i, 'false')

            #********* save rules which name's contain ":"
            # replace rule:part1:part2:partn with rule:part1<->part2<->part3
            parsed_rule.gsub!(/rule:([^\s]+)/) { |m| "rule:#{$1.gsub(/\:/, '<->')}" }

            # replace rule:name with @rules["name"].execute(locals,params)
            parsed_rule.gsub!(/rule:(?<rule>[^\s]+)/, '@rules.get("\k<rule>").execute(locals,params,trace)')
            # replace role:name with locals["roles"].include?("name")
            parsed_rule.gsub!(/role:(?<role>[^\s]+)/, 'locals["roles"].include?("\k<role>")')
            # replace name:value with (locals["name"]=="value" rescue false)
            parsed_rule.gsub!(/(?<key>[^\s|:]+):(?<value>[^\s]+)/, '(begin; locals["\k<key>"]==\k<value>; rescue; false; end)')

            #********* recover rules
            # replace <-> with :
            parsed_rule.gsub!("<->", ":")

            js_parsed_rule = parse_js(parsed_rule)

            self.new(policy_hash,all_rules, name, rule, parsed_rule, js_parsed_rule)
          end

          def default_rule
            @default_rule ||= self.new(nil, 'default_rule', '!', 'false')
          end

          protected

          def parse_js(parsed_rule)
            js_rule = parsed_rule.gsub(/@rules\.get\((?<rule>[^\)]+)\)\.execute\([^\)]+\)/,'rules[\k<rule>](rules,locals,params)')
            js_rule.gsub!(/locals\["roles"\]\.include\?\((?<role>[^\)]+)\)/,'locals["roles"].indexOf(\k<role>)>=0')
            js_rule.gsub!(/begin;(?<expresion>[^;]+);\s*rescue;(?<rescue>[^;]+);\s*end/, 'function(){try { return \k<expresion>;} catch(e){ return \k<rescue>;} }() ')
            js_rule.gsub!(/\.to_sym/,'')
            js_rule.gsub!(/\sor\s/,' || ')
            js_rule.gsub!(/\sand\s/,' && ')
            js_rule.gsub!(/not\s*/,'!')
            js_rule.gsub!(/nil/,'null')
            js_rule.gsub!(/\?/,'')
            "(function(rules,locals,params){ return #{js_rule} })"
          end

        end

        def initialize(policy_hash,all_rules, name, rule, parsed_rule,js_parsed_rule=nil)
          @policy_hash = policy_hash
          @name = name
          @rules = all_rules
          @rule = rule
          @parsed_rule = parsed_rule
          @js_parsed_rule = js_parsed_rule
          @resolved_rule = resolve_rule_dependencies(name)
          @involved_roles = @resolved_rule.scan(/role:([^\s]+)/).uniq rescue []
          @required_locals = extract_required_locals
          @required_params = extract_required_params
          @executable = eval("lambda {|locals={},params={},trace=nil| #{@parsed_rule} }")
        end

        def resolve_rule_dependencies(name)
          begin
            return "" if name=='cloud_admin'
            rule = @policy_hash[name]
            return "" unless rule
            depended_rules = rule.scan(/rule:(?<name>[^\s|\)]+)/).flatten
            depended_rules.each{|name| rule = rule.gsub(/rule:#{name}/, "( #{resolve_rule_dependencies(name)} ) ") }
            return rule
          rescue => e
            ""
          end
        end


        def to_s
          "name: #{@name} \nrule: #{@rule} \nparsed rule: #{@parsed_rule}"
        end

        def execute(locals, params, trace=nil)
          begin
            # add to trace if given
            next_trace = ExecutionTrace.new

            if trace
              if trace.root?
                trace.rule = self
                next_trace=trace
              else
                next_trace.rule=self
                trace.next << next_trace
              end
            end

            result = @executable.call(locals, params, next_trace)

            if trace
              next_trace.locals=locals
              next_trace.params=params
              next_trace.result=result
            end

            return result

              # catch no method error and raise rule execution error
          rescue NoMethodError => nme
            raise RuleExecutionError.new(self, locals, params, nme)
              #return false
              # catch name error and raise rule execution error
          rescue NameError => ne
            raise RuleExecutionError.new(self, locals, params, nme)
              #return false
              # catch rule execution error from nested rules and raise it up to next
          rescue RuleExecutionError => ree
            raise ree
              #return false
              # catch other exceptions and raise rule execution error
          rescue NameError => ne
            raise RuleExecutionError.new(self, locals, params, nme)
            #return false
          end
        end

        protected

        def extract_required_locals
          @parsed_rule.scan(/locals\["([^\]]+)"\]/).flatten
        end

        def extract_required_params
          @parsed_rule.scan(/params\["([^"]+)".to_sym\]/).flatten
        end
      end
    end
  end
end
