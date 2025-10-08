module MonsoonOpenstackAuth
  class Configuration
    METHODS = %i[
      connection_driver token_auth_allowed basic_auth_allowed access_key_auth_allowed sso_auth_allowed
      form_auth_allowed login_redirect_url debug debug_api_calls logger authorization token_cache
      two_factor_authentication_method two_factor_enabled enforce_natural_user natural_user_name_pattern rsa_dns
    ]

    attr_accessor(*METHODS)

    def initialize
      @connection_driver        = MonsoonOpenstackAuth::ConnectionDriver::Default
      @token_auth_allowed       = true
      @basic_auth_allowed       = true
      @sso_auth_allowed         = true
      @form_auth_allowed        = true
      @access_key_auth_allowed  = false
      @two_factor_enabled       = false
      @two_factor_authentication_method = lambda { |username, passcode|
        raise 'No two_factor_authentication_method given! Please provide a method for two factor authentication (config.two_factor_authentication_method=Proc).'
      }

      @debug                    = false
      @debug_api_calls          = false
      @logger                   = MonsoonOpenstackAuth::LoggerWrapper.new(Rails ? Rails.logger : Logger.new(STDERR))
      @authorization            = AuthorizationConfig.new
      @token_cache              = MonsoonOpenstackAuth::Cache::NoopCache
      @enforce_natural_user     = false
      @natural_user_name_pattern = nil
      @rsa_dns = false
    end

    # support old configuration format
    delegate :api_endpoint, to: :@connection_driver
    # end

    def to_hash
      METHODS.each_with_object({}) do |method_name, hash|
        hash[method_name] = send(method_name)
      end
    end

    def to_s
      to_hash.to_s
    end

    def token_auth_allowed?
      @token_auth_allowed
    end

    def basic_auth_allowed?
      @basic_auth_allowed
    end

    def access_key_auth_allowed?
      @access_key_auth_allowed
    end

    def sso_auth_allowed?
      @sso_auth_allowed
    end

    def form_auth_allowed?
      @form_auth_allowed
    end

    def debug?
      @debug
    end

    def two_factor_enabled?
      @two_factor_enabled
    end
  end

  class AuthorizationConfig
    METHODS = %i[policy_file_path controller_action_map context security_violation_handler user_method
                 reload_policy trace_enabled]
    attr_accessor(*METHODS)

    def initialize
      @controller_action_map = {}

      @context = Rails.application.class.parent_name if Rails
      @security_violation_handler = :authorization_forbidden
      @user_method = :current_user

      @policy_file_path = ['config/policy.json']
      @trace_enabled = false
      @reload_policy = false
    end
  end
end
