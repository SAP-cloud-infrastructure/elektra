# SSO Authentication Controller
#
# Handles token verification for two SSO flows:
# 1. SSO Precheck (JavaScript): Frontend directly calls Keystone, then posts token here
# 2. Identity Provider Redirect: External IdP redirects to this endpoint with token
#
# Security: Token is validated against Keystone before creating session
class AuthTokenController < ActionController::Base
  layout 'plain'

  def verify
    token = params[:token]
    return render json: { error: 'Auth token is required' }, status: :bad_request if token.blank?

    # Step 1: Validate token with Keystone (GET request)
    # This is a security check - we don't trust the token until Keystone confirms it
    # Uses MonsoonOpenstackAuth's API client which handles connection pooling and caching
    begin
      token_data = MonsoonOpenstackAuth.api_client.validate_token(token)
    rescue StandardError => e
      @error = 'An error occurred'
      @details = e.message
      return
    end

    unless token_data
      @error = 'Authentication failed'
      return
    end

    domain_name = token_data.dig('user', 'domain', 'name')

    if domain_name
      # Step 2: Create authentication session (POST request to Keystone)
      # This creates a new scoped token and establishes the user session
      auth_session = MonsoonOpenstackAuth::Authentication::AuthSession.create_from_auth_token(self, token)

      if auth_session&.logged_in?
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
      handle_missing_domain_access
    end
  end

  protected

  # CSRF protection override for SSO flows
  # Allows cross-origin requests from trusted SSO providers
  def verify_authenticity_token
    return true if Rails.env.development? || Rails.env.test?
    return true if trusted_sso_origin?

    super # Will raise InvalidAuthenticityToken if CSRF check fails
  end

  private

  # Handles case where token is valid but user has no Keystone access
  def handle_missing_domain_access
    if MonsoonOpenstackAuth.configuration.block_login_fallback_after_sso?
      @error = 'Access Forbidden'
      @oidc_authorization_failure = true
    else
      @error = 'Domain ID not found in response'
    end
  end

  # Checks if request comes from a trusted SSO origin
  # Needed for both Identity Provider redirects and SSO precheck (JavaScript)
  def trusted_sso_origin?
    origin = request.headers['Origin']
    return false if origin.blank?

    trusted_origins = [
      "https://identity-3.#{ENV['MONSOON_DASHBOARD_REGION']}.cloud.sap",  # Identity Provider
      "https://dashboard.#{ENV['MONSOON_DASHBOARD_REGION']}.cloud.sap"     # Dashboard (SSO precheck)
    ]

    trusted_origins.include?(origin)
  end
end
