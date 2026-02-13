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
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test', 'secret').and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('me', 'me').and_return(nil)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test', 'test', anything).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_token).with(anything, anything).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_external_user).and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).with('good_key').and_return(test_token)
    allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).with('bad_key').and_return(nil)
  end

  context 'two factor is required' do
    subject { MonsoonOpenstackAuth::Authentication::AuthSession }
    describe '::check_authentication' do
    
      before :each do
        @controller = double('controller',
          params: { after_login: "login", domain_id: "test" },
          request: double('request').as_null_object,
          monsoon_openstack_auth: double('auth-routes'),
        )

        # Set up new_session_path to accept parameters
        allow(@controller.monsoon_openstack_auth).to receive(:new_session_path) do |*args|
          if args.any?
            "http://localhost/auth/sessions/new"
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
          ).with(hash_including(domain_fid: "test", after_login: "login"))
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
            .with(hash_including(after_login: "login", domain_fid: "test", domain_id: nil, domain_name: nil))
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
      authentication_required region: ->(c) { c.params[:region_id] }, domain: ->(c) { c.params[:domain] }, project: ->(c) { c.params[:project] }

      def index
        head :ok
      end
    end

    context 'token auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { true  }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?)  { false }
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
          @token_store = MonsoonOpenstackAuth::Authentication::TokenStore.new(controller.session)
          @token_store.set_token test_token
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
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { true }
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

      context 'valid basic auth presented' do
        it 'should authenticate user' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).and_return({})
          request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
          get 'index'
          expect(controller.current_user).not_to be(nil)
        end
      end
    end

    context 'sso auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?)  { true }
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

          get 'index', params: {access_key: 'good_key'}
          expect(controller.current_user).not_to be(nil)
        end
      end

      context 'valid rails_auth_token  presented' do
        it 'should authenticate user' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_access_key).and_return({})

          get 'index', params: {rails_auth_token: 'good_key'}
          expect(controller.current_user).not_to be(nil)
        end
      end

      context 'invalid access key param presented' do
        it "should redirect to main app's root path" do
          get 'index', params: {access_key: 'bad_key'}
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end

      context 'invalid rails_auth_token  param presented' do
        it "should redirect to main app's root path" do
          get 'index', params: {rails_auth_token: 'bad_key'}
          expect(response).to redirect_to(controller.main_app.root_path)
          expect(flash[:notice]).to eq 'User is not authenticated!'
        end
      end
    end

    context 'form auth is allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?)  { false }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?)  { false }
      end

      context 'session token not presented' do
        it 'should authenticate user from auth token' do
          get 'index'
          expect(response).to redirect_to(controller.monsoon_openstack_auth.login_path)
        end

        it 'should authenticate user from auth token by given domain_id' do
          get 'index', params: {region_id: 'europe', domain: 'default'}
          expect(response).to redirect_to(controller.monsoon_openstack_auth.login_path('default'))
        end
      end

      context 'session token presented' do
        before do
          @token_store = MonsoonOpenstackAuth::Authentication::TokenStore.new(controller.session)
          @token_store.set_token test_token
        end

        it 'should authenticate user from session token' do
          get 'index', params: {domain: test_token_scope[:domain_id], project: test_token_scope[:project_id]}
          expect(controller.current_user).not_to be(nil)
          expect(controller.current_user.token).to eq(test_token[:value])
        end
      end
    end

    context 'all auth methods are allowed' do
      before :each do
        allow(MonsoonOpenstackAuth.configuration).to receive(:token_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:basic_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:sso_auth_allowed?)  { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:form_auth_allowed?) { true }
        allow(MonsoonOpenstackAuth.configuration).to receive(:access_key_auth_allowed?)  { true }
      end

      it 'authenticates from session' do
        @token_store = MonsoonOpenstackAuth::Authentication::TokenStore.new(controller.session)
        @token_store.set_token(test_token)

        request.headers['X-Auth-Token'] = test_token[:value]
        request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # todo
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        # allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:get_rescoped_token).and_return(true)

        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:validate_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_external_user)

        get 'index', params: {domain: test_token_domain, project: test_token_project}
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
      end

      it 'authenticates from auth token' do
        request.headers['X-Auth-Token'] = test_token[:value]
        request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # todo
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:validate_token).and_return(test_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_external_user)

        get 'index', params: {domain: test_token_domain, project: test_token_project}
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
        expect(MonsoonOpenstackAuth.api_client).to have_received(:validate_token)
      end

      it 'authenticates from sso' do
        domain = double('domain')
        allow(domain).to receive(:id).and_return('o-default')

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:domain_by_name).with('default').and_return(domain)

        request.env['HTTP_AUTHORIZATION'] = ActionController::HttpAuthentication::Basic.encode_credentials('test', 'secret')
        request.env['HTTP_SSL_CLIENT_VERIFY'] = 'SUCCESS'
        # TODO
        request.env['HTTP_SSL_CLIENT_CERT'] = '--a certificate--'

        allow_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_external_user).and_return(test_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:validate_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_token)
        expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).not_to receive(:authenticate_with_credentials)

        get 'index', params: {domain: test_token_domain, project: test_token_project}
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

        get 'index', params: {domain: test_token_domain, project: test_token_project}
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

        get 'index', params: {access_key: 'good_key', domain: test_token_domain, project: test_token_project}
        expect(controller.current_user).not_to be(nil)
        expect(controller.current_user.token).to eq(test_token[:value])
        expect(MonsoonOpenstackAuth.api_client).to have_received(:authenticate_with_access_key)
      end
    end

    describe '::create_from_login_form' do
      context 'domain_name is nil' do
        it 'should call authenticate using id and password' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test', 'test', nil)
          MonsoonOpenstackAuth::Authentication::AuthSession.create_from_login_form(controller, 'test', 'test')
        end
      end
      context 'domain_id is not nil' do
        it 'should call authenticate using id and password' do
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test', 'test', domain: 'test_domain')
          MonsoonOpenstackAuth::Authentication::AuthSession.create_from_login_form(controller, 'test', 'test', domain_id: 'test_domain')
        end
      end
      context 'domain_name is not nil' do
        it 'should call authenticate using id and password' do
          # allow(@driver).to receive(:authenticate).with({ auth: { identity: { methods: ["password"], password:{user: {name: 'test', password: 'test', domain: {id: 'test_domain'} } } } } })
          expect_any_instance_of(MonsoonOpenstackAuth::ApiClient).to receive(:authenticate_with_credentials).with('test', 'test', domain_name: 'test_domain')
          MonsoonOpenstackAuth::Authentication::AuthSession.create_from_login_form(controller, 'test', 'test', domain_name: 'test_domain')
        end
      end
    end

    describe '::check_authentication' do
      context 'not authenticated' do
        it 'raise not_authorized_error if not authenticated' do
          allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(false)

          expect do
            MonsoonOpenstackAuth::Authentication::AuthSession.check_authentication(controller, domain: 'aaa', project: 'bbb', raise_error: true)
          end.to raise_error(MonsoonOpenstackAuth::Authentication::NotAuthorized)
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
end
