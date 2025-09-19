module MonsoonOpenstackAuth
  class ApiClient
    attr_reader :connection_driver

    def initialize
      @connection_driver = MonsoonOpenstackAuth.configuration.connection_driver.new
    end
      
    delegate :validate_token,                 to: :@connection_driver
    delegate :authenticate_with_credentials,  to: :@connection_driver
    delegate :authenticate_with_token,        to: :@connection_driver
    delegate :authenticate_with_access_key,   to: :@connection_driver
    delegate :authenticate_external_user,     to: :@connection_driver
    
    def auth_user(username,password,user_domain_params={domain: nil, domain_name: nil, scoped_token: false})
      token = authenticate_with_credentials(username,password,user_domain_params)
      MonsoonOpenstackAuth::Authentication::AuthUser.new(token) 
    end
  end
end