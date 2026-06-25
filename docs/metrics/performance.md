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
4. [Dashboard: Elektra SLI (P0)](#dashboard-elektra-sli-p0)
5. [Dashboard: Elektra Overview (P0)](#dashboard-elektra-overview-p0)
6. [Dashboard: Elektra HTTP Details (P1)](#dashboard-elektra-http-details-p1)
7. [Dashboard: Elektra HTTP Plugin Response Times (P1)](#dashboard-elektra-http-plugin-response-times-p1)
8. [High-Cardinality Labels](#high-cardinality-labels)
9. [PromQL Query Reference](#promql-query-reference)

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

| Metric                                 | Type      | Labels           | Purpose                                   | Status                       |
| -------------------------------------- | --------- | ---------------- | ----------------------------------------- | ---------------------------- |
| `elektra_sli`                          | Histogram | `path`, `method` | User-perceived request latency per plugin | ✅ Working                   |
| `http_server_requests_total`           | Counter   | 9 labels         | Request count with full breakdown         | ✅ Working (requires filter) |
| `http_server_request_duration_seconds` | Histogram | 9 labels         | Response duration with full breakdown     | ✅ Working (requires filter) |
| `http_server_exceptions_total`         | Counter   | `exception`      | Exception tracking by class               | ✅ Working                   |

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

```ruby
# Histogram configuration
@durations = @registry.histogram(
  :"#{@metrics_prefix}_request_duration_seconds",
  docstring: "The HTTP response duration of the Rack application.",
  labels: LABELS,
  buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0],
)
```

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

---
