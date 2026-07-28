# spec/controllers/auth_token_controller_spec.rb
require 'spec_helper'

RSpec.describe AuthTokenController, type: :controller do
  let(:valid_token) { 'valid_auth_token_123' }
  let(:invalid_token) { 'invalid_token' }
  let(:domain_name) { 'test_domain' }
  let(:api_client) { double('api_client') }

  before do
    allow(MonsoonOpenstackAuth).to receive(:api_client).and_return(api_client)
    allow(Rails.application).to receive(:secret_key_base).and_return('test_secret_key')
  end

  describe 'POST #verify' do
    context 'when token is blank' do
      it 'returns bad request error' do
        post :verify, params: { token: '' }
        
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Auth token is required' })
      end

      it 'returns bad request error when token is nil' do
        post :verify, params: {}
        
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Auth token is required' })
      end
    end

    context 'when token is valid' do
      let(:token_data) do
        {
          'user' => {
            'domain' => {
              'name' => domain_name
            }
          }
        }
      end

      let(:mock_auth_session) do
        double('auth_session', logged_in?: true, user: double('user', name: 'testuser', domain_name: domain_name))
      end

      before do
        allow(api_client).to receive(:validate_token).with(valid_token).and_return(token_data)
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, valid_token)
          .and_return(mock_auth_session)
      end

      it 'successfully verifies token and redirects to domain home' do
        post :verify, params: { token: valid_token }

        expect(response).to have_http_status(:found)
        expect(response).to redirect_to("/#{domain_name}/home")
      end

      it 'redirects to after_login URL when provided' do
        post :verify, params: { token: valid_token, after_login: '/custom/path' }

        expect(response).to have_http_status(:found)
        expect(response).to redirect_to('/custom/path')
      end
    end

    context 'when keystone returns success but domain name is missing' do
      let(:response_without_domain) do
        {
          'user' => {}
        }
      end

      before do
        allow(api_client).to receive(:validate_token).with(valid_token).and_return(response_without_domain)
      end

      context 'with block_login_fallback_after_sso disabled (legacy behavior)' do
        before do
          MonsoonOpenstackAuth.configure do |config|
            config.block_login_fallback_after_sso = false
          end
        end

        it 'sets error when domain name is not found' do
          post :verify, params: { token: valid_token }

          expect(response).to have_http_status(:ok)
          expect(assigns(:error)).to eq('Domain ID not found in response')
          expect(assigns(:oidc_authorization_failure)).to be_nil
        end
      end

      context 'with block_login_fallback_after_sso enabled' do
        before do
          MonsoonOpenstackAuth.configure do |config|
            config.block_login_fallback_after_sso = true
          end
        end

        it 'sets OIDC authorization failure flag' do
          post :verify, params: { token: valid_token }

          expect(response).to have_http_status(:ok)
          expect(assigns(:error)).to eq('Access Forbidden')
          expect(assigns(:oidc_authorization_failure)).to be true
        end

        it 'sets OIDC authorization failure flag and disables Try Again' do
          post :verify, params: { token: valid_token }

          # Should set flag for view to show 403 with no "Try Again" button
          expect(assigns(:oidc_authorization_failure)).to be true
        end
      end
    end

    context 'when keystone returns authentication failure' do
      before do
        allow(api_client).to receive(:validate_token).with(invalid_token).and_return(nil)
      end

      it 'sets authentication failed error' do
        post :verify, params: { token: invalid_token }

        expect(response).to have_http_status(:ok)
        expect(assigns(:error)).to eq('Authentication failed')
      end
    end

    context 'when api client raises an error' do
      before do
        allow(api_client).to receive(:validate_token).and_raise(StandardError.new('Connection error'))
      end

      it 'handles errors gracefully' do
        post :verify, params: { token: valid_token }

        expect(response).to have_http_status(:ok)
        expect(assigns(:error)).to eq('An error occurred')
        expect(assigns(:details)).to eq('Connection error')
      end
    end
  end

  describe '#verify_authenticity_token' do
    context 'in development environment' do
      before do
        allow(Rails.env).to receive(:development?).and_return(true)
      end

      it 'skips CSRF protection' do
        expect(controller.send(:verify_authenticity_token)).to be true
      end
    end

    context 'in test environment' do
      before do
        allow(Rails.env).to receive(:test?).and_return(true)
      end

      it 'skips CSRF protection' do
        expect(controller.send(:verify_authenticity_token)).to be true
      end
    end

    context 'in production with allowed origin' do
      before do
        allow(Rails.env).to receive(:development?).and_return(false)
        allow(Rails.env).to receive(:test?).and_return(false)
        allow(ENV).to receive(:[]).with('MONSOON_DASHBOARD_REGION').and_return('eu-de-1')
        request.headers['Origin'] = 'https://identity-3.eu-de-1.cloud.sap'
      end

      it 'allows request from trusted origin' do
        expect(controller.send(:verify_authenticity_token)).to be true
      end
    end
  end

  describe '#trusted_sso_origin?' do
    before do
      allow(ENV).to receive(:[]).with('MONSOON_DASHBOARD_REGION').and_return('eu-de-1')
    end

    it 'returns true for trusted identity provider origin' do
      request.headers['Origin'] = 'https://identity-3.eu-de-1.cloud.sap'
      expect(controller.send(:trusted_sso_origin?)).to be true
    end

    it 'returns true for trusted dashboard origin' do
      request.headers['Origin'] = 'https://dashboard.eu-de-1.cloud.sap'
      expect(controller.send(:trusted_sso_origin?)).to be true
    end

    it 'returns false for untrusted origin' do
      request.headers['Origin'] = 'https://malicious-site.com'
      expect(controller.send(:trusted_sso_origin?)).to be false
    end

    it 'returns false when origin header is missing' do
      expect(controller.send(:trusted_sso_origin?)).to be false
    end
  end
end