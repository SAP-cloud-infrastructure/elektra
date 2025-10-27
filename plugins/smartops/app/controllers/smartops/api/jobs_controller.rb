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
        puts "Scheduling job in controller: ID #{id} with schedule_date: #{schedule_date}"
        job = services.smartops.schedule_job(id, schedule_date)
        render json: { success: true, job: job }
      end

       def show
         id = params.require(:id)
         jobs = services.smartops.list_jobs(id: id)
         job = jobs.first
         render json: { success: true, job: job }
       end

      private

      def build_filter_params
        filter = { project_id: @scoped_project_id }
        [:name, :type, :id, :scheduled_date, :due_date].each do |param|
          filter[param] = params[param] if params[param].present?
        end
        filter
      end

      def handle_api_error(error)
        render json: {
          success: false,
          error: {
            type: 'API_ERROR',
            message: error.message,
            backtrace: Rails.env.production? ? [] : error.backtrace
          }
        }, status: :bad_request  # 400
      end
    end
  end
end