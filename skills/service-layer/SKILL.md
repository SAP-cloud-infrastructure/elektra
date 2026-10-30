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

## Key files

- `lib/core/service_layer/service.rb` — `Service` base class
- `lib/core/service_layer/model.rb` — `Model` base class
- `lib/core/service_layer/services_manager.rb` — `services.NAME` dispatcher
- `app/controllers/concerns/services.rb` — defines `services` / `service_user` / `cloud_admin`
- `lib/core/api_client_manager.rb` — builds the Elektron client tiers
- `lib/core/elektron_middlewares/` — request UUID, object cache, loggers
- `plugins/compute/app/services/service_layer/` — a complete real-world example
