require 'monsoon_openstack_auth/authentication/errors'
require 'monsoon_openstack_auth/authentication/auth_user'
require 'monsoon_openstack_auth/authentication/token_store'
require 'monsoon_openstack_auth/authentication/auth_session'

module MonsoonOpenstackAuth
  # This module is included in a rails controller
  module Authentication
    def self.included(base)
      base.send :extend, ClassMethods
      base.send :include, InstanceMethods

      base.send :helper_method, :current_user, :logged_in?, :services
    end

    def self.get_filter_value(controller, method_name)
      result = nil
      if method_name
        if method_name.is_a?(TrueClass) or method_name.is_a?(FalseClass)
          return method_name
        elsif method_name.is_a?(Proc)
          result = method_name.call(controller)
        elsif controller.respond_to?(method_name.to_sym)
          result = controller.send(method_name.to_sym)
        end
      end
      (result.is_a?(String) and result.empty?) ? nil : result
    end

    module ClassMethods
      def skip_authentication(options = {})
        prepend_before_action options do
          @_skip_authentication = true
        end
      end

      def api_authentication_required(options = {})
        authentication_required options.merge raise_error: true
      end

      def authentication_required(options = {})
        raise_error = options[:raise_error]

        org = options.delete(:organization)
        org ||= options.delete(:domain)
        prj             = options.delete(:project)
        org_name        = options.delete(:domain_name)
        two_factor      = options.delete(:two_factor)

        do_rescope = options.delete(:rescope)
        do_rescope = do_rescope.nil? ? true : do_rescope

        before_action options.merge(unless: ->(c) { c.instance_variable_get('@_skip_authentication') }) do
          session[:init] = true if !raise_error and session and !session.loaded?

          auth_session_params = {
            domain: Authentication.get_filter_value(self, org),
            domain_name: Authentication.get_filter_value(self, org_name),
            project: Authentication.get_filter_value(self, prj),
            raise_error: raise_error
          }
          auth_session_params[:two_factor] = Authentication.get_filter_value(self, two_factor) if two_factor

          @auth_session = AuthSession.check_authentication(self, auth_session_params)

          # @current_user = @auth_session.user if @auth_session

          if @auth_session && do_rescope
            # rescope token to domain and project unless prevented
            authentication_rescope_token
          end
        end
      end
    end

    module InstanceMethods
      def auth_session
        @auth_session
      end

      def current_user
        return unless auth_session

        auth_session.user
        # else
        #   return @authentication_current_session_user if @authentication_current_session_user
        #   @authentication_current_session_user = AuthSession.load_user_from_session(self).user rescue nil
      end

      def logged_in?
        !current_user.nil?
      end

      def authentication_rescope_token(scope = nil)
        return unless @auth_session

        if scope
          @auth_session.rescope_token(scope)
        else
          @auth_session.rescope_token
        end
      end

      def redirect_to_login_form
        @auth_session.redirect_to_login_form if @auth_session
      end

      def create_session_from_auth_token(auth_token)
        @auth_session = AuthSession.create_from_auth_token(self, auth_token)
      end
    end
  end
end
