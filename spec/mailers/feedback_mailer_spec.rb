require "spec_helper"

describe FeedbackMailer, type: :mailer do
  describe "#user_feedback" do
    let(:feedback_message) { "This is a test feedback message" }
    let(:context) do
      {
        page_url: "http://localhost:3000/monsoon3/test-project/home",
        browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        viewport: "1920x1080",
        domain_id: "domain123",
        domain_name: "monsoon3",
        project_id: "project456",
        project_name: "test-project"
      }
    end

    context "when recipients are configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["recipient@example.com"])
        allow(Rails.configuration).to receive(:limes_mail_server_endpoint).and_return("https://mail-api.example.com")
      end

      it "sends email to configured recipients" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:recipient]).to eq(["recipient@example.com"])
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end

      it "includes feedback message in email body" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include(feedback_message)
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end

      it "includes context information in email body" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include(context[:page_url])
          expect(args[:body_html]).to include(context[:browser])
          expect(args[:body_html]).to include(context[:viewport])
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end

      it "includes domain information in email body" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include("Domain")
          expect(args[:body_html]).to include(context[:domain_id])
          expect(args[:body_html]).to include(context[:domain_name])
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end

      it "includes project information in email body" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include("Project")
          expect(args[:body_html]).to include(context[:project_id])
          expect(args[:body_html]).to include(context[:project_name])
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end

      it "uses correct email subject with filterable pattern" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:subject]).to eq("[Feedback] [Elektra]: New User Feedback")
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end

      it "includes timestamp in email body" do
        freeze_time = Time.current
        allow(Time).to receive(:current).and_return(freeze_time)

        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include(freeze_time.strftime("%B %d, %Y"))
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end
    end

    context "when multiple recipients are configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails)
          .and_return(["recipient1@example.com", "recipient2@example.com", "recipient3@example.com"])
        allow(Rails.configuration).to receive(:limes_mail_server_endpoint).and_return("https://mail-api.example.com")
      end

      it "sends email to all configured recipients" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:recipient]).to eq(["recipient1@example.com", "recipient2@example.com", "recipient3@example.com"])
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: context
        ).deliver_now
      end
    end

    context "when recipients are not configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(nil)
      end

      it "raises ConfigurationError" do
        expect {
          FeedbackMailer.user_feedback(
            feedback_message: feedback_message,
            context: context
          ).deliver_now
        }.to raise_error(FeedbackMailer::ConfigurationError, "Feedback recipients not configured")
      end

      it "logs a warning before raising error" do
        expect(Rails.logger).to receive(:warn).with(/No feedback recipient emails configured/)

        expect {
          FeedbackMailer.user_feedback(
            feedback_message: feedback_message,
            context: context
          ).deliver_now
        }.to raise_error(FeedbackMailer::ConfigurationError)
      end
    end

    context "when context is empty" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["recipient@example.com"])
        allow(Rails.configuration).to receive(:limes_mail_server_endpoint).and_return("https://mail-api.example.com")
      end

      it "still sends email without context information" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include(feedback_message)
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: {}
        ).deliver_now
      end
    end

    context "when only domain context is present (no project)" do
      let(:domain_only_context) do
        {
          page_url: "http://localhost:3000/monsoon3/home",
          browser: "Mozilla/5.0",
          viewport: "1920x1080",
          domain_id: "domain123",
          domain_name: "monsoon3"
        }
      end

      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["recipient@example.com"])
        allow(Rails.configuration).to receive(:limes_mail_server_endpoint).and_return("https://mail-api.example.com")
      end

      it "sends email without project information" do
        allow_any_instance_of(CoreApplicationMailer).to receive(:send_custom_email) do |_, args|
          expect(args[:body_html]).to include("Domain")
          expect(args[:body_html]).to include(domain_only_context[:domain_id])
          # Project id and name should not be present
          expect(args[:body_html]).not_to include(domain_only_context[:project_id].to_s) if domain_only_context[:project_id]
        end

        FeedbackMailer.user_feedback(
          feedback_message: feedback_message,
          context: domain_only_context
        ).deliver_now
      end
    end
  end
end
