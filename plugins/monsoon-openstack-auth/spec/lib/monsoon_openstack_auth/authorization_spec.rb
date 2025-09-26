require 'spec_helper'

describe MonsoonOpenstackAuth::Authorization, type: :controller do
  before do
    auth_session = double("auth_session").as_null_object
    # Replace FactoryGirl with simple user stub
    user_stub = double("user", 
      id: 1, 
      name: "Test User", 
      email: "test@example.com",
      member?: true
    ).as_null_object
    allow(auth_session).to receive(:user).and_return(user_stub)
    allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_return(auth_session)
    
    MonsoonOpenstackAuth.configuration.authorization.policy_file_path = File.expand_path("../../config/policy_test.json",__dir__)
    MonsoonOpenstackAuth.configuration.authorization.context = 'identity'
    MonsoonOpenstackAuth.load_policy
    allow(MonsoonOpenstackAuth).to receive(:api_client)
  end

  context "authorization filter all" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      include MonsoonOpenstackAuth::Authorization
      
      authentication_required region: ->(c) { c.params[:region_id] }, 
                             domain: ->(c) { c.params[:domain_id] }, 
                             project_id: ->(c) { c.params[:project_id] }
      
      authorization_required(context: 'identity')
      
      def index
        head :ok
      end
      
      def new
        head :ok
      end
      
      def change
        head :ok
      end
      
      def authorization_forbidden(error)
        raise error
      end
    end

    before do
      # Create admin user stub
      @current_user = double("admin_user",
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        admin?: true,
        member?: false
      ).as_null_object
      allow(controller).to receive(:current_user).and_return(@current_user)
      
      # Create domain stub
      @domain = double("domain",
        id: "domain-123",
        name: "Test Domain",
        description: "Test domain for specs"
      )
      allow(controller).to receive(:get_domain).and_return(@domain)
    end

    it "should require authorization for index" do
      expect_any_instance_of(MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy).to receive(:enforce)
      expect {
        get :index
      }.to raise_error(MonsoonOpenstackAuth::Authorization::SecurityViolation)
    end

    it "should require authorization for new" do
      expect_any_instance_of(MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy).to receive(:enforce)
      expect {
        get :new
      }.to raise_error(MonsoonOpenstackAuth::Authorization::SecurityViolation)
    end
  end

  context "authorization filter except" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      include MonsoonOpenstackAuth::Authorization
      
      authentication_required region: ->(c) { c.params[:region_id] }, 
                             domain: ->(c) { c.params[:domain_id] }, 
                             project_id: ->(c) { c.params[:project_id] }
      
      authorization_required except: [:index]
      
      def index
        head :ok
      end
      
      def new
        head :ok
      end
      
      def change
        head :ok
      end
      
      def authorization_forbidden(error)
        raise error
      end
    end

    before do
      # Create admin user stub
      @current_user = double("admin_user",
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        admin?: true,
        member?: false
      ).as_null_object
      allow(controller).to receive(:current_user).and_return(@current_user)
      
      # Create domain stub
      @domain = double("domain",
        id: "domain-123",
        name: "Test Domain",
        description: "Test domain for specs"
      )
      allow(controller).to receive(:get_domain).and_return(@domain)
    end

    it "should NOT require authorization for index" do
      expect_any_instance_of(MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy).not_to receive(:enforce)
      expect {
        get :index
      }.not_to raise_error
    end

    it "should require authorization for new" do
      expect_any_instance_of(MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy).to receive(:enforce)
      expect {
        get :new
      }.to raise_error(MonsoonOpenstackAuth::Authorization::SecurityViolation)
    end
  end

  context "authorization filter only" do
    controller(ActionController::Base) do # anonymous subclass of ActionController::Base
      include MonsoonOpenstackAuth::Authentication
      include MonsoonOpenstackAuth::Authorization
      
      authentication_required region: ->(c) { c.params[:region_id] }, 
                             domain: ->(c) { c.params[:domain_id] }, 
                             project_id: ->(c) { c.params[:project_id] }
      
      authorization_required except: [:index]
      
      def index
        head :ok
      end
      
      def new
        head :ok
      end
      
      def change
        head :ok
      end
      
      def authorization_forbidden(error)
        raise error
      end
    end

    before do
      # Create admin user stub
      @current_user = double("admin_user",
        id: 1,
        name: "Admin User",
        email: "admin@example.com",
        admin?: true,
        member?: false
      ).as_null_object
      allow(controller).to receive(:current_user).and_return(@current_user)
      
      # Create domain stub
      @domain = double("domain",
        id: "domain-123",
        name: "Test Domain",
        description: "Test domain for specs"
      )
      allow(controller).to receive(:get_domain).and_return(@domain)
    end

    it "should NOT require authorization for index" do
      expect_any_instance_of(MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy).not_to receive(:enforce)
      expect {
        get :index
      }.not_to raise_error
    end

    it "should require authorization for new" do
      expect_any_instance_of(MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy).to receive(:enforce)
      expect {
        get :new
      }.to raise_error(MonsoonOpenstackAuth::Authorization::SecurityViolation)
    end
  end

  context "check permissions" do
    controller(ActionController::Base) do
      include MonsoonOpenstackAuth::Authorization
    end

    let(:params) do
      {
        "action" => "index", 
        "controller" => "api/v3/credentials", 
        "page" => "1", 
        "per_page" => "10"
      }
    end

    it "should add relevant params to policy params" do
      additional_params = { "user_id" => "1", "id" => "2" }
      
      # Stub constants
      stub_const("User", double('User').as_null_object)
      stub_const("Credential", double('Credential').as_null_object)
      
      policy_params = MonsoonOpenstackAuth::Authorization.build_policy_params(
        controller, 
        additional_params.merge(params)
      )
      
      additional_params.each do |name, value|
        expect(policy_params.key?(name.to_sym)).to eq(true)
      end
      expect(policy_params[:target].key?(:user)).to eq(true)
    end

    it "should determine rule name" do
      allow(MonsoonOpenstackAuth::Authorization).to receive(:authorization_action_map).and_return({})
      app_name = MonsoonOpenstackAuth.configuration.authorization.context
      
      rule_name = ->(controller_name, action_name) do 
        MonsoonOpenstackAuth::Authorization.determine_rule_name(app_name, controller_name, action_name) 
      end
      
      expect(rule_name.call("credentials", "index")).to eq("#{app_name}:credential_index")
      expect(rule_name.call("users", "create")).to eq("#{app_name}:user_create")
      expect(rule_name.call("projects", "edit")).to eq("#{app_name}:project_edit")
      expect(rule_name.call("users", "destroy")).to eq("#{app_name}:user_destroy")
      expect(rule_name.call("users", "show")).to eq("#{app_name}:user_show")
    end

    it "should determine rule name regarding action mapping" do
      allow(MonsoonOpenstackAuth::Authorization).to receive(:authorization_action_map).and_return({
        index: 'list',
        show: 'read',
        new: 'create',
        create: 'create',
        edit: 'update',
        update: 'update',
        destroy: 'delete'
      })
      
      app_name = MonsoonOpenstackAuth.configuration.authorization.context
      rule_name = ->(controller_name, action_name) do 
        MonsoonOpenstackAuth::Authorization.determine_rule_name(app_name, controller_name, action_name) 
      end
      
      expect(rule_name.call("credentials", "index")).to eq("#{app_name}:credential_list")
      expect(rule_name.call("users", "create")).to eq("#{app_name}:user_create")
      expect(rule_name.call("projects", "edit")).to eq("#{app_name}:project_update")
      expect(rule_name.call("users", "destroy")).to eq("#{app_name}:user_delete")
      expect(rule_name.call("users", "show")).to eq("#{app_name}:user_read")
    end

    describe "enforce_permissions" do
      let(:policy_class) { MonsoonOpenstackAuth::Authorization::PolicyEngine::Policy }
      
      before do
        # Create admin user stub
        admin_user = double("admin_user",
          id: 1,
          name: "Admin User",
          email: "admin@example.com",
          admin?: true,
          member?: false
        ).as_null_object
        allow(controller).to receive(:current_user).and_return(admin_user)
        allow(MonsoonOpenstackAuth.configuration.authorization).to receive(:trace_enabled).and_return(false)
        allow_any_instance_of(policy_class).to receive(:enforce).and_return(true)
      end

      it "should call policy engine" do
        expect_any_instance_of(policy_class).to receive(:enforce).with(["identity:credential_list"], {})
        controller.enforce_permissions("identity:credential_list", {})
      end

      it "should complete rule_name if context is missing" do
        expect_any_instance_of(policy_class).to receive(:enforce).with(["identity:credential_list"], {})
        controller.enforce_permissions("identity:credential_list", {})
      end

      it "should complete rule_name if context is missing and name is symbol" do
        expect_any_instance_of(policy_class).to receive(:enforce).with(["identity:credential_list"], {})
        controller.enforce_permissions(:credential_list, {})
      end

      it "should complete rule_name if no rule_name given" do
        allow(controller).to receive(:params).and_return({
          "action" => "index", 
          "controller" => "credentials"
        })
        allow(controller).to receive(:controller_name).and_return('credential')
        allow(controller).to receive(:action_name).and_return('index')
        
        expect_any_instance_of(policy_class).to receive(:enforce).with(
          ["identity:credential_list"], 
          { user: anything }
        )
        
        controller.enforce_permissions({ user: double('User') })
      end
    end
  end
end
