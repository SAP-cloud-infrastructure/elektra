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

      # stub validate_token
      # stub validate_token for any parameters
      allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).and_return(nil)
      # stub validate_token for test_token
      allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).
        with(AuthenticationStub.test_token["value"]).and_return(AuthenticationStub.test_token)

      # stub authenticate. This method is called from api_client on :authenticate_with_credentials, :authenticate_with_token,
      # :authenticate_with_access_key, :authenticate_external_user
      allow_any_instance_of(MonsoonOpenstackAuth.configuration.connection_driver).to receive(:authenticate)
        .and_return(AuthenticationStub.test_token)

      # stub session token (so authenticate_with_credentials is never called)
      begin
        @token_store = MonsoonOpenstackAuth::Authentication::TokenStore.new(controller.session)

        test_token = AuthenticationStub.test_token
        test_token = block.call(test_token) if block_given?

        @token_store.delete_token test_token
        @token_store.set_token test_token
      rescue
      end

    end

    def stub_authentication_with_token(token_hash)
      stub_auth_configuration

      @session_store = MonsoonOpenstackAuth::Authentication::TokenStore.new(controller.session)
      @session_store.token = token_hash
    end
  end
end
