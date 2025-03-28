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

    request = Net::HTTP::Get.new(url)
    request['X-Subject-Token'] = token
    request['X-Auth-Token'] = token

    begin
      response = http.request(request)

      if response.is_a?(Net::HTTPSuccess)
        response_body = JSON.parse(response.body)
        domain_id = response_body.dig('token', 'user', 'domain', 'id')

        if domain_id
          # Render the loading view while processing the redirect
          @domain_id = domain_id
          @auth_token = encode_auth_token(token)
          # render :redirect_form, locals: { domain_id: @domain_id, auth_token: @auth_token } and return
          render :redirect and return
        else
          @error = 'Domain ID not found in response'
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
    # Call the original method to maintain normal CSRF checking
    super unless allowed_origin?

    true
  end

  private

  def allowed_origin?
    # Define your trusted domains
    trusted_origins = [KEYSTONE_ENDPOINT]

    # Check the Origin header
    origin = request.headers['Origin']
    trusted_origins.include?(origin)
  end

  def encode_auth_token(auth_token)
    @verifier = ActiveSupport::MessageVerifier.new(Rails.application.secret_key_base)
    @verifier.generate(auth_token)
  end
end
