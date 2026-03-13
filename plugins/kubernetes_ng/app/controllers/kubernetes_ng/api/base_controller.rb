# frozen_string_literal: true

module KubernetesNg
  module Api
    class BaseController < AjaxController

      protected

      # Returns a scoped Kubernetes service with project_id, region, and landscape_name automatically injected
      def kubernetes_service
        # Get landscape_name from params (always present in landscape-scoped routes)
        landscape_name = params[:landscape_name]

        # Raise error if landscape_name is missing
        if landscape_name.blank?
          raise KubernetesNg::LandscapeError, "Landscape name is required."
        end

        # Reset the cached service if the landscape_name has changed
        if @kubernetes_service && @cached_landscape_name != landscape_name
          @kubernetes_service = nil
        end

        @cached_landscape_name = landscape_name
        @kubernetes_service ||= services.kubernetes_ng.scoped(@scoped_project_id, current_region, landscape_name)
      end

      def handle_api_call(auto_render: true)
        # if the API call is successful, return the response
        # but only render if auto_render is true
        # otherwise do only error handling
        begin
          response = yield
          render json: response if auto_render
          response
        rescue KubernetesNg::LandscapeError => e
          render json: {
            error: "Landscape Error",
            code: 400,
            message: e.message
          }, status: :bad_request
        rescue Elektron::Errors::ApiResponse => e
          render json: {
            error: "API Error",
            code: e.code,
            message: e.message
          }, status: e.code
        rescue Elektron::Errors::Request => e
          render json: {
            error: "Request Error",
            code: 500,
            message: "Service temporarily unavailable. Please try again later.",
          }, status: 500
        rescue Net::HTTPError => e
          render json: {
            error: "Network Error",
            message: e.message
          }, status: 500
        end
      end

    end
  end
end
