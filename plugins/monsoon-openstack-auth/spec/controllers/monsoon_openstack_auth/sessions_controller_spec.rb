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

  describe 'GET #new' do
    let(:domain_name) { 'test_domain' }

    before do
      allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?).and_return(true)
      allow(controller.main_app).to receive(:root_path).and_return('/dashboard')
    end

    context 'when form auth is allowed' do
      it 'renders the login form' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:logout).with(controller, domain_id)
        
        get :new, params: { domain_fid: domain_id, domain_id: domain_id }
        
        expect(response).to have_http_status(:success)
      end

      it 'logs out existing session by domain_id' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:logout).with(controller, domain_id)
        
        get :new, params: { domain_fid: domain_id, domain_id: domain_id }
      end

      it 'logs out existing session by domain_name' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:logout).with(controller, domain_name)
        
        get :new, params: { domain_fid: domain_id, domain_name: domain_name }
      end

      it 'handles missing domain parameters' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:logout).with(controller, nil)
        
        get :new, params: { domain_fid: domain_id }
      end
    end

    context 'when form auth is not allowed' do
      before do
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?).and_return(false)
      end

      it 'redirects to root path with alert' do
        get :new, params: { domain_fid: domain_id, domain_id: domain_id }
        
        expect(response).to redirect_to(controller.main_app.root_path)
        expect(flash[:alert]).to eq('Not allowed!')
      end

      it 'does not call logout' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .not_to receive(:logout)
        
        get :new, params: { domain_fid: domain_id, domain_id: domain_id }
      end
    end
  end

  describe 'POST #create' do
    let(:username) { 'testuser' }
    let(:password) { 'password123' }
    let(:domain_name) { 'test_domain' }

    before do
      allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?).and_return(true)
      allow(MonsoonOpenstackAuth.configuration).to receive(:enforce_natural_user).and_return(false)
    end

    context 'when form auth is allowed' do
      context 'with valid credentials' do
        before do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)
        end

        it 'creates auth session and redirects to after_login url' do
          post :create, params: {
            domain_fid: domain_id,
            username: username,
            password: password,
            domain_id: domain_id,
            after_login: after_login_url
          }

          expect(response).to redirect_to(after_login_url)
          expect(flash[:alert]).to be_nil
        end

        it 'redirects to root url when after_login not provided' do
          expected_url = "http://test.host/#{domain_id}"
          allow(controller.main_app).to receive(:root_url)
            .with(domain_id: domain_id)
            .and_return(expected_url)

          post :create, params: {
            domain_fid: domain_id,
            username: username,
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(expected_url)
        end

        it 'calls create_from_login_form with correct parameters' do
          expect(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .with(controller, username, password, domain_id: domain_id, domain_name: nil)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: username,
            password: password,
            domain_id: domain_id
          }
        end

        it 'handles domain_name instead of domain_id' do
          expect(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .with(controller, username, password, domain_id: nil, domain_name: domain_name)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: username,
            password: password,
            domain_name: domain_name
          }
        end
      end

      context 'with invalid credentials' do
        before do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(nil)
        end

        it 'renders login form with error message' do
          post :create, params: {
            domain_fid: domain_id,
            username: username,
            password: 'wrong_password',
            domain_id: domain_id
          }

          expect(response).to render_template(:new)
          expect(flash[:alert]).to eq('Invalid username/password combination.')
          expect(assigns(:error)).to eq('Invalid username/password combination.')
        end
      end

      context 'when authentication raises exception' do
        before do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_raise(StandardError.new('Keystone unavailable'))
        end

        it 'renders login form with error message' do
          post :create, params: {
            domain_fid: domain_id,
            username: username,
            password: password,
            domain_id: domain_id
          }

          expect(response).to render_template(:new)
          expect(flash[:alert]).to eq('Keystone unavailable')
          expect(assigns(:error)).to eq('Keystone unavailable')
        end
      end

      context 'with two-factor authentication' do
        before do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)
        end

        context 'when two-factor is required and not validated' do
          it 'renders two_factor form' do
            allow(MonsoonOpenstackAuth::Authentication::AuthSession)
              .to receive(:two_factor_cookie_valid?)
              .and_return(false)

            post :create, params: {
              domain_fid: domain_id,
              username: username,
              password: password,
              domain_id: domain_id,
              two_factor: 'true'
            }

            expect(response).to render_template(:two_factor)
          end
        end

        context 'when two-factor is required and validated' do
          it 'redirects to after_login url' do
            allow(MonsoonOpenstackAuth::Authentication::AuthSession)
              .to receive(:two_factor_cookie_valid?)
              .and_return(true)

            post :create, params: {
              domain_fid: domain_id,
              username: username,
              password: password,
              domain_id: domain_id,
              after_login: after_login_url,
              two_factor: 'true'
            }

            expect(response).to redirect_to(after_login_url)
          end
        end

        context 'when two-factor is not required' do
          it 'redirects to after_login url' do
            post :create, params: {
              domain_fid: domain_id,
              username: username,
              password: password,
              domain_id: domain_id,
              after_login: after_login_url
            }

            expect(response).to redirect_to(after_login_url)
          end
        end
      end
    end

    context 'when form auth is not allowed' do
      before do
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?).and_return(false)
        allow(controller.main_app).to receive(:root_path).and_return('/dashboard')
      end

      it 'redirects to root path with alert' do
        post :create, params: {
          domain_fid: domain_id,
          username: username,
          password: password,
          domain_id: domain_id
        }

        expect(response).to redirect_to('/dashboard')
        expect(flash[:alert]).to eq('Not allowed!')
      end
    end

    context 'with natural user enforcement' do
      before do
        allow(MonsoonOpenstackAuth.configuration).to receive(:enforce_natural_user).and_return(true)
        allow(MonsoonOpenstackAuth.configuration).to receive(:natural_user_name_pattern).and_return(nil)
      end

      context 'with technical user (invalid)' do
        it 'rejects technical user and renders error' do
          post :create, params: {
            domain_fid: domain_id,
            username: 'technical_user',
            password: password,
            domain_id: domain_id
          }

          expect(response).to render_template(:new)
          expect(flash[:alert]).to eq('Only natural users are allowed to login to the dashboard!')
          expect(assigns(:error)).to eq('Only natural users are allowed to login to the dashboard!')
        end

        it 'does not call create_from_login_form for technical users' do
          expect(MonsoonOpenstackAuth::Authentication::AuthSession)
            .not_to receive(:create_from_login_form)

          post :create, params: {
            domain_fid: domain_id,
            username: 'technical_user',
            password: password,
            domain_id: domain_id
          }
        end
      end

      context 'with natural user (valid D-number)' do
        it 'accepts D-number user' do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: 'D123456',
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
        end

        it 'accepts d-number user (lowercase)' do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: 'd987654',
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
        end

        it 'accepts C-number user' do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: 'C555555',
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
        end

        it 'accepts I-number user' do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: 'I111111',
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
        end
      end

      context 'with custom natural user pattern' do
        before do
          # Custom pattern: allows users starting with "EMP-"
          allow(MonsoonOpenstackAuth.configuration)
            .to receive(:natural_user_name_pattern)
            .and_return(/\AEMP-\d+\z/)
        end

        it 'accepts user matching custom pattern' do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: 'EMP-12345',
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
        end

        it 'rejects user not matching custom pattern' do
          post :create, params: {
            domain_fid: domain_id,
            username: 'CONTRACTOR-123',
            password: password,
            domain_id: domain_id
          }

          expect(response).to render_template(:new)
          expect(flash[:alert]).to eq('Only natural users are allowed to login to the dashboard!')
        end

        it 'still accepts default pattern (D-number)' do
          allow(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:create_from_login_form)
            .and_return(mock_auth_session)

          post :create, params: {
            domain_fid: domain_id,
            username: 'D123456',
            password: password,
            domain_id: domain_id
          }

          expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
        end
      end

      context 'with invalid regex pattern' do
        before do
          allow(MonsoonOpenstackAuth.configuration)
            .to receive(:enforce_natural_user)
            .and_return(true)
          
          # Create a regex that will raise RegexpError when used for matching
          invalid_regex = /(?<foo>bar)(?<foo>baz)/ # duplicate named capture group
          allow(MonsoonOpenstackAuth.configuration)
            .to receive(:natural_user_name_pattern)
            .and_return(invalid_regex)
        end

        it 'handles regex error gracefully and rejects user' do
          post :create, params: {
            domain_fid: domain_id,
            username: 'anyuser',
            password: password,
            domain_id: domain_id
          }

          expect(response).to render_template(:new)
          expect(flash[:alert]).to eq('Only natural users are allowed to login to the dashboard!')
        end
      end
    end
  end

  describe 'GET #two_factor' do
    let(:domain_name) { 'test_domain' }
    let(:mock_user) { double('user', name: 'testuser') }
    let(:mock_session) { double('session', user: mock_user) }

    before do
      allow(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:load_user_from_session)
        .and_return(mock_session)
    end

    it 'loads user from session' do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:load_user_from_session)
        .with(controller, domain: domain_id, domain_name: nil)

      get :two_factor, params: { domain_fid: domain_id, domain_id: domain_id }
    end

    it 'sets username from session user' do
      get :two_factor, params: { domain_fid: domain_id, domain_id: domain_id }

      expect(assigns(:username)).to eq('testuser')
    end

    it 'handles domain_name parameter' do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:load_user_from_session)
        .with(controller, domain: nil, domain_name: domain_name)

      get :two_factor, params: { domain_fid: domain_id, domain_name: domain_name }
    end

    it 'handles nil session gracefully' do
      allow(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:load_user_from_session)
        .and_return(nil)

      get :two_factor, params: { domain_fid: domain_id, domain_id: domain_id }

      expect(assigns(:username)).to be_nil
    end

    it 'handles session without user gracefully' do
      session_without_user = double('session', user: nil)
      allow(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:load_user_from_session)
        .and_return(session_without_user)

      get :two_factor, params: { domain_fid: domain_id, domain_id: domain_id }

      expect(assigns(:username)).to be_nil
    end

    it 'renders two_factor template' do
      get :two_factor, params: { domain_fid: domain_id, domain_id: domain_id }

      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST #check_passcode' do
    let(:username) { 'testuser' }
    let(:passcode) { '123456' }
    let(:mock_user) { double('user', name: username) }
    let(:mock_session) { double('session', user: mock_user) }

    before do
      allow(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:load_user_from_session)
        .and_return(mock_session)
    end

    context 'with valid passcode' do
      before do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:check_two_factor)
          .and_return(true)
      end

      it 'redirects to after_login url' do
        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: username,
          passcode: passcode,
          after_login: after_login_url
        }

        expect(response).to redirect_to(after_login_url)
        expect(flash[:alert]).to be_nil
      end

      it 'redirects to root url when after_login not provided' do
        expected_url = "http://test.host/#{domain_id}"
        allow(controller.main_app).to receive(:root_url)
          .with(domain_id: domain_id)
          .and_return(expected_url)

        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: username,
          passcode: passcode
        }

        expect(response).to redirect_to(expected_url)
      end

      it 'calls check_two_factor with correct parameters' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:check_two_factor)
          .with(controller, username, passcode)
          .and_return(true)

        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: username,
          passcode: passcode
        }
      end
    end

    context 'with invalid passcode' do
      before do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:check_two_factor)
          .and_return(false)
      end

      it 'renders two_factor form with error' do
        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: username,
          passcode: 'wrong_passcode'
        }

        expect(response).to render_template(:two_factor)
        expect(flash[:alert]).to eq('Invalid user or SecurID passcode.')
        expect(assigns(:error)).to eq('Invalid user or SecurID passcode.')
      end
    end

    context 'when username mismatch' do
      it 'renders error when provided username differs from session' do
        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: 'different_user',
          passcode: passcode
        }

        expect(response).to render_template(:two_factor)
        expect(flash[:alert]).to eq("Provided user doesn't match logged in user")
        expect(assigns(:error)).to eq("Provided user doesn't match logged in user")
      end

      it 'does not call check_two_factor when username mismatches' do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession)
          .not_to receive(:check_two_factor)

        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: 'different_user',
          passcode: passcode
        }
      end
    end

    context 'when exception occurs' do
      before do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:load_user_from_session)
          .and_raise(StandardError.new('Session expired'))
      end

      it 'renders two_factor form with error message' do
        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_id: domain_id,
          username: username,
          passcode: passcode
        }

        expect(response).to render_template(:two_factor)
        expect(flash[:alert]).to eq('Session expired')
        expect(assigns(:error)).to eq('Session expired')
      end
    end

    context 'with domain_name instead of domain_id' do
      let(:domain_name) { 'test_domain' }

      it 'handles domain_name parameter' do
        allow(MonsoonOpenstackAuth::Authentication::AuthSession)
          .to receive(:check_two_factor)
          .and_return(true)

        post :check_passcode, params: {
          domain_fid: domain_id,
          domain_name: domain_name,
          username: username,
          passcode: passcode
        }

        expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_name))
      end
    end
  end

  describe 'GET #destroy' do
    let(:domain_name) { 'test_domain' }

    before do
      allow(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:logout)
      # The logout route doesn't require domain_fid, so we don't need special routing setup
    end

    it 'calls logout with domain_name parameter' do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:logout)
        .with(controller, domain_name)

      get :destroy, params: { domain_fid: domain_id, domain_name: domain_name }
    end

    it 'redirects to custom redirect_to url when provided' do
      custom_url = 'http://test.host/custom-logout'

      get :destroy, params: {
        domain_fid: domain_id,
        domain_name: domain_name,
        redirect_to: custom_url
      }

      expect(response).to redirect_to(custom_url)
    end

    it 'redirects to root url when redirect_to not provided' do
      expected_url = 'http://test.host/'
      allow(controller.main_app).to receive(:root_url).and_return(expected_url)

      get :destroy, params: { domain_fid: domain_id, domain_name: domain_name }

      expect(response).to redirect_to(expected_url)
    end

    it 'handles logout without domain_name' do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:logout)
        .with(controller, nil)

      get :destroy, params: { domain_fid: domain_id }
    end

    it 'clears session' do
      get :destroy, params: { domain_fid: domain_id, domain_name: domain_name }

      expect(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to have_received(:logout)
    end
  end

  describe 'safe_redirect_url?' do
    let(:username) { 'testuser' }
    let(:password) { 'password123' }

    before do
      allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?).and_return(true)
      allow(MonsoonOpenstackAuth::Authentication::AuthSession)
        .to receive(:create_from_login_form)
        .and_return(mock_auth_session)
    end

    context 'with safe relative URLs' do
      it 'accepts relative URL' do
        post :create, params: {
          domain_fid: domain_id,
          username: username,
          password: password,
          domain_id: domain_id,
          after_login: '/dashboard/projects'
        }

        expect(response).to redirect_to('/dashboard/projects')
      end
    end

    context 'with same-host URLs' do
      it 'accepts URL from same host' do
        allow(controller.request).to receive(:host).and_return('test.host')

        post :create, params: {
          domain_fid: domain_id,
          username: username,
          password: password,
          domain_id: domain_id,
          after_login: 'http://test.host/dashboard'
        }

        expect(response).to redirect_to('http://test.host/dashboard')
      end
    end

    context 'with unsafe URLs' do
      it 'rejects URL from different host' do
        allow(controller.request).to receive(:host).and_return('test.host')

        post :create, params: {
          domain_fid: domain_id,
          username: username,
          password: password,
          domain_id: domain_id,
          after_login: 'http://evil.com/phishing'
        }

        # Should redirect to the safe default (root_url with domain_id)
        expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
      end

      it 'rejects blank URL' do
        post :create, params: {
          domain_fid: domain_id,
          username: username,
          password: password,
          domain_id: domain_id,
          after_login: ''
        }

        # Should redirect to the safe default (root_url with domain_id)
        expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
      end

      it 'rejects malformed URL' do
        allow(controller.request).to receive(:host).and_return('test.host')

        post :create, params: {
          domain_fid: domain_id,
          username: username,
          password: password,
          domain_id: domain_id,
          after_login: 'ht!tp://invalid url with spaces'
        }

        # Should redirect to the safe default (root_url with domain_id)
        expect(response).to redirect_to(controller.main_app.root_url(domain_id: domain_id))
      end
    end
  end
end
