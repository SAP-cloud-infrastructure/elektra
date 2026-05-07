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
          # Render the loading view while processing the redirect
          @domain_name = domain_name
          @auth_token = encode_auth_token(token)
          render :redirect and return
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
    trusted_origins = ["https://identity-3.#{ENV['MONSOON_DASHBOARD_REGION']}.cloud.sap"]

    # Check the Origin header
    origin = request.headers['Origin']
    trusted_origins.include?(origin)
  end

  def encode_auth_token(auth_token)
    @verifier = ActiveSupport::MessageVerifier.new(Rails.application.secret_key_base)
    @verifier.generate(auth_token)
  end
end
