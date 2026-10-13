require 'spec_helper'

describe MonsoonOpenstackAuth::Configuration do
  before :each do
    @config = MonsoonOpenstackAuth::Configuration.new
  end

  [
    :connection_driver,
    :token_auth_allowed,
    :basic_auth_allowed,
    :access_key_auth_allowed,
    :sso_auth_allowed,
    :form_auth_allowed,
    :password_auth_allowed,
    :login_redirect_url,
    :debug,
    :debug_api_calls,
    :logger,
    :authorization,
    :token_cache,
    :two_factor_authentication_method
  ].each do |m|
    it "should respond to two_factor_authentication_method" do
      expect(@config).to respond_to(m)
    end

    describe '#two_factor_authentication_method' do
      it 'should return default proc' do
        expect(@config.two_factor_authentication_method).to be_a(Proc)
      end
    end

  end

  describe '#password_auth_allowed' do
    it 'defaults to true (backward compatible)' do
      expect(@config.password_auth_allowed).to eq(true)
    end

    it 'is settable' do
      @config.password_auth_allowed = false
      expect(@config.password_auth_allowed).to eq(false)
    end

    it 'has a predicate method' do
      expect(@config).to respond_to(:password_auth_allowed?)
      expect(@config.password_auth_allowed?).to eq(true)

      @config.password_auth_allowed = false
      expect(@config.password_auth_allowed?).to eq(false)
    end
  end
end
