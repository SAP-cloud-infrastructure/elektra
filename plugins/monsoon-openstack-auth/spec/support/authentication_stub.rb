require File.join(Gem.loaded_specs['monsoon-openstack-auth'].full_gem_path,'spec/support/api_stub')

module AuthenticationStub

  def self.included(base)
    base.send :include, ClassMethods
  end

  def self.bad_domain_id
    'BAD_DOMAIN'
  end

  def self.test_token
    @test_token ||= HashWithIndifferentAccess.new(ApiStub.keystone_token.merge("expires_at" => (Time.now+1.hour).to_s))
    @test_token.clone
  end

  def self.domain_id
    @domain_id ||= (test_token.fetch("domain",{}).fetch("id",nil) || test_token.fetch("project",{}).fetch("domain",{}).fetch("id",nil))
  end

  def self.project_id
    @project_id ||= test_token.fetch("project",{}).fetch("id",nil)
  end

  module ClassMethods

    def stub_auth_configuration
      MonsoonOpenstackAuth.configure do |config|
        config.connection_driver.api_endpoint = "http://localhost:8183/v3/auth/tokens"
      end
    end


    def stub_authentication(options={},&block)
      stub_auth_configuration

      # Get the test token and allow block to modify it (e.g., change roles)
      test_token = AuthenticationStub.test_token
      test_token = block.call(test_token) if block_given?

      # stub validate_token
      # stub validate_token for any parameters
      allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).and_return(nil)
      # stub validate_token for test_token - return the MODIFIED token
      allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).
        with(test_token["value"]).and_return(test_token)

      # stub authenticate. This method is called from api_client on :authenticate_with_credentials, :authenticate_with_token,
      # :authenticate_with_access_key, :authenticate_external_user
      allow_any_instance_of(MonsoonOpenstackAuth.configuration.connection_driver).to receive(:authenticate)
        .and_return(test_token)

      # Store token value directly in session for cookie-based sessions
      begin
        # Store the token value in session (cookie-based approach)
        controller.session[:auth_token_value] = test_token["value"]
      rescue
      end

    end

    def stub_authentication_with_token(token_hash)
      stub_auth_configuration

      # Store token value directly in session for cookie-based approach
      controller.session[:auth_token_value] = token_hash["value"]
    end
  end
end
