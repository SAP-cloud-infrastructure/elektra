# app/controllers/api/webconsole_controller.rb
require 'net/http'
require 'uri'
require 'json'

module Webconsole
  class ProxyController < ApplicationController
    skip_before_action :verify_authenticity_token
    
    def forward
      target_url = build_target_url
      uri = URI.parse(target_url)
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.read_timeout = 30
      
      # Create request based on method
      http_request = create_request(uri)
      
      # Execute request
      response = http.request(http_request)
      
      # Return response with proper content type
      render body: response.body, status: response.code, content_type: response.content_type
    rescue StandardError => e
      Rails.logger.error("Web Console proxy error: #{e.message}")
      render json: { error: e.message }, status: :bad_gateway
    end
    
    private
    
    def build_target_url
      # Extract the web console base URL from environment
      base_url = ENV['WEBCONSOLE_URL'] || 'https://cloudshell-qa.eu-de-1.cloud.sap'
      
      # Get the path from params
      path = params[:path] || ''
      
      # Preserve query parameters
      query_string = request.query_string.present? ? "?#{request.query_string}" : ''
      
      "#{base_url}/#{path}#{query_string}"
    end
    
    def create_request(uri)
      case request.method.upcase
      when 'GET'
        req = Net::HTTP::Get.new(uri.request_uri)
      when 'POST'
        req = Net::HTTP::Post.new(uri.request_uri)
        req.body = request.body.read
      when 'PUT'
        req = Net::HTTP::Put.new(uri.request_uri)
        req.body = request.body.read
      when 'PATCH'
        req = Net::HTTP::Patch.new(uri.request_uri)
        req.body = request.body.read
      when 'DELETE'
        req = Net::HTTP::Delete.new(uri.request_uri)
      else
        raise "Unsupported HTTP method: #{request.method}"
      end
      
      # Forward relevant headers
      forward_headers(req)
      
      req
    end
    
    def forward_headers(req)
      # Forward content type
      req['Content-Type'] = request.content_type if request.content_type
      
      # Forward accept header
      req['Accept'] = request.headers['Accept'] if request.headers['Accept']
      
      # Forward authorization if present (important for web console)
      req['Authorization'] = request.headers['Authorization'] if request.headers['Authorization']
      
      # Forward cookies if needed
      req['Cookie'] = request.headers['Cookie'] if request.headers['Cookie']
      
      # Add any custom headers your web console needs
      # req['X-Custom-Header'] = 'value'
    end
  end
end
