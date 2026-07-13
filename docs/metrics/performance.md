# How Elektra Performance Metrics Work

[← Back to Metrics Overview](./README.md)

**Date:** June 25, 2026  
**Implementation:** `app/middleware/sli_metrics_middleware.rb`, `app/middleware/http_metrics_collector_middleware.rb`  
**Tests:** `spec/middleware/sli_metrics_middleware_spec.rb`, `spec/middleware/http_metrics_collector_middleware_spec.rb`

---

## Table of Contents

1. [Overview](#overview)
2. [Metrics Reference](#metrics-reference)
3. [How the Middleware Works](#how-the-middleware-works)

---

## Overview

Elektra exposes three working performance metrics through its Rack middleware stack. These metrics power four Plutono dashboards that track latency, throughput, and error rates per plugin.

### Key Concepts

- ✅ **Plugin-scoped:** Every metric is breakable by plugin (`compute`, `networking`, `identity`, etc.)
- ✅ **SLI tracking:** `elektra_sli` measures user-perceived latency for every request

### URL Structure

Elektra URLs follow this pattern, which determines how labels are populated:

```
/:domain_id/:project_id/:plugin/...

Example: /monsoon3/abc-123/compute/instances
         ^^^^^^^^  ^^^^^^^  ^^^^^^^  ^^^^^^^^^
         domain_id project  plugin   controller path
```

The `elektra_sli` middleware extracts the **first URL segment** as the `path` label. The HTTP collector middleware reads plugin from Rails route parameters (`path_params[:controller].split("/").first`) and validates it against registered plugins.

---

## Metrics Reference

### 1. elektra_sli

**Type:** Histogram  
**Labels:** `path`, `method`  
**Status:** ✅ Working

**What it measures:**
This histogram tracks end-to-end request latency (wall-clock time) for every HTTP request. Despite the label name `path`, it actually contains the **first URL segment** (typically domain_id), not the full path or plugin name. This is a historical naming artifact preserved for backward compatibility with existing Plutono dashboards.

**Key behaviors:**
- **Wall-clock measurement:** Records total request time from middleware entry to response completion (includes all processing, database queries, OpenStack API calls, rendering)
- **First segment only:** `path` label contains only the first URL segment, not the full path
- **Excludes utility paths:** Skips `/metrics` (exact match), `/assets/*`, and `/system/*` (prefix matches)
- **Histogram buckets:** 9 buckets optimized for OpenStack API proxy latency (0.05s to 30s)

**Why this design:**
Originally intended as a simple SLI (Service Level Indicator) for user-perceived performance. The `path` label containing the first URL segment (domain_id) allows grouping by tenant, though this wasn't the original intent. Kept for dashboard compatibility.

**Use cases:**
- Calculate p50/p90/p99 latency across all requests
- Compare latency across different domains/tenants (via first URL segment)
- Monitor overall application performance trends
- SLI for availability and performance SLOs

**Important considerations:**
- **Label confusion:** The `path` label does NOT contain the full path or plugin name - use `http_server_request_duration_seconds` for plugin-specific analysis
- **Not plugin-specific:** Cannot directly aggregate by plugin (use HTTP collector metrics instead)
- **Domain-level only:** Best for tenant-level or overall performance analysis

**Example:**
```promql
# Median latency for domain "monsoon3"
histogram_quantile(0.5, rate(elektra_sli_bucket{path="monsoon3"}[5m]))

# 99th percentile latency for GET requests
histogram_quantile(0.99, rate(elektra_sli_bucket{method="get"}[5m]))
```

---

### 2. http_server_requests_total

**Type:** Counter  
**Labels:** `code`, `method`, `host`, `domain`, `project`, `controller`, `action`, `plugin`, `xhr` (9 labels)  
**Status:** ✅ Working (requires filter)

**What it measures:**
This counter increments on every HTTP request with rich labeling for detailed analysis. Provides granular breakdown by plugin, controller, action, HTTP status code, and more.

**Key behaviors:**
- **No deduplication:** Every request increments the counter (same as feature usage)
- **Plugin validation:** Plugin label is validated against `Core::PluginsManager` - invalid plugins get empty string
- **Rich context:** 9 labels provide multi-dimensional slicing (by plugin, status code, action, etc.)
- **Requires filtering:** High cardinality (9 labels) means queries should filter to avoid overwhelming Prometheus

**Why this design:**
Comprehensive request tracking for operational visibility. The 9-label design allows drilling down to specific controllers/actions while also enabling high-level plugin or status code rollups.

**Use cases:**
- Calculate request rate per plugin (`sum by (plugin) (rate(...))`)
- Track error rates by plugin (`code=~"5.."`)
- Identify high-traffic controllers/actions
- Monitor AJAX vs regular request distribution
- Detect unusual traffic patterns (spikes, drops)

**Important considerations:**
- **High cardinality:** 9 labels create many time series - always filter queries by at least one label (typically `plugin` or `controller`)
- **Empty string labels:** Missing domain/project/plugin get empty string (`""`) labels
- **Cardinality explosion risk:** Querying without filters can return thousands of time series

**Cardinality math:**
- ~15 plugins × ~50 controllers × ~10 actions × 5 status codes = ~37,500 potential time series
- Actual cardinality lower due to sparse usage, but still requires query discipline

**Labels explained:**
- `code` - HTTP status code ("200", "404", "500") - useful for error rate calculations
- `method` - HTTP verb ("get", "post", "put", "delete", "patch")
- `host` - Request host header (useful in multi-region deployments)
- `domain` - Domain ID from URL (empty if not in URL)
- `project` - Project ID from URL (empty if not in URL)
- `controller` - Full Rails controller path ("compute/os_instances")
- `action` - Rails action name ("index", "show", "create")
- `plugin` - Validated plugin name ("compute", "networking") or empty string
- `xhr` - Boolean indicating AJAX request (true/false)

**Example:**
```promql
# Request rate per plugin
sum by (plugin) (rate(http_server_requests_total[5m]))

# Error rate for compute plugin
sum(rate(http_server_requests_total{plugin="compute", code=~"5.."}[5m]))
/ sum(rate(http_server_requests_total{plugin="compute"}[5m]))

# Top 10 slowest endpoints by request count
topk(10, sum by (controller, action) (rate(http_server_requests_total[1h])))
```

---

### 3. http_server_request_duration_seconds

**Type:** Histogram  
**Labels:** `code`, `method`, `host`, `domain`, `project`, `controller`, `action`, `plugin`, `xhr` (9 labels)  
**Status:** ✅ Working (requires filter)

**What it measures:**
This histogram records request duration (wall-clock time) with the same rich 9-label breakdown as `http_server_requests_total`. Provides latency percentiles (p50, p90, p99) for specific controllers, actions, or plugins.

**Key behaviors:**
- **Identical labels to counter:** Same 9 labels as `http_server_requests_total` for correlated analysis
- **Wall-clock measurement:** Total request time from middleware entry to completion
- **Histogram buckets:** 9 buckets (0.05s to 30s) optimized for OpenStack API proxy latency
- **Requires filtering:** High cardinality requires query discipline

**Why this design:**
Complements the request counter with latency distribution data. The identical label set allows joining counter and histogram queries to calculate latency per request, error latency vs success latency, etc.

**Use cases:**
- Calculate p50/p90/p99 latency per plugin
- Compare latency across different actions in same controller
- Identify slow endpoints (high p99 latency)
- Correlate latency with error rates (compare latency for code="500" vs code="200")
- Monitor latency trends over time

**Important considerations:**
- **Same cardinality issues as counter:** Queries must filter by at least one label
- **Histogram interpretation:** Use `histogram_quantile()` to calculate percentiles
- **Multiple observations per request:** Each request generates observations for all buckets >= its duration
- **Bucket boundaries matter:** 9 buckets span 0.05s to 30s - requests > 30s all land in +Inf bucket

**Histogram mechanics:**
A request taking 2.7 seconds increments buckets: 2.5s, 5.0s, 10.0s, 30.0s, +Inf (all buckets >= 2.7s).

**Comparing with elektra_sli:**
- `elektra_sli`: Simple, low-cardinality (2 labels), good for overall SLI
- `http_server_request_duration_seconds`: Rich, high-cardinality (9 labels), good for deep analysis

**Example:**
```promql
# Median latency for compute plugin
histogram_quantile(0.5, 
  sum by (le) (rate(http_server_request_duration_seconds_bucket{plugin="compute"}[5m]))
)

# 99th percentile latency for specific controller action
histogram_quantile(0.99,
  sum by (le) (rate(http_server_request_duration_seconds_bucket{
    controller="compute/os_instances", 
    action="index"
  }[5m]))
)

# Compare success vs error latency for compute plugin
histogram_quantile(0.5,
  sum by (le, code) (rate(http_server_request_duration_seconds_bucket{
    plugin="compute",
    code=~"[25].."
  }[5m]))
)
```

---

### 4. http_server_exceptions_total

**Type:** Counter  
**Labels:** `exception`  
**Status:** ✅ Working

**What it measures:**
This counter increments whenever an unhandled exception occurs during request processing, recording the exception class name. Does NOT include handled errors that return HTTP error codes (like ActiveRecord::RecordNotFound that returns 404).

**Key behaviors:**
- **Unhandled exceptions only:** Only increments when exception propagates out of application (not caught by controllers)
- **Class name recorded:** Label contains Ruby exception class name ("NoMethodError", "OpenStack::Compute::ServiceUnavailable")
- **Request still fails:** Exception is recorded then re-raised - user sees error response
- **No request context:** Only records exception class, not which controller/action/plugin it occurred in

**Why this design:**
Simple exception tracking without high cardinality. Recording only the exception class keeps cardinality manageable (typically < 50 unique exception classes) while still providing actionable alerting.

**Use cases:**
- Alert on new exception types (classes that haven't been seen before)
- Track exception rate trends (increasing NoMethodError might indicate recent code bug)
- Identify most common exceptions
- Monitor OpenStack API reliability (via OpenStack::* exception counts)

**Important considerations:**
- **No context labels:** Cannot determine which plugin/controller raised the exception from this metric alone (check application logs or APM)
- **Handled errors excluded:** Controllers that rescue exceptions and return error responses won't increment this counter
- **Class name variations:** Different exception classes for similar problems ("Timeout::Error", "Net::ReadTimeout", "OpenStack::Compute::TimeoutError") tracked separately

**Exception types commonly seen:**
- `NoMethodError` - Code bugs (calling method on nil)
- `OpenStack::Compute::ServiceUnavailable` - OpenStack API down
- `Net::ReadTimeout` - Slow OpenStack API responses
- `ActiveRecord::RecordNotFound` - Only if not rescued by controller
- `ActionController::RoutingError` - Invalid URLs

**Example:**
```promql
# Exception rate (all types)
sum(rate(http_server_exceptions_total[5m]))

# Most common exceptions (last hour)
topk(5, sum by (exception) (increase(http_server_exceptions_total[1h])))

# Alert on new exception types
count by (exception) (http_server_exceptions_total) > 0

# OpenStack-related exceptions
sum(rate(http_server_exceptions_total{exception=~"OpenStack.*"}[5m]))
```

### Histogram Buckets

Both histograms explicitly define buckets optimized for OpenStack API proxy response times:

```ruby
buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
```

This gives useful resolution in the 0.5s–5s range where most OpenStack-backed requests land. The explicit bucket configuration overrides the prometheus-client gem's default sub-5ms buckets (0.005, 0.01, 0.025), which are not useful for API proxy workloads.

---

## How the Middleware Works

### Middleware Stack Order

```
Incoming request
       ↓
AnonymousSessionMetricsMiddleware
       ↓
HttpMetricsCollectorMiddleware   ← records http_server_* metrics
       ↓
SLIMetricsMiddleware             ← records elektra_sli metric
       ↓
HttpMetricsExporterMiddleware    ← serves /metrics endpoint
       ↓
Rails app
```

### SLIMetricsMiddleware

**File:** `app/middleware/sli_metrics_middleware.rb`

Records how long every request takes. Skips `/metrics` (exact match), `/assets/*`, and `/system/*` paths (prefix match).

```ruby
# Histogram configuration
@histogram = @registry.histogram(
  :elektra_sli,
  docstring: "Request duration for Elektra plugins in seconds.",
  labels: %i[path method],
  buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
)
```

```
Incoming: GET /monsoon3/abc-123/compute/instances
                          ↓
          Extract first segment: segments[0] = "monsoon3"
                          ↓
          Call app, measure wall-clock time
                          ↓
          elektra_sli.observe(duration, labels: {path: "monsoon3", method: "get"})
```

**Label: `path`** — contains the **first URL segment**, typically the domain_id. Historical naming artifact kept for Plutono dashboard compatibility.

**Label: `method`** — HTTP method in lowercase (`get`, `post`, `put`, `delete`, `patch`).

**Fallback:** Empty paths get `path="root"`.

```
/monsoon3/abc-123/compute/instances  →  path="monsoon3"
/networking/routers                  →  path="networking"
/                                    →  path="root"
```

---

### HttpMetricsCollectorMiddleware

**File:** `app/middleware/http_metrics_collector_middleware.rb`

Inherits from `Prometheus::Middleware::Collector`. Records both the counter and histogram on every request using 9 labels extracted from the Rails route parameters. Excludes paths starting with `/metrics`, `/system`, or `/assets` (prefix match).

**Metric initialization:**

```ruby
# Counter metric
@requests = @registry.counter(
  :"#{@metrics_prefix}_requests_total",
  docstring: "The total number of HTTP requests handled by the Rack application.",
  labels: LABELS,
)

# Histogram metric
@durations = @registry.histogram(
  :"#{@metrics_prefix}_request_duration_seconds",
  docstring: "The HTTP response duration of the Rack application.",
  labels: LABELS,
  buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
)
```

Where `LABELS = %i[code method host domain project controller action plugin xhr]` (9 labels total).

```
Incoming: GET /monsoon3/abc-123/compute/instances
                          ↓
          Rails routes resolve path_parameters:
          {
            controller: "compute/os_instances",
            action:     "index",
            domain_id:  "monsoon3",
            project_id: "abc-123"
          }
                          ↓
          Extract plugin from controller:
          plugin_name = "compute/os_instances".split("/").first
          plugin = Core::PluginsManager.has?("compute") ? "compute" : ""
                          ↓
          Build label set:
          {
            code:       "200",
            method:     "get",
            host:       "elektra.eu-de-1.cloud.sap",
            domain:     "monsoon3",
            project:    "abc-123",
            controller: "compute/os_instances",
            action:     "index",
            plugin:     "compute",
            xhr:        false
          }
                          ↓
          http_server_requests_total.increment(labels: ...)
          http_server_request_duration_seconds.observe(duration, labels: ...)
```

**Plugin validation:** The middleware extracts the first segment of the controller name and validates it against `Core::PluginsManager`. If not registered, the plugin label is set to an empty string.

**Label details:**
- `code` - HTTP status code as string (e.g., "200", "404", "500")
- `method` - HTTP method in lowercase (e.g., "get", "post")
- `host` - HTTP_HOST header value
- `domain` - domain_id from route parameters (empty string if missing)
- `project` - project_id from route parameters (empty string if missing)
- `controller` - Full controller path from route parameters (e.g., "compute/os_instances")
- `action` - Controller action name (e.g., "index", "show")
- `plugin` - Validated plugin name or empty string
- `xhr` - Boolean indicating if request was AJAX (X-Requested-With: XMLHttpRequest)

**Error handling:** If recording fails for any reason, the error is logged and the request continues normally — metrics failures never affect users.

```ruby
rescue => e
  Rails.logger.error("Failed to record HTTP metrics: #{e.class} - #{e.message}")
  Rails.logger.error(e.backtrace.first(5).join("\n")) if Rails.env.development?
  nil
end
```

**Exception tracking:** The middleware overrides the `trace` method to catch and record exceptions:

```ruby
def trace(env)
  response = nil
  duration = realtime { response = yield }
  record(env, response.first.to_s, duration)
  return response
rescue => exception
  @exceptions.increment(labels: { exception: exception.class.name })
  raise
end
```

When an exception occurs during request processing:
1. The exception class name is recorded to `http_server_exceptions_total`
2. The exception is re-raised (request still fails as expected)
3. This metric uses only the `exception` label to match the parent class's counter definition

---

**Last updated:** June 25, 2026
**Recent changes:**
- Fixed `http_server_exceptions_total` metric recording
- Added explicit histogram bucket configuration to both middlewares
- Improved `elektra_sli` docstring from "A histogram of sli" to "Request duration for Elektra plugins in seconds."
- Added comprehensive test coverage for both middlewares (excluded paths, bucket structure, label population, exception tracking)
