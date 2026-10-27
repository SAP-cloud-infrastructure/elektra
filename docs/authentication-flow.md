# Authentication & Login Flow

A map of elektra's login mechanism for humans and AI agents. The flow grew in
layers over time, so this document explains **what each layer does, in which
order decisions are made, and why** — rather than listing line numbers, which
go stale. Use it to find the right entry point, then read the code.

> Scope: unauthenticated login and session establishment. Authorization (the
> policy engine) is documented separately in
> `plugins/monsoon-openstack-auth/README.md`.

## TL;DR

A request hits elektra behind an **oauth2-proxy** (OIDC, used mainly as TFA).
elektra then tries, in order:

1. a valid **session token** (or cross-dashboard cookie / `X-Auth-Token` header),
2. an **access key**,
3. **certificate SSO** (only when allowed).

If none succeed, the user is redirected to the **login page**, which renders
exactly one of three partials depending on the domain and feature flags:
**Keystone federation (IdP)**, **SSO-only message**, or **password login form**.

## The layers (historical context)

Understanding *why* the flow looks the way it does:

1. **Original:** elektra checks for an existing session (valid token) or a valid
   SSO certificate. Otherwise it shows the login screen (password form).
2. **oauth2-proxy added:** placed in front of elektra, does OIDC and is used
   **mainly as TFA** (SAP-ID service). This introduced the OAuth-loop problem
   (see "oauth2-proxy loop protection").
3. **Keystone federation domains added:** certain domains use Keystone
   federation and don't need the normal flow at all. Driven by `DomainConfig`.
4. **JS SSO precheck added:** the SSO check moved to the browser, but **only for
   some QA domains**. Where the JS precheck is active, the backend certificate
   SSO check is not needed.
5. **TFA-bypass hardening:** a user not activated in elektra but valid at the IdP
   could complete the OIDC flow and still land on the login page (because
   elektra checks SSO), after which a different user — activated in elektra but
   not at the IdP (so no TFA) — could log in. The latest changes disabled
   password login globally and tightened the SSO-only path to close this.

## Authentication decision order (backend)

Entry point: `authentication_required` in controllers (see the plugin README),
which calls `AuthSession.check_authentication`.

`AuthSession#authenticated?` tries three methods **in order**, first success wins:

1. **Session token** — `validate_session_token`. Token source priority:
   Rails session -> cross-dashboard cookie -> `X-Auth-Token` header. Validated
   against Keystone; the token's domain must match the scoped domain, otherwise
   it is rejected and any stale cross-dashboard cookie is deleted.
2. **Access key** — `validate_access_key` (only if allowed).
3. **Certificate SSO** — `validate_sso_certificate`. Gated by
   `sso_auth_allowed?`. **Counter-intuitive:** this is the *inverse* of the JS
   precheck flag — when the JS precheck is enabled, backend cert SSO is turned
   OFF (`sso_auth_allowed = ENV['SSO_PRECHECK_ENABLED'] != 'true'`). Requires a
   verified client cert (`SSL_CLIENT_VERIFY == SUCCESS`); without one it fails
   silently and returns false.

If authenticated -> optional **TFA check**. If not -> redirect to the login page.

Key files:

- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_session.rb`
  — `check_authentication`, `authenticated?`, `validate_session_token`,
  `validate_sso_certificate`, TFA cookie handling.
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication.rb`
  — the `authentication_required` macro.

## The login page: picking one of three partials

When the user reaches the login page (because no auth method succeeded), the
view selects **exactly one** partial. **Order matters** and is the source of a
past production bug:

```
1. domain_config.federation?   -> federation (IdP) partial
2. @password_auth_disabled      -> sso_only partial
3. otherwise                    -> login_form (password) partial
```

**Federation is checked first on purpose.** Federation domains (e.g. iaas
domains using Keystone federation) never use password login, so the global
"password auth disabled" kill switch must not hide their IdP login. If the order
were reversed, federation domains in prod regions (where password auth is off
and the JS precheck is not active) would wrongly see the SSO-only message
instead of their IdP button.

Key files:

- `app/views/monsoon_openstack_auth/sessions/new.html.haml` — the selection.
- `.../sessions/_federation.html.haml` — builds the Keystone WebSSO URL.
- `.../sessions/_sso_only.html.haml` — SSO-only message (+ optional JS precheck).
- `.../sessions/_login_form.html.haml` — the password form.
- Controller: `plugins/monsoon-openstack-auth/app/controllers/monsoon_openstack_auth/sessions_controller.rb`
  (`#new` sets `@password_auth_disabled`; `#create` rejects password submissions
  when disabled).
- Regression test: `spec/views/monsoon_openstack_auth/sessions/new.html.haml_spec.rb`.

## DomainConfig

Per-domain behavior is resolved from a YAML config by **regex matching with
merge**: *all* entries whose `regex` matches the scoped domain name are merged,
and more specific (later) entries override general ones.

Relevant keys for the login flow:

- `federation` — use Keystone federation (render the IdP partial).
- `idp` / `idp_name` / `federation_protocol` — identity provider details used to
  build the WebSSO URL. `idp` is the redirect hint (`&idp=` query param);
  `idp_name` is the IdP entity registered in Keystone.
- `oidc_provider` — whether the domain sits behind the OIDC oauth2-proxy (affects
  the logout URL).

Key files:

- `config/initializers/domain_config.rb` — the `DomainConfig` class and
  `find_config` merge logic.
- `config/support/domain_config.yaml` — the data (documented inline). The
  shipped file uses placeholder domains; production config is often maintained
  externally (secret/helm), which is why the config keys are kept flat and
  backward compatible.
- Tests: `spec/initializers/domain_config_spec.rb`.

## Keystone federation (WebSSO / IdP redirect)

For `federation` domains the login page renders a "Sign In with Identity
Provider" button whose URL points at Keystone's WebSSO endpoint
(`identity-3.<region>.cloud.sap/.../websso`) with `origin` set back to
elektra's `/verify-auth-token`. The IdP authenticates the user and Keystone
redirects back to `/verify-auth-token`, which creates the session.

`FEDERATION_CUSTOM_AUTH_URL` can override the generated WebSSO URL.

Key files:

- `app/views/monsoon_openstack_auth/sessions/_federation.html.haml`.
- `app/controllers/auth_token_controller.rb` (`#verify`).

## SSO token verification endpoint

`POST /verify-auth-token` (`AuthTokenController#verify`) validates a Keystone
token and creates the session. It has a **dual response**:

- **JSON / XHR** (the JS precheck `fetch`) -> `{ redirect_to: ... }`.
- **top-level navigation** (IdP redirect) -> an HTTP redirect.

If SSO succeeds but the user has **no Keystone access** (the TFA-bypass concern),
it returns a terminal "no access" response (HTTP 200 / `AUTH_NO_ACCESS`) instead
of a 401/403 — see "oauth2-proxy loop protection".

Key files:

- `app/controllers/auth_token_controller.rb`.
- `spec/controllers/auth_token_controller_spec.rb`.

## JS SSO precheck (QA domains)

Where enabled (`SSO_PRECHECK_ENABLED=true`), the browser performs the SSO check
instead of the backend: on load it POSTs an `external` identity request straight
to Keystone; on success it verifies the token via `/verify-auth-token` and
navigates to the dashboard; on failure/timeout it reveals the login form. The
config is passed to JS via a `#sso-config` element in the login partials.

Key files:

- `plugins/monsoon-openstack-auth/app/javascript/sso_precheck.js`.
- Config element in `_login_form.html.haml` / `_sso_only.html.haml`.

## OIDC / oauth2-proxy and TFA

- **oauth2-proxy** fronts elektra for OIDC and is used mainly as **TFA** (RSA
  SecurID via RADIUS). TFA is enabled globally by `TWO_FACTOR_AUTHENTICATION=on`
  and per-domain by `TWO_FACTOR_AUTH_DOMAINS`.
- **OIDC-as-TFA fallback hack:** if SAP-ID (OIDC) is down, a second ingress sets
  `x-enable-tfa: true` for the `dashboard-rsa` host so login still works. The
  code also forces TFA when the host starts with `dashboard-rsa`.
- **Logout:** for `oidc_provider` domains, logout goes through the oauth2-proxy
  `sign_out` endpoint; otherwise plain elektra logout.

Key files:

- `config/initializers/monsoon_openstack_auth.rb` — TFA + RADIUS config, feature
  flags.
- `app/controllers/dashboard_controller.rb` — `two_factor_required?`.
- `app/views/application/_nav.html.haml` — logout URL selection.

## oauth2-proxy loop protection

Because oauth2-proxy re-initiates auth on any 401/403, elektra must **never**
emit 401/403 to it. A middleware rewrites 401/403 responses to **200**, and
internal auth results are carried as a 200 payload with an
`AuthStatus::{OK,NO_ACCESS,FAILED,SERVICE_UNAVAILABLE}` status instead of HTTP
error codes. This is why the "no access" SSO case returns a terminal 200 page.

Key files:

- `app/middleware/oauth_proxy_protection_middleware.rb`.
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/auth_status.rb`.
- `app/controllers/concerns/rescue.rb`.

## Regions

The current region comes from `MONSOON_DASHBOARD_REGION` (default `eu-de-1`).
Regions prefixed `qa-` are treated as QA (`ApplicationHelper#qa?`); the rest in
`config/regions.json` are production. The region is substituted into federation
WebSSO URLs, oauth2-proxy URLs, trusted-origin checks, and the cross-dashboard
cookie domain.

## Key feature flags

| Flag (env) | Effect |
|---|---|
| `MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED` | Global password-login kill switch. `false` -> SSO-only. |
| `SSO_PRECHECK_ENABLED` | Enables the JS precheck AND **disables** backend cert SSO. |
| `TWO_FACTOR_AUTHENTICATION` (`on`/`off`) | Global TFA enable. |
| `TWO_FACTOR_AUTH_DOMAINS` | Comma list of domains requiring TFA. |
| `MONSOON_DASHBOARD_REGION` | Current region; builds IdP/dashboard URLs. |
| `FEDERATION_CUSTOM_AUTH_URL` | Overrides the generated WebSSO URL. |

> Keep `form_auth_allowed = true` even in SSO-only regions, otherwise the login
> route becomes unreachable and users can be bounced to the auth-protected root.
> See the plugin README for details.
