module Smartops
  module Api
    class JobsController < AjaxController
      def index
        params.permit(:name, :type, :id, :scheduled_date, :due_date)
        filter = {project_id: @scoped_project_id}
        filter[:name] = params[:name] if params[:name]
        filter[:type] = params[:type] if params[:type]
        filter[:id] = params[:id] if params[:id]
        filter[:scheduled_date] = params[:scheduled_date] if params[:scheduled_date]
        filter[:due_date] = params[:due_date] if params[:due_date]
        render json: services.smartops.list_jobs(filter)
      end

      def update
        id = params.require(:id)
        schedule_date = params.require(:schedule_date)
        render json: services.smartops.schedule_job(id: id, schedule_date: schedule_date)
      end

      def show
        id = params.require(:id)
        render json: services.smartops.list_jobs(id: id)
      end
    end
  end
end