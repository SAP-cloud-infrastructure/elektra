require 'hashie'

require 'monsoon_openstack_auth/authorization/errors'
require 'monsoon_openstack_auth/authorization/policy_engine'
require 'monsoon_openstack_auth/authorization/policy_params'

module MonsoonOpenstackAuth
  module Authorization
    extend ActiveSupport::Concern
    include ActiveSupport::Rescuable unless defined?(Rails)

    def self.security_violation_callback
      Proc.new do |exception|
        # Through the magic of `instance_exec` `ActionController::Base#rescue_from`
        # can call this proc and make `self` the actual controller instance
        # default: authorization_forbidden
        self.send(MonsoonOpenstackAuth.configuration.authorization.security_violation_handler, exception)
      end
    end

    def self.authorization_action_map
      @authorization_action_map ||= MonsoonOpenstackAuth.configuration.authorization.controller_action_map.dup
    end

    ################ NEW action-level permissions ######################
    def self.determine_rule_name(application_name, controller_name, action_name)
      authorization_action = authorization_action_map[action_name.to_sym] || action_name
      rule_name = "#{application_name}:#{controller_name.singularize}_#{authorization_action.to_s}"
    end

    # build policy relevant parameters based on controller params
    def self.build_policy_params(controller, controller_params={},options = {})
      params =  controller_params.is_a?(ActionController::Parameters) ? controller_params.to_unsafe_hash : controller_params
      policy_params             = {target: {}}
      # ignore_params             = options.fetch(:ignore_params,[:page,:per_page,:action, :controller])
      ignore_params             = options.fetch(:ignore_params,[])
      id_alias                  = options.fetch(:id_alias,'id')
      additional_policy_params  = options.fetch(:additional_policy_params,{})
      controller_name           = controller.controller_name

      # convert params to policy params
      relevant_params = params.inject({}) do |hash, name_value_pair|
        name = name_value_pair[0].to_sym
        value = name_value_pair[1]
        hash[name]=value unless ignore_params.include?(name)
        hash
      end

      relevant_params.each do |name,value|#
        # add parameter to policy_params
        policy_params[name.to_sym] = value

        name_as_string = name.to_s

        if name_as_string.end_with?("_id") or name_as_string=='id'
          class_name = if name_as_string.end_with?("_id")
            name_as_string.gsub("_id",'')
          else
            controller_name.singularize
          end

          begin
            target_name = class_name.downcase.to_sym

            # Caching: try to find already loaded object -> load from db unless found
            object = controller.instance_variable_get("@#{target_name.to_s}")
            unless object
              klazz = eval(class_name.capitalize)
              object = klazz.where(id_alias => value).first
            end

            policy_params[:target][target_name] = object if object
          rescue => e
            #puts "Authorization: could not load object #{class_name}, param name: #{name_as_string}"
          end
        end
      end

      additional_policy_params.each do |target_name, object|
        value = if object.is_a?(Proc)
          controller.instance_eval(&object)
        elsif object.is_a?(Symbol)
          if object.to_s.start_with?('@')
            controller.instance_variable_get(object.to_s) || object
          elsif controller.repond_to?(object)
            controller.send(object)
          else
            object
          end
        else
          object
        end

        policy_params[:target][target_name] = value
      end
      policy_params.delete(:target) if policy_params[:target].empty?
      policy_params
    end
    ##################### END ###########################

    included do
      extend ClassMethods
      include InstanceMethods

      helper_method :enforce_permissions, :policy

      rescue_from(MonsoonOpenstackAuth::Authorization::SecurityViolation, :with => MonsoonOpenstackAuth::Authorization.security_violation_callback)
      class_attribute :authorization_resource, :instance_reader => false
    end

    module ClassMethods

      def authorization_context(context,options={})
        prepend_before_action options do
          @authorization_context = context
        end
      end

      def skip_authorization(options={})
        prepend_before_action options do
          @_skip_authorization=true
        end
      end

      ################ NEW action-level permissions ######################
      def authorization_required(options={})
        id_alias                  = options.delete(:id_alias)
        ignore_params             = options.delete(:ignore_params)
        additional_policy_params  = options.delete(:additional_policy_params)
        context                   = options.delete(:context)

        additional_options = {}
        additional_options[:id_alias] = id_alias if id_alias
        additional_options[:ignore_params] = ignore_params if ignore_params
        additional_options[:additional_policy_params] = additional_policy_params if additional_policy_params

        before_action options.merge(unless: -> c { c.instance_variable_get("@_skip_authorization") }) do
          # get the rule_name for requested action
          application_name = context || @authorization_context || MonsoonOpenstackAuth.configuration.authorization.context
          policy_rule_name  = ::MonsoonOpenstackAuth::Authorization.determine_rule_name(application_name,controller_name,action_name)
          # build policy params (including: params and target objects like user)
          # params = {user_id: 1} -> target[:user] = User.where(id_alias=>1)
          policy_params     = ::MonsoonOpenstackAuth::Authorization.build_policy_params(self, params, additional_options) || {}

          enforce_permissions(policy_rule_name, policy_params)
        end
      end
      ################# END #####################



      # Sets up before_action to ensure user is allowed to perform a given controller action
      #
      # @param [Class OR Symbol] resource_or_finder - class whose authorizer
      # should be consulted, or instance method on the controller which will
      # determine that class when the request is made
      # @param [Hash] options - can contain :actions to
      # be merged with existing
      # ones and any other options applicable to a before_action
      # <b>DEPRECATED:</b> Please use <tt>authorization_required</tt> instead.
      def authorization_actions_for(resource_or_finder, options = {})
        self.authorization_resource = resource_or_finder
        authorization_actions(overridden_actions(options))
        before_action options.merge(unless: -> c { c.instance_variable_get("@_skip_authorization") }) do
          run_authorization_check options
        end
      end

      # Allows defining and overriding a controller's map of its actions to the model's authorizer methods
      #
      # @param [Hash] action_map - controller actions and methods, to be merged with existing action_map
      def authorization_actions(action_map)
        authorization_action_map.merge!(overridden_actions(action_map))
        authorization_action_map.merge!(action_map.symbolize_keys)
      end

      # Convenience wrapper for instance method
      def ensure_authorization_performed(options = {})
        after_filter(options.slice(:only, :except)) do |controller_instance|
          controller_instance.ensure_authorization_performed(options)
        end
      end

      # The controller action to authorization action map used for determining
      # which Rails actions map to which authorization actions (ex: index to read)
      #
      # @return [Hash] A duplicated copy of the configured controller_action_map
      def authorization_action_map
        @authorization_action_map ||= MonsoonOpenstackAuth.configuration.authorization.controller_action_map.dup
      end

      def overridden_actions(options = {})
        if forced_action = options.fetch(:all_actions, false)
          overridden_actions = authorization_action_map.inject({}) { |hash, (key, val)| hash.tap { |h| h[key] = forced_action } }
        end
        overridden_actions || options.fetch(:actions, {})
      end

    end

    module InstanceMethods
      ################### action-level permissions #########################
      # object level permissions
      # possible signatures:
      # enforce_permissions("identity:user_read", {user: UserObject})
      # enforce_permissions(["identity:user_read","user_create"], {user: UserObject})
      # enforce_permissions(:user_read,{user: UserObject})
      # enforce_permissions(user: UserObject), rule_name is determined based on the controller and action names
      def enforce_permissions(*options)
        #context = "#{MonsoonOpenstackAuth.configuration.authorization.context}:"
        application_name = @authorization_context || MonsoonOpenstackAuth.configuration.authorization.context

        policy_rules = []
        policy_params = {}

        if options.first.is_a?(Hash)
          # application_name = context || @authorization_context || MonsoonOpenstackAuth.configuration.authorization.context
          policy_rules = [MonsoonOpenstackAuth::Authorization.determine_rule_name(application_name,self.controller_name,self.action_name)]
          policy_params = options.first
        else
          policy_rules = options.first.is_a?(Array) ? options.first : [options.first]
          policy_rules = policy_rules.collect do |n|
            rule_name = n.to_s
            if rule_name.start_with?('::')
              rule_name[2..-1]
            elsif (rule_name.include?(':') and rule_name.start_with?(application_name))
              rule_name
            else
              "#{application_name}:#{rule_name}"
            end
          end
          policy_params = options.second
        end

        policy_params ||= {}

        if @policy_default_params and @policy_default_params.is_a?(Hash)
          policy_params = @policy_default_params.merge(policy_params)
        end


        result = if MonsoonOpenstackAuth.configuration.authorization.trace_enabled
          policy_trace = policy.enforce_with_trace(policy_rules, policy_params)
          policy_trace.print
          policy_trace.result
        else
          policy.enforce(policy_rules, policy_params)
        end

        raise MonsoonOpenstackAuth::Authorization::SecurityViolation.new(authorization_user, policy_rules, policy_params, policy) unless result
      end

      ################### END Andreas ###################




      attr_writer :authorization_performed

      def authorization_performed?
        !!@authorization_performed
      end

      def ensure_authorization_performed(options = {})
        return if authorization_performed?
        return if options[:if] && !send(options[:if])
        return if options[:unless] && send(options[:unless])
        raise AuthorizationNotPerformed, "No authorization was performed for #{self.class.to_s}##{self.action_name}"
      end

      protected

      # To be run in a `before_action`; ensure this controller action is allowed for the user
      # Can be used directly within a controller action as well, given an instance or class with or
      # without options to delegate to the authorizer.
      #
      # @param [Class] authorization_resource, the model class associated with this controller
      # @param [Hash] options, arbitrary options hash to forward up the chain to the authorizer
      # @raise [MissingAction] if controller action isn't a key in `config.controller_action_map`
      def authorization_action_for(authorization_resource, options={})

        # determine object name and create a hash for non hash authorization objects in case of an instance
        if authorization_resource.is_a? Class
          hashed_resource = Hashie::Mash.new
          authorization_resouce_name = authorization_resource.name
        elsif authorization_resource.is_a? String
          hashed_resource = Hashie::Mash.new
          authorization_resouce_name = authorization_resource
        elsif authorization_resource.is_a? Symbol
          hashed_resource = Hashie::Mash.new
          authorization_resouce_name = authorization_resource.to_s
        elsif authorization_resource.is_a? ActiveRecord::Base
          hashed_resource =  Hashie::Mash.new({ authorization_resource.class.name.downcase.to_sym => authorization_resource })
          authorization_resouce_name = authorization_resource.class.name
        else
          unless authorization_resource.is_a? Hash
            hashed_resource =  Hashie::Mash.new({ authorization_resource.class.name.downcase.to_sym => authorization_resource })
          else
            hashed_resource = Hashie::Mash.new(authorization_resource)
          end
          authorization_resouce_name = authorization_resource.class.name
        end
        authorization_resouce_name = options[:name] if options[:name]

        # `action_name` comes from ActionController
        authorization_action = self.class.authorization_action_map[action_name.to_sym]
        if authorization_action.nil?
          raise MissingAction.new("No authorization action defined for #{action_name}")
        end
        self.authorization_performed = true
        application_name = MonsoonOpenstackAuth.configuration.authorization.context
        os_action = ("#{application_name}:#{authorization_resouce_name}_#{authorization_action}").downcase

        if params[:policy_trace] && params[:policy_trace] == "1" && !session[:policy_trace]
          session[:policy_trace] = 1
        elsif params[:policy_trace] && session[:policy_trace]
          session.delete(:policy_trace)
        end

        result = if session[:policy_trace] || MonsoonOpenstackAuth.configuration.authorization.trace_enabled
          @policy_trace = policy.enforce_with_trace([os_action], hashed_resource)
          @policy_trace.print
          @policy_trace.result
        else
          policy.enforce([os_action], hashed_resource)
        end

        raise MonsoonOpenstackAuth::Authorization::SecurityViolation.new(authorization_user, os_action, authorization_resource, policy) unless result
      end


      def if_allowed?(policy_rules, options={})

        unless options.is_a? Hash
          raise InvalidResource
        else
          mashed_resource = Hashie::Mash.new(options)
        end

        unless policy_rules.is_a? Array
          policy_rules = [policy_rules]
        end

        self.authorization_performed = true

        if params[:policy_trace] && params[:policy_trace] == "1" && !session[:policy_trace]
          session[:policy_trace] = 1
        elsif params[:policy_trace] && session[:policy_trace]
            session.delete(:policy_trace)
        end

        result = if session[:policy_trace] || MonsoonOpenstackAuth.configuration.authorization.trace_enabled
          @policy_trace = policy.enforce_with_trace(policy_rules, mashed_resource)
          @policy_trace.print
          @policy_trace.result
        else
          policy.enforce(policy_rules, mashed_resource)
        end

        raise MonsoonOpenstackAuth::Authorization::SecurityViolation.new(authorization_user, policy_rules, mashed_resource, policy) unless result
      end

      # Renders a static file to minimize the chances of further errors.
      #
      # @param [Exception] error, an error that indicates the user tried to perform a forbidden action.
      def authorization_forbidden(error)
        MonsoonOpenstackAuth.logger.warn(error.message)
        render :file => Rails.root.join('public', '403.html'), :status => 403, :layout => false
      end

      private

      # The `before_action` that will be setup to run when the class method
      # `authorize_actions_for` is called
      def run_authorization_check options
        authorization_action_for instance_authorization_resource, options
      end

      def instance_authorization_resource
        return self.class.authorization_resource if self.class.authorization_resource.is_a?(Class)
        send(self.class.authorization_resource)
      rescue NoMethodError
        return self.class.authorization_resource
        # raise MissingResource.new(
        #           "Trying to authorize actions for '#{self.class.authorization_resource}', but can't. \
        #   Must be either a resource class OR the name of a controller instance method that \
        #   returns one.".squeeze(' ')
        #       )
      end

      def policy
        if !@policy || (authorization_user and authorization_user.id != @policy.user.id)
          @policy = MonsoonOpenstackAuth.policy_engine.policy(authorization_user) if authorization_user
        end
        return @policy
      end

      def policy=(policy)
        @policy = policy
      end

      def authorization_user
        send(MonsoonOpenstackAuth.configuration.authorization.user_method)
      end

      class MissingAction < StandardError;
      end

      class InvalidResource < StandardError;
      end

      class AuthorizationNotPerformed < StandardError;
      end

    end

  end
end
