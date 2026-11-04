---
name: configuration
description: >-
  Use when adding a new environment variable, understanding what an existing env
  var does, debugging a misconfigured deployment, or onboarding to Elektra's
  runtime configuration. Covers all ENV vars, their defaults, where they are
  consumed in code, and how they map to Helm values in production.
---

# Configuration / Environment Variables

Elektra is configured entirely via environment variables — no config files are
committed with real values. In production, vars are injected by the Helm chart
(`helm-charts/openstack/elektra/`). In development, they are set in `.env`
(gitignored; generated from vault or workspace tooling).

**Sources of truth:**
- `helm-charts/openstack/elektra/templates/_env.tpl` — the complete list of ENV vars
  injected into every container in production
- `helm-charts/openstack/elektra/values.yaml` — defaults and Helm value names
- `config/application.rb` — where most vars are read and mapped to `Rails.configuration.*`
- `config/database.yml` — database connection vars

---

## OpenStack / Keystone authentication (service user)

These configure the **service account** Elektra uses for privileged API calls
(not the end-user's token).

| Env var | Helm value | Default | Notes |
|---------|-----------|---------|-------|
| `MONSOON_OPENSTACK_AUTH_API_ENDPOINT` | `monsoon_openstack_auth_api_endpoint` | derived from `keystone_url` helper if not set | Keystone v3 endpoint (`https://identity-3.{region}.{tld}/v3/`). Also derived from `AUTHORITY_SERVICE_HOST/PORT/PROTO` (see below). |
| `MONSOON_OPENSTACK_AUTH_API_PUBLIC_ENDPOINT` | `keystone_public_endpoint` | `https://identity-3.{region}.{tld}/v3/auth/tokens` | Public Keystone endpoint used for federation WebSSO URLs. |
| `MONSOON_OPENSTACK_AUTH_API_USERID` | `monsoon_openstack_auth_api_userid` | — | Service user ID (default in values: `dashboard`). |
| `MONSOON_OPENSTACK_AUTH_API_PASSWORD` | secret: `monsoon.openstack.auth.api.password` | — | Service user password. Stored in `elektra-secrets` k8s Secret. |
| `MONSOON_OPENSTACK_AUTH_API_DOMAIN` | `monsoon_openstack_auth_api_domain` | — | Service user's domain (default in values: `Default`). |
| `APP_CRED_ID` | secret: `app_cred_id` (optional) | — | Application credential ID. If both `APP_CRED_ID` and `APP_CRED_SECRET` are set, Elektra uses app credentials instead of user/password. |
| `APP_CRED_SECRET` | secret: `app_cred_secret` (optional) | — | Application credential secret. |

`APP_CRED_ID` + `APP_CRED_SECRET` take priority over `MONSOON_OPENSTACK_AUTH_API_PASSWORD`. Checked in `config/application.rb:153`.

### AUTHORITY_SERVICE alternative

If `AUTHORITY_SERVICE_HOST` and `AUTHORITY_SERVICE_PORT` are set, they override
`MONSOON_OPENSTACK_AUTH_API_ENDPOINT`:

```
AUTHORITY_SERVICE_PROTO (default: http) + AUTHORITY_SERVICE_HOST + AUTHORITY_SERVICE_PORT
→ https://<host>:<port>/v3/
```

Used in some Kubernetes-internal deployments where Keystone is reachable without
a public hostname. Configured in `config/application.rb:112-118`.

---

## Database

All database connection vars have a fallback chain — the first non-nil value wins.

| Env var | Default | Notes |
|---------|---------|-------|
| `MONSOON_DB_USER` | `postgres` | DB username. In production: `elektra` (from `values.yaml postgresql.user`). |
| `MONSOON_DB_PASSWORD` | `''` | DB password. In production: from `{release}-pguser-elektra` k8s Secret. |
| `MONSOON_DB_NAME` | `monsoon-dashboard_{env}` | DB name. Production default: `monsoon-dashboard_production`. |
| `POSTGRES_SERVICE_HOST` | `localhost` | DB host. Also checked: `POSTGRES_PORT_5432_TCP_ADDR`, `ELEKTRA_POSTGRESQL_SERVICE_HOST`, `POSTGRES_ELEKTRA_SERVICE_HOST` (in that order). |
| `POSTGRES_SERVICE_PORT` | `5432` | DB port. Also checked: `POSTGRES_PORT_5432_TCP_PORT`, `ELEKTRA_POSTGRESQL_SERVICE_PORT`, `POSTGRES_ELEKTRA_SERVICE_PORT`. |
| `DATABASE_URL` | — | Full connection URL; overrides all individual vars when set (commented out in `database.yml` — for emergency use). |

Fallback chain (host example): `POSTGRES_PORT_5432_TCP_ADDR` → `ELEKTRA_POSTGRESQL_SERVICE_HOST` → `POSTGRES_ELEKTRA_SERVICE_HOST` → `POSTGRES_SERVICE_HOST` → `'localhost'`

---

## Rails / Puma server

| Env var | Default | Notes |
|---------|---------|-------|
| `RAILS_ENV` | `production` (puma) | `development` / `production` / `test` / `e2e`. |
| `PORT` | `80` | Puma listen port. Dev default: `3000` (from `.env`). Production: `80`. |
| `MAX_THREADS` | `16` (puma) / `10` (DB pool) | Maximum Puma threads; also sets the DB connection pool size. |
| `MIN_THREADS` | `4` | Minimum Puma threads always available. |
| `PERSISTENT_TIMEOUT` | `61` | Puma keep-alive timeout in seconds. |
| `MONSOON_RAILS_SECRET_TOKEN` | required in production | Used as `secret_key_base` fallback. Raises if not set in production. |
| `SECRET_KEY_BASE` | — | Direct `secret_key_base` override; takes priority over `MONSOON_RAILS_SECRET_TOKEN`. |
| `RAILS_MASTER_KEY` | — | Standard Rails master key for credentials decryption. |

---

## Region and deployment identity

| Env var | Helm value | Default | Notes |
|---------|-----------|---------|-------|
| `MONSOON_DASHBOARD_REGION` | `monsoon_dashboard_region` | Current OpenStack region. Substituted into federation WebSSO URLs, oauth2-proxy URLs, cross-dashboard cookie domain, and CSP headers. Regions prefixed `qa-` are treated as QA. |
| `MONSOON_DASHBOARD_LANDSCAPE` | `monsoon_dashboard_landscape` | — | Deployment landscape identifier (e.g. `production`, `qa`). Used in UI labels and logging. |
| `HAS_KEYSTONE_ROUTER` | `has_keystone_router` | `1` | When `1`, Elektra knows a Keystone router sits in front; affects how auth endpoints are resolved. |
| `DEFAULT_SERVICE_INTERFACE` | — | `internal` | OpenStack endpoint interface to use (`internal` / `public`). Set to `public` for local development. |

---

## Authentication and SSO

| Env var | Helm value | Default | Notes |
|---------|-----------|---------|-------|
| `MONSOON_OPENSTACK_PASSWORD_AUTH_ALLOWED` | `monsoon_openstack_password_auth_allowed` | `true` | Global password-login kill switch. `false` → SSO-only. See authentication skill. |
| `SSO_PRECHECK_ENABLED` | `sso_precheck_enabled` | — | `true` → enables JS browser-side SSO precheck AND disables backend cert SSO (mutually exclusive). QA domains only. |
| `ENFORCE_NATURAL_USER_LOGIN` | `enforce_natural_user_login` | — | `true` → rejects logins where username doesn't match the configured natural user pattern (regex set in the auth initializer). |
| `FEDERATION_CUSTOM_AUTH_URL` | — | — | Overrides the auto-generated Keystone WebSSO URL for federation domains. |
| `CROSS_DASHBOARD_COOKIE_NAME` | — | `dashboard-session-auth` | Name of the wildcard-domain cookie shared between Elektra and Aurora for cross-dashboard SSO. |
| `ELEKTRA_SSL_VERIFY_PEER` | — | `true` | Set to `false` to disable SSL cert verification for Keystone calls (dev proxy only). |

---

## Two-factor authentication (RADIUS)

| Env var | Helm value | Default | Notes |
|---------|-----------|---------|-------|
| `TWO_FACTOR_AUTHENTICATION` | `two_factor_authentication` | `off` | Global TFA toggle. `on` enables RADIUS TFA via oauth2-proxy. |
| `TWO_FACTOR_AUTH_DOMAINS` | `two_factor_auth_domains` | — | Comma-separated list of domain names requiring TFA. Set per-region in region-specific values files. |
| `TWO_FACTOR_RADIUS_SERVERS` | `two_factor_radius_servers` | — | Comma-separated RADIUS server hostnames. |
| `TWO_FACTOR_RADIUS_SECRET` | secret: `two-factor-radius-secret` | — | RADIUS shared secret. Stored in `elektra-secrets` k8s Secret. |

---

## Email / notifications

| Env var | Helm value | Default | Notes |
|---------|-----------|---------|-------|
| `LIMES_MAIL_SERVER_API_ENDPOINT` | `limes_mail_server_endpoint` | — | HTTP endpoint for the Limes mail relay service. If blank, `CoreApplicationMailer` skips sending and logs a warning. Used for inquiry notifications. |
| `FEEDBACK_RECIPIENT_EMAIL` | `feedback_recipient_email` | — | Comma-separated email addresses for user feedback. Parsed in `config/application.rb:170`. |
| `MONSOON_NEW_PROJECT_DL` | — | `dl_not_set@sap.com` | Distribution list notified when a new project inquiry is approved (kind `"project"`). |

The `monsoon_dashboard_mail_*` values in `values.yaml` (`mail_server`, `mail_server_port`, `mail_domain`, `mail_sender`, `mail_authentication`, `mail_user`, `mail_password`) are set per-region via Helm but not directly consumed as ENV vars in the Rails code — they feed ActionMailer SMTP config through a region-specific values layer.

---

## Logging and debugging

| Env var | Default | Notes |
|---------|---------|-------|
| `ELEKTRON_QUIET` | — | Set (any value) to suppress Elektron API call logging. Useful in development to reduce log noise. |
| `ACTIVE_RECORD_QUIET` | — | Set (any value) to suppress ActiveRecord SQL query logging in development. |
| `DEBUG_API_CALLS` | — | Set (any value) to enable verbose Elektron API call tracing. Sets `Rails.configuration.debug_api_calls = true`. |
| `DEBUG_POLICY_ENGINE` | — | Set (any value) to reload policy on every request and enable rule evaluation tracing. Sets `Rails.configuration.debug_policy_engine = true`. Also enables `?policy_trace=1` URL param. |
| `EXCON_DEBUG` | — | Set to `true` to enable Excon (HTTP client) low-level request/response logging. |
| `SENTRY_DSN` | secret or helm value | — | Sentry error tracking DSN. If `sentryDSN: "auto"` in values, reads from `sentry` k8s Secret key `elektra.DSN`; otherwise from `elektra-secrets`. |

---

## Plugin-specific

| Env var | Used by | Notes |
|---------|---------|-------|
| `MONSOON_LOB_LIST` | `identity/projects/request_wizard_controller.rb` | Comma-separated list of Lines of Business (format: `LOB1\|Board1,LOB2\|Board1`). Shown in the new project request wizard. Default: `"no lob list found"`. |
| `DOMAIN_MASTERDATA_INHERITANCE_BLACKLIST` | `masterdata_cockpit` | Comma-separated domain names that cannot inherit masterdata to child projects. Hardcoded in `_env.tpl`. |
| `MONSOON_DASHBOARD_AVATAR_URL` | `avatars_controller.rb` | Ruby template string for user avatar URLs. Configured per-deployment in values files. Dev default uses Gravatar. |
| `MONSOON_DASHBOARD_CAM_URL` | `masterdata_cockpit` | Base URL for the SAP Cloud Access Manager (CAM). Configured per-deployment in values files. |
| `MONSOON_DASHBOARD_DEFAULT_DOMAIN` | `config/application.rb:146` | Default domain slug when no domain is in the URL. Default: `monsoon3`. |
| `CEREBRO_CUSTOM_ENDPOINT` | `resources/application_controller.rb` | Custom base URL for the Cerebro VM-placement API. If not set, uses `cerebro.{region}.cloud.sap`. |
| `MAIA_HOST` | `metrics/maia_proxy_controller.rb` | Base URL for the Maia metrics service. Falls back to `https://maia.{region}.cloud.sap`. Per-region override: `MAIA_HOST_{REGION}` (uppercased, hyphens to underscores). |

---

## Helm-only values (not direct ENV vars)

These `values.yaml` keys affect the deployment but are not injected as ENV vars — they configure Kubernetes resources directly:

| Helm value | Effect |
|-----------|--------|
| `replica_count` | Number of Elektra pod replicas (default: `2`) |
| `image.tag` | Docker image tag to deploy |
| `postgresql.*` | PostgreSQL chart subchart config (connections, persistence, resources) |
| `ingress.oauth_proxy` | Whether to put oauth2-proxy in front of ingress |
| `ingress.tls_client_auth.cacrt` | CA cert for mutual TLS (eu-de-3 only) |
| `cache_cleanup_time` | Time of day (UTC) to run the ObjectCache pruning job (default: `0415`) |
| `galvani` | Galvani service config (defined per-region) |
| `domain_config` | Inline domain config YAML (overrides `config/support/domain_config.yaml`) |
| `alerts.prometheus` | Prometheus instance name for alert routing |
| `alerts.support_group` | Support group for alert routing |

---

## Key files

- `helm-charts/openstack/elektra/templates/_env.tpl` — all ENV vars injected in production containers
- `helm-charts/openstack/elektra/values.yaml` — Helm defaults and value names
- `helm-charts/openstack/elektra/templates/secrets.yaml` — k8s Secrets for sensitive values
- `config/application.rb` — primary ENV var consumption; maps to `Rails.configuration.*`
- `config/database.yml` — DB connection fallback chains
- `config/puma.rb` — server threads and port config
- `config/initializers/monsoon_openstack_auth.rb` — auth, SSO, TFA feature flags
- `config/initializers/secret_key_base.rb` — `MONSOON_RAILS_SECRET_TOKEN` / `SECRET_KEY_BASE` handling
- `config/initializers/content_security_policy.rb` — reads `MONSOON_DASHBOARD_REGION` for CSP
