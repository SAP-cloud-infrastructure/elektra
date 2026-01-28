module EmailService
  class MaillogController < ::EmailService::ApplicationController
    authorization_context 'email_service'
    authorization_required
  end
end
