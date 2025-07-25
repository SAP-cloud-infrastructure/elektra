# frozen_string_literal: true

module Reports
  class CostController < DashboardController
    authorization_context "reports"
    authorization_required
    
    def project
      if request.format.json?
        data = services.masterdata_cockpit.get_project_costing
      end

      respond_to do |format|
        format.html
        format.json { render json: data }
      end
    end

    def domain
      if request.format.json?
        data = services.masterdata_cockpit.get_domain_costing
      end

      respond_to do |format|
        format.html
        format.json { render json: data }
      end
    end
  end
end
