# frozen_string_literal: true

module ComputeNg
  module Api
    # JSON-only base controller for the compute_ng BFF. Inherits the API
    # authentication + project rescoping from AjaxController.
    class BaseController < AjaxController
      protected

      # The scoped compute_ng service, with project id and region injected.
      def compute_service
        @compute_service ||= services.compute_ng.scoped(@scoped_project_id, current_region)
      end

      # Wraps a BFF action: renders the block's return value as JSON and maps
      # every known error class to a consistent { error, code, message } body
      # with a matching HTTP status. Upstream (OpenStack) status codes are
      # passed through unchanged.
      def handle_api_call(auto_render: true)
        response = yield
        render json: response if auto_render
        response
      rescue ComputeNg::RequestError => e
        render json: { error: "Request Error", code: 400, message: e.message }, status: :bad_request
      rescue Elektron::Errors::ApiResponse => e
        render json: { error: "API Error", code: e.code, message: e.message }, status: e.code
      rescue Elektron::Errors::Request
        render json: {
          error: "Request Error",
          code: 500,
          message: "Service temporarily unavailable. Please try again later.",
        }, status: 500
      rescue Net::HTTPError => e
        render json: { error: "Network Error", code: 500, message: e.message }, status: 500
      rescue StandardError => e
        # Last-resort guard: an unexpected error must still reach the React
        # client as a well-formed JSON envelope (not a raw HTML 500 page the
        # frontend's error/validation layer cannot parse). Log the class and
        # message for debugging, but no request params or object identifiers.
        Rails.logger.error("ComputeNg BFF unhandled error: #{e.class}: #{e.message}")
        render json: {
          error: "Internal Server Error",
          code: 500,
          message: "An unexpected error occurred. Please try again later.",
        }, status: 500
      end
    end
  end
end
