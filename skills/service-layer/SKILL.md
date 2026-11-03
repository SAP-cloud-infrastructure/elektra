---
name: service-layer
description: >-
  Use when a controller or service needs to talk to an OpenStack API, when adding
  or changing a plugin's service layer, or when debugging how `services.NAME.method`
  resolves. Covers the Service/Model base classes, the ServicesManager dispatcher,
  the Elektron client, and the three API-client tiers.
---

# Service Layer

Elektra talks to OpenStack through a **service layer** that sits between controllers
and the OpenStack REST APIs. A controller never calls an API directly; it calls
`services.<name>.<method>`, which resolves to a plugin service class that issues the
HTTP request via an **Elektron** client and maps the JSON response into domain
models.

```
Controller (< DashboardController)
  → services.compute.servers(...)         # Services concern → ServicesManager
      → ServiceLayer::ComputeService       # plugin service (< Core::ServiceLayer::Service)
          → service.elektron / elektron_compute   # Elektron client ("driver")
              → OpenStack REST API (Nova, …)
          → map_to(...) → Compute::Server  # domain model (< Core::ServiceLayer::Model)
```

There is **no separate driver class**: the "driver" role is the Elektron client,
reached through `service.elektron`.

## How `services.NAME` resolves

`services` is **not** defined on `DashboardController`. It comes from the concern
`app/controllers/concerns/services.rb`, which is included in
`app/controllers/application_controller.rb` (so every controller has it). The
concern's `included` hook exposes `services`, `service_user`, `cloud_admin`, and
`current_region` as helper methods.

`services` builds a user-scoped Elektron client via
`Core::ApiClientManager.user_api_client(current_user)` and wraps it in a
`Core::ServiceLayer::ServicesManager` (cached per user token).

`ServicesManager` (`lib/core/service_layer/services_manager.rb`) is the dispatcher
behind `services.compute`:

- `method_missing(:compute)` resolves and caches the service instance, then sets
  `service.service_manager = self`.
- `service_class(:compute)` derives the class name by convention: it classifies the
  symbol and builds `"::ServiceLayer::#{Name}Service"` — e.g. `:compute` →
  `::ServiceLayer::ComputeService`. Resolved classes are cached (and reloaded in
  development).
- `service(name, api_client)` instantiates it, raising `ServiceParentError` unless
  the class is a subclass of `Core::ServiceLayer::Service`.
- `available?(name, action)` / `has_service_endpoint?(name)` check service presence.

So the naming contract is: a service named `foo` must be
`ServiceLayer::FooService` living under `plugins/<plugin>/app/services/service_layer/`.

## Base classes

### `Core::ServiceLayer::Service` — `lib/core/service_layer/service.rb`

Every plugin service inherits from this.

- `initialize(elektron)` stores the Elektron client (`attr_reader :elektron`) and
  sets `@region = Rails.configuration.default_region`.
- `available?(_action = nil)` returns `false` by default — override per service
  (typically `elektron.service?("compute")`).
- `map_to(klass, data, options = {})` turns a Hash / Array / `ActionController::Parameters`
  into model instances by calling `klass.new(self, ...)`.
- `class_map_proc(klass)` returns `proc { |params| klass.new(self, params) }`, used
  as a mapping block (see the Elektron `map_to` example below).

### `Core::ServiceLayer::Model` — `lib/core/service_layer/model.rb`

Base domain model. Includes `ActiveModel` naming/validation/conversion and
`Core::StripAttributes`.

- `initialize(service, params = nil)` stores `@service` and derives `@class_name`
  from the class name.
- Attribute access goes through `method_missing` → `read`/`write` on `@attributes`.
- `save` runs `before_create`/`before_save`, `valid?`, then `perform_create` or
  `perform_update`; `update`/`update_attributes`, `destroy` likewise.
- **CRUD delegates back to the service by convention** (`model.rb`):
  `perform_service_create` → `@service.create_<class_name>(...)`,
  `perform_service_update` → `@service.update_<class_name>(id, ...)`,
  `perform_service_delete` → `@service.delete_<class_name>(id)`. A service that backs
  model persistence must implement `create_<name>` / `update_<name>` / `delete_<name>`.
- `rescue_api_errors` catches `::Elektron::Errors::ApiResponse` and adds messages to
  `errors`.

## The Elektron client ("driver")

**Elektron** is an external SAPCC gem — an OpenStack API client — pinned in
`Gemfile` (`gem 'elektron', git: 'https://github.com/sapcc/elektron', tag: 'v2.2.5'`).
Clients are created via `::Elektron.client(auth_params, default_client_params)` in
`lib/core/api_client_manager.rb`.

A service obtains a per-service handle and issues requests on it. Response objects
expose `.get/.post/.put/.delete`, `.body`, and `.map_to`:

```ruby
# plugins/compute/app/services/service_layer/compute_services/server.rb
def server_map
  @server_map ||= class_map_proc(Compute::Server)
end

def servers(filter = {})
  elektron_compute.get("servers/detail", filter).map_to("body.servers", &server_map)
rescue Elektron::Errors::ApiResponse
  nil
end
```

Here `.map_to("body.servers", &server_map)` is the **Elektron response** method
(distinct from `Service#map_to`); `server_map` is the `class_map_proc` block that
builds a `Compute::Server` from each raw hash.

## The three API-client tiers

Built in `Core::ApiClientManager` (`lib/core/api_client_manager.rb`), selected via
three accessors on the `Services` concern:

| Tier | Accessor | Scope / purpose |
| --- | --- | --- |
| **User** | `services` | Current user's token + context. Default for user-facing actions. |
| **Service user** | `service_user` | Domain-scoped service account, cached per domain. |
| **Cloud admin** | `cloud_admin` | Admin scope (ccadmin). Single cached client. |

Caveat (verify against current code before relying on a distinction): today
`create_service_user_api_client` delegates to `create_cloud_admin_api_client`, so the
service-user and cloud-admin accessors resolve to the **same underlying client**.
They are three logical accessors but currently two distinct clients.

Each client attaches Elektron middlewares (`RequestUUID`, `ObjectCache`, a
tier-specific logger, `DebugLogger`) from `lib/core/elektron_middlewares/`.
Cloud-admin auth uses application credentials when
`Rails.application.config.use_app_credentials` is set, otherwise service-user
name/domain/password.

## End-to-end example (compute "servers")

1. **Controller** — `plugins/compute/app/controllers/compute/instances_controller.rb`
   (`InstancesController < Compute::ApplicationController`, itself
   `< ::DashboardController`): `index` calls `services.compute.servers(...)`.
2. **Service** — `plugins/compute/app/services/service_layer/compute_service.rb`
   (`ServiceLayer::ComputeService < Core::ServiceLayer::Service`): mixes in feature
   modules such as `ComputeServices::Server`; `elektron_compute` sets the Nova
   microversion header.
3. **Feature module** — `.../compute_services/server.rb`: `servers` issues
   `GET servers/detail` and maps `body.servers` into models; also defines
   `create_server` / `update_server` / `delete_server` for the Model CRUD contract.
4. **Model** — `plugins/compute/app/models/compute/server.rb`
   (`Compute::Server < Core::ServiceLayer::Model`): ActiveModel validations and
   domain helpers (e.g. `power_state_string`).

## Adding a service method — checklist

- Service class is `ServiceLayer::<Name>Service < Core::ServiceLayer::Service`, under
  `plugins/<plugin>/app/services/service_layer/`.
- Override `available?` (usually `elektron.service?("<name>")`).
- Issue the request on the Elektron handle; map responses with `class_map_proc` /
  `map_to` to a `Core::ServiceLayer::Model` subclass.
- If the model should persist itself, implement `create_<name>` / `update_<name>` /
  `delete_<name>` on the service.
- Rescue `Elektron::Errors::ApiResponse` where a nil/empty result is acceptable.

## Service availability and the services menu

The project-level navigation (`config/navigations/services_navigation.rb`) uses
two independent checks before showing any menu item:

### 1. `plugin_available?(name)` — is the Rails Engine mounted?

Defined in `app/helpers/application_helper.rb:186`. Two conditions must both pass:

1. `@domain_config.plugin_hidden?(name)` must be `false` (see the
   [`domain-config`](../domain-config/SKILL.md) skill).
2. `self.respond_to?("#{name}_plugin")` must be `true` — i.e. a named route
   helper `<name>_plugin` must exist.

The route helper is registered at boot: `config/routes.rb:84` iterates
`Core::PluginsManager.mountable_plugins` and mounts each engine as
`mount <Engine> => "/<mount_point>", as: "<name>_plugin"`. So
`plugin_available?(:compute)` is `true` iff the `compute` gem is loaded **and**
not hidden by `domain_config`.

`plugin(name)` (`app/helpers/application_helper.rb:175`) builds a
`PluginUrlHelper` for generating scoped URL paths — it returns
`UnavailablePluginURLHelper` (all methods return `"#<method>-plugin-not-available"`)
when the plugin is not available, so nav URL lambdas never raise.

### 2. `services.available?(name, action)` — does the OpenStack endpoint exist?

`ServicesManager#available?` (`lib/core/service_layer/services_manager.rb:68`)
instantiates the service and delegates to its `available?` instance method:

```ruby
def available?(service_name, action_name = nil)
  send(service_name.to_sym).send(:available?, action_name.try(:to_sym))
rescue StandardError
  false
end
```

Each plugin service overrides `available?` (base returns `false`). The standard
pattern is an Elektron catalog lookup:

```ruby
# compute, networking, dns, lbaas2, keppel, …
def available?(_action_name_sym = nil)
  elektron.service?("compute")   # checks the Keystone service catalog
end
```

`kubernetes_ng` uses the `action_name` parameter to distinguish landscapes:

```ruby
def available?(landscape_name_or_action = nil)
  service_to_check = KubernetesNg.service_for(landscape_name_or_action.to_s)
  return false unless service_to_check
  elektron.service?(service_to_check)
end
```

`ServicesManager#has_service_endpoint?` (`services_manager.rb:63`) is a lighter
alternative — it checks only whether a URL exists in the catalog without
instantiating the service:

```ruby
def has_service_endpoint?(name_or_sym, options = {})
  @api_client.service_url(name_or_sym.to_s, options) != nil
end
```

Used e.g. for `pca` in the nav: `services.has_service_endpoint?("pca")`.

### 3. `current_user.has_service?(type)` — Keystone service catalog on the token

Defined in `plugins/monsoon-openstack-auth/lib/monsoon_openstack_auth/authentication/auth_user.rb:97`.
Scans the token's embedded service catalog directly (no HTTP call):

```ruby
def has_service?(type)
  service_catalog.each { |service| throw(:found, true) if service["type"] == type }
  false
end
```

Used in the nav for services where a catalog type check is enough (e.g. `image`,
`object-store`, `kubernikus`) rather than a full service availability probe.

### Combined pattern in the navigation

Most nav items use all three guards together:

```ruby
# services_navigation.rb
if: lambda {
  services.available?(:compute, :instances) &&  # OpenStack endpoint exists
    plugin_available?(:compute)                 # Engine mounted + not domain-hidden
}
```

The `services.available?` call goes through the network (or cache); the
`plugin_available?` check is local. The `domain_config.plugin_hidden?` inside
`plugin_available?` is the server-side enforcement — the `ScopeController`
`hidden_plugin_redirect` before-action blocks direct URL access too.

## The OS API proxy

`OsApiController < AjaxController` (`app/controllers/os_api_controller.rb`)
exposes a **reverse proxy** that lets frontend JavaScript call OpenStack APIs
directly under the authenticated user's token, without CORS or token exposure.

**URL pattern:** `GET|POST|PUT|PATCH|DELETE /os-api/<service_name>/<path>`

The controller:
1. Extracts `service_name` and `path` from `REQUEST_PATH` (undecoded, to
   preserve special characters).
2. Collects request headers prefixed `HTTP_OS_API_*` and strips the prefix —
   these become custom OpenStack headers (e.g. `X-Microversion`).
3. Calls `services.os_api.service(service_name)` to get an Elektron service
   handle for that OpenStack service type.
4. Issues the request with `service.public_send(method, path, query_params, headers:)`;
   POST/PUT/PATCH read the raw body via `request.body.read` and pass it as a
   block.
5. Copies all response headers with an `x-` prefix to the Rails response.
6. Renders the response: JSON as JSON, binary/PDF/audio/image/video via
   `send_data`, HTML inline, or plain text — unless `params[:inline]` is absent,
   in which case it always renders JSON with the upstream status code.
7. On error: renders `{ error: e.response.body || e.message }` with `e.code`.

**Browser usage example:**
```javascript
fetch("/os-api/compute/servers/detail")       // GET Nova servers
fetch("/os-api/network/v2.0/networks", {
  method: "POST",
  headers: { "OS-API-Content-Type": "application/json" },
  body: JSON.stringify({ network: { name: "my-net" } })
})
```

The proxy inherits `services` from `AjaxController`, which inherits from
`ApplicationController` (the `Services` concern) — so it uses the **user-scoped**
Elektron client with the current user's token.

## Key files

- `lib/core/service_layer/service.rb` — `Service` base class
- `lib/core/service_layer/model.rb` — `Model` base class
- `lib/core/service_layer/services_manager.rb` — `services.NAME` dispatcher, `available?`, `has_service_endpoint?`
- `app/controllers/concerns/services.rb` — defines `services` / `service_user` / `cloud_admin`
- `lib/core/api_client_manager.rb` — builds the Elektron client tiers
- `lib/core/elektron_middlewares/` — request UUID, object cache, loggers
- `lib/core/plugins_manager.rb` — discovers and registers plugins at boot
- `config/routes.rb:84` — mounts plugins as `<name>_plugin` route helpers
- `app/helpers/application_helper.rb:186` — `plugin_available?` and `plugin(name)`
- `config/navigations/services_navigation.rb` — project-level services menu
- `app/controllers/os_api_controller.rb` — OS API reverse proxy
- `plugins/compute/app/services/service_layer/` — a complete real-world example
