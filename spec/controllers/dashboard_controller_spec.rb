require "spec_helper"

describe DashboardController, type: :controller do
  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }
  
  let(:current_user) do
    double("User",
      id: "user123",
      name: "testuser",
      email: "test@example.com",
      full_name: "Test User",
      user_domain_id: default_params[:domain_id],
      user_domain_name: "default",
      domain_id: default_params[:domain_id],
      domain_name: "default",
      project_id: default_params[:project_id],
      project_name: "test-project",
      project_domain_id: default_params[:domain_id],
      project_domain_name: "default"
    )
  end
  
  before(:all) do
    FriendlyIdEntry.find_or_create_entry(
      "Domain",
      nil,
      default_params[:domain_id],
      "default",
    )
    FriendlyIdEntry.find_or_create_entry(
      "Project",
      default_params[:domain_id],
      default_params[:project_id],
      default_params[:project_id],
    )
  end
  
  before(:each) do
    stub_authentication
    allow(Settings).to receive_message_chain(:terms_of_use, :version).and_return("1.0")
    allow_any_instance_of(DomainConfig).to receive(:terms_of_use_name).and_return(:terms_of_use)
    allow(controller).to receive(:current_user).and_return(current_user)
  end
  
  describe "exception handling" do
    before do
      allow(UserProfile).to receive(:tou_accepted?).and_return(true)
    end

    context "when NotAuthorized exception is raised" do
      context "and project exists (user has no permission)" do
        it "renders unauthorized template with 401 status" do
          # Mock FriendlyIdEntry to return a project (project exists)
          allow(FriendlyIdEntry).to receive(:find_project)
            .with(default_params[:domain_id], default_params[:project_id])
            .and_return(double("project"))

          # Trigger the exception by stubbing the auth_session rescope method
          allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:rescope_token)
            .and_raise(MonsoonOpenstackAuth::Authentication::NotAuthorized.new("insufficient permissions"))

          get :terms_of_use, params: default_params

          expect(response).to have_http_status(:unauthorized)
          expect(response).to render_template('application/exceptions/unauthorized')
        end
      end

      context "and project doesn't exist" do
        it "renders not found template with 404 status" do
          # Set up controller instance variables to simulate project not being found
          # This needs to happen AFTER ScopeController sets them
          allow(controller).to receive(:load_scoped_objects).and_wrap_original do |original_method, *args|
            original_method.call(*args)
            # Override the project_id to simulate a non-existent project scenario
            controller.instance_variable_set(:@scoped_project_id, "non_existent_project")
          end

          # Mock FriendlyIdEntry to return nil (project doesn't exist)
          allow(FriendlyIdEntry).to receive(:find_project)
            .with(default_params[:domain_id], "non_existent_project")
            .and_return(nil)

          # Trigger the exception
          allow_any_instance_of(MonsoonOpenstackAuth::Authentication::AuthSession)
            .to receive(:rescope_token)
            .and_raise(MonsoonOpenstackAuth::Authentication::NotAuthorized.new("insufficient permissions"))

          get :terms_of_use, params: default_params

          expect(response).to have_http_status(:not_found)
          expect(response).to render_template('application/exceptions/project_not_found')
        end
      end
    end
  end
  
  describe "terms of use handling" do
    context "when terms not accepted" do
      before do
        Rails.cache.clear  # Clear cache to ensure fresh test state
        # Mock the controller's tou_accepted? method directly (not UserProfile)
        allow(controller).to receive(:tou_accepted?).and_return(false)
        allow_any_instance_of(DomainConfig).to receive(:feature_hidden?)
          .with('terms_of_use').and_return(false)
      end

      it "renders accept_terms_of_use template when accessing accept_terms_of_use" do
        get :accept_terms_of_use, params: default_params
        expect(response).to render_template(:accept_terms_of_use)
      end

      it "stores the original URL when check_terms_of_use is called" do

        # Ensure check_terms_of_use is called and can execute normally
        expect(controller).to receive(:check_terms_of_use).and_call_original

        # When GET is made to accept_terms_of_use (without terms_of_use param),
        # it calls check_terms_of_use which sets @orginal_url and renders
        get :accept_terms_of_use, params: default_params

        # After rendering, @orginal_url should be set
        expect(assigns(:orginal_url)).to be_present
        expect(response).to render_template(:accept_terms_of_use)
      end
    end

    context "when terms of use feature is hidden for domain" do
      before do
        Rails.cache.clear  # Clear cache
        allow_any_instance_of(DomainConfig).to receive(:feature_hidden?)
          .with('terms_of_use').and_return(true)
        allow(controller).to receive(:tou_accepted?).and_return(false)
      end

      it "skips terms of use check" do
        # terms_of_use action doesn't have check_terms_of_use before_action
        get :terms_of_use, params: { domain_id: default_params[:domain_id] }
        expect(response).to be_successful
        expect(response).to render_template(:terms_of_use)
      end
    end
  end
  
  describe "POST accept_terms_of_use" do
    before do
      Rails.cache.clear  # Clear cache to ensure fresh test state
      allow(UserProfile).to receive(:tou_accepted?).and_return(false)
      # Skip the check_terms_of_use for these tests so we can directly test the action
      allow(controller).to receive(:check_terms_of_use)
    end
    
    context "when user accepts terms" do
      it "creates or updates user profile" do
        expect {
          post :accept_terms_of_use, params: default_params.merge(terms_of_use: "1")
        }.to change(UserProfile, :count).by(1)
      end
      
      it "creates domain profile with correct version" do
        user_profile = create(:user_profile, uid: current_user.id)
        
        expect {
          post :accept_terms_of_use, params: default_params.merge(terms_of_use: "1")
        }.to change { user_profile.reload.domain_profiles.count }.by(1)
        
        domain_profile = user_profile.domain_profiles.last
        expect(domain_profile.tou_version).to eq("1.0")
        expect(domain_profile.domain_id).to eq(current_user.user_domain_id)
      end
      
      context "redirects after acceptance" do
        it "redirects to original URL if provided" do
          original_url = "/#{default_params[:domain_id]}/instances"
          post :accept_terms_of_use, params: default_params.merge(
            terms_of_use: "1",
            orginal_url: original_url
          )
          expect(response).to redirect_to(original_url)
        end
        
        it "redirects to domain home if identity plugin available" do
          allow(controller).to receive(:plugin_available?).with('identity').and_return(true)
          
          post :accept_terms_of_use, params: default_params.merge(terms_of_use: "1")
          # The route is defined as: get '/:domain_id/home' => 'domains#show', :as => :domain_home
          expect(response).to redirect_to("/#{default_params[:domain_id]}/home")
        end
        
        it "redirects to root if identity plugin not available" do
          allow(controller).to receive(:plugin_available?).with('identity').and_return(false)
          
          post :accept_terms_of_use, params: default_params.merge(terms_of_use: "1")
          expect(response).to redirect_to("/")
        end
      end
    end
    
    context "when user does not accept terms" do
      it "re-renders accept_terms_of_use page" do
        Rails.cache.clear  # Clear cache

        # Unstub check_terms_of_use to let it run naturally (override outer before block)
        allow(controller).to receive(:check_terms_of_use).and_call_original

        # Mock the controller's tou_accepted? method to return false
        allow(controller).to receive(:tou_accepted?).and_return(false)

        # Set up the conditions for check_terms_of_use to render the template
        allow_any_instance_of(DomainConfig).to receive(:feature_hidden?)
          .with('terms_of_use').and_return(false)

        # GET accept_terms_of_use without terms_of_use param should call check_terms_of_use
        # which should render accept_terms_of_use template
        get :accept_terms_of_use, params: default_params
        expect(response).to render_template(:accept_terms_of_use)
      end
    end
  end
  
  describe "GET terms_of_use" do
    it "loads TOU information for current user" do
      tou_data = { version: "1.0", accepted: true }
      expect(UserProfile).to receive(:tou)
        .with(current_user.id, current_user.user_domain_id, "1.0")
        .and_return(tou_data)
      
      get :terms_of_use, params: { domain_id: default_params[:domain_id] }
      expect(assigns(:tou)).to eq(tou_data)
    end
    
    it "renders terms_of_use template" do
      allow(UserProfile).to receive(:tou).and_return(nil)
      get :terms_of_use, params: { domain_id: default_params[:domain_id] }
      expect(response).to render_template(:terms_of_use)
    end
  end
  
  describe "mailer configuration" do
    before do
      allow(UserProfile).to receive(:tou_accepted?).and_return(true)
      allow(controller).to receive(:set_mailer_host).and_call_original
    end
    
    it "sets mailer host from request" do
      get :terms_of_use, params: { domain_id: default_params[:domain_id] }
      expect(ActionMailer::Base.default_url_options[:host]).to eq(request.host_with_port)
      expect(ActionMailer::Base.default_url_options[:protocol]).to eq(request.protocol)
    end
  end
  
  describe "before_action callbacks" do
    context "check_terms_of_use" do
      it "is not called for terms_of_use action" do
        expect(controller).not_to receive(:check_terms_of_use)
        get :terms_of_use, params: { domain_id: default_params[:domain_id] }
      end
      
      it "is not called for accept_terms_of_use action" do
        expect(controller).not_to receive(:check_terms_of_use)
        post :accept_terms_of_use, params: default_params.merge(terms_of_use: "1")
      end
    end
  end
end
