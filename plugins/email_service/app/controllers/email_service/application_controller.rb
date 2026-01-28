# frozen_string_literal: true

module EmailService
  # EmailService ApplicationController
  class ApplicationController < ::DashboardController
    authorization_context "email_service"
    authorization_required

    protected
    
  end
end
