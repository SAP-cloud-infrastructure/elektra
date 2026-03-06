require 'strscan'

module MonsoonOpenstackAuth
  module Authorization
    # SafeRuleParser replaces the use of eval() for parsing and executing OpenStack
    # policy rules. It implements a tokenizer, AST builder, and evaluator that only
    # support whitelisted operations.
    #
    # Supported syntax:
    #   role:name          - checks if role is in user's roles
    #   rule:name          - delegates to another named rule
    #   key:value          - compares a local variable to a value (e.g., domain_id:%(domain.id)s)
    #   and / or / not     - boolean operators
    #   ( )                - grouping
    #   @ / True / ""      - always true
    #   ! / False          - always false
    class SafeRuleParser
      class ParseError < StandardError; end

      # Token types produced by the tokenizer
      TOKEN_TYPES = %i[
        role rule param_ref local_compare equality_compare standalone_param
        and or not
        lparen rparen
        true false
      ].freeze

      Token = Struct.new(:type, :value, keyword_init: true)

      # -- Tokenizer ----------------------------------------------------------

      def self.tokenize(rule_string)
        tokens = []
        scanner = StringScanner.new(rule_string.strip)

        until scanner.eos?
          scanner.skip(/\s+/)
          break if scanner.eos?

          if scanner.scan(/\(/)
            tokens << Token.new(type: :lparen, value: '(')
          elsif scanner.scan(/\)/)
            tokens << Token.new(type: :rparen, value: ')')
          elsif scanner.scan(/\bnot\b/i)
            tokens << Token.new(type: :not, value: 'not')
          elsif scanner.scan(/\band\b/i)
            tokens << Token.new(type: :and, value: 'and')
          elsif scanner.scan(/\bor\b/i)
            tokens << Token.new(type: :or, value: 'or')
          elsif scanner.scan(/\bTrue\b/i) || scanner.scan(/@/)
            tokens << Token.new(type: :true, value: 'true')
          elsif scanner.scan(/\bFalse\b/i) || scanner.scan(/!/)
            tokens << Token.new(type: :false, value: 'false')
          elsif scanner.scan(/role:\s*([^\s()]+)/)
            tokens << Token.new(type: :role, value: scanner[1])
          elsif scanner.scan(/rule:\s*([^\s()]+)/)
            tokens << Token.new(type: :rule, value: scanner[1])
          elsif scanner.scan(/(%\([a-zA-Z0-9_.?]+\)s)(==|!=)('([^']*)'|"([^"]*)"|[a-zA-Z0-9_.]+|nil)/)
            # Handle %(param)s==value or %(param)s!=value
            # This is Ruby-style equality comparison (non-standard OpenStack syntax)
            # Supports: ==nil, ==value, =='quoted', =="quoted"
            param_ref = scanner[1].match(/%\(([^)]+)\)s/)[1]
            operator = scanner[2]
            literal = scanner[3]
            # Strip quotes if present
            literal = literal[1..-2] if literal.start_with?("'", '"')
            tokens << Token.new(type: :equality_compare, value: { param: param_ref, operator: operator, literal: literal })
          elsif scanner.scan(/('([^']*)'|"([^"]*)"|[a-zA-Z0-9_.]+|nil)(==|!=)(%\([a-zA-Z0-9_.?]+\)s)/)
            # Handle value==%(param)s or value!=%(param)s (reversed order)
            literal = scanner[1]
            # Strip quotes if present
            literal = literal[1..-2] if literal.start_with?("'", '"')
            operator = scanner[4]
            param_ref = scanner[5].match(/%\(([^)]+)\)s/)[1]
            tokens << Token.new(type: :equality_compare, value: { param: param_ref, operator: operator, literal: literal })
          elsif scanner.scan(/(%\([a-zA-Z0-9_.?]+\)s)/)
            # Standalone param reference like %(flavor.public?)s used as a boolean
            param_ref = scanner[1].match(/%\(([^)]+)\)s/)[1]
            tokens << Token.new(type: :standalone_param, value: param_ref)
          elsif scanner.scan(/([a-zA-Z_][a-zA-Z0-9_.?]*):(%\([a-zA-Z0-9_.?]+\)s)/)
            # local:%(param)s  e.g., domain_id:%(domain.id)s
            local_name = scanner[1]
            param_ref = scanner[2].match(/%\(([^)]+)\)s/)[1]
            tokens << Token.new(type: :local_compare, value: { local: local_name, param: param_ref })
          elsif scanner.scan(/([a-zA-Z_][a-zA-Z0-9_.?]*):([^\s()]+)/)
            # local:literal_value  e.g., domain_id:default
            local_name = scanner[1]
            literal = scanner[2]
            tokens << Token.new(type: :local_compare, value: { local: local_name, literal: literal })
          else
            remaining = scanner.rest
            raise ParseError, "Unexpected token at: #{remaining[0..20]}"
          end
        end

        tokens
      end

      # -- AST Nodes -----------------------------------------------------------

      module AST
        LiteralTrue   = Struct.new(:type) { def initialize; super(:true); end }
        LiteralFalse  = Struct.new(:type) { def initialize; super(:false); end }
        RoleCheck     = Struct.new(:role_name, keyword_init: true)
        RuleRef       = Struct.new(:rule_name, keyword_init: true)
        LocalCompare  = Struct.new(:local_name, :param_path, :literal_value, keyword_init: true)
        EqualityCompare = Struct.new(:param_path, :operator, :literal_value, keyword_init: true)
        StandaloneParam = Struct.new(:param_path, keyword_init: true)
        AndNode       = Struct.new(:left, :right, keyword_init: true)
        OrNode        = Struct.new(:left, :right, keyword_init: true)
        NotNode       = Struct.new(:operand, keyword_init: true)
      end

      # -- Parser (recursive descent) -----------------------------------------
      # Grammar:
      #   expression  := or_expr
      #   or_expr     := and_expr ('or' and_expr)*
      #   and_expr    := not_expr ('and' not_expr)*
      #   not_expr    := 'not' not_expr | primary
      #   primary     := '(' expression ')' | role | rule | local_compare | true | false

      class Parser
        def initialize(tokens)
          @tokens = tokens
          @pos = 0
        end

        def parse
          return AST::LiteralTrue.new if @tokens.empty?
          node = parse_or_expr
          unless @pos >= @tokens.length
            raise ParseError, "Unexpected token after end of expression: #{current_token.inspect}"
          end
          node
        end

        private

        def current_token
          @tokens[@pos]
        end

        def consume(expected_type = nil)
          tok = current_token
          if expected_type && (tok.nil? || tok.type != expected_type)
            raise ParseError, "Expected #{expected_type}, got #{tok&.type || 'EOF'}"
          end
          @pos += 1
          tok
        end

        def peek_type
          current_token&.type
        end

        def parse_or_expr
          left = parse_and_expr
          while peek_type == :or
            consume(:or)
            right = parse_and_expr
            left = AST::OrNode.new(left: left, right: right)
          end
          left
        end

        def parse_and_expr
          left = parse_not_expr
          while peek_type == :and
            consume(:and)
            right = parse_not_expr
            left = AST::AndNode.new(left: left, right: right)
          end
          left
        end

        def parse_not_expr
          if peek_type == :not
            consume(:not)
            operand = parse_not_expr
            return AST::NotNode.new(operand: operand)
          end
          parse_primary
        end

        def parse_primary
          case peek_type
          when :lparen
            consume(:lparen)
            node = parse_or_expr
            consume(:rparen)
            node
          when :role
            tok = consume(:role)
            AST::RoleCheck.new(role_name: tok.value)
          when :rule
            tok = consume(:rule)
            AST::RuleRef.new(rule_name: tok.value)
          when :local_compare
            tok = consume(:local_compare)
            v = tok.value
            if v[:param]
              AST::LocalCompare.new(local_name: v[:local], param_path: v[:param], literal_value: nil)
            else
              AST::LocalCompare.new(local_name: v[:local], param_path: nil, literal_value: v[:literal])
            end
          when :equality_compare
            tok = consume(:equality_compare)
            v = tok.value
            AST::EqualityCompare.new(param_path: v[:param], operator: v[:operator], literal_value: v[:literal])
          when :standalone_param
            tok = consume(:standalone_param)
            AST::StandaloneParam.new(param_path: tok.value)
          when :true
            consume(:true)
            AST::LiteralTrue.new
          when :false
            consume(:false)
            AST::LiteralFalse.new
          when nil
            raise ParseError, "Unexpected end of expression"
          else
            raise ParseError, "Unexpected token: #{current_token.inspect}"
          end
        end
      end

      # -- Evaluator -----------------------------------------------------------

      def self.build(rule_string)
        tokens = tokenize(rule_string)
        ast = Parser.new(tokens).parse
        ast
      end

      # Evaluates an AST node given locals, params, rules container, and optional trace.
      def self.evaluate(node, locals, params, rules, trace = nil)
        case node
        when AST::LiteralTrue
          true
        when AST::LiteralFalse
          false
        when AST::RoleCheck
          roles = locals["roles"]
          roles.is_a?(Array) && roles.include?(node.role_name)
        when AST::RuleRef
          rules.get(node.rule_name).execute(locals, params, trace)
        when AST::LocalCompare
          local_val = locals[node.local_name]
          compare_val = if node.param_path
                          resolve_param_path(node.param_path, params)
                        else
                          node.literal_value
                        end
          begin
            # If comparing against a param path that couldn't be resolved (nil),
            # treat as false to match OpenStack policy semantics (missing params = deny).
            return false if node.param_path && compare_val.nil?
            local_val == compare_val
          rescue
            false
          end
        when AST::EqualityCompare
          # Handle %(param)s==value or %(param)s!=value syntax
          param_val = resolve_param_path(node.param_path, params)
          literal_val = (node.literal_value == 'nil') ? nil : node.literal_value
          begin
            if node.operator == '=='
              param_val == literal_val
            elsif node.operator == '!='
              param_val != literal_val
            else
              false
            end
          rescue
            false
          end
        when AST::StandaloneParam
          # Handle standalone %(param)s used as a boolean value
          param_val = resolve_param_path(node.param_path, params)
          # Convert to boolean: truthy values are true, falsy are false
          !!param_val
        when AST::AndNode
          evaluate(node.left, locals, params, rules, trace) &&
            evaluate(node.right, locals, params, rules, trace)
        when AST::OrNode
          evaluate(node.left, locals, params, rules, trace) ||
            evaluate(node.right, locals, params, rules, trace)
        when AST::NotNode
          !evaluate(node.operand, locals, params, rules, trace)
        else
          raise ParseError, "Unknown AST node: #{node.class}"
        end
      end

      # Resolves a dotted param path like "domain.id" against the params hash.
      # params are keyed by symbols after PolicyParams.build converts them.
      def self.resolve_param_path(path, params)
        parts = path.split('.')
        current = params[parts.first.to_sym]
        parts[1..-1].each do |part|
          return nil if current.nil?
          current = if current.respond_to?(part.to_sym)
                      current.send(part.to_sym)
                    elsif current.respond_to?(:[])
                      current[part.to_sym]
                    else
                      nil
                    end
        end
        current
      end

      # Extracts required local variable names from the AST.
      def self.extract_locals(node)
        case node
        when AST::LiteralTrue, AST::LiteralFalse
          []
        when AST::RoleCheck
          ['roles']
        when AST::RuleRef
          []
        when AST::LocalCompare
          [node.local_name]
        when AST::AndNode
          extract_locals(node.left) + extract_locals(node.right)
        when AST::OrNode
          extract_locals(node.left) + extract_locals(node.right)
        when AST::NotNode
          extract_locals(node.operand)
        else
          []
        end
      end

      # Extracts required param names from the AST.
      def self.extract_params(node)
        case node
        when AST::LocalCompare
          node.param_path ? [node.param_path] : []
        when AST::EqualityCompare
          [node.param_path]
        when AST::StandaloneParam
          [node.param_path]
        when AST::AndNode
          extract_params(node.left) + extract_params(node.right)
        when AST::OrNode
          extract_params(node.left) + extract_params(node.right)
        when AST::NotNode
          extract_params(node.operand)
        else
          []
        end
      end
    end
  end
end
