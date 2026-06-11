require "spec_helper"

describe ApplicationHelper do
  describe "#feedback_enabled?" do
    context "when feedback recipients are configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(["test@example.com"])
      end

      it "returns true" do
        expect(helper.feedback_enabled?).to be true
      end
    end

    context "when multiple recipients are configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails)
          .and_return(["test1@example.com", "test2@example.com"])
      end

      it "returns true" do
        expect(helper.feedback_enabled?).to be true
      end
    end

    context "when feedback recipients are not configured" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return(nil)
      end

      it "returns false" do
        expect(helper.feedback_enabled?).to be false
      end
    end

    context "when feedback recipients is an empty array" do
      before do
        allow(Rails.configuration).to receive(:feedback_recipient_emails).and_return([])
      end

      it "returns false" do
        expect(helper.feedback_enabled?).to be false
      end
    end
  end
end
