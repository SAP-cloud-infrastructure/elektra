# frozen_string_literal: true

module ComputeNjq
  module Api
    # JSON-only base controller for the compute_njq BFF. Inherits the API
    # authentication + project rescoping from AjaxController.
    class BaseController < AjaxController
      protected

      # The scoped compute_njq service, with project id and region injected.
      def compute_service
        @compute_service ||= services.compute_njq.scoped(@scoped_project_id, current_region)
      end

      # Server-side policy gate for mutating actions. The client-side policy
      # engine only gates the UI; a hand-crafted request would otherwise reach
      # the service unchecked. Returns true when allowed; otherwise renders a 403
      # envelope (matching handle_api_call's shape) and returns false so the
      # caller aborts before touching the service.
      def authorize!(rule)
        return true if current_user.is_allowed?(rule, policy_target)

        render json: {
          error: "Forbidden",
          code: 403,
          message: "You are not allowed to perform this action.",
        }, status: :forbidden
        false
      end

      # The policy target for the scoped request: the domain/project the user is
      # acting in. Mirrors ScopeController's @policy_default_params target.
      def policy_target
        { target: { scoped_domain_name: @scoped_domain_name, scoped_project_name: @scoped_project_name } }
      end

      # Wraps a BFF action: renders the block's return value as JSON and maps
      # every known error class to a consistent { error, code, message } body
      # with a matching HTTP status. Upstream (OpenStack) status codes are
      # passed through unchanged.
      def handle_api_call(auto_render: true)
        response = yield
        render json: response if auto_render
        response
      rescue ComputeNjq::RequestError => e
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
        Rails.logger.error("ComputeNjq BFF unhandled error: #{e.class}: #{e.message}")
        render json: {
          error: "Internal Server Error",
          code: 500,
          message: "An unexpected error occurred. Please try again later.",
        }, status: 500
      end
    end
  end
end
