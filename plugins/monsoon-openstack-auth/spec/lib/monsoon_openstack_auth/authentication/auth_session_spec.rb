require 'spec_helper'

describe MonsoonOpenstackAuth::Authentication::AuthSession do
  test_token = HashWithIndifferentAccess.new(ApiStub.keystone_token.merge('expires_at' => (Time.now + 1.hour).to_s))
  test_token_domain = test_token.fetch('domain', {}).fetch('id', nil)
  test_token_project = test_token.fetch('project', {}).fetch('id', nil)

  test_token_scope = {
    domain_id: (test_token.fetch('project', {}).fetch('domain', nil) || test_token.fetch('domain', {}))['id'],
    domain_name: (test_token.fetch('project', {}).fetch('domain', nil) || test_token.fetch('domain', {}))['name'],
    project_id: test_token.fetch('project', {})['id'],
    project_name: test_token.fetch('project', {})['name']
  }

  before :each do
    MonsoonOpenstackAuth.configure do |config|
      config.connection_driver.api_endpoint = 'http://localhost:5000/v3/auth/tokens'
    end

    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).with(test_token[:value]).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).with('INVALID_TOKEN').and_return(nil)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test',
                                                                                                           'secret').and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('me',
                                                                                                           'me').and_return(nil)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test',
                                                                                                           'test', anything).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_token).with(anything,
                                                                                                     anything).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_external_user).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).with('good_key').and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).with('bad_key').and_return(nil)
  end

  context 'two factor is required' do
    subject { MonsoonOpenstackAuth::Authentication::AuthSession }
    describe '::check_authentication' do
      before :each do
        @controller = double('controller',
                             params: { after_login: 'login', domain_id: 'test' },
                             request: double('request').as_null_object,
                             monsoon_openstack_auth: double('auth-routes'))

        # Set up new_session_path to accept parameters
        allow(@controller.monsoon_openstack_auth).to receive(:new_session_path) do |*args|
          if args.any?
            'http://localhost/auth/sessions/new'
          else
            'http://localhost/auth/sessions/new'
          end
        end

        allow(@controller.monsoon_openstack_auth).to receive(:two_factor_path).and_return('http://localhost/auth/sessions/passcode')
      end

      context 'user is not authenticated' do
        before :each do
          allow_any_instance_of(subject).to receive(:authenticated?).and_return false
        end

        it 'should redirect user to login form' do
          expect(@controller.monsoon_openstack_auth).to receive(
            :new_session_path
          ).with(hash_including(domain_fid: 'test', after_login: 'login'))
          expect(@controller).to receive(:redirect_to).with('http://localhost/auth/sessions/new', two_factor: true)
          subject.check_authentication(@controller, two_factor: true)
        end
      end

      context 'user is authenticated but without two factor' do
        before :each do
          allow_any_instance_of(subject).to receive(:authenticated?).and_return true
        end

        it 'should redirect user to login form' do
          expect(@controller.monsoon_openstack_auth).to receive(:two_factor_path)
            .with(hash_including(after_login: 'login', domain_fid: 'test', domain_id: nil, domain_name: nil))
          expect(@controller).to receive(:redirect_to).with('http://localhost/auth/sessions/passcode')
          subject.check_authentication(@controller, two_factor: true)
        end
      end

      context 'user is authenticated and two factor is ok' do
        before :each do
          allow_any_instance_of(subject).to receive(:authenticated?).and_return true
          allow(subject).to receive(:two_factor_cookie_valid?).and_return true
        end

        it 'should redirect user to login form' do
          expect(subject.check_authentication(@controller, two_factor: true)).to be_a(subject)
        end
      end
    end
  end

  context 'included in controller', type: :controller do
    before do
      allow(controller.main_app).to receive(:root_path).and_return('/')
      allow(controller.monsoon_openstack_auth).to receive(:new_session_path).and_return('/auth/sessions/new')
      allow(controller.monsoon_openstack_auth).to receive(:login_path).and_return('/auth/sessions/new')
    end

    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      authentication_required region: ->(c) { c.params[:region_id] }, domain: lambda { |c|
        c.params[:domain]
      }, project: lambda { |c|
           c.params[:project]
         }

      def index
        head :ok
      end
    end

    context 'token auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?) { false }
      end

      context 'no auth token presented' do
        it "should redirect to main app's root path" do
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'invalid auth token' do
        it "should redirect to main app's root path" do
          request.headers['X-Auth-Token'] = 'INVALID_TOKEN'
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'session token not presented' do
        it 'should authenticate user from auth token' do
          request.headers['X-Auth-Token'] = test_token[:value]
          get 'index'
          expect(controller.current_user).not_to be(nil)
          expect(controller.current_user.token).to eq(test_token[:value])
        end
      end

      context 'session token presented' do
        before do
          # Store token directly in session (cookie-based sessions)
          controller.session[:auth_token_value] = test_token[:value]
        end

        it 'should authenticate user from session token' do
          request.headers['X-Auth-Token'] = test_token[:value]
          get 'index'
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:validate_token)
        end
      end
    end

    context 'basic auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false } # HTTP Basic Auth removed
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?)  { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?) { false }
      end

      context 'no basic auth presented' do
        it "should redirect to main app's root path" do
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'wrong basic auth credentials' do
        it "should redirect to main app's root path" do
          request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('me', 'me')
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      # HTTP Basic Auth support was removed in the cookie-based session migration
      # Keeping this test but expecting it to fail authentication since basic auth is disabled
      context 'valid basic auth presented' do
        it 'should not authenticate user (basic auth removed)' do
          request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end
    end

    context 'sso auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?) { false }
      end

      context 'no sso header presented' do
        it "should redirect to main app's root path" do
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'valid sso header presented' do
        it 'should authenticate user' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_external_user).and_return(
            {}
          )
          request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
          request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

          get 'index'
          expect(controller.current_user).not_to be(nil)
        end
      end
    end

    context 'acccess_key auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { false }
      end

      context 'no access key param presented' do
        it "should redirect to main app's root path" do
          get 'index'
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'valid access key  presented' do
        it 'should authenticate user' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).and_return({})

          get 'index', params: { access_key: 'good_key' }
          expect(controller.current_user).not_to be(nil)
        end
      end

      context 'valid rails_auth_token  presented' do
        it 'should authenticate user' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).and_return({})

          get 'index', params: { rails_auth_token: 'good_key' }
          expect(controller.current_user).not_to be(nil)
        end
      end

      context 'invalid access key param presented' do
        it "should redirect to main app's root path" do
          get 'index', params: { access_key: 'bad_key' }
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'invalid rails_auth_token  param presented' do
        it "should redirect to main app's root path" do
          get 'index', params: { rails_auth_token: 'bad_key' }
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end
    end

    context 'form auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?) { false }
      end

      context 'session token not presented' do
        it 'should authenticate user from auth token' do
          get 'index'
          expect(response).to redirect_to(controller.monsoon_openstack_auth.login_path)
        end

        it 'should authenticate user from auth token by given domain_id' do
          get 'index', params: { region_id: 'europe', domain: 'default' }
          expect(response).to redirect_to(controller.monsoon_openstack_auth.login_path('default'))
        end
      end

      context 'session token presented' do
        before do
          # Store token directly in session (cookie-based sessions)
          controller.session[:auth_token_value] = test_token[:value]
        end

        it 'should authenticate user from session token' do
          get 'index', params: { domain: test_token_scope[:domain_id], project: test_token_scope[:project_id] }
          expect(controller.current_user).not_to be(nil)
          expect(controller.current_user.token).to eq(test_token[:value])
        end
      end
    end

    context 'all auth methods are allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?) { true }
      end

      it 'authenticates from session' do
        # Store token directly in session (cookie-based sessions)
        controller.session[:auth_token_value] = test_token[:value]

        request.headers['X-Auth-Token'] = test_token[:value]
        request.env['HTTP_AUTHORIZATION'] =
          ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # todo
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        # allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:get_rescoped_token).and_return(true)

        # With cookie-based sessions, the token value is stored but the full token object is not cached
        # So validate_token will be called to get the full token object, but other auth methods won't be tried
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_external_user)

        get 'index', params: { domain: test_token_domain, project: test_token_project }
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
      end

      it 'authenticates from auth token' do
        request.headers['X-Auth-Token'] = test_token[:value]
        request.env['HTTP_AUTHORIZATION'] =
          ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # todo
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).and_return(test_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_external_user)

        get 'index', params: { domain: test_token_domain, project: test_token_project }
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
        expect(MonsoonOpenstackAuth.api_client).to have_received(:validate_token)
      end

      it 'authenticates from sso' do
        domain = double('domain')
        allow(domain).to receive(:id).and_return('o-default')

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:domain_by_name).with('default').and_return(domain)

        request.env['HTTP_AUTHORIZATION'] =
          ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # TODO
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_external_user).and_return(test_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:validate_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)

        get 'index', params: { domain: test_token_domain, project: test_token_project }
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
        expect(MonsoonOpenstackAuth.api_client).to have_received(
          :authenticate_external_user
        ).with(
          {
            'SSL-Client-Verify' => 'SUCCESS',
            'SSL-Client-Cert' => '--a certificate--'
          }, 'unscoped'
        )
      end

      it 'authenticate from sso ignoring domain' do
        domain = double('domain')
        allow(domain).to receive(:id).and_return('o-default')

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(
          :domain_by_name
        ).with('default').and_return(domain)

        request.env['HTTP_AUTHORIZATION'] =
          ActionController::HttpAuthentication::Basic.encode_credentials(
            'test', 'secret'
          )
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # todo
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_external_user).and_return(test_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:validate_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)

        get 'index', params: { domain: test_token_domain, project: test_token_project }
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])

        expect(MonsoonOpenstackAuth.api_client).to have_received(
          :authenticate_external_user
        ).with(
          {
            'SSL-Client-Verify' => 'SUCCESS',
            'SSL-Client-Cert' => '--a certificate--'
          }, 'unscoped'
        )
      end

      it 'authenticates from access_key' do
        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).and_return(test_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:validate_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_external_user)

        get 'index', params: { access_key: 'good_key', domain: test_token_domain, project: test_token_project }
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
        expect(MonsoonOpenstackAuth.api_client).to have_received(:authenticate_with_access_key)
      end
    end

    describe '::create_from_login_form' do
      context 'domain_name is nil' do
        it 'should call authenticate using id and password' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with(
            'test', 'test', nil
          )
          MonsoonOpenstackAuth::Authentication::AuthSession.create_from_login_form(controller, 'test', 'test')
        end
      end
      context 'domain_id is not nil' do
        it 'should call authenticate using id and password' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with(
            'test', 'test', domain: 'test_domain'
          )
          MonsoonOpenstackAuth::Authentication::AuthSession.create_from_login_form(controller, 'test', 'test',
                                                                                   domain_id: 'test_domain')
        end
      end
      context 'domain_name is not nil' do
        it 'should call authenticate using id and password' do
          # allow(@driver).to receive(:authenticate).with({ auth: { identity: { methods: ["password"], password:{user: {name: 'test', password: 'test', domain: {id: 'test_domain'} } } } } })
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with(
            'test', 'test', domain_name: 'test_domain'
          )
          MonsoonOpenstackAuth::Authentication::AuthSession.create_from_login_form(controller, 'test', 'test',
                                                                                   domain_name: 'test_domain')
        end
      end
    end

    describe '::check_authentication' do
      context 'not authenticated' do
        it 'raise not_authenticated_error if not authenticated' do
          allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(false)

          expect do
            MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller, domain: 'aaa',
                                                                                               project: 'bbb', raise_error: true)
          end.to raise_error(MonsoonOpenstackAuth::Authentication::NotAuthenticated)
        end

        it 'redirect if not authenticated' do
          c = double('controller').as_null_object
          allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(false)
          expect_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:redirect_to_login_form_url).and_return 'http://localhost/auth/sessions/new'
          expect(c).to receive(:redirect_to).with('http://localhost/auth/sessions/new', two_factor: true)
          MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(c, domain: 'aaa', project: 'bbb')
        end
      end
    end
  end

  describe '#validate_session_token with cross-dashboard cookie scope mismatch' do
    let(:test_controller) do
      double('controller',
             params: {},
             session: { auth_token_value: nil },
             request: double('request',
                             host: 'dashboard.example.com',
                             cookies: { Rails.configuration.cross_dashboard_cookie_name => test_token[:value] },
                             headers: {}),
             response: double('response').as_null_object)
    end

    let(:token_domain_a) do
      test_token.merge('domain' => { 'id' => 'domain-a-id', 'name' => 'domain-a' })
    end

    before do
      # Token from cookie is for domain-a
      allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token)
        .with(test_token[:value]).and_return(token_domain_a)
    end

    it 'should delete cross-dashboard cookie when scope mismatch occurs' do
      # Request for domain-b but token is for domain-a
      session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-b-id' })

      # Expect the cookie to be deleted
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:delete_cross_dashboard_cookie)
        .with(test_controller)

      result = session.validate_session_token

      expect(result).to be false
    end

    it 'should log the scope mismatch with source information' do
      # Enable debug mode to trigger logging
      allow(MonsoonOpenstackAuth.configuration).to receive(:debug?).and_return(true)

      session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-b-id' })

      # Mock the logger to verify both log messages
      allow(MonsoonOpenstackAuth.logger).to receive(:info)
      expect(MonsoonOpenstackAuth.logger).to receive(:info)
        .with(/Token scope mismatch \(source: cross_dashboard_cookie\)/).ordered
      expect(MonsoonOpenstackAuth.logger).to receive(:info)
        .with('Deleting stale cross-dashboard cookie due to scope mismatch.').ordered

      session.validate_session_token
    end

    it 'should accept token when scope is empty (nil values)' do
      # Scope with nil values (like in controller tests)
      session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: nil, project: nil })

      result = session.validate_session_token

      expect(result).to be true
    end
  end

  describe '#validate_session_token with expired token' do
    context 'when session token is expired' do
      let(:expired_token_value) { 'EXPIRED_TOKEN_123' }
      let(:test_controller) do
        double('controller',
               params: {},
               session: { auth_token_value: expired_token_value },
               request: double('request',
                               host: 'dashboard.example.com',
                               cookies: {},
                               headers: {}),
               response: double('response').as_null_object)
      end

      before do
        # Mock validate_token to return nil for expired token
        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token)
          .with(expired_token_value).and_return(nil)
      end

      it 'should clear session token when validation returns nil' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        result = session.validate_session_token

        expect(result).to be false
        expect(test_controller.session[:auth_token_value]).to be_nil
      end

      it 'should log token clearing with source information' do
        allow(MonsoonOpenstackAuth.configuration).to receive(:debug?).and_return(true)

        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        # Allow any info calls
        allow(MonsoonOpenstackAuth.logger).to receive(:info)
        # But expect the specific one we care about
        expect(MonsoonOpenstackAuth.logger).to receive(:info)
          .with(/Token validation failed \(token is nil\), clearing stale token \(source: session\)/)

        session.validate_session_token
      end
    end

    context 'when cross-dashboard cookie token is expired' do
      let(:expired_token_value) { 'EXPIRED_COOKIE_TOKEN_456' }
      let(:test_controller) do
        double('controller',
               params: {},
               session: { auth_token_value: nil },
               request: double('request',
                               host: 'dashboard.example.com',
                               cookies: { Rails.configuration.cross_dashboard_cookie_name => expired_token_value },
                               headers: {}),
               response: double('response').as_null_object)
      end

      before do
        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token)
          .with(expired_token_value).and_return(nil)
      end

      it 'should delete cross-dashboard cookie when token validation fails' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:delete_cross_dashboard_cookie)
          .with(test_controller)

        result = session.validate_session_token

        expect(result).to be false
      end

      it 'should log token clearing with source information' do
        allow(MonsoonOpenstackAuth.configuration).to receive(:debug?).and_return(true)

        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        allow(MonsoonOpenstackAuth.logger).to receive(:info)
        expect(MonsoonOpenstackAuth.logger).to receive(:info)
          .with(/Token validation failed \(token is nil\), clearing stale token \(source: cross_dashboard_cookie\)/)

        session.validate_session_token
      end
    end

    context 'when both session and cross-dashboard cookie have the same expired token' do
      let(:expired_token_value) { 'EXPIRED_SHARED_TOKEN_789' }
      let(:test_controller) do
        double('controller',
               params: {},
               session: { auth_token_value: expired_token_value },
               request: double('request',
                               host: 'dashboard.example.com',
                               cookies: { Rails.configuration.cross_dashboard_cookie_name => expired_token_value },
                               headers: {}),
               response: double('response').as_null_object)
      end

      before do
        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token)
          .with(expired_token_value).and_return(nil)
      end

      it 'should clear both session token and cross-dashboard cookie' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:delete_cross_dashboard_cookie)
          .with(test_controller)

        result = session.validate_session_token

        expect(result).to be false
        expect(test_controller.session[:auth_token_value]).to be_nil
      end
    end

    context 'when token validation throws an exception' do
      let(:invalid_token_value) { 'MALFORMED_TOKEN' }
      let(:test_controller) do
        double('controller',
               params: {},
               session: { auth_token_value: invalid_token_value },
               request: double('request',
                               host: 'dashboard.example.com',
                               cookies: {},
                               headers: {}),
               response: double('response').as_null_object)
      end

      before do
        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token)
          .with(invalid_token_value).and_raise(Excon::Errors::Unauthorized.new('Unauthorized'))
      end

      it 'should clear session token on exception' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        result = session.validate_session_token

        expect(result).to be false
        expect(test_controller.session[:auth_token_value]).to be_nil
      end

      it 'should log the exception with source information' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})

        expect(MonsoonOpenstackAuth.logger).to receive(:error)
          .with(/token validation failed \(exception:.*Unauthorized\), clearing stale token \(source: session\)/)

        session.validate_session_token
      end
    end
  end

  describe '#token_domain_matches_scope_domain?' do
    let(:test_controller) do
      double('controller',
             params: {},
             session: {},
             request: double('request',
                             host: 'dashboard.example.com',
                             cookies: {},
                             headers: {}),
             response: double('response').as_null_object)
    end

    context 'with unscoped token' do
      let(:unscoped_token) do
        {
          user: { domain: { id: 'domain-a', name: 'Domain A' } },
          expires_at: (Time.now + 1.hour).to_s,
          value: 'unscoped_token_123'
        }
      end

      it 'should use user domain as fallback when token is unscoped' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-a' })
        result = session.send(:token_domain_matches_scope_domain?, unscoped_token)
        expect(result).to be true
      end

      it 'should reject when user domain does not match requested scope' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-b' })
        result = session.send(:token_domain_matches_scope_domain?, unscoped_token)
        expect(result).to be false
      end

      it 'should accept when scope is empty' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, {})
        result = session.send(:token_domain_matches_scope_domain?, unscoped_token)
        expect(result).to be true
      end

      it 'should accept when scope has nil values' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: nil, project: nil })
        result = session.send(:token_domain_matches_scope_domain?, unscoped_token)
        expect(result).to be true
      end
    end

    context 'with domain-scoped token' do
      let(:domain_token) do
        {
          user: { domain: { id: 'domain-a', name: 'Domain A' } },
          domain: { id: 'domain-a', name: 'Domain A' },
          expires_at: (Time.now + 1.hour).to_s,
          value: 'domain_token_123'
        }
      end

      it 'should match when token domain equals requested domain' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-a' })
        result = session.send(:token_domain_matches_scope_domain?, domain_token)
        expect(result).to be true
      end

      it 'should reject when token domain does not match requested domain' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-b' })
        result = session.send(:token_domain_matches_scope_domain?, domain_token)
        expect(result).to be false
      end
    end

    context 'with project-scoped token' do
      let(:project_token) do
        {
          user: { domain: { id: 'domain-a', name: 'Domain A' } },
          project: {
            id: 'project-123',
            name: 'Test Project',
            domain: { id: 'domain-a', name: 'Domain A' }
          },
          expires_at: (Time.now + 1.hour).to_s,
          value: 'project_token_123'
        }
      end

      it 'should match when project and domain both match' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-a', project: 'project-123' })
        result = session.send(:token_domain_matches_scope_domain?, project_token)
        expect(result).to be true
      end

      it 'should reject when project matches but domain does not' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-b', project: 'project-123' })
        result = session.send(:token_domain_matches_scope_domain?, project_token)
        expect(result).to be false
      end

      it 'should reject when domain matches but project does not' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain: 'domain-a', project: 'project-999' })
        result = session.send(:token_domain_matches_scope_domain?, project_token)
        expect(result).to be false
      end

      it 'should match when only project is requested (no domain in scope)' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { project: 'project-123' })
        result = session.send(:token_domain_matches_scope_domain?, project_token)
        expect(result).to be true
      end
    end

    context 'with domain name matching' do
      let(:domain_token_with_name) do
        {
          user: { domain: { id: 'domain-a', name: 'Domain A' } },
          domain: { id: 'domain-a', name: 'Domain A' },
          expires_at: (Time.now + 1.hour).to_s,
          value: 'domain_token_name_123'
        }
      end

      it 'should match by domain name' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain_name: 'Domain A' })
        result = session.send(:token_domain_matches_scope_domain?, domain_token_with_name)
        expect(result).to be true
      end

      it 'should reject when domain name does not match' do
        session = MonsoonOpenstackAuth::Authentication::AuthSession.new(test_controller, { domain_name: 'Domain B' })
        result = session.send(:token_domain_matches_scope_domain?, domain_token_with_name)
        expect(result).to be false
      end
    end
  end
end
