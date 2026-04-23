# frozen_string_literal: true

require 'spec_helper'

describe 'MonsoonOpenstackAuth::Authentication::AuthSession SSO Authorization' do
  let(:test_token) do
    HashWithIndifferentAccess.new(
      ApiStub.keystone_token.merge('expires_at' => (Time.now + 1.hour).to_s)
    )
  end

  before :each do
    MonsoonOpenstackAuth.configure do |config|
      config.connection_driver.api_endpoint = 'http://localhost:5000/v3/auth/tokens'
      config.sso_auth_allowed = true
      config.form_auth_allowed = true
    end

    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient)
      .to receive(:authenticate_external_user).and_return(test_token)
  end

  describe '#certificate_valid_but_no_keystone_permissions?' do
    let(:session_hash) { {} }
    let(:controller) do
      double('controller').as_null_object.tap do |c|
        allow(c).to receive(:params).and_return({})
        allow(c).to receive(:request).and_return(double('request', env: {}).as_null_object)
        allow(c).to receive(:session).and_return(session_hash)
        allow(c).to receive(:[]).and_return(session_hash)
        allow(c).to receive(:[]=) { |key, val| session_hash[key] = val }
      end
    end

    let(:auth_session) do
      MonsoonOpenstackAuth::Authentication::AuthSession.new(controller, {})
    end

    context 'when SSO auth is disabled' do
      before { MonsoonOpenstackAuth.configuration.sso_auth_allowed = false }

      it 'returns false' do
        controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'valid-cert-data'

        expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be false
      end
    end

    context 'when SSO auth is enabled' do
      before { MonsoonOpenstackAuth.configuration.sso_auth_allowed = true }

      context 'when certificate verification failed' do
        it 'returns false for FAILED verification' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'FAILED'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'invalid-cert-data'

          expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be false
        end

        it 'returns false for missing verification header' do
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'cert-data'

          expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be false
        end
      end

      context 'when certificate is missing' do
        it 'returns false for nil certificate' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = nil

          expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be false
        end

        it 'returns false for empty certificate' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = ''

          expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be false
        end
      end

      context 'when certificate is valid' do
        it 'returns true when certificate verified successfully' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'valid-cert-data'

          expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be true
        end

        it 'returns true with multi-line certificate' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = <<~CERT
            -----BEGIN CERTIFICATE-----
            MIIDXTCCAkWgAwIBAgIJAKZ...
            -----END CERTIFICATE-----
          CERT

          expect(auth_session.certificate_valid_but_no_keystone_permissions?(controller)).to be true
        end
      end
    end
  end

  describe '.check_authentication with SSO authorization enforcement' do
    let(:session_hash) { {} }
    let(:controller) do
      double('controller').as_null_object.tap do |c|
        allow(c).to receive(:params).and_return({ after_login: "login", domain_id: "test" })
        allow(c).to receive(:request).and_return(double('request', env: {}).as_null_object)
        allow(c).to receive(:monsoon_openstack_auth).and_return(double('auth-routes'))
        allow(c).to receive(:main_app).and_return(double('main_app', root_path: '/'))
        allow(c).to receive(:session).and_return(session_hash)
        allow(c).to receive(:[]).and_return(session_hash)
        allow(c).to receive(:[]=) { |key, val| session_hash[key] = val }
      end
    end

    before :each do
      allow(controller.monsoon_openstack_auth).to receive(:new_session_path).and_return('/auth/sessions/new')
      allow(controller).to receive(:redirect_to)
    end

    context 'when block_login_fallback_after_sso is false (legacy behavior)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = false
        allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:authenticated?).and_return(false)
      end

      it 'redirects to login form when user not authenticated' do
        controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'valid-cert'

        expect(controller).to receive(:redirect_to)
        MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller)
      end
    end

    context 'when block_login_fallback_after_sso is true (secure behavior)' do
      before do
        MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso = true
        allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:authenticated?).and_return(false)
      end

      context 'and valid certificate but user not authenticated' do
        it 'raises NotAuthorized exception' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'valid-cert-data'

          expect {
            MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller)
          }.to raise_error(
            MonsoonOpenstackAuth::Authentication::NotAuthorized,
            /Valid certificate authentication but no OpenStack domain\/project access/
          )
        end

        it 'does not redirect to login form' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'valid-cert-data'

          expect(controller).not_to receive(:redirect_to)

          expect {
            MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller)
          }.to raise_error(MonsoonOpenstackAuth::Authentication::NotAuthorized)
        end
      end

      context 'and no certificate present' do
        it 'redirects to login form (normal behavior)' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = nil
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = nil

          expect(controller).to receive(:redirect_to)
          MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller)
        end
      end

      context 'and invalid certificate' do
        it 'redirects to login form (normal behavior)' do
          controller.request.env['HTTP_SSL_CLIENT_VERIFY'] = 'FAILED'
          controller.request.env['HTTP_SSL_CLIENT_CERT'] = 'invalid-cert'

          expect(controller).to receive(:redirect_to)
          MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller)
        end
      end
    end
  end
end
