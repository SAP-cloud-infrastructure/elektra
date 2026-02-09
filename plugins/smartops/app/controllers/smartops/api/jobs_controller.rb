module Smartops
  module Api
    class JobsController < AjaxController
      rescue_from StandardError, with: :handle_api_error

      def index
        filter = build_filter_params
        jobs = services.smartops.list_jobs(filter)
        render json: { success: true, jobs: jobs }
      end

      def update
        id = params.require(:id)
        schedule_date = params.require(:schedule_date)
        Rails.logger.info "Scheduling job in controller: ID #{id} with schedule_date: #{schedule_date}"
        render json: { success: services.smartops.schedule_job(id, schedule_date) }
      end

       def show
         id = params.require(:id)
         jobs = services.smartops.list_jobs(id: id)
         job = jobs.first
         render json: { success: true, job: job }
       end

      private

      def build_filter_params
        filter = {}
        [:name, :type, :id, :scheduled_date, :due_date].each do |param|
          filter[param] = params[param] if params[param].present?
        end
        filter
      end

      # this method handles API errors and returns a standardized JSON response
      def handle_api_error(error)
        # error = <Elektron::Errors::ApiResponse: ERRORTYPE>
        # Handle errors that have a status method (like Elektron::Errors::ApiResponse)

        status_code = error.respond_to?(:status) ? error.status : :bad_request
        # Note this error is swallowed by the the ajax_helper -> elektra/app/javascript/lib/ajax_helper.js -> if (!response.ok)
        # and needs that structure to be properly handled
        error_response = {
          success: false,
          error: error.message || error.response.body || "An unexpected error occurred", # this will be the error.message on js side
        }
        render json: error_response , status: status_code
      end
    end
  end
end
