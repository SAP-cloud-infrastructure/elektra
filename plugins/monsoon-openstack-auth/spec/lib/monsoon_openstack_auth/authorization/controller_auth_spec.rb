require 'spec_helper'

describe "TestController", type: :controller do
  controller(ActionController::Base) do 
    def self.name
      "TestController"
    end

    authentication_required region: ->(c) { 'europe' }
    authorization_required
    authorization_context "identity"
    
    def index 
      head :ok
    end

    def show
      head :ok
    end

    def edit
      head :ok
    end

    def update
      head :ok
    end

    def new 
      head :ok
    end  

    def create
      head :ok
    end    

    def destroy 
      head :ok 
    end
  end
  
  before do  
    auth_session = double("auth_session").as_null_object
    user_stub = double("user", 
      id: 1, 
      name: "Test User", 
      email: "test@example.com",
      member?: true
    )
    allow(auth_session).to receive(:user).and_return(user_stub)
    allow(MonsoonOpenstackAuth::Authentication::AuthSession).to receive(:check_authentication).and_return(auth_session)
    allow(MonsoonOpenstackAuth).to receive(:api_client)
    
    routes.draw do
      get "index" => "test#index"
      get "show" => "test#show"
      get "new" => "test#new"
      post "create" => "test#create"
      get "edit" => "test#edit"
      put "update" => "test#update"
      delete "destroy" => "test#destroy"
    end

    allow(controller).to receive(:enforce_permissions).with(anything, anything).and_return true
  end

  context "should enforce permissions" do  
    it "should allow index" do
      get :index
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_list", anything)
    end
    
    it "should not allow index" do 
      allow(controller).to receive(:enforce_permissions).with("identity:test_list", anything).and_raise(StandardError.new("error"))
      expect { get :index }.to raise_error(StandardError)
    end

    it "should allow get" do
      get :show
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_get", anything)
    end
    
    it "should allow new" do
      get :new
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_create", anything)
    end
    
    it "should allow creation" do
      post :create
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_create", anything)
    end

    it "should allow edit" do
      get :edit
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_update", anything)
    end

    it "should allow update" do
      put :update
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_update", anything)
    end
    
    it "should allow destroy" do
      delete :destroy
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_delete", anything)
    end
  end

  context "different context", type: :controller do 
    controller(ActionController::Base) do 
      def self.name
        "TestController"
      end

      authentication_required region: ->(c) { 'europe' }
      authorization_context "compute"
      authorization_required
      
      def index 
        head :ok
      end
    end

    it "should call compute" do
      allow(controller).to receive(:enforce_permissions).with(anything, anything).and_return true

      get :index
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("compute:test_list", anything)
    end
  end

  context "default context should be identity", type: :controller do 
    controller(ActionController::Base) do 
      def self.name
        "TestController"
      end

      authentication_required region: ->(c) { 'europe' }
      authorization_required
      
      def index 
        head :ok
      end
    end

    it "should call compute" do
      allow(controller).to receive(:enforce_permissions).with(anything, anything).and_return true

      get :index
      expect(response.status).to eq(200)
      expect(controller).to have_received(:enforce_permissions).with("identity:test_list", anything)
    end
  end   
end
