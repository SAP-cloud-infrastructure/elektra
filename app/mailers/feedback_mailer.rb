class FeedbackMailer < CoreApplicationMailer
  layout false

  def user_feedback(feedback_message:, context: {})
    @feedback_message = feedback_message
    @context = context
    @timestamp = Time.current

    recipients = recipient_emails
    if recipients.blank?
      Rails.logger.warn("No feedback recipient emails configured. Set FEEDBACK_RECIPIENT_EMAIL environment variable (comma-separated for multiple recipients).")
      raise ConfigurationError, "Feedback recipients not configured"
    end

    subject = "[Feedback] [Elektra]: New User Feedback"

    email_body = render_to_string('feedback_mailer/user_feedback', layout: false)

    send_custom_email(
      recipient: recipients,
      subject: subject,
      body_html: email_body
    )
  end

  class ConfigurationError < StandardError; end

  private

  def recipient_emails
    Rails.configuration.try(:feedback_recipient_emails)&.presence
  end
end
