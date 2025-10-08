require 'spec_helper'

describe MonsoonOpenstackAuth::Authentication, type: :controller do
  before do
    auth_session = double("auth_session").as_null_object
    # Replace FactoryGirl with a simple user stub
    user_stub = double("user", 
      id: 1, 
      name: "Test User", 
      email: "test@example.com",
      member?: true
    ).as_null_object
    allow(auth_session).to receive(:user).and_return(user_stub)
    allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_return(auth_session)
  end

  context "skip authentication for an action" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required region: ->(c) { c.params[:region_id] }, 
                             domain: ->(c) { c.params[:domain_id] }, 
                             project: ->(c) { c.params[:project_id] }
      
      skip_authentication only: [:new]
      
      def index
        head :ok
      end
      
      def new
        head :ok
      end
    end

    it "should require authentication" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
      get :index
    end

    it "should skip authentication" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).not_to receive(:check_authentication)
      get :new
    end
  end

  context "skip authentication for all actions" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required region: ->(c) { c.params[:region_id] }, 
                             domain: ->(c) { c.params[:domain_id] }, 
                             project: ->(c) { c.params[:project_id] }
      
      skip_authentication
      
      def index
        head :ok
      end
      
      def new
        head :ok
      end
    end

    it "should not require authentication for index" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).not_to receive(:check_authentication)
      get :index
    end

    it "should not require authentication for new" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).not_to receive(:check_authentication)
      get :new
    end
  end

  context "ignore empty scope" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      def self.name
        "DomainController"
      end

      authentication_required region: ->(c) { c.params[:region_id] }, 
                             domain: ->(c) { nil }, 
                             project: ->(c) { "" }
      
      def index
        head :ok
      end
    end

    it "authentication should ignore empty domain and project" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
        .with(controller, hash_including(domain: nil, domain_name: nil, project: nil, raise_error: nil))
      get :index
    end
  end

  context "scope not nil" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required region: ->(c) { c.params[:region_id] }, 
                             organization: :get_org, 
                             project: ->(c) { c.params[:project_id] }
      
      def index
        head :ok
      end
      
      def get_org
        params[:organization_id]
      end
    end

    it "authenticate with scope o-12345 and p-12345" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
        .with(controller, hash_including(domain: "o-12345", domain_name: nil, project: "p-12345", raise_error: nil))
      get :index, params: { organization_id: 'o-12345', project_id: 'p-12345' }
    end

    it "authenticate with empty scope" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
        .with(controller, hash_including(domain: nil, domain_name: nil, project: nil, raise_error: nil))
      get :index, params: { organization_id: '', project_id: '' }
    end
  end

  context "api_authentication_required" do
    before do
      allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_call_original
    end

    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      api_authentication_required domain: ->(c) { c.params[:domain_id] }, 
                                  project: ->(c) { c.params[:project_id] }
      
      def index
        head :ok
      end
    end

    it "authenticate without redirect" do
      expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
        .with(controller, hash_including(domain: "aaa", domain_name: nil, project: "bbb", raise_error: true))
        .and_return(nil)
      get :index, params: { domain_id: 'aaa', project_id: 'bbb' }
    end

    it "should raise a not_authorized_error if not authenticated" do
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(false)
      expect { 
        get :index, params: { domain_id: 'aaa', project_id: 'bbb' } 
      }.to raise_error(MonsoonOpenstackAuth::Authentication::NotAuthorized)
    end

    it "should raise not_authorized_error on forbidden scope" do
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(true)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:rescope_token).and_raise(MonsoonOpenstackAuth::Authentication::NotAuthorized)
      expect { 
        get :index, params: { domain_id: 'aaa', project_id: 'bbb' } 
      }.to raise_error(MonsoonOpenstackAuth::Authentication::NotAuthorized)
    end

    it "should not raise a not_authorized_error when rescope_token returns true" do
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(true)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:rescope_token).and_return(true)
      expect { 
        get :index, params: { domain_id: 'aaa', project_id: 'bbb' } 
      }.not_to raise_error
    end

    it "should not raise a not_authorized_error when rescope_token returns false" do
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(true)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:rescope_token).and_return(false)
      expect { 
        get :index, params: { domain_id: 'aaa', project_id: 'bbb' } 
      }.not_to raise_error
    end
  end

  describe 'two factor parameter' do
    context 'two_factor parameter is true' do
      controller(ActionController::Base) do # anonymous subclass of ActionController::Base
        include MonsoonOpenstackAuth::Authentication
        
        authentication_required domain: ->(c) { c.params[:domain_id] }, 
                               project: ->(c) { c.params[:project_id] }, 
                               two_factor: true
        
        def index
          head :ok
        end
      end

      it "should set two_factor parameter to true" do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
          .with(controller, hash_including(domain: nil, domain_name: nil, project: nil, raise_error: nil, two_factor: true))
          .and_return(nil)
        get :index
      end
    end

    context 'two_factor parameter is a method' do
      controller(ActionController::Base) do # anonymous subclass of ActionController::Base
        include MonsoonOpenstackAuth::Authentication
        
        authentication_required domain: ->(c) { c.params[:domain_id] }, 
                               project: ->(c) { c.params[:project_id] }, 
                               two_factor: :two_factor
        
        def index
          head :ok
        end
        
        def two_factor
          true
        end
      end

      it "should set two_factor parameter to true" do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
          .with(controller, hash_including(domain: nil, domain_name: nil, project: nil, raise_error: nil, two_factor: true))
          .and_return(nil)
        get :index
      end
    end

    context 'two_factor parameter is a proc' do
      controller(ActionController::Base) do # anonymous subclass of ActionController::Base
        include MonsoonOpenstackAuth::Authentication
        
        authentication_required domain: ->(c) { c.params[:domain_id] }, 
                               project: ->(c) { c.params[:project_id] }, 
                               two_factor: ->(c) { false }
        
        def index
          head :ok
        end
        
        def two_factor
          true
        end
      end

      it "should set two_factor parameter to false" do
        expect(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication)
          .with(controller, hash_including(domain: nil, domain_name: nil, project: nil, raise_error: nil, two_factor: false))
          .and_return(nil)
        get :index
      end
    end
  end

  context "authentication_required" do
    before do
      MonsoonOpenstackAuth.configure do |config|
        config.connection_driver.api_endpoint = "http://localhost:5000/v3/auth/tokens"
      end
      allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_call_original
    end

    class TestUrlHelper 
      def new_session_path(id=nil); '/auth/sessions/new'; end
    end
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required domain: ->(c) { c.params[:domain_id] }, 
                             project: ->(c) { c.params[:project_id] }
      
      def index
        head :ok
      end
      
      # Mock the routing helpers
      def monsoon_openstack_auth
        @monsoon_openstack_auth ||= TestUrlHelper.new
      end
    end

    it "do not redirect -> raise error" do
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(true)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:rescope_token).and_raise(MonsoonOpenstackAuth::Authentication::NotAuthorized)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:redirect_to_login_form).and_return(true)
      
      expect { 
        get :index, params: { domain_id: 'aaa', project_id: 'bbb' } 
      }.to raise_error(MonsoonOpenstackAuth::Authentication::NotAuthorized)
    end

    it "redirect to login form" do
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:authenticated?).and_return(false)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:rescope_token).and_raise(MonsoonOpenstackAuth::Authentication::NotAuthorized)
      allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:redirect_to_login_form).and_return(true)
      allow(controller).to receive(:redirect_to)
      expect { 
        get :index, params: { domain_id: 'aaa', project_id: 'bbb' } 
      }.not_to raise_error
    end
  end

  context "do not rescope token" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required domain: ->(c) { c.params[:domain_id] },
                             project: ->(c) { c.params[:project_id] },
                             rescope: false
      
      def index
        head :ok
      end
    end

    it "should not rescope token when rescope is false" do
      auth_session = double("auth_session").as_null_object
      allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_return(auth_session)
      expect(auth_session).not_to receive(:rescope_token)
      get :index, params: { domain_id: 'aaa', project_id: 'bbb' }
    end
  end

  context "explicitly rescope token" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required domain: ->(c) { c.params[:domain_id] },
                             project: ->(c) { c.params[:project_id] },
                             rescope: false
      
      before_action :authentication_rescope_token
      
      def index
        head :ok
      end
    end

    it "should rescope token when explicitly called" do
      auth_session = double("auth_session").as_null_object
      allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_return(auth_session)
      expect(auth_session).to receive(:rescope_token)
      get :index, params: { domain_id: 'aaa', project_id: 'bbb' }
    end
  end

  context "implicitly rescope token after authentication" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      
      authentication_required domain: ->(c) { c.params[:domain_id] },
                             project: ->(c) { c.params[:project_id] }
      
      def index
        head :ok
      end
    end

    it "should rescope token by default" do
      auth_session = double("auth_session").as_null_object
      allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_return(auth_session)
      expect(auth_session).to receive(:rescope_token)
      get :index, params: { domain_id: 'aaa', project_id: 'bbb' }
    end
  end
end
