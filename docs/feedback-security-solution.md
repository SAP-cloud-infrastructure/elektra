# Secure Feedback Endpoint Solution

## Security Architecture: CORS + SSO + Rate Limiting

This document describes the secure implementation for the Aurora → Elektra feedback endpoint.

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: CORS (Browser-enforced)                               │
│  - Only Aurora can make JavaScript requests                     │
│  - Blocks all other origins                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: SSO Authentication (Server-enforced)                  │
│  - User must be logged in via SSO                               │
│  - Session cookie validated                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Rate Limiting (Server-enforced)                       │
│  - Max 10 requests per hour per user                            │
│  - Prevents spam/abuse                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Input Validation (Server-enforced)                    │
│  - Strong parameters                                            │
│  - Specific allowed context fields                              │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Elektra Controller

```ruby
# app/controllers/feedback_controller.rb
class FeedbackController < ActionController::Base
  include MonsoonOpenstackAuth::Authentication
  include Services
  include CurrentUserWrapper

  authentication_required rescope: false

  # CORS is configured to allow only Aurora
  # This makes CSRF protection redundant for JavaScript attacks
  # Remaining risk: HTML form submissions (low impact, rate limited)
  skip_before_action :verify_authenticity_token, only: [:create]
  
  before_action :set_cors_headers, only: [:create]
  before_action :check_rate_limit, only: [:create]
  before_action :validate_feedback_params, only: [:create]

  def create
    FeedbackMailer.user_feedback(
      feedback_message: feedback_params[:feedback_message],
      context: enriched_context
    ).deliver_now

    render json: {
      status: 'success',
      message: 'Feedback submitted successfully'
    }, status: :ok
  rescue EmailDeliveryError => e
    Rails.logger.error "Failed to send feedback email: #{e.message}"
    render json: {
      status: 'error',
      message: 'Failed to send feedback email'
    }, status: :service_unavailable
  rescue StandardError => e
    Rails.logger.error "Unexpected error sending feedback: #{e.message}"
    render json: {
      status: 'error',
      message: 'An unexpected error occurred'
    }, status: :internal_server_error
  end

  private

  def set_cors_headers
    # Only allow Aurora to make JavaScript requests
    aurora_origin = "https://dashboard-aurora.#{Rails.application.config.region}.#{Rails.application.config.tld}"
    
    if request.headers['Origin'] == aurora_origin
      response.headers['Access-Control-Allow-Origin'] = aurora_origin
      response.headers['Access-Control-Allow-Credentials'] = 'true'
      response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
      response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    end
  end

  def feedback_params
    params.require(:feedback).permit(
      :feedback_message,
      context: [:page_url, :source, :browser, :browser_version, :viewport, :feature, :action]
    )
  end

  def enriched_context
    context = feedback_params[:context] || {}
    context.merge(
      domain_id: current_user.user_domain_id,
      domain_name: current_user.user_domain_name,
      project_id: @scoped_project_id,
      project_name: @scoped_project_name
    )
  end

  def validate_feedback_params
    if feedback_params[:feedback_message].blank?
      render json: {
        status: 'error',
        message: 'Missing required field: feedback_message'
      }, status: :bad_request
      return
    end

    if feedback_params[:feedback_message].length > 10_000
      render json: {
        status: 'error',
        message: 'Feedback message too long (maximum 10,000 characters)'
      }, status: :bad_request
      return
    end
  end

  def check_rate_limit
    rate_limit_key = "feedback:rate_limit:user:#{current_user.id}"
    rate_limit_max = 10
    rate_limit_period = 1.hour

    count = Rails.cache.read(rate_limit_key) || 0

    if count >= rate_limit_max
      Rails.logger.warn "Rate limit exceeded for user #{current_user.id} - IP: #{request.remote_ip}"
      render json: {
        status: 'error',
        message: 'Too many feedback submissions. Please try again later.'
      }, status: :too_many_requests
      return
    end

    Rails.cache.write(rate_limit_key, count + 1, expires_in: rate_limit_period)
  end
end
```

### 2. Handle OPTIONS preflight (for CORS)

```ruby
# config/routes.rb
Rails.application.routes.draw do
  scope '/system' do
    # Handle CORS preflight
    match :feedback, to: 'feedback#cors_preflight', via: :options
    
    # Feedback endpoint
    post :feedback, to: 'feedback#create'
  end
end
```

```ruby
# Add to FeedbackController
def cors_preflight
  set_cors_headers
  head :ok
end
```

### 3. Aurora Implementation

```javascript
// Aurora frontend code
async function sendFeedback(feedbackMessage, context) {
  try {
    const response = await fetch(
      'https://dashboard.region.tld/system/feedback',
      {
        method: 'POST',
        credentials: 'include',  // Include SSO session cookie
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback: {
            feedback_message: feedbackMessage,
            context: {
              page_url: window.location.href,
              source: 'feedback-button',
              browser: navigator.userAgent,
              browser_version: navigator.appVersion,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              feature: context.feature,
              action: context.action
            }
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send feedback:', error);
    throw error;
  }
}
```

## Security Analysis

### Protected Against:

✅ **JavaScript attacks from unauthorized domains**
- CORS blocks all requests except from Aurora
- Only Aurora's origin can make JavaScript fetch/XHR calls

✅ **Unauthenticated requests**
- `authentication_required` ensures user has valid SSO session
- No anonymous feedback submissions

✅ **Spam/abuse**
- Rate limiting: 10 requests/hour per user
- Prevents mass spam campaigns

✅ **Data injection**
- Strong parameters limit allowed fields
- Context fields explicitly whitelisted
- Message length validation (10k chars max)

✅ **Server-side data spoofing**
- Domain/project context added server-side
- Client cannot fake domain_id, project_id

✅ **Silent mail failures**
- EmailDeliveryError caught and returned to client
- Client knows if submission failed

### Remaining Risk (Acceptable):

⚠️ **HTML form-based CSRF attacks**

**Attack scenario:**
```html
<!-- evil.com -->
<form action="https://dashboard.region.tld/system/feedback" method="POST">
  <input name="feedback[feedback_message]" value="spam">
</form>
<script>document.forms[0].submit();</script>
```

**Why this is low risk:**
1. User must visit evil.com while logged into Elektra (unlikely)
2. Rate limited to 10 submissions/hour
3. Uses victim's own session (traceable to their account)
4. Can't read response (no data exfiltration)
5. Low-impact operation (just feedback, not payments/data changes)
6. Modern browsers have additional protections (SameSite cookies)

**Mitigation:**
- Rate limiting prevents mass spam
- User can report suspicious activity
- Monitoring/alerting on unusual feedback patterns

**If this risk is unacceptable:** Add CSRF protection (see alternative solution below)

## Alternative: Add CSRF Protection

If you want defense-in-depth against form attacks:

### Add token endpoint:

```ruby
# In FeedbackController
def csrf_token
  render json: { csrf_token: form_authenticity_token }
end

# Don't skip CSRF for create action
# before_action :verify_authenticity_token is now active
```

### Aurora calls token endpoint first:

```javascript
// Get CSRF token
const tokenRes = await fetch('https://dashboard.region.tld/system/feedback_token', {
  credentials: 'include'
});
const { csrf_token } = await tokenRes.json();

// Send feedback with token
await fetch('https://dashboard.region.tld/system/feedback', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf_token
  },
  body: JSON.stringify({...})
});
```

**Trade-off:** Extra network request + complexity vs. eliminating form CSRF risk

## Deployment Checklist

- [ ] CORS headers configured to allow only Aurora origin
- [ ] SSO authentication required on endpoint
- [ ] Rate limiting implemented (10/hour per user)
- [ ] Strong parameters configured
- [ ] Message length validation (10k max)
- [ ] Email delivery error handling
- [ ] Monitoring/alerting for suspicious patterns
- [ ] SameSite cookie attribute set (if not already)
- [ ] HTTPS enforced (should already be via ingress)

## Testing

### Test 1: Legitimate request from Aurora
```bash
# Should succeed
curl -X POST https://dashboard.region.tld/system/feedback \
  -H "Origin: https://dashboard-aurora.region.tld" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=valid_session" \
  -d '{"feedback":{"feedback_message":"test"}}'
```

### Test 2: JavaScript from unauthorized domain
```javascript
// Should fail with CORS error
fetch('https://dashboard.region.tld/system/feedback', {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({...})
});
// Error: CORS policy blocked
```

### Test 3: Unauthenticated request
```bash
# Should return 401 Unauthorized
curl -X POST https://dashboard.region.tld/system/feedback \
  -H "Content-Type: application/json" \
  -d '{"feedback":{"feedback_message":"test"}}'
```

### Test 4: Rate limiting
```bash
# Send 11 requests
for i in {1..11}; do
  curl -X POST https://dashboard.region.tld/system/feedback \
    -H "Cookie: session_id=valid_session" \
    -d '{"feedback":{"feedback_message":"test"}}';
done
# 11th request should return 429 Too Many Requests
```

## Monitoring

Monitor for:
- Failed authentication attempts
- Rate limit violations
- Unusual feedback patterns (same message repeated, etc.)
- CORS violations (requests from unexpected origins)
- Email delivery failures

## Conclusion

This solution provides **strong security** with **minimal complexity**:
- No API tokens to manage
- No certificate infrastructure
- No CSRF token endpoints (unless you want defense-in-depth)
- Simple to deploy and maintain

The security is appropriate for a **customer-facing feedback endpoint** that:
- Doesn't handle sensitive data
- Doesn't modify critical resources
- Is rate-limited and authenticated
- Has low impact if abused
