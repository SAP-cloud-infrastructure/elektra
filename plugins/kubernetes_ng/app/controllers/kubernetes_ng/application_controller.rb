# frozen_string_literal: true

module KubernetesNg
  class ApplicationController < AjaxController

    protected

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
