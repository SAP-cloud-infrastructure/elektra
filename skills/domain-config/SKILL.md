---
name: domain-config
description: >-
  Use when working with per-domain behaviour: plugin/feature visibility,
  floating IP networks, DNS options, federation/SSO settings, or CIDR
  validation. Covers the YAML config file, the DomainConfig class, and how
  the multi-entry merge works.
---

# Domain Config

Elektra lets operators customise behaviour per OpenStack domain via a YAML file
that is loaded once at startup into the `DomainConfig` class.

## Key files

| File | Role |
|------|------|
| `config/support/domain_config.yaml` | Canonical config (production defaults) |
| `config/support/domain_config.local.yaml` | Local override (gitignored); loaded instead of the canonical file when it exists |
| `config/initializers/domain_config.rb` | `DomainConfig` class — loaded by Rails at boot |
| `spec/initializers/domain_config_spec.rb` | Unit tests |

## How entries are matched and merged

Each entry in `domain_config.yaml` has a `regex` field matched against the
**scoped domain name** (e.g. `"marioworld-and-luigi-prod"`). All matching entries
are merged in order — later entries win on conflicting keys.

**Ordering rule: most general entries first, most specific entries last.**

```
".*"                       (matches everything → base defaults)
  ↓ merge (child wins)
"^marioworld-.*$"          (matches all marioworld domains)
  ↓ merge (child wins)
"^marioworld-and-luigi.*$" (matches only this sub-domain)
  ↓
effective config
```

The merge is performed by `DomainConfig#find_config`
(`config/initializers/domain_config.rb:118`): it selects all matching entries
via `Array#select` and folds them with `Hash#merge`, so the last matching entry
wins key-by-key.

## DomainConfig API

Instantiate with the scoped domain name; use `update_domain` to re-scope:

```ruby
config = DomainConfig.new(current_user.domain_name)
config.update_domain("other-domain")
```

| Method | Returns | Default |
|--------|---------|---------|
| `plugin_hidden?(name)` | `true` if name is in `disabled_plugins` | `false` |
| `feature_hidden?(name)` | `true` if in `disabled_features` and NOT in `enabled_features` | `false` |
| `federation?` | `true` if federated login is active | `false` |
| `oidc_provider?` | `true` if domain uses an OIDC provider (affects logout) | `false` |
| `idp?` | `Idp` struct (`url`, `name`) or `false` | `false` |
| `idp_name` | Keystone IdP entity name | `"sap-ias"` |
| `federation_protocol` | Protocol segment in the WebSSO URL | `"openid"` |
| `floating_ip_networks` | List of network names; `%DOMAIN_NAME%` replaced | `[]` |
| `disabled_dns_providers?` | List of hidden DNS provider labels or `false` | `false` |
| `dns_c_subdomain?` | Show "Subdomain" option in DNS wizard | `false` |
| `check_cidr_range?` | Enforce 10.180.x.x CIDR validation on subnet create | `true` |
| `terms_of_use_name` | Settings key for the current ToU version | `"actual_terms"` |
| `group_management?` | Group management feature enabled | `false` |

### `feature_hidden?` precedence

`enabled_features` overrides `disabled_features` — a feature listed in both is
**visible**. This lets a general entry disable a feature while a more specific
entry re-enables it for a sub-domain.

### `idp?` and the flat-key design

`idp` (URL) and `idp_name` are stored as separate top-level YAML keys for
backward compatibility with externally managed configs (Helm/Secrets). The code
bundles them into a `DomainConfig::Idp` struct (`url` + `name`) returned by
`idp?`. The `url` value is URL-encoded (`URI.encode_www_form_component`).

## Available config keys (YAML)

| Key | Type | Description |
|-----|------|-------------|
| `name` | string | Human-readable label (docs only, not used by code) |
| `regex` | string | Regex matched against the scoped domain name |
| `floating_ip_networks` | list | Network names; `%DOMAIN_NAME%` is replaced at runtime |
| `disabled_dns_providers` | list | DNS provider pool labels hidden in zone-creation UI |
| `dns_c_subdomain` | bool | Show "Subdomain" option in DNS zone wizard |
| `check_cidr_range` | bool | Enforce 10.180.x.x CIDR check on subnet create |
| `terms_of_use_name` | string | Settings key for Terms of Use version lookup |
| `disabled_plugins` | list | Plugin names blocked (404) and hidden from nav |
| `disabled_features` | list | UI feature names hidden for the domain |
| `enabled_features` | list | Feature names that override `disabled_features` |
| `group_management` | bool | Enable group management (also toggleable via `disabled_features`) |
| `federation` | bool | Show federated "Sign In with IdP" flow on login page |
| `oidc_provider` | bool | Domain uses OIDC — "Log out" also signs out of oauth2-proxy |
| `idp` | string | IdP redirect hint URL appended as `&idp=` on WebSSO auth URL |
| `idp_name` | string | Keystone IdP entity name (`identity_providers/<name>`) |
| `federation_protocol` | string | Protocol segment in WebSSO URL (`protocols/<protocol>`) |

## Local development

Create `config/support/domain_config.local.yaml` (gitignored) to override the
canonical file without touching it. The initializer checks for this file first
(`config/initializers/domain_config.rb:14`).

## How @domain_config reaches controllers and views

`ScopeController#create_default_domain_config` (`:8`: `scope_controller.rb:109`)
runs as a `before_action` on every request and assigns `@domain_config`:

```ruby
def create_default_domain_config
  @domain_config = DomainConfig.new(@scoped_domain_name || params[:domain_id])
end
```

Because all plugin controllers inherit from `DashboardController < ScopeController`,
every controller action has `@domain_config` available automatically — no explicit
instantiation needed. The instance variable is also accessible in all views rendered
by those controllers.

`ScopeController` also enforces plugin-level access control immediately after:

```ruby
before_action :hidden_plugin_redirect   # redirects to /error-404 if plugin_hidden?
```

### Exceptions: local instantiation

A few places bypass `@domain_config` and create their own instance. This is necessary
when the domain context differs from `@scoped_domain_name` or when the code runs
outside the controller (e.g. in a service object):

| File | Reason |
|------|--------|
| `app/views/monsoon_openstack_auth/sessions/new.html.haml:1` | Login view runs before a scope is set; uses `@domain_name` from the auth controller |
| `plugins/dns_service/app/controllers/dns_service/request_zone_wizard_controller.rb:11` | Reads `disabled_dns_providers?` in an action not via `@domain_config` |
| `plugins/dns_service/app/controllers/dns_service/zones_controller.rb:144` | Same pattern — reads `disabled_dns_providers?` locally |
| `plugins/networking/app/services/service_layer/networking_services/network.rb:85` | Service object (no controller context), needs `floating_ip_networks` |
| `plugins/identity/app/controllers/identity/projects_controller.rb:341` | Wizard step loader re-instantiates for `@scoped_domain_name` |

## Where DomainConfig is used (by feature)

| Feature | Method | File |
|---------|--------|------|
| Plugin access control (404) | `plugin_hidden?` | `app/controllers/scope_controller.rb:17` |
| Navigation visibility | `plugin_hidden?` | `app/views/application/_nav.html.haml` |
| Terms of Use gate | `feature_hidden?('terms_of_use')`, `terms_of_use_name` | `app/controllers/dashboard_controller.rb:26,44,67` |
| Help links (internal vs external) | `feature_hidden?('internal_help_links')` | `app/controllers/dashboard_controller.rb:232` |
| Footer: support / docs / domain switcher | `feature_hidden?('support'/'documentation'/'domain_switcher')` | `app/views/application/_footer.html.haml` |
| Logout OIDC sign-out | `oidc_provider?` | `app/views/application/_nav.html.haml:45` |
| Login page flow (federation vs password) | `federation?`, `idp?`, `idp_name`, `federation_protocol` | `app/views/monsoon_openstack_auth/sessions/new.html.haml`, `_federation.html.haml` |
| Group management | `feature_hidden?('group_management')` | `plugins/identity/app/controllers/identity/domains/groups_controller.rb:199` |
| Subnet CIDR validation | `check_cidr_range?` | `plugins/networking/app/controllers/networking/networks_controller.rb:76`, `subnets_controller.rb:18` |
| Floating IP network candidates | `floating_ip_networks` | `plugins/networking/app/services/service_layer/networking_services/network.rb:85` |
| DNS disabled providers | `disabled_dns_providers?` | `plugins/dns_service/app/controllers/dns_service/zones_controller.rb:144`, `request_zone_wizard_controller.rb:11` |
| DNS subdomain option | `dns_c_subdomain?` | `plugins/dns_service` (wizard view) |
