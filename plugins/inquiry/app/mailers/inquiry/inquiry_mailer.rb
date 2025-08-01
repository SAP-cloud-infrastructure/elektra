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

      email_body = render_to_string('inquiry/inquiry_mailer/notification_email_requester', layout: false)
      send_custom_email(
        recipient: @user_email,
        subject: "SAP Cloud Infrastructure: Your resource request is in state: #{@inquiry.aasm.human_state}",
        body_html: email_body
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
      subject = "SAP Cloud Infrastructure: Please process a resource request "
      if @inquiry.tags
        if @inquiry.tags["region"]
          subject += " for region #{@inquiry.tags["region"]}"
        end
        if @inquiry.tags["domain_name"]
          subject += "/#{@inquiry.tags["domain_name"]}"
        end
      end

      # this is called from the model, first try with all emails at once, if a error occurs, try to send each email separately
      email_body = render_to_string('inquiry/inquiry_mailer/notification_email_processors', layout: false)
      send_custom_email(
        recipient: processor_emails,
        subject: subject,
        body_html: email_body
      )
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
        "SAP Cloud Infrastructure: Additional Review, A request needs your attention!"
      if @inquiry.tags
        if @inquiry.tags["region"]
          subject += " for region #{@inquiry.tags["region"]}"
        end
        if @inquiry.tags["domain_name"]
          subject += "/#{@inquiry.tags["domain_name"]}"
        end
      end

      # this is called from the model, first try with all emails at once, if a error occurs, try to send each email separately
      email_body = render_to_string('inquiry/inquiry_mailer/notification_email_additional_recipients', layout: false)
      send_custom_email(
        recipient: receiver_emails,
        subject: subject,
        body_html: email_body
      ) 
    end

    def notification_new_project(inform_dl, inquiry, user_full_name)
      @inquiry = inquiry
      @requester_name = user_full_name
      subject =
        "SAP Cloud Infrastructure: New project was created for LoB #{@inquiry.payload["lob"]}"
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
    end

  end
end
