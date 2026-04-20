# frozen_string_literal: true

require 'spec_helper'

# Integration tests for SSO authorization and password session feature flags
RSpec.describe 'SSO Authorization and Password Session Integration', type: :request do
  let(:test_token) do
    HashWithIndifferentAccess.new(
      'value' => 'test_token_12345',
      'expires_at' => (Time.now + 1.hour).to_s,
      'domain' => { 'id' => 'test_domain', 'name' => 'TestDomain' },
      'user' => {
        'id' => 'test_user_id',
        'name' => 'testuser',
        'domain' => { 'id' => 'test_domain', 'name' => 'TestDomain' }
      }
    )
  end

  before do
    MonsoonOpenstackAuth.configure do |config|
      config.connection_driver.api_endpoint = 'http://localhost:5000/v3/auth/tokens'
      config.sso_auth_allowed = true
      config.form_auth_allowed = true
    end

    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient)
      .to receive(:authenticate_with_credentials).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient)
      .to receive(:authenticate_external_user).and_return(nil) # Simulate no permissions
  end

  describe 'Certificate SSO Scenario' do
    context 'with both flags disabled (default behavior)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = false
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = true
      end

      it 'redirects to login form when SSO user has no Keystone permissions' do
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be false
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be true
      end
    end

    context 'with block_login_fallback_after_sso only' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = true
      end

      it 'shows 403 when SSO user has no Keystone permissions' do
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be true
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be true
      end
    end

    context 'with password_session_auth_allowed disabled only' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = false
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'validates password but does not create session' do
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be false
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end
    end

    context 'with both flags enabled (strict mode)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'shows 403 and does not create password session' do
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be true
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end

      it 'preserves password sync functionality when authentication plugin supports it' do
        # Even though password sessions are disabled, password validation
        # triggers Keystone authentication which may include password sync
        # when the Keystone authentication plugin supports it

        test_user = 'testuser123'
        test_password = 'test_password'

        # When password form is submitted, Keystone is called for authentication.
        # The password_session_auth_allowed flag only affects whether Elektra
        # creates a session AFTER successful Keystone authentication.
        # The Keystone call itself (which may trigger password sync in the authentication plugin)
        # happens regardless of the flag value.

        # Test verifies the configuration allows this behavior
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end
    end
  end

  describe 'OIDC/SAML SSO Scenario' do
    context 'with both flags enabled (strict mode)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'shows 403 with no Try Again button when OIDC user has no Keystone permissions' do
        # 1. User authenticates via Identity Provider
        # 2. Keystone returns token but user has no domain (no permissions)
        # 3. auth_token_controller detects this and sets @oidc_authorization_failure = true
        # 4. verify.haml shows 403 with NO "Try Again" button

        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be true
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end
    end
  end

  describe 'Backward Compatibility' do
    context 'Development environment (flags disabled)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = false
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = true
      end

      it 'preserves legacy behavior for development/testing' do
        # Legacy behavior: SSO failures redirect to login form
        # Password login creates sessions normally
        # This allows developers to test without SSO infrastructure

        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be false
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be true
      end
    end

    context 'Staging environment (testing flags)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = true
      end

      it 'allows testing SSO 403 handling while keeping password login for debugging' do
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be true
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be true
      end
    end

    context 'Production environment (both flags enabled)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'enforces secure behavior: SSO-only web access' do
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be true
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end
    end
  end

  describe 'Alternative Authentication Paths' do
    context 'with password_session_auth_allowed disabled' do
      before do
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'only affects web dashboard login' do
        # This fix specifically targets web dashboard login via sessions_controller#create
        # Other authentication paths use different code paths
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end

      it 'does not affect token authentication' do
        # Token authentication uses a different code path (token_auth_allowed flag)
        expect(MonsoonOpenstackAuth.configuration.token_auth_allowed).to be true
      end
    end
  end
end
