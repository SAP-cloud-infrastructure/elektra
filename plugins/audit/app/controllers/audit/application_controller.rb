module Audit
  class ApplicationController < DashboardController

    authorization_context 'audit'
    authorization_required

    def index
      enforce_permissions('audit:application_get')
      @events_endpoint = current_user.service_url('audit-data')
    end
  end
end
