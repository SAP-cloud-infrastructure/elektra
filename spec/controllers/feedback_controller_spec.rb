require "spec_helper"

describe FeedbackController, type: :controller do
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
      project_domain_name: "default",
      token_expires_at: Time.now + 1.hour
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
      "test-project",
    )
  end

  before(:each) do
    stub_authentication
    allow(controller).to receive(:current_user).and_return(current_user)
    allow(UserProfile).to receive(:tou_accepted?).and_return(true)
    allow_any_instance_of(DashboardController).to receive(:authentication_rescope_token).and_return(true)
  end

  describe "#enriched_context" do
    before do
      allow(controller).to receive(:params).and_return(ActionController::Parameters.new(context: {}))
    end

    it "includes user domain information" do
      context = controller.send(:enriched_context)
      expect(context[:domain_id]).to eq(current_user.user_domain_id)
      expect(context[:domain_name]).to eq(current_user.user_domain_name)
    end

    it "includes project information when scoped to a project" do
      controller.instance_variable_set(:@scoped_project_id, default_params[:project_id])
      controller.instance_variable_set(:@scoped_project_name, "test-project")

      context = controller.send(:enriched_context)
      expect(context[:project_id]).to eq(default_params[:project_id])
      expect(context[:project_name]).to eq("test-project")
    end

    it "returns nil project info when not scoped to a project" do
      controller.instance_variable_set(:@scoped_project_id, nil)
      controller.instance_variable_set(:@scoped_project_name, nil)

      context = controller.send(:enriched_context)
      expect(context[:project_id]).to be_nil
      expect(context[:project_name]).to be_nil
    end

    it "merges context from params" do
      allow(controller).to receive(:params).and_return(
        ActionController::Parameters.new(
          context: {
            page_url: "http://example.com",
            browser: "Mozilla/5.0",
            viewport: "1920x1080"
          }
        )
      )

      context = controller.send(:enriched_context)
      expect(context[:page_url]).to eq("http://example.com")
      expect(context[:browser]).to eq("Mozilla/5.0")
      expect(context[:viewport]).to eq("1920x1080")
    end
  end
end
