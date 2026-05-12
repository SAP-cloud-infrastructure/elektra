# frozen_string_literal: true

# Middleware to prevent oauth2-proxy redirect loops by intercepting 401/403 responses
#
# When oauth2-proxy sits in front of Elektra (configured in nginx-ingress),
# it intercepts 401 and 403 HTTP status codes and treats them as "user not authenticated",
# triggering a redirect to the SSO provider. This creates endless redirect loops.
#
# This middleware intercepts ALL 401/403 responses from the Rails app and converts
# them to 200 OK, while preserving the original response body. This prevents
# oauth2-proxy from triggering re-authentication loops.
#
# The response body is unchanged - clients can detect errors by reading the body
# content (which typically contains error details and a 'code' field for APIs).
class OauthProxyProtectionMiddleware
  UNAUTHORIZED = 401
  FORBIDDEN = 403

  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)

    # Only intercept 401 and 403 responses
    return [status, headers, response] unless status == UNAUTHORIZED || status == FORBIDDEN

    # Log the interception for debugging
    request = Rack::Request.new(env)
    Rails.logger.warn(
      "OauthProxyProtectionMiddleware: Intercepted #{status} response for #{request.request_method} #{request.path} " \
      "(converting to 200 to prevent oauth2-proxy redirect loop)"
    )

    # Convert status to 200 OK, keep all headers and body unchanged
    # This prevents oauth2-proxy from seeing 401/403 and triggering re-authentication
    # Clients can still detect the error from the response body
    [200, headers, response]
  end
end
