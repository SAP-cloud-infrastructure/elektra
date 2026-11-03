---
name: error-handling
description: >-
  Use when adding error handling to a controller, debugging why an error is
  not being caught, or understanding how exceptions flow from OpenStack through
  the service layer to the rendered page. Covers the ErrorRenderer concern,
  the Rescue concern, error classes, and all exception templates.
---

# Error Handling

Elektra has a layered exception system. Errors bubble from OpenStack → Elektron
→ service layer → controller, where they are caught by a chain of `rescue_from`
handlers and rendered as an HTML page, modal, JS dialog, or JSON response
depending on the request context.

## Architecture overview

```
OpenStack API
  → Elektron::Errors::ApiResponse  (HTTP 4xx/5xx from OpenStack)
  → Elektron::Errors::TokenExpired (401 that means re-auth)
  → Elektron::Errors::Request      (network / timeout)
      ↓
  Service layer (re-raises or returns nil)
      ↓
  Controller action
      ↓
  rescue_from handlers  (in priority order — innermost class wins)
      ↓
  render_exception_page(exception, map)
      ↓
  Template chosen by: warning? × format (html / js / json) × modal?
```

## ErrorRenderer concern — `app/controllers/concerns/error_renderer.rb`

`ApplicationController` does `extend ErrorRenderer`, which makes two methods
available to all controllers:

### `render_exception_page(exception, map = {})` (instance method)

The single rendering entry point. The `map` hash controls what the page shows:

| Key | Type | Meaning |
|-----|------|---------|
| `:title` | string / Symbol / Proc | Page heading. Symbol → `exception.send(sym)`. Proc → `proc.call(exception, controller)`. |
| `:description` | string / Symbol / Proc | Body text. `:message` → `exception.message`. |
| `:details` | string / Symbol / Proc | Technical details (backtrace etc.). |
| `:exception_id` | string | Defaults to `request.uuid`. |
| `:warning` | boolean | `true` → warning style (yellow, dismissable); `false` → error style (red, logged). |
| `:status` | integer | HTTP status. Falls back to `exception.status` → `exception.code` → 503. Clamped to 400–511. |

**Rendering decision tree:**

```
warning: true?
  └─ XHR + polling_service?  →  error_polling.js.erb  (flash append)
  └─ format html              →  exceptions/warning.html.haml
  └─ format js                →  exceptions/warning.js.erb  (InfoDialog)
  └─ format json              →  { error: @description }

warning: false?
  └─ logs: "#{exception_id}: #{title}. #{description}"
  └─ skip render if polling_service
  └─ format html              →  exceptions/error.html.haml
  └─ format js                →  exceptions/error.js.erb   (InfoDialog)
  └─ format json              →  { error: @description }
```

Both `error.js.erb` and `warning.js.erb` call `MoModal.close()` first, then
`InfoDialog.showError(html)` — so modal dialogs are closed and replaced by an
error dialog.

`error_polling.js.erb` appends a dismissible flash alert into `.flashes` (or
`.modal-flashes` for modals) without closing the page.

**Modal context:** both `warning.html.haml` and `error.html.haml` detect
`modal?` and render a `.modal-body` / `.modal-footer` fragment instead of a
full page, so the same templates work for both full-page and modal requests.

In `Rails.env.development?` with `ENV["NO_EXCEPTION_PAGE"]` set,
`render_exception_page` re-raises the exception instead of rendering.

### `rescue_and_render_exception_page(*exception_classes)` (class method)

A convenience wrapper around `rescue_from` that registers a handler for one or
more exception classes and calls `render_exception_page` with a per-class map:

```ruby
# in any controller class body:
rescue_and_render_exception_page [
  { "Fog::OpenStack::Errors::ServiceError" => {
      title: "Backend Service Error",
      description: "Could not reach OpenStack API",
      warning: true
    }
  },
  "Core::ServiceLayer::Errors::ApiError"   # uses defaults
]
```

Accepts an array of strings or `{ "ClassName" => map_hash }` entries.
Falls back to superclass matching when the exact class is not in the map
(`found_class > exception.class`).

## Rescue concern — `app/controllers/concerns/rescue.rb`

Included in `DashboardController`, so it applies to all scoped controllers.
Registers global `rescue_from` handlers in priority order (last registered =
highest priority in Rails):

| Exception | Action |
|-----------|--------|
| `ActiveRecord::ConnectionNotEstablished` | Render `db_error.html.haml` with `application_error` layout (status 500) |
| `ActionView::MissingTemplate` | `render_exception_page` with warning, "Page not Found" |
| `Elektron::Errors::TokenExpired`, `ActionController::InvalidAuthenticityToken` | Redirect to login |
| `MonsoonOpenstackAuth::Authentication::NotAuthenticated` | Redirect to login |
| `MonsoonOpenstackAuth::Authentication::NotAuthorized` | Render `unauthorized.haml` with HTTP 200 (avoids OAuth redirect loop) |
| `Elektron::Errors::ApiResponse` 401 | Redirect to login |
| `Elektron::Errors::ApiResponse` 403 | `render_exception_page` warning "Permission Denied" |
| `Elektron::Errors::ApiResponse` 404 | `render_exception_page` warning "Object not Found" |
| `Elektron::Errors::ApiResponse` 422 | `render_exception_page` warning "Unprocessable Entity" |
| `Elektron::Errors::ApiResponse` 429 | `render_exception_page` warning "Too Many Requests" |
| `Elektron::Errors::ApiResponse` 501 | `render_exception_page` warning "Not Implemented" |
| `MonsoonOpenstackAuth::Authorization::SecurityViolation` | `rescue_and_render_exception_page` status 403, lists involved roles |
| `Core::Error::ProjectNotFound` | `rescue_and_render_exception_page` warning "Project Not Found" |

`ApplicationController` adds one more (higher priority, so catches first):

| Exception | Action |
|-----------|--------|
| `Elektron::Errors::Request` | `render_exception_page` warning "Backend Slowdown Detected" |

**Why Elektra never sends HTTP 401 to the browser:**

An oauth2-proxy sits in front of Elektra and intercepts every HTTP 401 response
as "session expired / not authenticated" → redirects to the IdP → which
redirects back → which produces another 401 → infinite loop.

To avoid this, Elektra handles all auth-related errors without ever returning
401 to the browser:

| Situation | Response |
|-----------|----------|
| OpenStack returns 401 (`Elektron::Errors::ApiResponse` code 401) | Redirect to Elektra's own login page (monsoon-openstack-auth) |
| `Elektron::Errors::TokenExpired` | Redirect to login |
| `MonsoonOpenstackAuth::Authentication::NotAuthenticated` | Redirect to login |
| `MonsoonOpenstackAuth::Authentication::NotAuthorized` | HTTP **200** + `unauthorized.haml` |
| `MonsoonOpenstackAuth::Authorization::SecurityViolation` | HTTP **403** + warning page (403 is safe — oauth2-proxy only intercepts 401) |

The HTTP 200 on `NotAuthorized` is deliberate: the user IS authenticated (they
passed the oauth2-proxy), they just lack permissions for this scope. A 401 here
would trigger the proxy loop; 200 shows the error without disrupting the
session.

## Error classes — `lib/core/error.rb`

```ruby
Core::Error::ServiceUserNotAuthenticated  # service user token missing
Core::Error::DomainNotFound               # domain_id unknown
Core::Error::ProjectNotFound              # project_id unknown
```

`ScopeController` rescues `ServiceUserNotAuthenticated` and `DomainNotFound`
directly (not via `ErrorRenderer`) and renders a custom "Unsupported Domain"
404 page (`scope_controller.rb:92`).

## Exception templates — `app/views/application/exceptions/`

| Template | Used when |
|----------|-----------|
| `error.html.haml` | Hard error, full page or modal fragment |
| `error.js.erb` | Hard error on XHR/JS request → `InfoDialog.showError` |
| `warning.html.haml` | Warning, full page or modal fragment |
| `warning.js.erb` | Warning on XHR/JS request → `InfoDialog.showError` |
| `error_polling.js.erb` | Any error during polling → dismissible flash append |
| `db_error.html.haml` | DB connection failure, own `application_error` layout |
| `unauthorized.haml` | Auth scope failure (HTTP 200) |
| `project_not_found.haml` | Project scope missing |
| `not_authenticated.haml` | No session |
| `_dismissible_flashes_with_details.html.haml` | Partial used by `error_polling.js.erb` |

## Redirect behaviour during errors

`ApplicationController#redirect_to` is overridden: for JSON requests, modal
requests, polling services, or `do_not_redirect` param, it sends `HEAD :ok`
with a `Location` header instead of a real redirect. This prevents double-render
errors and keeps AJAX flows intact even when error handlers call `redirect_to`.

## Adding error handling to a plugin controller

**Option A — per-class mapping via `rescue_and_render_exception_page`:**

```ruby
class MyPlugin::ThingsController < ::DashboardController
  rescue_and_render_exception_page [
    { "MyPlugin::NotFoundError" => {
        title: "Thing Not Found",
        description: :message,
        warning: true
      }
    }
  ]
end
```

**Option B — inline rescue in an action:**

```ruby
def show
  @thing = services.my_plugin.find_thing(params[:id])
rescue Elektron::Errors::ApiResponse => e
  render_exception_page(e, title: "Could not load thing", warning: true)
end
```

**Option C — return nil / empty for non-critical failures:**

Service methods that call `rescue Elektron::Errors::ApiResponse; nil` (the
pattern in the service layer checklist) let the controller decide how to handle
a missing resource without triggering the global error page.

## Frontend error handling (React plugins)

React-based plugins (e.g. `kubernetes_ng`) have their own error handling stack
that is completely separate from the Rails `rescue_from` chain. Errors from
fetch calls never reach the server — they are handled entirely in the browser.

### The 200-with-error-body problem

Because Elektra never returns HTTP 401 (oauth2-proxy loop), the Rails controller
may render an error response with HTTP 200 containing a JSON body like
`{ "error": "...", "code": 403 }`. A plain `fetch` call would treat this as a
success (`response.ok === true`).

`apiClient.ts` in `kubernetes_ng` solves this with `checkForApiError`:

```typescript
function checkForApiError(data: unknown): void {
  if (data && typeof data === "object" && "error" in data && "code" in data &&
      typeof (data as { code: unknown }).code === "number") {
    const error = new Error(`${message} (HTTP ${errorData.code})`)
    error.status = errorData.code
    throw error
  }
}
```

Every API method calls `checkForApiError(res.data)` after a successful fetch —
so a `{ error: "Forbidden", code: 403 }` body becomes a thrown `Error` even
though the HTTP status was 200.

### `ajax_helper.js` — the shared fetch client

`lib/ajax_helper.js` (`app/javascript/lib/ajax_helper.js`) is the core fetch
wrapper used by all plugins. Key error behaviours:

- **`handleResponse`**: if `!response.ok`, creates an `Error` with `.status`,
  `.statusText`, `.headers`, `.data` (parsed body), and `.response` (raw fetch
  Response). Throws it so callers see a rejected Promise.
- **Location header redirect**: if any response (including errors) has a
  `location` header, redirects `window.location` to it — this is how the Rails
  `redirect_to login_path` flows back to the browser when a session expires mid-
  session. The redirect URL gets the current page appended as `after_login=`.
- **CSRF token**: added automatically via `X-CSRF-Token` from the page's meta
  tag, unless `X-Auth-Token` is already present.
- **Timeout + cancel**: `prepareRequest` creates an `AbortController`; if
  `timeout` is set, `setTimeout` aborts the request.

`pluginAjaxHelper(pluginName, options)` builds a client pre-scoped to
`/<domain>/<project>/<pluginName>/`, so plugin fetch calls use relative paths
without repeating the scope.

`createAjaxHelper` extends `Client` with an `.osApi(serviceName)` method that
sets `pathPrefix = os-api/<serviceName>` and `headerPrefix = OS-API-` — the
frontend counterpart of `OsApiController`.

### Error normalization — `InlineError.tsx` / `normalizeError`

`normalizeError(error)` (`kubernetes_ng/components/InlineError.tsx`) converts
any thrown value into `{ title, message }`:

| Error shape | Handling |
|-------------|----------|
| `{ data: { message: string } }` (serialized server error) | Strips leading `, ` from message; title = "API Error:" |
| `instanceof Error` | Uses `error.name` as title, `error.message` as message |
| Anything else | title = "Unknown Error" |

`InlineError` renders the normalized error via the Juno `<Status status="error">`
component, optionally showing `.details` (e.g. Zod parse issues) in a collapsible section.

### Error boundaries

`kubernetes_ng` uses `react-error-boundary` at two levels:

1. **App level** (`App.tsx`): `<ErrorBoundary fallback={<InlineError />}>` wraps
   the entire app — catches any render-time throw that bubbles up uncaught.
2. **Route level** (`clusters/index.tsx`): `ClustersErrorBoundary` wraps the
   clusters page with `fallbackRender` so the page header still renders even when
   the content errors.

TanStack Query errors from `useQuery` do **not** automatically propagate to
error boundaries (unlike `throwOnError: true`). Instead they stay in
`query.error` and components render `<InlineError error={query.error} />`
inline.

### Mutation errors — Juno MessagesProvider

Write operations use `useMutation`. On error, the `onError` callback calls
`addMessage` from `@cloudoperators/juno-messages-provider`:

```typescript
onError: (error) => {
  resetMessages()
  const errText = normalizeError(error)
  addMessage({ text: `${errText.title}${errText.message}`, variant: "danger" })
}
```

This appends a dismissible danger alert to the Juno message bar at the top of
the page — not a modal, not a page reload. `resetMessages()` clears previous
messages before showing the new one.

### Schema validation errors (Zod)

`apiClient.ts` validates every API response against Zod schemas
(`ClustersSchema`, `ClusterSchema`, etc.) using `safeParse`. On failure it throws:

```typescript
const error = new Error("Invalid response")
error.name = "Failed to fetch clusters"
error.details = parsed.error.issues   // Zod issue array
throw error
```

`InlineError` picks up `.details` and renders them collapsed under the main
message, so developers see exactly which fields failed validation.

### Error handling patterns across React plugins

Vier verschiedene Stile koexistieren — je nach Alter und Komplexität des Plugins:

**Pattern A: TanStack Query + ErrorBoundary + `addMessage` (`kubernetes_ng` — modern)**

`useQuery` hält Errors in `query.error`, Komponenten rendern `<InlineError
error={query.error} />` inline. Mutations nutzen `onError` → `addMessage` für
Juno-Danger-Messages. `<ErrorBoundary>` fängt ungeplante Render-Crashes auf
App- und Route-Ebene ab. `checkForApiError` schützt explizit vor 200-mit-Error-
Body (oauth2-proxy). Zod validiert alle API-Responses.

**Pattern B: TanStack Query + eigene Retry-Logik (`email_service`)**

Eigene Error-Klassen `HTTPError` / `NetworkError` mit `.statusCode`. TanStack
Query `retry`-Callback unterscheidet 4xx (kein Retry) von 5xx (max 3x,
exponentieller Backoff). Bulk-Fetches nutzen `isTransientError` +
`fetchPageWithRetry`. Errors landen als `{ isError, error }` in lokalem State
→ Juno `<Message variant="error">`.

**Pattern C: TanStack Router Loader + lokaler State (`smartops`)**

Fehler werden im Router `loader` gecatcht und als `{ error: string }` in
`loaderData` transportiert — nicht geworfen. Komponente liest `error` aus
`useLoaderData()` und rendert `<Message variant="error">`. Detail-Fetch-Errors
landen in `useState<string | null>`.

**Pattern D: Lokaler `useState` + `.catch` (`block_storage`, `shared_filesystem_storage` — legacy)**

Kein TanStack Query. `useEffect` + direkter `ajaxHelper`-Aufruf mit
`.catch(error => setLoadError(error.message))`. Error-State wird als Bootstrap-
Alert oder `<p>` gerendert.

**Wichtig:** Das 200-mit-Error-Body-Problem (oauth2-proxy) wird **nur** in
`kubernetes_ng` durch `checkForApiError` explizit behandelt. Andere Plugins
ignorieren eine 200-Response mit `{ error, code }` im Body still.

### Summary: two completely separate error stacks

| Layer | Mechanism | Shown as |
|-------|-----------|----------|
| Rails controller | `rescue_from` → `render_exception_page` | Server-rendered HTML page / modal / JS dialog |
| React fetch (non-ok HTTP) | `ajax_helper handleResponse` throws | Caught by query hook → `<InlineError>` or `addMessage` |
| React fetch (200 + error body) | `checkForApiError` throws | Same as above |
| React render crash | `react-error-boundary` | `<InlineError>` fallback in place |
| Mutation failure | `useMutation onError` + `addMessage` | Juno danger message bar |

## OpenStack error formats and Elektron normalization

Each OpenStack service uses a different JSON structure for error responses. Elektron
normalizes all of them through `Elektron::Errors::ApiResponse.read_error_messages`
(`vendor/.../elektron.../lib/elektron/errors/api_response.rb`).

### How `read_error_messages` works

It recursively walks the response body hash and collects values for four candidate
keys: `message`, `description`, `type`, `faultstring` (in that priority order).
Nested hashes and arrays are traversed automatically — so deeply-nested error
objects are found regardless of wrapper key names.

```ruby
# For each hash node encountered:
# 1. Recurse into nested Hash values
# 2. Recurse into Arrays of Hashes
# 3. Collect values for the 4 candidate keys
# Priority: message > description > type > faultstring
```

Result: `exception.message` always returns the collected messages joined with `', '`.

### Known OpenStack error structures

| Service | Example JSON structure | Key extracted |
|---------|----------------------|---------------|
| **Nova** (compute) | `{ "computeFault": { "message": "...", "code": 500 } }` | `message` |
| **Nova** (not found) | `{ "itemNotFound": { "message": "Instance could not be found", "code": 404 } }` | `message` |
| **Nova** (bad request) | `{ "badRequest": { "message": "Invalid input...", "code": 400 } }` | `message` |
| **Neutron** (networking) | `{ "NeutronError": { "type": "NetworkNotFound", "message": "...", "detail": "" } }` | `message` (then `type`) |
| **Cinder** (block storage) | `{ "itemNotFound": { "message": "Volume ... could not be found.", "code": 404 } }` | `message` |
| **Heat** (orchestration) | `{ "title": "...", "explanation": "...", "error": { "message": "...", "type": "..." } }` | `message` |
| **Keystone** (identity) | `{ "error": { "message": "...", "code": 401, "title": "Unauthorized" } }` | `message` |
| **Swift** (object store) | Plain text body (no JSON) | `response.message` fallback |
| **Designate** (DNS) | `{ "description": "...", "code": 400, "type": "invalid_object" }` | `description` |
| **SOAP/legacy** (some services) | `{ "faultstring": "...", "faultcode": "..." }` | `faultstring` |

### What happens when the body is not JSON

If the response body is a string that fails `JSON.parse`, `ApiResponse#initialize`
falls back to `@response.message || data` (the raw string). `read_error_messages`
then receives this string, which does not `respond_to?(:each)` → returns
`[hash.to_s]`. The exception message becomes the raw HTTP message or body text.

### What `Elektron::Errors::ApiResponse` exposes

| Attribute | Source |
|-----------|--------|
| `exception.code` | `response.code.to_i` (the HTTP status) |
| `exception.message` | `messages.join(', ')` — normalized human text |
| `exception.messages` | Array of all collected messages (may be multiple) |
| `exception.service_name` | Set by `ResponseErrorHandler` from `request_context` |
| `exception.http_method` | Set by `ResponseErrorHandler` |
| `exception.url` | Set by `ResponseErrorHandler` |
| `exception.response` | Raw Elektron response object (body, headers, code) |

The `rescue_from` handlers in `Rescue` concern branch on `e.code` (e.g. `== 401`,
`== 403`, `== 404`, `== 422`, `== 429`, `== 501`) — `e.message` is already
normalized by the time those handlers run.

## Key files (updated)

- `app/controllers/concerns/error_renderer.rb` — `render_exception_page`, `rescue_and_render_exception_page`
- `app/controllers/concerns/rescue.rb` — global `rescue_from` chain (included in `DashboardController`)
- `app/controllers/application_controller.rb:43` — `Elektron::Errors::Request` handler
- `app/controllers/scope_controller.rb:92` — `DomainNotFound` / `ServiceUserNotAuthenticated` handler
- `lib/core/error.rb` — `Core::Error::*` classes
- `app/views/application/exceptions/` — all server-side error templates
- `app/javascript/lib/ajax_helper.js` — shared fetch client; `handleResponse`, redirect handling, `pluginAjaxHelper`, `osApi`
- `plugins/kubernetes_ng/app/javascript/widgets/app/apiClient.ts` — `checkForApiError`, Zod validation
- `plugins/kubernetes_ng/app/javascript/widgets/app/components/InlineError.tsx` — `normalizeError`, `<InlineError>`
- `plugins/kubernetes_ng/app/javascript/widgets/app/hooks/useClusterQueries.ts` — TanStack Query hooks with error handling
