# frozen_string_literal: true

module Smartops
  class ApplicationController < DashboardController
    def show
      services.smartops.list_jobs(status: 'initial', project_id: @scoped_project_id)
    end
  end
end
