# Browser-Based Authentication for External Domains

> Reference for anyone who wants to reuse Elektra/Aurora's SSO flow in **their own proxy outside Elektra/Aurora**.
>
> You do **not** need to know Elektra's codebase to use this. The flow is plain HTTP against OpenStack Keystone plus one shared cookie. Source-code pointers are collected in [Code references](#code-references) at the end; a pointer like `file.rb:19` or `file.rb:67-72,123-133` just means "see line 19" / "see lines 67–72 and 123–133 of that file" — only relevant if you want to read Elektra's exact implementation.

## TL;DR

Elektra authenticates against OpenStack **Keystone (Identity API v3)**. Browser-based auth for external (federated) domains uses **Keystone WebSSO / OS-FEDERATION** against an external Identity Provider (IdP). Two browser variants both land on the same endpoint, `POST /verify-auth-token`:

1. **IdP Redirect (WebSSO)** – classic top-level redirect to the IdP and back.
2. **SSO Precheck (JavaScript)** – silent login attempt using the existing browser session / client cert.

After successful verification, the Keystone token is written into a **cross-dashboard cookie** on the wildcard parent domain, so a second app on another subdomain (e.g. Aurora) can read the same token.

**"External domain"** means two things: a *federated OpenStack domain* (login via external IdP, configured in `domain_config.yaml`) and *cross-subdomain sharing* between separate apps (Elektra ↔ Aurora) via a wildcard cookie `*.<region>.cloud.sap`. Both matter for a custom proxy.

---

## Flow A – IdP Redirect (WebSSO)

The flow a custom proxy most likely wants to replicate.

1. **Redirect to IdP** – top-level navigation to Keystone's WebSSO endpoint:

   ```
   https://identity-3.<REGION>.cloud.sap/v3/auth/OS-FEDERATION/identity_providers/<IDP_NAME>/protocols/<PROTOCOL>/websso?origin=<ORIGIN>&idp=<IDP_URL>
   ```

   | Placeholder | Meaning | Source |
   |---|---|---|
   | `<REGION>` | Region, e.g. `qa-de-1` | `ENV["MONSOON_DASHBOARD_REGION"]` |
   | `<IDP_NAME>` | Keystone IdP entity, default `sap-ias` | `domain_config.idp_name` |
   | `<PROTOCOL>` | Federation protocol, default `openid` (or `saml2`) | `domain_config.federation_protocol` |
   | `<ORIGIN>` | Return URL after login | fixed: `https://dashboard.<REGION>.cloud.sap/verify-auth-token` |
   | `<IDP_URL>` | External IdP URL (URL-encoded, appended as `&idp=`) | `domain_config.idp.url` |

   The whole URL can be overridden via `ENV["FEDERATION_CUSTOM_AUTH_URL"]`.

2. **Login at external IdP** – Keystone processes the assertion and issues an unscoped token.
3. **Redirect back to `origin`** (`/verify-auth-token`) **with the token**, which is validated server-side against Keystone before being trusted.

---

## Flow B – SSO Precheck (JavaScript, silent)

A silent login attempt before any login form is shown, using the existing browser session / TLS client cert. Enabled via `ENV["SSO_PRECHECK_ENABLED"]`.

1. On page load, JavaScript reads config from the login page (Keystone URL, domain name, the verify URL, optional post-login target).
2. It `POST`s **directly** to Keystone's token endpoint with `methods: ["external"]`:

   ```http
   POST https://identity-3.<REGION>.cloud.sap/v3/auth/tokens
   Content-Type: application/json
   X-User-Domain-Name: <DOMAIN_NAME>

   { "auth": { "identity": { "methods": ["external"], "external": {} } } }
   ```

3. On success, reads the token from the **`X-Subject-Token`** response header.
4. `POST`s it as JSON to `/verify-auth-token`:

   ```http
   POST /verify-auth-token
   Content-Type: application/json
   Accept: application/json

   { "token": "<X-Subject-Token>", "after_login": "<optional>" }
   ```

5. Response is JSON `{ "redirect_to": "<url>" }`; JS does a real `window.location.assign(...)` so the URL bar updates.
6. Any failure (5 s timeout, no token, not ok) → fall back to the normal login form.

---

## The central endpoint: `POST /verify-auth-token`

Both flows land here — the key building block for anything custom.

1. `token` param is required (else `400`).
2. **Validate token against Keystone** — the token is never trusted blindly.
3. Extract domain name from token data.
4. **Create session** — issues a new scoped token and writes the cross-dashboard cookie.
5. **Respond by caller type:** JSON/XHR (precheck) → `{ "redirect_to": "<url>" }`; top-level navigation (IdP redirect) → real `302`.

### Security details (replicate these in your own proxy)

| Mechanism | Description |
|---|---|
| **Token validation** | Validated against Keystone before any session is created. |
| **Open-redirect guard** | A post-login redirect URL is accepted only if it is relative or points at the same host; otherwise it falls back to a safe default. |
| **CSRF override for trusted origins** | The usual CSRF check is skipped **only** for whitelisted origins (`identity-3.<REGION>.cloud.sap`, `dashboard.<REGION>.cloud.sap`), because the token arrives cross-origin. |
| **No 401/403 on "no access"** | SSO ok but no Keystone role → **HTTP 200** with payload `AUTH_NO_ACCESS`, never 401/403 (would cause an oauth2-proxy redirect loop). |

---

## Cross-dashboard cookie (token sharing across subdomains)

How Elektra shares the token with Aurora — likely the most relevant part for a custom proxy.

- **Name:** `ENV["CROSS_DASHBOARD_COOKIE_NAME"]`, default `dashboard-session-auth`.
- **Value:** the raw Keystone token (unencoded).
- **Domain:** wildcard parent domain derived from host, e.g. `dashboard.qa-de-1.cloud.sap` → `.qa-de-1.cloud.sap`.
- **Attributes:** `path=/`, `secure` (production only), `httponly: true`, `same_site: :lax`.
- **Expiry:** from `token.expires_at` (fallback 24 h).

**Read priority** when validating a session: server-side session token → **cross-dashboard cookie** → `X-Auth-Token` header.

**Domain-scope enforcement:** a cross-dashboard token is rejected if its domain doesn't match the requested scope domain (prevents leaking between external domains); the stale cookie is then deleted.

> For your proxy: read the `dashboard-session-auth` cookie, but **always validate the token against Keystone yourself** (`GET /v3/auth/tokens` with `X-Auth-Token`/`X-Subject-Token`) before trusting it. The cookie is transport only, not a trust source.

---

## oauth2-proxy (OIDC) context

In production an **oauth2-proxy (OIDC)** sits in front of the app, which affects status-code handling:

- All `401/403` responses are converted into `200 OK` (body preserved) so the proxy doesn't treat them as "unauthenticated" and loop back to the IdP.
- Outcome codes travel **in the payload** (`AUTH_OK`, `AUTH_NO_ACCESS`, `AUTH_FAILED`, `AUTH_SERVICE_UNAVAILABLE`), not via HTTP status.
- **Logout** for OIDC domains goes via `https://auth.<REGION>.cloud.sap/oauth2/sign_out?rd=...`, then chains the Elektra logout (which deletes the cross-dashboard cookie).

---

## Per-domain configuration

Each federated domain is configured with these keys:

| Key | Default | Meaning |
|---|---|---|
| `federation` | – | Shows the "Sign In with Identity Provider" flow (Flow A). |
| `oidc_provider` | – | Marks domain as OIDC (affects logout). |
| `idp` | – | IdP redirect URL, appended as `&idp=` on the WebSSO URL. |
| `idp_name` | `sap-ias` | Keystone IdP entity (`identity_providers/<idp_name>`). |
| `federation_protocol` | `openid` | `protocols/<protocol>` (e.g. `saml2`). |

Example domains: `marioworld` (federation + oidc), `marioworld-and-luigi` (override to `luigi-ias` / `saml2`).

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `MONSOON_DASHBOARD_REGION` | – | Region for IdP/dashboard/auth URLs and trusted origins. |
| `SSO_PRECHECK_ENABLED` | – | Enables the silent JS precheck (Flow B). |
| `FEDERATION_CUSTOM_AUTH_URL` | – | Overrides the computed Keystone WebSSO URL. |
| `CROSS_DASHBOARD_COOKIE_NAME` | `dashboard-session-auth` | Name of the shared auth cookie (Elektra ↔ Aurora). |
| `MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED` | `true` | `false` = SSO-only (password form disabled). |
| `MONSOON_OPENSTACK_AUTH_API_PUBLIC_ENDPOINT` / `..._API_ENDPOINT` | – | Keystone endpoint for `/v3/auth/tokens` (JS precheck). |

---

## End-to-end summary (federated domain)

1. User opens the login page of a federated/SSO-only domain.
2. **Either** (A) clicks "Sign In with Identity Provider" → browser navigates to Keystone WebSSO → external IdP login → Keystone redirects back to `/verify-auth-token` with a token; **or** (B) the silent JS precheck `POST`s `methods:["external"]` to Keystone, reads `X-Subject-Token`, `POST`s it as JSON to `/verify-auth-token`.
3. `/verify-auth-token` validates the token against Keystone, creates a session (new scoped token), responds with (A) `302` or (B) `{ redirect_to }` (open-redirect-guarded).
4. The token is stored in the server-side session **and** the **cross-dashboard cookie** on the wildcard parent domain → Aurora (another subdomain) can read the same token.
5. Subsequent requests validate the token and enforce domain-scope matching; stale/mismatched cookies are deleted.
6. SSO ok but no access → HTTP 200 with `AUTH_NO_ACCESS` (never 401/403, to avoid oauth2-proxy loop).
7. Logout: OIDC domains via oauth2-proxy `/oauth2/sign_out`, then Elektra logout (deletes the cross-dashboard cookie).

---

## For a custom proxy outside Elektra/Aurora

Two options:

**Option 1 – Read the cross-dashboard cookie (simplest)**
- Your proxy must run on a subdomain of `*.<region>.cloud.sap` to receive the `dashboard-session-auth` cookie.
- Read the cookie, take the token, and **validate it against Keystone** (`GET /v3/auth/tokens`, header `X-Auth-Token`/`X-Subject-Token`).
- Never trust the cookie contents without Keystone validation.

**Option 2 – Build your own WebSSO flow (full control)**
- Build the WebSSO URL as in Flow A and redirect the browser there, with your own `origin` URL.
- Receive the token on your `origin` endpoint, validate against Keystone, create your own session.
- Note: `origin` must be allowed by Keystone, and you must handle CSRF / trusted-origin logic yourself.

**In all cases:** always validate the token server-side against Keystone before trusting it; apply an open-redirect guard to any `after_login`/redirect URL; if an oauth2-proxy sits in front, never return `401/403` (redirect loops).

---

## Code references

| Topic | File |
|---|---|
| Verify endpoint | `app/controllers/auth_token_controller.rb` |
| SSO Precheck (JS) | `plugins/monsoon-openstack-auth/app/javascript/sso_precheck.js` |
| Federation view (WebSSO URL) | `app/views/monsoon_openstack_auth/sessions/_federation.html.haml` |
| Login form / precheck config | `app/views/monsoon_openstack_auth/sessions/_login_form.html.haml` |
| Cross-dashboard cookie | `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_session.rb:152-209` |
| oauth2-proxy protection | `app/middleware/oauth_proxy_protection_middleware.rb` |
| Auth status codes | `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/auth_status.rb` |
| Domain config | `config/support/domain_config.yaml`, `config/initializers/domain_config.rb` |
| Cookie name config | `config/application.rb:172-173` |
| Routes | `config/routes.rb:4,6` |
