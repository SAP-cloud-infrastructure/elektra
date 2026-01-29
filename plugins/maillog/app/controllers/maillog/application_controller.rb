# frozen_string_literal: true

module Maillog
  # Maillog ApplicationController
  class ApplicationController < ::DashboardController
    authorization_context "maillog"
    authorization_required

    def index
    end

  end
end
