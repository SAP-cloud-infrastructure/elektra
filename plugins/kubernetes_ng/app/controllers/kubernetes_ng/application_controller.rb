# frozen_string_literal: true

module KubernetesNg
  class ApplicationController < AjaxController

    ALLOWED_LANDSCAPES = %w[prod canary qa].freeze

    def show
      # Store landscape_name in session when loading the React app
      @landscape_name = params[:landscape_name]

      # Redirect to default landscape if no landscape_name provided
      if @landscape_name.blank?
        redirect_to plugin('kubernetes_ng').service_path(landscape_name: 'prod')
        return
      end

      # Validate landscape_name is allowed
      unless ALLOWED_LANDSCAPES.include?(@landscape_name)
        redirect_to plugin('kubernetes_ng').service_path(landscape_name: 'prod')
        return
      end

      session[:kubernetes_landscape_name] = @landscape_name
    end

    protected

    # Returns a scoped Kubernetes service with project_id, region, and landscape_name automatically injected
    def kubernetes_service
      # Try to get landscape_name from params first (for landscape-scoped API routes)
      # Fall back to session (for just API routes without UI)
      landscape_name = params[:landscape_name] || session[:kubernetes_landscape_name]

      # Raise error if landscape_name is missing (indicates session expired or missing setup)
      if landscape_name.blank?
        raise "Landscape name is required."
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
