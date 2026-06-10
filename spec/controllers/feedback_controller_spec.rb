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

  describe "POST #create" do
    let(:feedback_message) { "This is my feedback" }
    let(:context) do
      {
        page_url: "http://localhost:3000/#{default_params[:domain_id]}/#{default_params[:project_id]}/home",
        browser: "Mozilla/5.0",
        viewport: "1920x1080"
      }
    end

    let(:feedback_params) do
      default_params.merge(
        feedback_message: feedback_message,
        context: context
      )
    end

    context "when feedback recipients are configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["test@example.com"])
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email).and_return(true)
      end

      it "sends the feedback email successfully and sets success message" do
        post :create, params: feedback_params, xhr: true, format: :js

        expect(assigns(:success)).to be true
        expect(assigns(:message)).to eq('Thank you for your feedback!')
      end

      it "includes domain and project information in enriched context" do
        post :create, params: feedback_params, xhr: true, format: :js

        expect(controller.instance_variable_get(:@scoped_project_id)).to eq(default_params[:project_id])
        expect(controller.instance_variable_get(:@scoped_domain_id)).to eq(default_params[:domain_id])
      end

      it "calls the mailer with feedback message and context" do
        expect(FeedbackMailer).to receive(:user_feedback).with(
          feedback_message: feedback_message,
          context: hash_including(
            page_url: context[:page_url],
            browser: context[:browser],
            viewport: context[:viewport]
          )
        ).and_call_original

        post :create, params: feedback_params, xhr: true, format: :js
      end
    end

    context "when feedback recipients are not configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(nil)
      end

      it "sets error message without sending email" do
        expect_any_instance_of(CoreApplicationMailer).not_to receive(:send_custom_email)

        post :create, params: feedback_params, xhr: true, format: :js

        expect(assigns(:success)).to be false
        expect(assigns(:message)).to eq('Feedback service is not configured. Please contact your administrator.')
      end
    end

    context "when feedback message is blank" do
      let(:blank_feedback_params) do
        default_params.merge(
          feedback_message: "",
          context: context
        )
      end

      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["test@example.com"])
      end

      it "returns an error without sending email" do
        expect_any_instance_of(CoreApplicationMailer).not_to receive(:send_custom_email)

        post :create, params: blank_feedback_params, xhr: true, format: :js

        expect(assigns(:success)).to be false
        expect(assigns(:message)).to eq('Feedback message is required')
      end
    end

    context "when email delivery fails" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["test@example.com"])
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email)
          .and_raise(StandardError.new("Email API failed"))
      end

      it "returns a generic error message" do
        post :create, params: feedback_params, xhr: true, format: :js

        expect(assigns(:success)).to be false
        expect(assigns(:message)).to eq('Failed to send feedback')
      end
    end

    context "without project scope" do
      let(:domain_only_params) do
        {
          domain_id: default_params[:domain_id],
          feedback_message: feedback_message,
          context: context
        }
      end

      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["test@example.com"])
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email).and_return(true)
      end

      it "still sends feedback without project information" do
        post :create, params: domain_only_params, xhr: true, format: :js

        expect(assigns(:success)).to be true
      end
    end
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

    it "includes project information when available" do
      controller.instance_variable_set(:@scoped_project_id, default_params[:project_id])
      controller.instance_variable_set(:@scoped_project_name, "test-project")

      context = controller.send(:enriched_context)
      expect(context[:project_id]).to eq(default_params[:project_id])
      expect(context[:project_name]).to eq("test-project")
    end
  end
end
