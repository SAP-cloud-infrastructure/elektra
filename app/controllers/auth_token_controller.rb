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
        after_login_url = safe_after_login_url(params[:after_login], domain_name)
        Rails.logger.info "SSO login successful: domain=#{domain_name}, user=#{auth_session.user&.name || 'unknown'}"

        # Two callers reach this action:
        # 1. SSO Precheck (JavaScript fetch): expects JSON so it can navigate itself.
        #    A 302 here would be silently followed by fetch and its body injected via
        #    document.write, which never changes the URL bar. Return the target URL instead.
        # 2. Identity Provider redirect (top-level navigation): a real 302 is correct.
        if request.format.json? || request.xhr?
          render json: { redirect_to: after_login_url }
        else
          redirect_to after_login_url
        end
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

  # CSRF protection override for the two SSO flows reaching #verify:
  #
  # 1. SSO Precheck (same-origin JavaScript fetch): CAN and MUST supply a valid
  #    CSRF token. Whenever a token is present we always run the standard Rails
  #    check via `super`, so the precheck flow is fully CSRF-protected. This also
  #    means a request that sends a *wrong* token is rejected even if it happens
  #    to originate from a trusted Origin.
  #
  # 2. Identity Provider redirect (cross-origin top-level navigation): the
  #    external IdP has no access to our CSRF token and therefore cannot send
  #    one. For these token-less requests we fall back to verifying the request
  #    comes from a trusted SSO Origin.
  def verify_authenticity_token
    return true if Rails.env.development? || Rails.env.test?

    # A present CSRF token is always authoritative (precheck flow).
    return super if csrf_token_present?

    # Token-less requests are only accepted from trusted SSO origins (IdP flow).
    return true if trusted_sso_origin?

    super # No token and untrusted origin -> raise InvalidAuthenticityToken
  end

  # True when the request carries a CSRF token, either as the standard form
  # parameter or the X-CSRF-Token header used by the precheck fetch call.
  def csrf_token_present?
    params[request_forgery_protection_token].present? ||
      request.headers['X-CSRF-Token'].present? ||
      request.headers['X-Csrf-Token'].present?
  end

  private

  # Returns a validated post-login redirect target, falling back to the domain
  # home page when the requested URL is missing or not safe (open-redirect guard).
  def safe_after_login_url(url, domain_name)
    return url if safe_redirect_url?(url)

    "/#{domain_name}/home"
  end

  # Only allow relative URLs or URLs pointing at the current host to prevent
  # open redirects to attacker-controlled destinations.
  def safe_redirect_url?(url)
    return false if url.blank?

    begin
      uri = URI.parse(url)
      uri.host.nil? || uri.host == request.host
    rescue URI::InvalidURIError
      false
    end
  end

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
