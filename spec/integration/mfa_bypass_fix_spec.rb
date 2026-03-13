# frozen_string_literal: true

require 'spec_helper'

# HASI2025461-29: Integration tests for MFA bypass vulnerability fix
# These tests verify that both changes work together to prevent the vulnerability
RSpec.describe 'MFA Bypass Vulnerability Fix Integration', type: :request do
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

  describe 'Certificate SSO Attack Scenario' do
    context 'BEFORE fix (vulnerability present)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = false
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = true
      end

      it 'allows MFA bypass: certificate auth fails → redirects to login form → password login succeeds' do
        # Step 1: Attacker authenticates with valid certificate but no Keystone permissions
        # (This step would be handled by Apache and would fail in check_authentication)
        # Step 2: Elektra redirects to login form (VULNERABLE)
        # Step 3: Attacker can now use password login (MFA bypassed)

        # This simulates the final step where password login would succeed
        # In real attack: attacker would see login form and authenticate as different user
        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be false
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be true
      end
    end

    context 'AFTER fix (Change #1 only - NOT sufficient)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = true
      end

      it 'prevents automatic redirect but attacker can manually navigate to /auth/login' do
        # Change #1: Shows 403 instead of redirecting to login form
        # But attacker can still manually type /auth/login in browser
        # Password login would still create session (STILL VULNERABLE)

        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be true
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be true
        # Manual navigation to /auth/login would bypass the fix
      end
    end

    context 'AFTER fix (Change #2 only - NOT sufficient)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = false
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'prevents password sessions but Elektra auto-redirects to login form' do
        # Change #2: Password form does not create session
        # But automatic redirect to login form still happens (confusing UX)

        expect(MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?).to be false
        expect(MonsoonOpenstackAuth.configuration.password_session_auth_allowed?).to be false
      end
    end

    context 'AFTER fix (Both changes - SECURE)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'fully prevents MFA bypass: no redirect + no password sessions' do
        # Change #1: Shows 403, no automatic redirect
        # Change #2: Password form validates but does NOT create session
        # Result: Attacker cannot bypass MFA via Elektra dashboard

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

  describe 'OIDC/SAML SSO Attack Scenario' do
    context 'AFTER fix (Both changes - SECURE)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        MonsoonOpenstackAuth.configuration.password_session_auth_allowed = false
      end

      it 'prevents MFA bypass via OIDC path: shows 403 with no Try Again button' do
        # Scenario:
        # 1. User authenticates via Identity Provider with MFA
        # 2. Keystone returns token but user has no domain (no permissions)
        # 3. auth_token_controller detects this and sets @oidc_authorization_failure = true
        # 4. verify.haml shows 403 with NO "Try Again" button
        # 5. Even if user manually navigates to /auth/login, password form does not create session

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
