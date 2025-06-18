module Inquiry
  class InquiryMailer < ::CoreApplicationMailer
    
    def notification_email_requester(
      user_email,
      user_full_name,
      inquiry,
      inquiry_step
    )
      return if user_email.blank?
      @user_email = user_email
      @user_full_name = user_full_name
      @inquiry_step = inquiry_step
      @inquiry = inquiry
      mail(
        to: @user_email,
        subject:
          "Converged Cloud: Your resource request is in state: #{@inquiry.aasm.human_state}",
        content_type: "text/html",
      )
    end

    def notification_email_processors(
      processor_emails,
      inquiry,
      inquiry_step,
      requester
    )
      processor_emails.reject!(&:blank?)
      return if processor_emails.blank?
      @inquiry_step = inquiry_step
      @inquiry = inquiry
      @requester_name = "#{requester.full_name} (#{requester.name})"
      subject = "Converged Cloud: Please process a resource request "
      if @inquiry.tags
        if @inquiry.tags["region"]
          subject += " for region #{@inquiry.tags["region"]}"
        end
        if @inquiry.tags["domain_name"]
          subject += "/#{@inquiry.tags["domain_name"]}"
        end
      end
      # this is called from the model, first try with all emails at once, if a error occurs, try to send each email separately
      mail(to: processor_emails, subject: subject, content_type: "text/html")
    end

    def notification_email_additional_recipients(
      receiver_emails,
      inquiry,
      inquiry_step,
      requester
    )
      receiver_emails.reject!(&:blank?)
      return if receiver_emails.blank?
      @inquiry_step = inquiry_step
      @inquiry = inquiry
      @requester_name = "#{requester.full_name} (#{requester.name})"
      subject =
        "Converged Cloud: Additional Review, A request needs your attention!"
      if @inquiry.tags
        if @inquiry.tags["region"]
          subject += " for region #{@inquiry.tags["region"]}"
        end
        if @inquiry.tags["domain_name"]
          subject += "/#{@inquiry.tags["domain_name"]}"
        end
      end
      # this is called from the model, first try with all emails at once, if a error occurs, try to send each email separately
      mail(to: receiver_emails, subject: subject, content_type: "text/html")
    end

    def notification_new_project(inform_dl, inquiry, user_full_name)
      @inquiry = inquiry
      @requester_name = user_full_name
      subject =
        "Converged Cloud: New project was created for LoB #{@inquiry.payload["lob"]}"
      if @inquiry.tags
        if @inquiry.tags["region"]
          subject += " in region #{@inquiry.tags["region"]}"
        end
        if @inquiry.tags["domain_name"]
          subject += "/#{@inquiry.tags["domain_name"]}"
        end
      end
      
      # Render the email body content
      email_body = render_to_string('inquiry/inquiry_mailer/notification_new_project', layout: false)

      send_custom_email(
        recipient: inform_dl,
        subject: subject,
        body_html: email_body
      )
      # mail(to: inform_dl, subject: subject, content_type: "text/html")
    end

  end
end
