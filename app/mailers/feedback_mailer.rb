class FeedbackMailer < CoreApplicationMailer
  layout false

  def user_feedback(feedback_message:, context: {})
    @feedback_message = feedback_message
    @context = context
    @timestamp = Time.current

    subject = "SAP Cloud Infrastructure: User Feedback"

    email_body = render_to_string('feedback_mailer/user_feedback', layout: false)

    send_custom_email(
      recipient: recipient_email,
      subject: subject,
      body_html: email_body
    )
  end

  private

  def recipient_email
    Rails.configuration.try(:feedback_recipient_email) || 'a.reuschenbach.puncernau@sap.com'
  end
end
