---
name: elektron
description: >-
  Use when tracing how an OpenStack API call flows from a controller through the
  service layer to HTTP, understanding the three client tiers (services /
  service_user / cloud_admin), debugging API errors, adding a new service method,
  or understanding the middleware stack (ObjectCache, logging, error handling).
---

# Elektron — the OpenStack HTTP client

Elektron is a SAP open-source gem (`github.com/sapcc/elektron`, pinned to
`v2.2.5` in `Gemfile:95`) that handles all OpenStack API calls after
authentication. It is built on Ruby's `Net::HTTP`.

**Elektron is NOT the same as the auth connection driver.** `monsoon-openstack-auth`
uses Excon directly for Keystone authentication calls. Elektron handles everything
after the session token is established.

---

## The three client tiers

**File:** `app/controllers/concerns/services.rb`

| Method | Token | Re-auth on expiry | Notes |
|--------|-------|-------------------|-------|
| `services` | End-user token from `current_user.token` | No — raises `TokenExpired` | Re-initialised if token changes after rescope |
| `service_user` | App credentials / service user password, scoped to cloud_admin project | Yes — auto-renews | Per-process, per-domain, class-level Mutex |
| `cloud_admin` | Same as `service_user` (same factory method) | Yes — auto-renews | Per-process, class-level Mutex |

`services` is what plugin controllers use for user-context calls. `service_user`
and `cloud_admin` are used for privileged operations (e.g. creating a project on
behalf of a user, looking up identity data).

---

## Client instantiation — `ApiClientManager`

**File:** `lib/core/api_client_manager.rb`

### `create_user_api_client(current_user)` (line 62)

```ruby
::Elektron.client(
  {
    token_context: current_user.context,  # full token hash
    token: current_user.token,            # raw token string
    url: ::Core.keystone_auth_endpoint,
  },
  default_client_params
)
```

Uses the already-valid session token — Elektron never re-authenticates for the
user client. If the token expires mid-session, `TokenExpired` is raised.

The `Services` concern in controllers re-creates this client whenever
`current_user.token` changes (after a rescope), so the new scoped token is always
used: `@token_expires_at == token_expires_at && @services_token == token` checked
on every `services` call.

### `create_cloud_admin_api_client` (line 135)

```ruby
::Elektron.client(
  {
    url: ...,
    scope_project_name: Rails.configuration.cloud_admin_project,
    scope_project_domain_name: Rails.configuration.cloud_admin_domain,
    application_credential: { id:, secret: }   # if APP_CRED_* set
    # OR: user_name:, user_domain_name:, password:
  },
  default_client_params
)
```

`service_user` and `cloud_admin` both call this same factory. Credentials are
stored in the Elektron session so it can auto-renew when the token expires.

### `default_client_params` (line 18)

```ruby
{
  region: Rails.configuration.default_region,
  interface: ENV["DEFAULT_SERVICE_INTERFACE"] || "internal",
  debug: Rails.env.development? && ENV["ELEKTRON_QUIET"] != "true",
  http_client: {
    open_timeout: nil,
    read_timeout: 60,
    verify_ssl: Rails.configuration.ssl_verify_peer,
    keep_alive_timeout: 5,
  },
}
```

`interface: "internal"` means Elektron resolves endpoints from the `internalURL`
in the service catalog. Set `DEFAULT_SERVICE_INTERFACE=public` for local
development (no direct access to internal network).

---

## Middleware stack

Elektron uses a linked middleware chain. The execution order (outermost → innermost):

```
ResponseHandler
  → ResponseErrorHandler
      → ObjectCache
          → UserLogger / CloudAdminLogger   (debug only)
              → DebugLogger                  (debug only)
                  → RequestUUID
                      → HttpRequestPerformer  ← actual Net::HTTP call
```

`ResponseHandler` wraps the response; `ResponseErrorHandler` raises on HTTP ≥ 400;
everything else runs on the way in/out around `HttpRequestPerformer`.

### Middleware descriptions

**Built into the gem:**

| Middleware | What it does |
|-----------|-------------|
| `HttpRequestPerformer` | `Net::HTTP` GET/POST/PUT/PATCH/DELETE. Builds headers, JSON-encodes body, applies SSL/timeout config, parses JSON response. |
| `ResponseErrorHandler` | Raises `Elektron::Errors::ApiResponse` for HTTP ≥ 400; wraps `Net::HTTP` exceptions as `Elektron::Errors::Request`. |
| `ResponseHandler` | Wraps raw response in a `Response` object that provides `map_to`. |

**Elektra-specific (in `lib/core/elektron_middlewares/`):**

| Middleware | File | What it does |
|-----------|------|-------------|
| `ObjectCache` | `object_cache.rb` | Recursively walks response body; stores cacheable objects in the `object_cache` DB table. On error responses, stores an `error`-type entry. See database skill for full write-path. |
| `RequestUUID` | `request_uuid.rb` | Adds `X-OpenStack-Request-ID: req-{uuid}` header (internal interface only). Enables request tracing across services. |
| `DebugLogger` | `debug_logger.rb` | Logs full request URL + headers + body and response body to `Rails.logger.debug`. Only when `debug: true`. |
| `UserLogger` | `user_logger.rb` | Logs a colored "User Client" banner line. Only when `debug: true`. Used on the `services` client. |
| `CloudAdminLogger` | `cloud_admin_logger.rb` | Logs a "Cloud Admin Client" banner (different color). Used on `service_user` and `cloud_admin` clients. |
| `ServiceUserLogger` | `service_user_logger.rb` | **Dead code — never added to any client.** |

---

## End-to-end call trace

`@servers = services.compute.servers`

1. `services` concern (services.rb:19) — returns a `ServicesManager` wrapping the user Elektron client.
2. `ServicesManager#method_missing` (services_manager.rb:77) — looks up `ServiceLayer::ComputeService`, creates and caches instance.
3. `ComputeService#servers` — calls `elektron_compute.get("servers/detail", filter)`.
4. `elektron_compute` (compute_service.rb:23) — `elektron.service("compute", http_client: {read_timeout: 180}, headers: {"X-OpenStack-Nova-API-Version" => "2.67"})`.
5. `Elektron::Client#service` — resolves compute endpoint from token catalog, returns an `Elektron::Service`.
6. `Elektron::Service#get` — builds `RequestContext`, injects `X-Auth-Token` header, calls `@middlewares.execute(request_context)`.
7. Middleware stack runs (outermost → innermost, see above).
8. Response back up the chain — ObjectCache stores servers, ResponseHandler wraps in `Response`.
9. Back in `servers`: `.map_to("body.servers", &server_map)` — navigates `response.body["servers"]`, yields each hash to `server_map` proc.
10. `server_map` = `class_map_proc(Compute::Server)` — calls `Compute::Server.new(self, params)` for each item.
11. Result: array of `Compute::Server` (ServiceLayer::Model) instances.

---

## `map_to` — two different methods

**`Response#map_to(key_path, &block)`** (gem `response_handler.rb`):
- Navigates a dot-separated path into the response body: `"body.servers"` → `response.body["servers"]`
- `"body"` prefix is implicit (stripped automatically)
- If block given: yields each element hash; the block's return value is the mapped item
- If Hash given (`"body.servers" => Compute::Server`): calls `Compute::Server.new(params)`

**`Service#map_to(klass, data, options={})`** (service.rb:21):
- Wraps already-extracted raw Hash data (not a Response object) into model instances
- Used when data is passed in as params, not fetched fresh from the API

**`class_map_proc(klass)`** (service.rb:30):
```ruby
def class_map_proc(klass)
  proc { |params| klass.new(self, params) }
end
```
Standard pattern for building models. `self` here is the Service instance —
passed as the first argument to Model so it has a back-reference for `save`/`destroy`.

---

## Error handling

### Error classes

| Class | Raised by | Has |
|-------|-----------|-----|
| `Elektron::Errors::ApiResponse` | `ResponseErrorHandler` (HTTP ≥ 400) | `#code` (int), `#messages` (array), `#service_name`, `#http_method`, `#url` |
| `Elektron::Errors::Request` | `ResponseErrorHandler` wrapping `Net::HTTP` errors | Original exception as cause |
| `Elektron::Errors::TokenExpired` | `Session#enforce_valid_token` | — |
| `Elektron::Errors::ServiceUnavailable` | `Client#service` when not in catalog | — |

`ApiResponse#messages` is extracted by recursively walking the JSON body looking
for keys: `message`, `description`, `type`, `faultstring`.

### Global rescue in ApplicationController

```ruby
rescue_from 'Elektron::Errors::Request' do |exception|
  render_exception_page(exception, { title: 'Backend Slowdown Detected', warning: true })
end
```

`ApiResponse` (HTTP errors) is **not rescued globally** — plugins handle it via
`rescue_api_errors` or let it bubble to the `Rescue` concern.

### `rescue_api_errors` on ServiceLayer::Model (model.rb:259)

```ruby
def rescue_api_errors
  yield
  true
rescue ::Elektron::Errors::ApiResponse => e
  e.messages.each { |m| errors.add(:api, m) unless m.blank? }
  false
end
```

Wraps `save`/`update`/`destroy` on models. HTTP errors become `model.errors[:api]`
entries — turns API failures into ActiveModel-style errors so views can render
`form.errors` without special-casing. Returns `true` on success, `false` on API error.

---

## `services.available?`

**`ServicesManager#available?`** (services_manager.rb:68):
```ruby
def available?(service_name, action_name = nil)
  send(service_name.to_sym).send(:available?, action_name.try(:to_sym))
rescue StandardError
  false
end
```

Each service overrides `Service#available?` to check catalog presence:
```ruby
# compute_service.rb:21
def available?(_action_name_sym = nil)
  elektron.service?("compute")   # checks service catalog
end
```

`Elektron::Client#service?` checks whether the service type exists in the token's
catalog. If the endpoint is not there, `service?` returns false — no exception.

Used in views and navigation to conditionally show/hide service sections:
```ruby
services.compute.available?   # Is Nova reachable?
services.available?(:kubernetes_ng, :clusters)  # action-level check (optional)
```

---

## Pagination — `paginatable`

**File:** `lib/core/paginatable.rb`

```ruby
@servers = paginatable(per_page: 15) do |pagination_options|
  services.compute.servers(pagination_options)
end
```

`paginatable` builds `{ limit: per_page + 1, sort_dir: ..., marker: ... }` and
passes them to the block as query params for the Elektron GET call.

**`limit: N+1` trick:** requests one extra item. If N+1 items come back, there
is a next page (`@pagination_has_next = true`) and the extra is popped. Uses
OpenStack's cursor-based pagination (`marker` = last item's ID from previous page).

Elektron has no built-in pagination awareness — it forwards params as query string.
The entire marker/limit protocol lives in the `paginatable` helper.

---

## Custom per-service HTTP options

Services can override timeout and headers per Elektron service call:

```ruby
# compute_service.rb:23 — longer timeout for slow Nova calls
elektron.service("compute",
  http_client: { read_timeout: 180 },
  headers: { "X-OpenStack-Nova-API-Version" => "2.67" }
)
```

`http_client:` options merge with `default_client_params`. `headers:` are added
to every request made through that service handle.

---

## Key files

- `Gemfile:95` — `gem 'elektron', git: 'https://github.com/sapcc/elektron', tag: 'v2.2.5'`
- `lib/core/api_client_manager.rb` — three factory methods, `default_client_params`
- `app/controllers/concerns/services.rb` — `services`, `service_user`, `cloud_admin` controller helpers
- `lib/core/service_layer/services_manager.rb` — `method_missing` dispatch to service classes, `available?`
- `lib/core/service_layer/service.rb` — `Service` base: `map_to`, `class_map_proc`, `elektron`, `available?`
- `lib/core/service_layer/model.rb` — `Model` base: `rescue_api_errors`, `save`/`destroy` → `perform_service_*`
- `lib/core/service_layer/errors.rb` — `Core::ServiceLayer::Errors` wrappers
- `lib/core/paginatable.rb` — `paginatable` helper (limit+1 trick, marker cursor)
- `lib/core/elektron_middlewares/object_cache.rb` — DB write middleware
- `lib/core/elektron_middlewares/request_uuid.rb` — `X-OpenStack-Request-ID` header
- `lib/core/elektron_middlewares/debug_logger.rb` — full request/response logging
- `lib/core/elektron_middlewares/user_logger.rb` — user client banner logging
- `lib/core/elektron_middlewares/cloud_admin_logger.rb` — cloud admin client banner logging
- `lib/core/elektron_middlewares/service_user_logger.rb` — **unused, dead code**
- `plugins/compute/app/services/service_layer/compute_service.rb` — canonical service example with `available?`, custom timeout, versioned header
- `plugins/compute/app/services/service_layer/compute_services/server.rb` — canonical `map_to` + `class_map_proc` usage
