require 'spec_helper'

describe MonsoonOpenstackAuth::SessionsController, type: :controller do
  let(:valid_token) { 'valid_auth_token_123' }
  let(:invalid_token) { 'invalid_auth_token' }
  let(:domain_id) { 'test_domain_123' }
  let(:after_login_url) { 'http://test.host/dashboard' }
  
  # Mock the auth session
  let(:mock_auth_session) do
    double('auth_session', logged_in?: true, user: double('user', name: 'testuser'))
  end
  
  let(:failed_auth_session) do
    double('auth_session', logged_in?: false)
  end

  before do
    # Mock the main_app helper
    allow(controller).to receive(:main_app).and_return(
      double('main_app', root_url: "http://test.host/#{domain_id}")
    )
    # Mock Rails secret key base for token verification
    allow(Rails.application).to receive(:secret_key_base).and_return('a' * 64)
        
    # Set up engine routes for testing
    @routes = MonsoonOpenstackAuth::Engine.routes
  end

  describe 'POST #consume_auth_token' do
    context 'with valid auth token' do
      before do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, valid_token)
          .and_return(mock_auth_session)
      end

      it 'creates auth session and redirects to after_login_url' do
        post :consume_auth_token, params: {
          domain_fid: domain_id,
          auth_token: valid_token,
          domain_id: domain_id,
          after_login: after_login_url
        }

        expect(response).to redirect_to(after_login_url)
      end

      it 'redirects to root_url when no after_login provided' do
        expected_url = "http://test.host/#{domain_id}"
        allow(controller.main_app).to receive(:root_url)
          .with(domain_id: domain_id)
          .and_return(expected_url)

        post :consume_auth_token, params: {
          domain_fid: domain_id,
          auth_token: valid_token,
          domain_id: domain_id
        }

        expect(response).to redirect_to(expected_url)
      end

      it 'calls create_from_auth_token with correct parameters' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, valid_token)
          .and_return(mock_auth_session)

        post :consume_auth_token, params: {
          domain_fid: domain_id,
          auth_token: valid_token,
          domain_id: domain_id
        }
      end
    end

    context 'with invalid auth token' do
      before do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, invalid_token)
          .and_return(nil)
      end

      it 'redirects to new session with alert for nil session' do
        post :consume_auth_token, params: {
          domain_fid: domain_id,
          auth_token: invalid_token,
          domain_id: domain_id
        }

        expect(response).to redirect_to(new_session_path(domain_fid: domain_id, domain_id: domain_id))
        expect(flash[:alert]).to eq('Invalid token.')
      end
    end

    context 'with failed login session' do
      before do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, valid_token)
          .and_return(failed_auth_session)
      end

      it 'redirects to new session with alert for failed login' do
        post :consume_auth_token, params: {
          auth_token: valid_token,
          domain_id: domain_id,
          domain_fid: domain_id
        }

        expect(response).to redirect_to(new_session_path(domain_fid: domain_id, domain_id: domain_id))
        expect(flash[:alert]).to eq('Invalid token.')
      end
    end
  end

  describe 'GET #consume_auth_token' do
    let(:encoded_token) { 'encoded_token_string' }
    let(:verifier) { double('verifier') }

    before do
      allow(ActiveSupport::MessageVerifier).to receive(:new)
        .with(Rails.application.secret_key_base)
        .and_return(verifier)
    end

    context 'with valid encoded token' do
      before do
        allow(verifier).to receive(:verify)
          .with(encoded_token)
          .and_return(valid_token)
        
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, valid_token)
          .and_return(mock_auth_session)
      end

      it 'decodes token and creates auth session' do
        get :consume_auth_token, params: {
          auth_token: encoded_token,
          domain_id: domain_id,
          domain_fid: domain_id,
          after_login: after_login_url
        }

        expect(verifier).to have_received(:verify).with(encoded_token)
        expect(response).to redirect_to(after_login_url)
      end

      it 'works without after_login parameter' do
        expected_url = 'http://test.host/?domain_id=test_domain_123'
        allow(controller.main_app).to receive(:root_url)
          .with(domain_id: domain_id)
          .and_return(expected_url)

        get :consume_auth_token, params: {
          auth_token: encoded_token,
          domain_id: domain_id,
          domain_fid: domain_id,
        }

        expect(response).to redirect_to(expected_url)
      end
    end

    context 'with invalid encoded token' do
      before do
        allow(verifier).to receive(:verify)
          .with(encoded_token)
          .and_raise(ActiveSupport::MessageVerifier::InvalidSignature)
      end

      it 'handles invalid signature and redirects with alert' do
        get :consume_auth_token, params: {
          auth_token: encoded_token,
          domain_id: domain_id,
          domain_fid: domain_id
        }

        expect(response).to redirect_to(new_session_path(domain_fid: domain_id, domain_id: domain_id))
        expect(flash[:alert]).to eq('Invalid token.')
      end
    end

    context 'with token that decodes but fails authentication' do
      before do
        allow(verifier).to receive(:verify)
          .with(encoded_token)
          .and_return(invalid_token)
        
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, invalid_token)
          .and_return(nil)
      end

      it 'redirects to new session with alert' do
        get :consume_auth_token, params: {
          auth_token: encoded_token,
          domain_id: domain_id,
          domain_fid: domain_id
        }

        expect(response).to redirect_to(new_session_path(domain_fid: domain_id, domain_id: domain_id))
        expect(flash[:alert]).to eq('Invalid token.')
      end
    end
  end

  describe 'edge cases for consume_auth_token' do
    context 'missing parameters' do
      it 'handles missing auth_token parameter' do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, nil)
          .and_return(nil)

        post :consume_auth_token, params: { domain_fid: domain_id,domain_id: domain_id }

        expect(response).to redirect_to(new_session_path(domain_fid: domain_id, domain_id: domain_id))
        expect(flash[:alert]).to eq('Invalid token.')
      end

      it 'handles missing domain_id parameter' do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .and_return(mock_auth_session)

        expected_url = 'http://test.host/?domain_id='
        allow(controller.main_app).to receive(:root_url)
          .with(domain_id: nil)
          .and_return(expected_url)

        post :consume_auth_token, params: { domain_fid: domain_id, auth_token: valid_token }

        expect(response).to redirect_to(expected_url)
      end
    end

    context 'exception handling' do
      it 'handles exceptions from create_from_auth_token gracefully' do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .and_raise(StandardError.new('Authentication service unavailable'))

        expect {
          post :consume_auth_token, params: {
            auth_token: valid_token,
            domain_id: domain_id,
            domain_fid: domain_id
          }
        }.to raise_error(StandardError, 'Authentication service unavailable')
      end
    end
  end

  describe 'integration scenarios' do
    context 'token authentication flow' do
      it 'successfully processes complete authentication flow' do
        # Setup successful authentication
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, valid_token)
          .and_return(mock_auth_session)

        # Make request
        post :consume_auth_token, params: {
          auth_token: valid_token,
          domain_id: domain_id,
          domain_fid: domain_id,
          after_login: after_login_url
        }

        # Verify response
        expect(response).to redirect_to(after_login_url)
        expect(response.status).to eq(302)
        expect(flash[:alert]).to be_nil
      end
    end

    context 'URL building' do
      it 'properly constructs root URL with domain_id' do
        expected_url = 'http://test.host/dashboard?domain_id=test_domain_123'
        
        allow(controller.main_app).to receive(:root_url)
          .with(domain_id: domain_id)
          .and_return(expected_url)
        
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .and_return(mock_auth_session)

        post :consume_auth_token, params: {
          auth_token: valid_token,
          domain_id: domain_id,
          domain_fid: domain_id
        }

        expect(response).to redirect_to(expected_url)
      end
    end
  end

  # Test the private method indirectly
  describe 'decode_auth_token functionality' do
    let(:encoded_token) { 'encoded_test_token' }
    let(:decoded_token) { 'decoded_test_token' }

    context 'when token verification succeeds' do
      it 'returns decoded token for GET requests' do
        verifier = double('verifier')
        allow(ActiveSupport::MessageVerifier).to receive(:new)
          .with(Rails.application.secret_key_base)
          .and_return(verifier)
        allow(verifier).to receive(:verify)
          .with(encoded_token)
          .and_return(decoded_token)

        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:create_from_auth_token)
          .with(controller, decoded_token)
          .and_return(mock_auth_session)

        get :consume_auth_token, params: {
          auth_token: encoded_token,
          domain_fid: domain_id,
          domain_id: domain_id
        }

        expect(verifier).to have_received(:verify).with(encoded_token)
      end
    end
  end
end