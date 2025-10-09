# require "elektron"
require 'net/http'
require 'json'
require 'uri'

module V2 
  class AuthHandler

    def self.request_token(auth_data) 
      uri = URI.parse(Rails.configuration.keystone_endpoint)
      uri.path= "/v3/auth/tokens"

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.verify_mode = Rails.env["ELEKTRA_SSL_VERIFY_PEER"] == true || OpenSSL::SSL::VERIFY_NONE if Rails.env.development? # Only for dev!

      request = Net::HTTP::Post.new(uri.path)
      request['Content-Type'] = 'application/json'
      request['Accept'] = 'application/json'
      request.body = auth_data.to_json
      

      response = http.request(request)
    
      if response.code == '201'
        return {
          success: true,
          token_data: JSON.parse(response.body)["token"],
          token: response['X-Subject-Token']
        }
      else
        return {
          error: "Authentication failed: #{response.code} - #{response.body}",
          success: false
        }
      end
    end

    def self.authenticate_with_credentials(user, password, scope = {})
      payload = {
        auth: {
          identity: build_password_auth_payload(user,password, scope),
          scope: build_scope(scope)
        }
      }
      request_token(payload)
    end

    private 

    def self.build_password_auth_payload(user,password,scope={})
      auth_scope = build_scope(scope)
      payload = {
        methods: ["password"],
        password: {
          user: {
            name: user,
            password: password,
            domain: build_domain_scope(scope)
          }
        }
      }
    end

    def self.build_scope(scope={})
      project_scope = build_project_scope(scope)
      return {project: project_scope} if project_scope

      domain_scope = build_domain_scope(scope)
      return {domain: domain_scope} if domain_scope 

      return nil 
    end

    def self.build_domain_scope(scope={})
      return {id: scope[:domain_id]} if scope[:domain_id]
      return {name: scope[:domain_name]} if scope[:domain_name]
      return nil
    end

    def self.build_project_scope(scope={})
      return {id: scope[:project_id]} if scope[:project_id]

      domain_scope = build_domain_scope(scope)
      return {name: scope[:domain_name, domain: domain_scope]} if scope[:project_name]  
    end
  end
end