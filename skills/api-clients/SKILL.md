---
name: api-clients
description: >-
  Use when adding features that need privileged OpenStack access, when
  debugging why service_user or cloud_admin has unexpected permissions, or
  when understanding how current_user, service_user and cloud_admin differ.
  Covers the three API-client tiers, their auth strategies, middleware
  stacks, caching behaviour, and the current_user wrapper.
---

# API Clients: current_user, service_user, cloud_admin

Elektra maintains three distinct Elektron client tiers with different scopes
and privilege levels. A controller always has access to all three via the
`Services` concern (`app/controllers/concerns/services.rb`), which is included
in `ApplicationController`.

```
ApplicationController
  include Services        → services / service_user / cloud_admin helpers
  include CurrentUserWrapper  → enriches the auth-gem's current_user
```

## The three tiers at a glance

| Accessor | Method | Token scope | Auth strategy | Cached |
|----------|--------|-------------|---------------|--------|
| `services` | `Services#services` | Current user's token (project or domain scope after rescoping) | User's Keystone token (from oauth2-proxy session) | Per-request, invalidated on token renewal |
| `service_user` | `Services#service_user` | cloud_admin project in ccadmin domain | Application credentials OR service user password (same as cloud_admin) | Per domain (class-level `@service_user_api_clients` hash) |
| `cloud_admin` | `Services#cloud_admin` | cloud_admin project in ccadmin domain | Application credentials OR service user password | Single global instance (class-level `@cloud_admin_api_client`) |

**`service_user` and `cloud_admin` share the same underlying Elektron client.**
`create_service_user_api_client` delegates directly to
`create_cloud_admin_api_client` (`lib/core/api_client_manager.rb:124`). The
two accessors exist as separate semantic concepts (domain-admin operations vs.
global admin operations), but they resolve to the same privileged token.

## `services` — user-scoped client

`Services#services` (`app/controllers/concerns/services.rb:19`):

1. Reads `current_user.token` and `current_user.token_expires_at`.
2. Returns the cached `@services` if the token has not changed.
3. Otherwise calls `Core::ApiClientManager.user_api_client(current_user)` →
   `create_user_api_client`, which builds an Elektron client with:
   - `token_context: current_user.context` (full Keystone token hash)
   - `token: current_user.token` (the raw token string)
   - `url: Core.keystone_auth_endpoint`
4. Wraps the client in a `Core::ServiceLayer::ServicesManager`.

The user client is **not** cached between requests — it is rebuilt whenever the
token changes. Token rotation during a long session therefore transparently
picks up the new token.

## `service_user` — privileged domain-scoped client

`Services#service_user` (`services.rb:43`):

1. Resolves the current domain: looks up `params[:domain_id]` in
   `FriendlyIdEntry`; falls back to `Rails.configuration.default_domain`.
2. Calls `Core::ApiClientManager.service_user_api_client(scope_domain)`.
3. The manager keeps a per-domain cache (`@service_user_api_clients[domain]`)
   protected by a `Mutex`. The client is created once per domain per process
   lifetime and reused.

**Why per-domain?** Historically the service user was a domain-scoped admin
token — one per domain. With the switch to application credentials (cloud_admin
project / ccadmin domain), all domains reuse the same client, but the
per-domain cache structure is preserved for backwards compatibility.

### Why the service_user → cloud_admin delegation exists

Application credentials in OpenStack cannot be rescoped — they are bound to the
project they were created in (`cloud_admin` project, `ccadmin` domain). A
domain-scoped service-user token is no longer possible with app credentials.
The cloud_admin token is a strict superset: it can perform all identity
operations across any domain without requiring a per-domain role assignment.
New domains therefore work in Elektra immediately, without manual role seeding.

See the comment block at `api_client_manager.rb:91–122` for the canonical list
of all places that call `service_user`.

## `cloud_admin` — global admin client

`Services#cloud_admin` (`services.rb:64`):

Calls `Core::ApiClientManager.cloud_admin_api_client`, which is a single
lazily-created, globally-cached instance (`@cloud_admin_api_client`, Mutex
protected). Created via `create_cloud_admin_api_client`:

**Auth — application credentials (preferred):**
```ruby
auth_params[:application_credential] = {
  'id'     => Rails.application.config.app_cred_id,
  'secret' => Rails.application.config.app_cred_secret
}
```
Activated when `Rails.application.config.use_app_credentials` is true.

**Auth — service user password (fallback):**
```ruby
auth_params.merge!(
  user_name:              Rails.application.config.service_user_id,
  user_domain_name:       Rails.application.config.service_user_domain_name,
  password:               Rails.application.config.service_user_password
)
```

Both strategies scope to:
- `scope_project_name: Rails.configuration.cloud_admin_project`
- `scope_project_domain_name: Rails.configuration.cloud_admin_domain`

## Middleware stacks

All three tiers share a common base stack; they differ only in the logger
middleware:

```
DebugLogger          (outermost — logs request/response in development)
  → UserLogger / ServiceUserLogger / CloudAdminLogger  (tier-specific colour)
      → ObjectCache    (caches response objects by id; logs errors silently)
          → RequestUUID  (injects X-Request-ID header)
              → [Elektron built-in middlewares]
                  → ResponseErrorHandler  (raises ApiResponse on HTTP 4xx/5xx)
                      → ResponseHandler
                          → HttpRequestPerformer  (actual HTTP call)
```

Middleware is added `before: <target>` via Elektron's middleware API.

### ObjectCache middleware (`lib/core/elektron_middlewares/object_cache.rb`)

Runs on every response. For successful responses it walks the body recursively,
finds all hashes with an `id` key (skipping blacklisted parent keys like
`version`), stamps each with `cached_object_type`, and passes them to
`::ObjectCache.cache_objects`. For error responses (code >= 400) it caches an
error object keyed on the `req-*` request ID from the response headers. Role
assignments get special handling (URL-parsed composite key).

## `current_user` — the wrapper

`ApplicationController` includes `CurrentUserWrapper`
(`app/controllers/concerns/current_user_wrapper.rb`). This redefines
`current_user` to return a `CurrentUserWrapper::CurrentUserWrapper` instance
that wraps the auth gem's `AuthUser`:

- **`email`** — not stored in the Keystone token; read from
  `session[:current_user_details][:email]`, which is populated once per session
  by calling `service_user.identity.find_user(current_user.id)`.
- **`full_name`** — same source, `[:description]`.
- All other methods (`token`, `id`, `name`, `roles`, `has_role?`, `admin?`,
  `has_service?`, etc.) **delegate** to the underlying `AuthUser` via
  `method_missing`.

The wrapper re-initialises only when the token changes (`token ==
old_user_details[:id]` check at line 27). On first load it:
1. Calls `service_user.identity.find_user(current_user.id)` (privileged call).
2. Stores the result in `session[:current_user_details]`.
3. Calls `UserProfile.find_by_name_or_create_or_update` to upsert a local DB
   record for this user.

## `AuthUser` — what `current_user` exposes

`MonsoonOpenstackAuth::Authentication::AuthUser`
(`plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_user.rb`).

The object wraps the Keystone token hash (`@context`). Key attributes:

| Method | Returns |
|--------|---------|
| `token` | Raw Keystone token string |
| `id` | User UUID |
| `name` | Username |
| `domain_id` / `domain_name` | Token's domain scope |
| `project_id` / `project_name` | Token's project scope |
| `user_domain_id` / `user_domain_name` | Domain the user belongs to |
| `roles` / `role_names` | List of role hashes / names |
| `admin?` | `true` if any role is `"admin"` |
| `has_role?(name)` | Check a specific role name |
| `has_service?(type)` | Scan service catalog for a service type (no HTTP) |
| `service_catalog` | Array of service catalog entries from the token |
| `service_url(type, options)` | URL for a service type + region + interface |
| `is_allowed?(actions, params)` | Policy engine enforcement |
| `token_expires_at` / `token_expired?` | Token lifetime |
| `is_admin_project_token?` | Whether token carries the admin project flag |

`email` and `full_name` are **not** on `AuthUser`; they come from the
`CurrentUserWrapper` enrichment described above.

## Scope resolution — `ScopeController` and rescoping

Plugin controllers inherit from `DashboardController < ScopeController`. On
every request:

1. **`load_scoped_objects`** (prepend_before_action): resolves `params[:domain_id]`
   and `params[:project_id]` to real UUIDs via `FriendlyIdEntry`. Uses
   `service_user` (= cloud_admin) to look up unknown domains/projects in
   Keystone and create `FriendlyIdEntry` records for them. Sets
   `@scoped_domain_id`, `@scoped_domain_fid`, `@scoped_domain_name`,
   `@scoped_project_id`, `@scoped_project_fid`, `@scoped_project_name`.
   Redirects to the friendly-ID URL if the raw UUID was in the path.

2. **`authentication_required`** (from monsoon-openstack-auth): checks the
   user's session token. `DashboardController` passes `domain:`, `domain_name:`,
   `project:` from the scoped instance variables, and sets `rescope: false` so
   it does NOT auto-rescope.

3. **`rescope_token_with_error_handling`** (before_action in `DashboardController`):
   manually calls `authentication_rescope_token`. If `NotAuthorized` is raised
   it checks whether the project exists and renders `unauthorized` (HTTP 200, to
   avoid oauth2-proxy loop) or `project_not_found` (HTTP 404).

After rescoping, `current_user.project_id` and `current_user.domain_id` reflect
the scoped context, and `services` builds an Elektron client from the
rescoped token.

## FriendlyIdEntry — human-readable URL slugs

`FriendlyIdEntry` is an ActiveRecord model that maps:
- `class_name` (`"Domain"` or `"Project"`) + optional `scope` (domain_id for
  projects)
- `key` (UUID) ↔ `slug` (human-readable name like `"marioworld"`)
- `name` (display name)

`RescopingService` (`app/services/dashboard/rescoping_service.rb`) wraps the
lookup-or-create pattern for both domains and projects, using `service_user`
(= cloud_admin) to call Keystone when a local entry is not found.

## Typical usage patterns

**Controller action using the user's scope:**
```ruby
def index
  @servers = services.compute.servers   # user token, project scope
end
```

**Cross-domain identity lookup (needs privilege):**
```ruby
def show
  @user = service_user.identity.find_user(params[:user_id])
end
```

**Global admin operation:**
```ruby
def assign_admin_role
  cloud_admin.identity.grant_role_to_user(...)
end
```

**Checking service availability without a full probe:**
```ruby
current_user.has_service?("object-store")   # scans token catalog, no HTTP
services.has_service_endpoint?("network")   # checks Elektron catalog URL
services.available?(:compute)               # instantiates service + available?
```

## Key files

- `app/controllers/concerns/services.rb` — `services`, `service_user`, `cloud_admin` helpers
- `lib/core/api_client_manager.rb` — `create_user_api_client`, `create_cloud_admin_api_client`, middleware wiring
- `app/controllers/concerns/current_user_wrapper.rb` — `CurrentUserWrapper` (adds `email`, `full_name`)
- `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_user.rb` — `AuthUser` (token wrapper)
- `app/controllers/scope_controller.rb` — `load_scoped_objects`, `create_default_domain_config`
- `app/controllers/dashboard_controller.rb` — `rescope_token_with_error_handling`, `load_active_project`
- `app/services/dashboard/rescoping_service.rb` — `domain_friendly_id`, `project_friendly_id`
- `lib/core/elektron_middlewares/object_cache.rb` — response object caching
- `lib/core/service_layer/services_manager.rb` — `services.NAME` dispatcher, `available?`, `has_service_endpoint?`
