class FeedbackMailer < CoreApplicationMailer
  layout false

  def user_feedback(user_email:, user_name:, feedback_message:, user_metadata: {})
    @user_email = user_email
    @user_name = user_name
    @feedback_message = feedback_message
    @user_metadata = user_metadata
    @timestamp = Time.current

    subject = "SAP Cloud Infrastructure: User Feedback from #{@user_name}"

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
