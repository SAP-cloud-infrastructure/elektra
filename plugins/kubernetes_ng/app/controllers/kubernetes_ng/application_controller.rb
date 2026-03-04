# frozen_string_literal: true

module KubernetesNg
  class ApplicationController < AjaxController

    ALLOWED_SERVICES = %w[prod canary qa].freeze

    def show
      # Store service_name in session when loading the React app
      @service_name = params[:service_name]

      # Redirect to default service if no service_name provided
      if @service_name.blank?
        redirect_to plugin('kubernetes_ng').service_path(service_name: 'prod')
        return
      end

      # Validate service_name is allowed
      unless ALLOWED_SERVICES.include?(@service_name)
        redirect_to plugin('kubernetes_ng').service_path(service_name: 'prod')
        return
      end

      session[:kubernetes_service_name] = @service_name
    end

    protected

    # Returns a scoped Kubernetes service with project_id, region, and service_name automatically injected
    def kubernetes_service
      # Try to get service_name from params first (for service-scoped API routes)
      # Fall back to session (for just API routes without UI)
      service_name = params[:service_name] || session[:kubernetes_service_name]

      # Reset the cached service if the service_name has changed
      if @kubernetes_service && @cached_service_name != service_name
        @kubernetes_service = nil
      end

      @cached_service_name = service_name
      @kubernetes_service ||= services.kubernetes_ng.scoped(@scoped_project_id, current_region, service_name)
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
