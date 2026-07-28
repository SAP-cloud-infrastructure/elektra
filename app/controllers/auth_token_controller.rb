require 'net/http'
require 'uri'
require 'json' # Ensure JSON module is required

KEYSTONE_ENDPOINT = if ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']
                      URI.parse(ENV['MONSOON_OPENSTACK_AUTH_API_ENDPOINT']).origin
                    else
                      ''
                    end

class AuthTokenController < ActionController::Base
  layout 'plain'

  def verify
    token = params[:token]
    return render json: { error: 'Auth token is required' }, status: :bad_request if token.blank?

    # Ensure the endpoint path is correctly formatted
    url = URI.parse("#{KEYSTONE_ENDPOINT}/v3/auth/tokens")

    # Set up the HTTP connection
    http = Net::HTTP.new(url.host, url.port)
    http.use_ssl = true if url.scheme == 'https'
    if ENV['ELEKTRA_SSL_VERIFY_PEER'] == 'false'
      http.verify_mode = 0
    end

    request = Net::HTTP::Get.new(url)
    request['X-Subject-Token'] = token
    request['X-Auth-Token'] = token

    begin
      response = http.request(request)

      if response.is_a?(Net::HTTPSuccess)
        response_body = JSON.parse(response.body)
        domain_name = response_body.dig('token', 'user', 'domain', 'name')

        if domain_name
          # Create authentication session directly - no redirect needed
          # Since MonsoonOpenstackAuth is now part of the same codebase,
          # we can call it directly instead of going through consume_auth_token
          auth_session = MonsoonOpenstackAuth::Authentication::AuthSession.create_from_auth_token(self, token)

          if auth_session&.logged_in?
            # Get after_login URL from localStorage (will be in query param from identity provider)
            after_login_url = params[:after_login].presence || "/#{domain_name}/home"

            Rails.logger.info "SSO login successful: domain=#{domain_name}, user=#{auth_session.user&.name || 'unknown'}"
            redirect_to after_login_url
            return
          else
            @error = 'Failed to create authentication session'
            Rails.logger.warn "SSO auth session creation failed for domain: #{domain_name}"
          end
        else
          # Token is valid but user has no domain/project access (no Keystone role assignments)
          if MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?
            @error = 'Access Forbidden'
            @oidc_authorization_failure = true
          else
            @error = 'Domain ID not found in response'
          end
        end
      else
        @error = 'Authentication failed'
      end
    rescue JSON::ParserError => e
      @error = 'Invalid JSON response'
      @details = e.message
    rescue StandardError => e
      @error = 'An error occurred'
      @details = e.message
    end
  end

  protected

  def verify_authenticity_token
    return true if Rails.env.development? || Rails.env.test?
    return true if allowed_origin?

    super # Will raise InvalidAuthenticityToken if CSRF check fails
  end

  private

  def allowed_origin?
    # Define your trusted domains
    # Include both identity provider and dashboard domains
    trusted_origins = [
      "https://identity-3.#{ENV['MONSOON_DASHBOARD_REGION']}.cloud.sap",
      "https://dashboard.#{ENV['MONSOON_DASHBOARD_REGION']}.cloud.sap"
    ]

    # Check the Origin header
    origin = request.headers['Origin']
    trusted_origins.include?(origin)
  end
end
