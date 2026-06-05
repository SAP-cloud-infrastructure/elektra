# Feedback Endpoint Authentication Options

This document outlines different authentication approaches for the `/system/feedback` endpoint that Aurora uses.

## Current Implementation: API Token

**How it works:**
- Aurora sends `X-Feedback-API-Token` header with each request
- Elektra validates token against `ENV['FEEDBACK_API_TOKEN']`
- Token must be deployed to both Aurora and Elektra Kubernetes namespaces

**Pros:**
- Simple to understand
- Works across any network boundary
- No certificate management

**Cons:**
- ❌ Token must be securely stored in 2 different Kubernetes namespaces
- ❌ Token rotation requires coordinated deployment to both services
- ❌ If token leaks, must redeploy both services
- ❌ Managing secrets in K8s is operationally complex

---

## Option 1: SSO Session Only (Recommended - Simplest)

**How it works:**
- Remove API token validation entirely
- Rely on existing `authentication_required` (line 5 in controller)
- Aurora shares SSO cookie with Elektra
- User must be logged in via SSO to submit feedback

**Implementation:**
```ruby
class FeedbackController < ActionController::Base
  include MonsoonOpenstackAuth::Authentication
  
  authentication_required rescope: false
  
  before_action :check_rate_limit, only: [:create]
  before_action :validate_feedback_params, only: [:create]
  
  # No API token validation needed!
end
```

**Pros:**
- ✅ Zero additional secrets to manage
- ✅ User must be authenticated (already have SSO session)
- ✅ Rate limiting per user prevents abuse
- ✅ CORS configuration limits which domains can call the endpoint
- ✅ Simplest deployment - works immediately

**Cons:**
- User must have active SSO session (but this is already required)

**Security layers:**
1. User authentication via SSO (authentication_required)
2. Rate limiting (10 requests/hour per user)
3. CORS restrictions (only Aurora's domain can call)
4. Input validation (strong parameters)

---

## Option 2: OAuth2 Bearer Token

**How it works:**
- Aurora sends user's OAuth2/OIDC token in `Authorization: Bearer <token>` header
- Elektra validates token against identity provider
- Each request includes proof of user's identity

**Implementation:**
```ruby
def validate_bearer_token
  token = request.headers['Authorization']&.split(' ')&.last
  
  # Validate token with identity provider
  user_info = validate_with_keystone(token)
  
  unless user_info
    render json: { status: 'error', message: 'Invalid token' }, status: :unauthorized
    return
  end
end
```

**Pros:**
- ✅ No shared secrets to manage
- ✅ Token is per-user and short-lived
- ✅ Can verify user identity from token

**Cons:**
- More complex validation logic
- May require additional API calls to identity provider

---

## Option 3: Mutual TLS (mTLS)

**How it works:**
- Both Aurora (client) and Elektra (server) present certificates
- Certificates are signed by a trusted Certificate Authority (CA)
- TLS layer verifies both sides before HTTP request even happens
- No application-level authentication needed

**Architecture:**
```
Aurora (client cert) <---mTLS---> Elektra (server cert)
     |                                  |
     +--- Signed by CA                  +--- Signed by CA
```

**Implementation:**

1. Generate certificates:
```bash
# Certificate Authority (CA)
openssl genrsa -out ca.key 4096
openssl req -new -x509 -key ca.key -out ca.crt -days 3650

# Aurora client certificate
openssl genrsa -out aurora-client.key 2048
openssl req -new -key aurora-client.key -out aurora-client.csr
openssl x509 -req -in aurora-client.csr -CA ca.crt -CAkey ca.key -out aurora-client.crt

# Elektra server certificate
openssl genrsa -out elektra-server.key 2048
openssl req -new -key elektra-server.key -out elektra-server.csr
openssl x509 -req -in elektra-server.csr -CA ca.crt -CAkey ca.key -out elektra-server.crt
```

2. Configure Nginx/Ingress for mTLS:
```nginx
server {
  listen 443 ssl;
  
  # Server certificate
  ssl_certificate /etc/nginx/certs/elektra-server.crt;
  ssl_certificate_key /etc/nginx/certs/elektra-server.key;
  
  # Client certificate verification
  ssl_client_certificate /etc/nginx/certs/ca.crt;
  ssl_verify_client on;
  
  location /system/feedback {
    # Request only reaches here if client cert is valid
    proxy_pass http://elektra-backend;
  }
}
```

3. Aurora makes request with client cert:
```javascript
fetch('https://elektra/system/feedback', {
  method: 'POST',
  cert: '/path/to/aurora-client.crt',
  key: '/path/to/aurora-client.key',
  body: JSON.stringify(feedback)
})
```

**Pros:**
- ✅ Very secure - authentication happens at TLS layer
- ✅ No application code changes needed
- ✅ Automatic with service mesh (Istio, Linkerd)
- ✅ Can't be bypassed - happens before HTTP request
- ✅ Certificates can be auto-rotated by cert-manager in K8s

**Cons:**
- ❌ Requires certificate infrastructure (CA, cert-manager)
- ❌ More complex initial setup
- ❌ Need to configure at ingress/load balancer level
- ❌ Debugging is harder (TLS layer vs application layer)

**Best for:**
- Microservices within same Kubernetes cluster using service mesh
- High-security environments with existing PKI infrastructure
- When you want zero-trust networking

---

## Option 4: Kubernetes Service Account Token

**How it works:**
- Aurora pod has a Kubernetes service account
- K8s automatically mounts a JWT token into the pod
- Aurora sends this token to Elektra
- Elektra validates token with K8s API server

**Implementation:**

1. Create ServiceAccount for Aurora:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: aurora-feedback
  namespace: aurora
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: feedback-submitter
rules:
- apiGroups: [""]
  resources: ["serviceaccounts/token"]
  verbs: ["create"]
```

2. Aurora reads token from pod:
```javascript
const token = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token');

fetch('https://elektra/system/feedback', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

3. Elektra validates token:
```ruby
def validate_k8s_token
  token = request.headers['Authorization']&.split(' ')&.last
  
  # Validate with K8s API server
  k8s_client = Kubeclient::Client.new('https://kubernetes.default.svc')
  k8s_client.auth_options = { bearer_token: token }
  
  begin
    # Try to get the service account info
    sa = k8s_client.get_service_account('aurora-feedback', 'aurora')
    # Token is valid!
  rescue
    render json: { status: 'error', message: 'Invalid token' }, status: :unauthorized
  end
end
```

**Pros:**
- ✅ Tokens automatically managed by Kubernetes
- ✅ Auto-rotated
- ✅ No manual secret management

**Cons:**
- ❌ Only works within same Kubernetes cluster
- ❌ Requires K8s API access from Elektra
- ❌ More complex validation logic

**Best for:**
- Both services in same Kubernetes cluster
- Want automatic token rotation
- Already have K8s RBAC setup

---

## Recommendation

**For your use case (Aurora → Elektra feedback):**

### Use Option 1: SSO Session Only

**Why:**
1. You already have `authentication_required` - user must be logged in
2. Aurora shares SSO cookie with Elektra
3. Rate limiting prevents abuse (10 requests/hour per user)
4. Zero operational overhead - no secrets to manage
5. Works immediately without additional deployment complexity

**Security is sufficient because:**
- ✅ User authentication: Only logged-in users can submit feedback
- ✅ Rate limiting: Prevents spam/abuse
- ✅ CORS: Only Aurora's domain can call the endpoint
- ✅ Input validation: Strong parameters prevent injection attacks
- ✅ Context enrichment: Server adds domain/project info (can't be spoofed by client)

**When to use other options:**
- **Option 2 (OAuth2)**: If you need to track which user submitted feedback without storing personal data
- **Option 3 (mTLS)**: If you're already using a service mesh or have strict zero-trust requirements
- **Option 4 (K8s tokens)**: If both services are in same cluster and you want automatic token rotation

---

## Decision Matrix

| Factor | SSO Only | OAuth2 | mTLS | K8s SA Token |
|--------|----------|--------|------|--------------|
| Complexity | ⭐ Simple | ⭐⭐ Medium | ⭐⭐⭐ Complex | ⭐⭐⭐ Complex |
| Secret Management | ✅ None | ✅ None | ⚠️ Certs | ✅ Auto-managed |
| User Must Be Logged In | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Works Cross-Cluster | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Setup Time | ⏱️ 5 min | ⏱️ 30 min | ⏱️ 2-4 hours | ⏱️ 1-2 hours |
| Operational Overhead | ✅ None | ⚠️ Low | ⚠️ Medium | ⚠️ Low |

---

## Implementation: Remove API Token (Option 1)

To switch to SSO-only authentication:

1. **Remove API token validation:**
```ruby
# Remove these lines:
before_action :validate_api_token, only: [:create]

def validate_api_token
  # ... delete entire method
end
```

2. **Update comments:**
```ruby
# Skip CSRF for external calls from Aurora (they share SSO cookie for auth)
# This is safe because:
# 1. User authentication is required (authentication_required)
# 2. Rate limiting prevents abuse (check_rate_limit)
# 3. Input validation via strong parameters
skip_before_action :verify_authenticity_token, only: [:create]
```

3. **Remove from Aurora:** Aurora just needs to include credentials (cookies) in fetch request:
```javascript
fetch('https://elektra/system/feedback', {
  method: 'POST',
  credentials: 'include',  // Include cookies
  headers: {
    'Content-Type': 'application/json'
    // No X-Feedback-API-Token needed!
  },
  body: JSON.stringify({ feedback: {...} })
})
```

4. **Testing:** 
- Logged-in user: ✅ Can submit feedback
- Logged-out user: ❌ Gets 401 Unauthorized
- Rate limit: ❌ After 10 submissions/hour, gets 429 Too Many Requests
