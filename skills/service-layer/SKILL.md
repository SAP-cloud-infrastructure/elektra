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
and the OpenStack REST APIs. The canonical path is `services.<name>.<method>`, which
resolves to a plugin service class that issues the HTTP request via an **Elektron**
client and maps the JSON response into domain models. Most plugins follow this path;
a minority bypass it (see "Plugin-level variations" below).

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

## Response mapping: Model objects vs. raw JSON

Depending on the age and style of a plugin, controllers return responses in one
of three patterns.

### Pattern A — HAML with Model objects (older plugins)

The service returns `Core::ServiceLayer::Model` subclass instances; the
controller assigns them to instance variables; the HAML view iterates them.
Used by `compute`, `networking`, `dns_service`, `masterdata_cockpit`, and other
older plugins.

```ruby
# plugins/identity/app/controllers/identity/domains_controller.rb
def index
  @domains = services.identity.domains   # → Array<Identity::Domain>
end
```

```haml
-# view
- @domains.each do |domain|
  %tr= domain.name
```

Models carry ActiveModel validations. The HAML view may also render JSON for
specific sub-actions (e.g. `console_url`), but the main page flow is
HAML-rendered. Overriding `attributes_for_create` / `attributes_for_update`
restricts which fields are sent to the OpenStack API:

```ruby
# plugins/lbaas2/app/models/lbaas2/loadbalancer.rb
def attributes_for_create
  attrs = attributes.select { |k, _| %w[name description vip_subnet_id ...].include?(k) }
  { "loadbalancer" => attrs }
end
```

### Pattern B — JSON response with Model serialisation (common in React plugins)

The service still returns Model instances, but the controller renders them as
JSON. `Core::ServiceLayer::Model#as_json` serialises `@attributes.merge(id:)`
and sanitises every string through `Rails::Html::FullSanitizer` (via
`Core::StripAttributes`).

```ruby
# plugins/lbaas2/app/controllers/lbaas2/loadbalancers_controller.rb
def create
  loadbalancer = services.lbaas2.build_loadbalancer(params[:loadbalancer])
  loadbalancer.save
  if loadbalancer.errors.empty?
    render json: { loadbalancer: loadbalancer }   # model → as_json
  else
    render json: { errors: loadbalancer.errors }, status: 422
  end
end
```

`rescue_api_errors` (`model.rb`) catches `::Elektron::Errors::ApiResponse` and
appends `e.messages` to `errors`, so the standard ActiveModel error flow works
without additional rescue blocks.

### Pattern C — JSON response with raw hashes (newer / simpler endpoints)

For endpoints that don't need model lifecycle (validations, CRUD callbacks), the
service returns the raw hash from `map_to` without wrapping in a Model.

```ruby
# plugins/lbaas2/app/services/.../loadbalancer_v2.rb
def loadbalancer_device(id)
  elektron_lbaas2.get("loadbalancers/#{id}/stats").body("body.stats")
  # returns Hash, not a Model
end
```

The controller renders it directly:

```ruby
render json: { stats: services.lbaas2.loadbalancer_device(params[:id]) }
```

### JSON-first controllers: `AjaxController` and `handle_api_call`

Controllers that exclusively serve JSON (i.e. React widget backends) inherit from:

```
AjaxController < ScopeController < ApplicationController
```

`AjaxController` (`app/controllers/ajax_controller.rb`) requires
`api_authentication_required` with `rescope: true`, so the user's token is
always rescoped to the current project before any action runs.

Kubernetes-ng adds a structured error-response wrapper via `handle_api_call`:

```ruby
# plugins/kubernetes_ng/app/controllers/kubernetes_ng/api/base_controller.rb
def handle_api_call(auto_render: true)
  result = yield
  render json: result if auto_render
rescue LandscapeError => e
  render json: { error: "landscape_error", code: 422, message: e.message }, status: 422
rescue Elektron::Errors::ApiResponse => e
  render json: { error: "api_error", code: e.code, message: e.message }, status: e.code
rescue Elektron::Errors::Request => e
  render json: { error: "request_error", code: 503, message: e.message }, status: 503
rescue Net::HTTPError => e
  render json: { error: "http_error", code: 503, message: e.message }, status: 503
end
```

Every controller action wraps its logic in `handle_api_call { ... }` so errors
are always JSON with a predictable `{ error:, code:, message: }` shape.

---

## Direct OS API calls (rare)

A small number of plugins skip Elektra's service layer entirely and let the
**frontend widget call the OpenStack API directly** with the user's token. This
is the exception, not the rule.

### Why it is rare

Direct browser → OS API calls require the OpenStack service to have CORS
configured, and they expose the user's Keystone token to JavaScript. Elektra as
a proxy is strongly preferred: it handles auth centrally, consolidates error
handling, and works even when CORS is not configured on the OS service.

### How it works — the two flavours

**1. Token embedded at render time via `data-*` (keppel, tools/castellum)**

The Rails controller embeds the token and the service URL as a `@js_data` hash;
the HAML view spreads it into the widget's `data-*` attributes:

```ruby
# plugins/tools/app/controllers/tools/castellum_controller.rb
@js_data = {
  token:        current_user.token,               # raw Keystone token
  castellum_api: current_user.service_url("castellum"),
}
```

```haml
-# plugins/tools/app/views/tools/castellum/show.html.haml
= javascript_include_tag "tools_castellum_widget", data: @js_data
```

The widget reads them from `widget.config.scriptParams` synchronously:

```js
// tools/widgets/castellum/init.js
createWidget(null).then((widget) => {
  widget.configureAjaxHelper({
    baseURL: widget.config.scriptParams.castellumApi,
    headers: { "X-Auth-Token": widget.config.scriptParams.token },
  })
  widget.render(App)
})
```

Same approach for keppel (`plugins/keppel/app/controllers/keppel/application_controller.rb`):
`@js_data = { token: current_user.token, keppel_api: current_user.service_url("keppel"), ... }`.

**2. Token fetched at runtime via `window._getCurrentToken()` (audit)**

For widgets where the HAML view cannot safely embed the token, or where a fresh
token may be needed mid-session, only the function *name* is passed:

```haml
-# plugins/audit/app/views/audit/application/index.html.haml
= javascript_include_tag "audit_app_widget",
    data: { get_token_func: "_getCurrentToken", events_api: @events_endpoint }
```

The widget calls the named function asynchronously:

```js
// audit/widgets/app/init.js
createWidget().then(async (widget) => {
  const getTokenFunc = globalThis[widget.config.scriptParams.getTokenFunc]
  const token = await getTokenFunc()   // → window._getCurrentToken()
  widget.configureAjaxHelper({
    baseURL: widget.config.scriptParams.eventsApi,
    headers: { "X-Auth-Token": token.authToken },
  })
  widget.render(App)
})
```

`window._getCurrentToken` is defined in `app/javascript/core/current_user_token.js`
and available on every page:

```js
window._getCurrentToken = async () => {
  const res = await fetch("/<domain>/<project>/os-api/__token")
  const data = await res.json()
  return { authToken: data.token.value }
}
```

The route `/os-api/__token` maps to `OsApiController#token`, which renders
`current_user.context` (the full Keystone token hash); `token.value` is the raw
token string. A companion endpoint `OsApiController#auth_token` renders
`plain: current_user.token` for widgets that need only the string.

### When to use this pattern

Only when the target OpenStack service has CORS configured (Keppel does). For all
other services, use the OS API proxy (`/os-api/<service>/<path>`) or a regular
controller action so Elektra handles auth and CORS does not apply.

---

## Plugin-level variations and known quirks

Every plugin started from the same scaffold and then diverged to match its OpenStack
service. The patterns below appear across the codebase and are worth knowing before
editing an unfamiliar plugin.

### `respond_to` — two distinct usages

**`format.js {}` + `.js.haml` partials (compute, dns_service, networking)**

Used for jQuery UJS-driven in-place updates: a form submits via `remote: true`, Rails
finds `action.js.haml`, which renders JavaScript that mutates the DOM. No JSON
involved.

```ruby
# compute/instances_controller.rb
respond_to do |format|
  format.html { redirect_to instances_url }
  format.js {}      # renders instances/terminate.js.haml
end
```

**`format.html / format.json` in one action (reports, identity)**

The same controller action serves either a full HAML page or a JSON response
depending on `Accept` header. Data is fetched conditionally:

```ruby
respond_to do |format|
  format.html   # renders view, no data loaded
  format.json   { render json: { data: load_expensive_data } }
end
```

### `[code, body]` return tuple (networking bgp_vpns)

`networking`'s bgp_vpn service returns `[status_code, response_body_or_error_string]`
instead of raising or returning a Model. The controller checks manually:

```ruby
# plugins/networking/app/services/.../bgp_vpn.rb
def bgp_vpns(...)
  response = elektron_networking.get(...)
  [200, response.body["bgpvpns"]]
rescue Elektron::Errors::ApiResponse => e
  [e.code, e.messages.join(", ")]
end

# controller
code, data = services.networking.bgp_vpns(...)
if code.to_i >= 400
  render json: { error: data }, status: code
else
  render json: { bgpvpns: data }
end
```

This pattern is unique to `networking/bgp_vpns`. Do not copy it to new code —
prefer `rescue_api_errors` on the model or explicit `rescue` in the controller.

### Server-side `Net::HTTP` proxy (email_service, metrics, resources)

Some plugins bypass Elektron entirely for non-OpenStack or differently-authenticated
upstream services:

| Plugin | Upstream | Auth mechanism |
|--------|----------|----------------|
| `email_service/CronusProxyController` | SAP Cronus mail API | EC2 credentials (`X-Keystone-Access` / `X-Keystone-Secret`) |
| `metrics/MaiaProxyController` | Maia (Prometheus) | `X-Auth-Token: current_user.token` via `Net::HTTP` |
| `resources/ApplicationController#bigvm_resources` | Cerebro (BigVM recommender) | Unauthenticated; endpoint overridable via `CEREBRO_CUSTOM_ENDPOINT` env var |

These are one-off integrations. They do not use the service layer and should not
be used as a template for new work.

### `cloud_admin` called directly in controller actions

Several plugins call `cloud_admin.identity` directly from controller actions instead
of delegating to a service:

- `lookup/ReverseLookupController` — dynamic dispatch via service-name maps
- `keymanagerng/ApplicationController#user_name` — `cloud_admin.identity.find_user`
- `object_storage/ApplicationController#parse_acl` — `cloud_admin.identity.find_project/find_user` inside a private helper

This works but couples the controller to the identity API. For new code, wrap
privileged lookups in a service method.

### Plugins with no service layer (data from elsewhere)

| Plugin | Where data comes from |
|--------|-----------------------|
| `cloudops` | `ObjectCache` ActiveRecord table (cached OS responses) — no live API calls |
| `inquiry` | Elektra's own PostgreSQL via `Inquiry::Inquiry` AR model — no OpenStack at all |
| `audit` | Direct OS API (`audit-data` service) — frontend calls it with `_getCurrentToken` |
| `keppel` | Direct Keppel API — frontend calls it with embedded token |
| `testikus` | Hardcoded fake data (demo scaffold only) |

### ActionCable broadcasts (block_storage)

`block_storage` broadcasts volume create/update events to the `projects:<id>:volumes`
channel via ActionCable alongside the JSON response:

```ruby
ActionCable.server.broadcast "projects:#{@scoped_project_id}:volumes",
                             { created: volume.to_json }
render json: volume
```

The frontend subscribes to this channel to update the volume list without polling.
No other plugin currently uses ActionCable.

### Kubernetes service catalog quirk (kubernetes legacy)

The legacy `kubernetes` plugin looks for a per-project service entry:

```ruby
current_user.has_service?("kubernikus-#{project_name}")
```

The service type includes the project name — each Kubernikus cluster has its own
catalog entry. `kubernetes_ng` does not use this pattern; it uses standard
`elektron.service?("gardener-{landscape}")` instead.

### `shared_filesystem_storage` — dual ajaxHelper in one widget

The `shared_filesystem_storage` widget conditionally configures **two** separate
`ajaxHelper` instances: one for the Elektra proxy (main API), one pointing directly
at the Castellum API with `X-Auth-Token` (if Castellum is available in the catalog):

```js
widget.configureAjaxHelper({ baseURL: "/<domain>/<project>/os-api/sharev2" })
if (widget.config.scriptParams.castellumApi) {
  castellumAjaxHelper.configure({
    baseURL: widget.config.scriptParams.castellumApi,
    headers: { "X-Auth-Token": widget.config.scriptParams.token },
  })
}
```

The token is embedded at render time (same as keppel/castellum flavour above).

---

## Key files

- `lib/core/service_layer/service.rb` — `Service` base class
- `lib/core/service_layer/model.rb` — `Model` base class (`method_missing` attrs, `save`, `rescue_api_errors`, `as_json`)
- `lib/core/service_layer/services_manager.rb` — `services.NAME` dispatcher, `available?`, `has_service_endpoint?`
- `app/controllers/concerns/services.rb` — defines `services` / `service_user` / `cloud_admin`
- `lib/core/api_client_manager.rb` — builds the Elektron client tiers
- `lib/core/elektron_middlewares/` — request UUID, object cache, loggers
- `lib/core/plugins_manager.rb` — discovers and registers plugins at boot
- `config/routes.rb:84` — mounts plugins as `<name>_plugin` route helpers
- `app/helpers/application_helper.rb:186` — `plugin_available?` and `plugin(name)`
- `config/navigations/services_navigation.rb` — project-level services menu
- `app/controllers/ajax_controller.rb` — JSON-first base controller (`api_authentication_required`)
- `app/controllers/os_api_controller.rb` — OS API reverse proxy + `token`/`auth_token` endpoints
- `app/javascript/core/current_user_token.js` — `window._getCurrentToken()` for widget token fetches
- `plugins/compute/app/services/service_layer/` — complete real-world service example
- `plugins/lbaas2/app/` — Pattern B example (Model + JSON, with `attributes_for_create`)
- `plugins/kubernetes_ng/app/controllers/kubernetes_ng/api/base_controller.rb` — `handle_api_call` pattern
