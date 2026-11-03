---
name: authentication
description: >-
  Use when working on login flows, session handling, token rescoping, SSO/oauth2-proxy
  integration, two-factor auth, password sync, or debugging why a user is redirected
  to the login page. Covers the monsoon-openstack-auth plugin: AuthSession lifecycle,
  AuthUser, ConnectionDriver (Keystone client), SessionsController, and how the
  module hooks into every Rails controller.
---

# Authentication

Elektra's authentication is handled entirely by the `monsoon-openstack-auth` plugin
(`plugins/monsoon-openstack-auth/`). It is **not** a separate gem — it lives in the
plugin tree and is loaded as a Rails Engine. At boot it injects itself into every
`ActionController::Base`:

```ruby
# lib/monsoon-openstack-auth.rb:81-82
ActionController::Base.send(:include, MonsoonOpenstackAuth::Authentication)
ActionController::Base.send(:include, MonsoonOpenstackAuth::Authorization)
```

Every controller in Elektra therefore has auth and policy support without opting in.
Authorization / policy is documented separately in the `policy-rbac` skill.

---

## Architecture overview

```
Request arrives
  → before_action (authentication_required)
      → AuthSession.check_authentication
          → tries 3 auth paths in order: session token / access key / SSO certificate
              → ConnectionDriver (Keystone v3 HTTP client)
                  → token stored in session[:auth_token_value]
                      → AuthUser built from token hash
                          → current_user available in controller + views
```

---

## Authentication module — controller mixin

**File:** `lib/monsoon_openstack_auth/authentication.rb`

Included in every controller. Adds class methods and instance methods.

### Class methods (used in plugin controllers)

```ruby
# Add authentication gate to all actions
authentication_required

# With scope requirements
authentication_required domain: "ccadmin"
authentication_required project: @project_id

# Require 2FA
authentication_required two_factor: true

# Skip automatic rescoping
authentication_required rescope: false

# Standard before_action options work
authentication_required only: [:create, :update]
authentication_required except: [:index, :show]

# For API/JSON controllers — raises instead of redirect
api_authentication_required

# Opt out entirely (used by health check endpoints)
skip_authentication
```

### Instance methods (available in all controllers and views)

| Method | Returns | Notes |
|--------|---------|-------|
| `current_user` | `AuthUser` or nil | `auth_session.user` |
| `logged_in?` | bool | `!current_user.nil?` |
| `auth_session` | `AuthSession` | per-request session object |
| `authentication_rescope_token(scope)` | — | triggers `@auth_session.rescope_token` |
| `redirect_to_login_form` | — | redirects to login; preserves `redirect_back` param |
| `create_session_from_auth_token(token)` | — | creates session from bare token string |

---

## AuthSession — session lifecycle

**File:** `lib/monsoon_openstack_auth/authentication/auth_session.rb`

One instance per request. Holds: `@controller`, `@scope`, `@api_client`, `@token`, `@user`.

### Authentication chain

`authenticated?` (line 222) tries three paths in order; first success wins:

1. **`validate_session_token`** — checks `session[:auth_token_value]`, then cross-dashboard cookie, then `HTTP_X_AUTH_TOKEN` header
2. **`validate_access_key`** — checks `params[:access_key]` / `params[:rails_auth_token]` (only if `access_key_auth_allowed?` — disabled by default)
3. **`validate_sso_certificate`** — checks `HTTP_SSL_CLIENT_VERIFY == "SUCCESS"` + x509 cert in request env (only if `sso_auth_allowed?`)

### Token storage

`cache_token(new_token)` stores `session[:auth_token_value] = new_token[:value]` (the raw Keystone token string). Optionally also sets the cross-dashboard cookie (wildcard-domain cookie shared with Aurora).

`session[:auth_token_value]` is just the token string. On each request `validate_token` calls the Keystone API to verify it and reconstruct the full token hash. An optional `RailsMemoryCache` (20s TTL) reduces those Keystone roundtrips.

### Token rescoping

`rescope_token(scope)` (line 229): if the current token's scope doesn't match the requested `@scope`, calls `api_client.authenticate_with_token(token[:value], new_scope)`. Raises `NotAuthorized` on failure unless scope is `unscoped` (which retries with nil scope).

Rescoping is triggered automatically by `authentication_required` on every scoped request — this is how a user's token is exchanged for a project-scoped token when navigating into a project.

### Session security

`reset_session(controller)` (line 112) preserves the CSRF token while resetting the session ID — session fixation protection. Called before creating any session from login.

### Class methods for login flows

```ruby
AuthSession.create_from_login_form(controller, username, password, options)
AuthSession.create_from_auth_token(controller, auth_token)
AuthSession.logout(controller, domain)  # deletes cross-dashboard cookie + resets session
```

---

## AuthUser — the current_user object

**File:** `lib/monsoon_openstack_auth/authentication/auth_user.rb`

Wraps the raw Keystone token hash (`HashWithIndifferentAccess`). All values memoized. Raises `MalformedToken` if token is nil or not a hash.

### Identity

| Method | Notes |
|--------|-------|
| `token` | raw token string |
| `id` | user UUID |
| `name` | username |
| `domain_id` / `domain_name` | token's scope domain |
| `user_domain_id` / `user_domain_name` | user's home domain (differs for cross-domain tokens) |
| `project_id` / `project_name` | project scope |
| `project_domain_id` / `project_domain_name` | project's domain |
| `project_parent_id` | parent project UUID |
| `project_scoped` / `domain_scoped` | raw scope hash (truthy/falsy) |

### Token lifecycle

| Method | Notes |
|--------|-------|
| `token_expires_at` | expiry datetime |
| `token_issued_at` | issue datetime |
| `token_expired?` | bool |

### Roles and permissions

| Method | Notes |
|--------|-------|
| `roles` | array of role hashes (`[{id, name}, ...]`) |
| `role_names` | array of name strings |
| `has_role?(name)` | bool |
| `admin?` | bool (`has_role?("admin")`) |
| `is_admin_project_token?` | `is_admin_project` flag from Keystone |
| `is_allowed?(actions, params = {})` (line 181) | policy check — returns bool, never raises. See policy-rbac skill |
| `required_roles(rules)` | roles involved in given policy rules |

### Service catalog

| Method | Notes |
|--------|-------|
| `service_catalog` | array of service entries from `catalog` or `serviceCatalog` |
| `has_service?(type)` | bool — e.g. `has_service?("compute")` |
| `service_url(type, options)` | endpoint URL for given service type + region + interface |
| `default_services_region` | first region from catalog |
| `available_services_regions` | all regions in catalog |

### Token hash structure

```ruby
{
  "value"       => "gAAAAAB...",   # X-Subject-Token header — the token string
  "expires_at"  => "2026-11-03T...",
  "issued_at"   => "...",
  "user"        => { "id" => "...", "name" => "...", "domain" => { "id" => ".." } },
  "domain"      => { "id" => "...", "name" => "..." },    # domain-scoped tokens only
  "project"     => { "id" => "...", "name" => "...", "domain" => { "id" => ".." }, "parent_id" => nil },
  "roles"       => [{ "id" => "..", "name" => ".." }, ...],
  "catalog"     => [{ "type" => "compute", "endpoints" => [...] }, ...],
  "is_admin_project" => false
}
```

---

## ConnectionDriver — Keystone HTTP client

**Files:** `lib/monsoon_openstack_auth/api_client.rb`, `lib/monsoon_openstack_auth/connection_driver/default.rb`

`ApiClient` is a thin facade; `ConnectionDriver::Default` does the actual HTTP.

### ApiClient methods

```ruby
api_client.validate_token(auth_token)
api_client.authenticate_with_credentials(username, password, scope)
api_client.validate_credentials(username, password, domain_name)   # raises on failure
api_client.authenticate_with_token(token, scope = nil)
api_client.authenticate_with_access_key(access_key)
api_client.authenticate_external_user(headers, scope)   # SSO certificate path
api_client.auth_user(username, password, domain_params) # credentials → AuthUser
```

### ConnectionDriver::Default internals

Uses **Excon** (not Elektron — this is auth-only, separate from the regular OS API client). Endpoint: `{api_endpoint}/v3/auth/tokens`.

`authenticate(auth_params, headers)` (line 47):
- POST JSON to Keystone
- Reads `X-Subject-Token` from response header
- Merges `token['value'] = header_value` into token hash

`validate_token`:
- GET with both `X-Auth-Token` (service credential) and `X-Subject-Token` (token being validated)
- Result wrapped in `cache.fetch` — `NoopCache` by default; `RailsMemoryCache` gives a 20s TTL cache

`authenticate_with_credentials`:
- Tries `domain_name` first; retries with `domain_id` on 401 (Keystone name/id ambiguity)

Token cache can be set to `MonsoonOpenstackAuth::Cache::RailsMemoryCache.new` in configuration to reduce Keystone roundtrips for validate calls.

---

## Login page — three partials

When no auth method succeeds, the user is redirected to the login page. The view
selects **exactly one** partial in this fixed order:

```
1. domain_config.federation?  →  federation (IdP) partial
2. @password_auth_disabled    →  sso_only partial
3. otherwise                  →  login_form (password form) partial
```

**Federation is checked first on purpose.** Federation domains never use password
login, so the global password-auth kill switch must not hide their IdP button.
If the order were reversed, federation domains in prod regions (where
`MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED=false` and JS precheck is inactive) would
wrongly see the SSO-only message instead of their IdP button. This ordering bug
occurred in production before the explicit ordering was enforced.

**Files:**
- `app/views/monsoon_openstack_auth/sessions/new.html.haml` — partial selection
- `app/views/monsoon_openstack_auth/sessions/_federation.html.haml` — IdP button + WebSSO URL
- `app/views/monsoon_openstack_auth/sessions/_sso_only.html.haml` — SSO-only message + optional JS precheck config
- `app/views/monsoon_openstack_auth/sessions/_login_form.html.haml` — password form
- `spec/views/monsoon_openstack_auth/sessions/new.html.haml_spec.rb` — regression test for ordering

---

## Keystone federation (WebSSO / IdP redirect)

For `federation` domains the login page renders a "Sign in with Identity Provider"
button. Its URL points at Keystone's WebSSO endpoint with `origin` set back to
Elektra's `/verify-auth-token`. The IdP authenticates the user; Keystone redirects
back to `/verify-auth-token`, which creates the session.

`FEDERATION_CUSTOM_AUTH_URL` can override the generated WebSSO URL.

### `AuthTokenController#verify` — `/verify-auth-token`

**File:** `app/controllers/auth_token_controller.rb`

Validates a Keystone token and creates the session. Dual response:
- **JSON / XHR** (from the JS SSO precheck `fetch`) → `{ redirect_to: "..." }`
- **Top-level navigation** (from IdP redirect) → HTTP redirect

If SSO succeeds but the user has **no Keystone access**, returns HTTP 200 with
`AUTH_NO_ACCESS` instead of 401/403 — see oauth2-proxy loop protection below.

---

## JS SSO precheck (QA domains only)

When `SSO_PRECHECK_ENABLED=true`, the browser performs the SSO check instead of
the backend:

1. On login page load: POSTs an `external` identity request directly to Keystone
2. On success: verifies the token via `POST /verify-auth-token` and navigates to dashboard
3. On failure or timeout: reveals the login form

Config is passed to JS via a `#sso-config` element in the login partials.

**Counter-intuitive:** `SSO_PRECHECK_ENABLED=true` **disables** backend cert SSO
(`sso_auth_allowed = ENV['SSO_PRECHECK_ENABLED'] != 'true'`). The two paths are
mutually exclusive.

**File:** `plugins/monsoon-openstack-auth/app/javascript/sso_precheck.js`

---

## oauth2-proxy, OIDC, and TFA

oauth2-proxy fronts Elektra for OIDC and is used mainly as **TFA** (RSA SecurID
via RADIUS). TFA is enabled globally by `TWO_FACTOR_AUTHENTICATION=on` and
per-domain by `TWO_FACTOR_AUTH_DOMAINS`.

**OIDC-as-TFA fallback:** if SAP-ID (OIDC) is down, a second ingress sets
`x-enable-tfa: true` for the `dashboard-rsa` host so login still works. The code
also forces TFA when the request host starts with `dashboard-rsa`.

**Logout:** for `oidc_provider` domains, logout goes through the oauth2-proxy
`sign_out` endpoint; otherwise plain Elektra logout.

**Files:**
- `config/initializers/monsoon_openstack_auth.rb` — TFA + RADIUS config, feature flags
- `app/controllers/dashboard_controller.rb` — `two_factor_required?`
- `app/views/application/_nav.html.haml` — logout URL selection

### oauth2-proxy loop protection

Because oauth2-proxy re-initiates OIDC on any 401/403, Elektra must **never** emit
401/403 to it. A middleware rewrites these to **200**, and internal auth results are
carried as a 200 payload using `AuthStatus` constants instead of HTTP error codes.
This is why "no access" SSO cases return a terminal HTTP 200 page.

**Files:**
- `app/middleware/oauth_proxy_protection_middleware.rb` — 401/403 → 200 rewrite
- `app/controllers/concerns/rescue.rb` — uses `AuthStatus` constants

---

## DomainConfig keys for authentication

`DomainConfig` drives which login partial is shown. Relevant keys:

| Key | Effect |
|-----|--------|
| `federation` | Show IdP partial (Keystone federation) |
| `idp` | `&idp=` query param hint in WebSSO URL |
| `idp_name` | IdP entity name registered in Keystone |
| `federation_protocol` | WebSSO protocol (`oidc`, `saml2`, etc.) |
| `oidc_provider` | Domain uses oauth2-proxy OIDC; affects logout URL |

See the `domain-config` skill for the full DomainConfig merge logic.

---

## SessionsController — login UI

**File:** `app/controllers/monsoon_openstack_auth/sessions_controller.rb`

Standalone `ActionController::Base` subclass — not a `DashboardController`. Routes mounted at `/:domain_id/auth/`.

### Actions

**`new`** — login form:
- Clears existing session
- Sets `@password_auth_disabled` when password auth is disabled
- Exposes `@keystone_endpoint` (`{base}/v3/auth/tokens`) for direct JS Keystone calls from the form

**`create`** — credential submission:
- Validates form params
- Optionally enforces natural user pattern (`ENFORCE_NATURAL_USER_LOGIN`)
- Calls `AuthSession.create_from_login_form`
- Validates redirect target with `safe_redirect_url?` (same host or relative only)
- On 2FA requirement: renders `two_factor` form instead of redirecting

**`two_factor`** — SecurID passcode form (shown when 2FA is required)

**`check_passcode`** — validates passcode via RADIUS; sets 2FA cookie on success

**`destroy`** — logout:
- Calls `AuthSession.logout` (resets session + deletes cross-dashboard cookie)
- Redirects to `params[:redirect_to]` (validated with `safe_redirect_url?`)

---

## PasswordSyncController

**File:** `app/controllers/monsoon_openstack_auth/password_sync_controller.rb`

Handles password synchronisation between LDAP and Keystone. Available even when `password_auth_allowed == false`.

- `new` — renders sync form (no session side effects)
- `create` — calls `PasswordSync.new.call(username, password, domain_name)`, rate-limited to 5 per minute

**`PasswordSync` service** (`authentication/password_sync.rb`):
- Mechanism: calling `validate_credentials` on Keystone triggers backend sync as a side effect. First call may get 401 (not yet synced); retries once (now synced).
- Two consecutive 401s = wrong password.
- 5xx = `service_unavailable`; 4xx = `invalid_credentials`.
- Never creates a session; the token from validation is discarded.
- Returns `Result` struct: `{ status: :success | :invalid_credentials | :service_unavailable, message: "..." }`

---

## SSO / External authentication

### A. SSL client certificate (x509 / mutual TLS)

`validate_sso_certificate` in `AuthSession`:
- Reads `HTTP_SSL_CLIENT_VERIFY == "SUCCESS"` + `HTTP_SSL_CLIENT_CERT` from request env
- Calls `authenticate_external_user(headers, 'unscoped')` → Keystone `external` auth method
- Domain hint from `X-User-Domain-Id` / `X-User-Domain-Name` headers
- Enabled via `sso_auth_allowed = true` in configuration (disabled when `SSO_PRECHECK_ENABLED=true`)

### B. Cross-dashboard cookie (Elektra ↔ Aurora SSO)

- Cookie named by `Rails.configuration.cross_dashboard_cookie_name`
- Wildcard domain (e.g. `.qa-de-1.cloud.sap`) — shared between Elektra and Aurora
- Contains the raw Keystone token value (not encrypted)
- Read in `validate_session_token` as a fallback after checking `session[:auth_token_value]`
- `token_domain_matches_scope_domain?` (line 458) guards against stale cookies from wrong domains
- Set on login, deleted on logout

### C. Two-factor RSA/SecurID (RADIUS)

- Triggered by `x-enable-tfa` request header or `rsa_dns` hostname prefix (e.g. `dashboard-rsa`)
- Separate encrypted cookie `two_factor_authentication` (domain `.cloud.sap`, 4h TTL, AES-encrypted with `secret_key_base`)
- RADIUS servers from `TWO_FACTOR_RADIUS_SERVERS` env; secret from `TWO_FACTOR_RADIUS_SECRET`
- Configured via `two_factor_enabled: true` + `two_factor_authentication_method` lambda

### D. AuthStatus constants (SSO BFF responses)

`lib/monsoon_openstack_auth/auth_status.rb` — four constants for a JSON BFF endpoint that signals SSO outcomes without HTTP error codes (prevents oauth2-proxy redirect loops):

```ruby
MonsoonOpenstackAuth::AuthStatus::OK                  # 'AUTH_OK'
MonsoonOpenstackAuth::AuthStatus::NO_ACCESS           # 'AUTH_NO_ACCESS'
MonsoonOpenstackAuth::AuthStatus::FAILED              # 'AUTH_FAILED'
MonsoonOpenstackAuth::AuthStatus::SERVICE_UNAVAILABLE # 'AUTH_SERVICE_UNAVAILABLE'
```

---

## Configuration

**Files:** `lib/monsoon_openstack_auth/configuration.rb`, `config/initializers/monsoon_openstack_auth.rb`

| Option | Default | Elektra value |
|--------|---------|---------------|
| `connection_driver` | `ConnectionDriver::Default` | unchanged |
| `token_auth_allowed` | `true` | `true` |
| `basic_auth_allowed` | `true` | `true` |
| `sso_auth_allowed` | `true` | `false` when `SSO_PRECHECK_ENABLED=true` |
| `form_auth_allowed` | `true` | `true` |
| `password_auth_allowed` | `true` | `ENV['MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED']` |
| `access_key_auth_allowed` | `false` | `false` |
| `two_factor_enabled` | `false` | `TWO_FACTOR_AUTHENTICATION == 'on'` |
| `enforce_natural_user` | `false` | `ENFORCE_NATURAL_USER_LOGIN == 'true'` |
| `natural_user_name_pattern` | nil | `/\A([DCIdci]\d*\|TI_EC5A3E_.*)\z/` |
| `rsa_dns` | `false` | `'dashboard-rsa'` |
| `token_cache` | `NoopCache` | unchanged (no caching by default) |
| `debug` | `false` | `Rails.configuration.debug_api_calls` |

`AuthorizationConfig` (nested under `authorization`):
- `controller_action_map`: `{ index: 'list', show: 'get', destroy: 'delete', new: 'create', edit: 'update' }`
- `reload_policy` / `trace_enabled`: both `= Rails.configuration.debug_policy_engine`

---

## Error classes

**File:** `lib/monsoon_openstack_auth/authentication/errors.rb`

| Class | When raised |
|-------|------------|
| `NotAuthenticated` | No valid session/token found |
| `NotAuthorized` | Token rescope failed or policy denied |
| `MalformedToken` | Token hash is nil or not a Hash |
| `AuthenticationError` | Keystone HTTP error (carries `code` attribute) |
| `ConfigurationError` | Bad plugin configuration |
| `ConnectionError` | Network failure reaching Keystone |

`AuthenticationError#code` distinguishes 4xx (credential error) from 5xx (service unavailable) — used by `PasswordSync`.

---

## Feature flags

| Env var | Effect |
|---------|--------|
| `MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED` | Global password-login kill switch. `false` → SSO-only message shown (but `form_auth_allowed` must stay `true` in the plugin config, otherwise the login route becomes unreachable). |
| `SSO_PRECHECK_ENABLED` | Enables the JS browser precheck **and disables** backend cert SSO (mutually exclusive). |
| `TWO_FACTOR_AUTHENTICATION` | `on` / `off` — global TFA toggle via oauth2-proxy RADIUS. |
| `TWO_FACTOR_AUTH_DOMAINS` | Comma-separated list of domains requiring TFA. |
| `MONSOON_DASHBOARD_REGION` | Current region; substituted into federation WebSSO URLs, oauth2-proxy URLs, trusted-origin checks, and the cross-dashboard cookie domain. |
| `FEDERATION_CUSTOM_AUTH_URL` | Overrides the auto-generated Keystone WebSSO URL for federation domains. |
| `ENFORCE_NATURAL_USER_LOGIN` | `true` → reject logins where username doesn't match `natural_user_name_pattern` (pattern: `/\A([DCIdci]\d*\|TI_EC5A3E_.*)\z/`). |

---

## Key files

- `app/controllers/auth_token_controller.rb` — `POST /verify-auth-token` (federation callback + JS SSO precheck endpoint)
- `app/middleware/oauth_proxy_protection_middleware.rb` — rewrites 401/403 → 200 (oauth2-proxy loop protection)
- `plugins/monsoon-openstack-auth/app/javascript/sso_precheck.js` — browser-side SSO check (QA domains, `SSO_PRECHECK_ENABLED=true`)
- `app/views/monsoon_openstack_auth/sessions/new.html.haml` — login partial selection (federation → sso_only → login_form)
- `lib/monsoon-openstack-auth.rb` — entry point: `ActionController::Base` injection, `api_client`, `policy_engine`, `load_policy`
- `lib/monsoon_openstack_auth/authentication.rb` — controller mixin: `authentication_required`, `current_user`, `authentication_rescope_token`
- `lib/monsoon_openstack_auth/authentication/auth_session.rb` — session lifecycle, three auth paths, token caching, rescoping, 2FA, cross-dashboard cookie
- `lib/monsoon_openstack_auth/authentication/auth_user.rb` — `current_user` wrapper: token accessors, roles, service catalog, `is_allowed?`
- `lib/monsoon_openstack_auth/authentication/errors.rb` — all error classes
- `lib/monsoon_openstack_auth/authentication/password_sync.rb` — PasswordSync service (session-free credential validation)
- `lib/monsoon_openstack_auth/api_client.rb` — Keystone client facade
- `lib/monsoon_openstack_auth/connection_driver/default.rb` — Excon-based Keystone v3 HTTP client
- `lib/monsoon_openstack_auth/connection_driver/interface.rb` — abstract interface
- `lib/monsoon_openstack_auth/connection_driver/errors.rb` — `AuthenticationError` (with `code`), `ConfigurationError`, `ConnectionError`
- `lib/monsoon_openstack_auth/auth_status.rb` — SSO BFF response constants
- `lib/monsoon_openstack_auth/configuration.rb` — all config options with defaults
- `lib/monsoon_openstack_auth/cache/noop_cache.rb` — default no-op token cache
- `lib/monsoon_openstack_auth/cache/rails_memory_cache.rb` — optional Rails cache with 20s TTL
- `app/controllers/monsoon_openstack_auth/sessions_controller.rb` — login form, 2FA, logout
- `app/controllers/monsoon_openstack_auth/password_sync_controller.rb` — password sync (rate-limited)
- `config/initializers/monsoon_openstack_auth.rb` — Elektra-specific configuration wiring
