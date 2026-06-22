# How Elektra Performance Metrics Work

**Date:** June 22, 2026
**Implementation:** `app/middleware/sli_metrics_middleware.rb`, `app/middleware/http_metrics_collector_middleware.rb`

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

Elektra exposes three working performance metrics through its Rack middleware stack. These metrics power four Plutono dashboards (two P0, two P1) that track latency, throughput, and error rates per plugin.

### Key Concepts

- ✅ **Plugin-scoped:** Every metric is breakable by plugin (`compute`, `networking`, `identity`, etc.)
- ✅ **SLI tracking:** `elektra_sli` measures user-perceived latency for every request
- ⚠️ **Cardinality:** HTTP metrics carry 9 labels — always filter by `plugin` before querying
- ❌ **Exception tracking broken:** `http_server_exceptions_total` exists in the middleware but is not recording data correctly

### URL Structure

Elektra URLs follow this pattern, which determines how labels are populated:

```
/:domain_id/:project_id/:plugin/...

Example: /monsoon3/abc-123/compute/instances
         ^^^^^^^^  ^^^^^^^  ^^^^^^^  ^^^^^^^^^
         domain_id project  plugin   controller path
```

The `elektra_sli` middleware extracts the plugin name from the **third URL segment**. The HTTP collector middleware reads plugin from Rails route parameters (`path_params[:controller].split("/").first`).

---

## Metrics Reference

| Metric | Type | Labels | Purpose | Status |
|---|---|---|---|---|
| `elektra_sli` | Histogram | `path`, `method` | User-perceived request latency per plugin | ✅ Working |
| `http_server_requests_total` | Counter | 9 labels | Request count with full breakdown | ✅ Working (requires filter) |
| `http_server_request_duration_seconds` | Histogram | 9 labels | Response duration with full breakdown | ✅ Working (requires filter) |
| `http_server_exceptions_total` | Counter | `exception` | Exception tracking by class | ❌ Broken |

### Histogram Buckets

Both histograms use buckets tuned for OpenStack API proxy response times:

```
[0.05s, 0.1s, 0.25s, 0.5s, 1.0s, 2.5s, 5.0s, 10.0s, 30.0s]
```

This gives useful resolution in the 0.5s–5s range where most OpenStack-backed requests land.

---

## How the Middleware Works

### Middleware Stack Order

```
Incoming request
       ↓
HttpMetricsCollectorMiddleware   ← records http_server_* metrics
       ↓
InquiryMetricsMiddleware
       ↓
SLIMetricsMiddleware             ← records elektra_sli metric
       ↓
HttpMetricsExporterMiddleware    ← serves /metrics endpoint
       ↓
Rails app
```

### SLIMetricsMiddleware

**File:** `app/middleware/sli_metrics_middleware.rb`

Records how long every request takes. Skips `/metrics`, `/assets/`, and `/system/` paths.

```
Incoming: GET /monsoon3/abc-123/compute/instances
                          ↓
          Extract plugin: segments[2] = "compute"
                          ↓
          Call app, measure wall-clock time
                          ↓
          elektra_sli.observe(duration, labels: {path: "compute", method: "get"})
```

**Label: `path`** — despite the name, this contains the **plugin name** extracted from the third URL segment. Historical naming artifact kept for Plutono dashboard compatibility.

**Label: `method`** — HTTP method in lowercase (`get`, `post`, `put`, `delete`, `patch`).

**Fallback:** Paths with fewer than 3 segments (domain landing pages, home pages) get `path="root"`.

```
/monsoon3/abc-123/compute/instances  →  path="compute"
/monsoon3/abc-123/networking/routers →  path="networking"
/monsoon3/abc-123                    →  path="root"
/                                    →  path="root"
```

---

### HttpMetricsCollectorMiddleware

**File:** `app/middleware/http_metrics_collector_middleware.rb`

Inherits from `Prometheus::Middleware::Collector`. Records both the counter and histogram on every request using 9 labels extracted from the Rails route parameters.

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
          Build label set:
          {
            code:       "200",
            method:     "get",
            host:       "elektra.eu-de-1.cloud.sap",
            domain:     "monsoon3",
            project:    "abc-123",
            controller: "compute/os_instances",
            action:     "index",
            plugin:     "compute",           ← first segment of controller
            xhr:        false
          }
                          ↓
          http_server_requests_total.increment(labels: ...)
          http_server_request_duration_seconds.observe(duration, labels: ...)
```

**Error handling:** If recording fails for any reason, the error is logged and the request continues normally — metrics failures never affect users.

```ruby
rescue => e
  Rails.logger.error("Failed to record HTTP metrics: #{e.class} - #{e.message}")
  nil
end
```

---

## Dashboard: Elektra SLI (P0)

**Purpose:** SLI/SLO monitoring — answers "Is Elektra fast enough right now?"

**Metric used:** `elektra_sli` only — low cardinality, safe to query unfiltered.

**Panels (4 working / 2 broken):**

| Panel | What it shows | Status |
|---|---|---|
| p95 Latency | 95th percentile response time across all plugins | ✅ |
| SLO Compliance | % of requests completing under threshold | ✅ |
| Response latency trend | p50 / p90 / p99 over time | ✅ |
| Request throughput | Requests per second by plugin | ✅ |
| Exception rate (24h) | Count of exceptions in last 24h | ❌ Broken |
| Exception rate graph | Exception rate over time | ❌ Broken |

**SLO threshold:** Currently set to 250ms in Plutono — this is too tight for an OpenStack API proxy where responses regularly take 1–5 seconds. Recommended threshold for Perses migration: **2.5 seconds**.

### How to read the SLI data

```
elektra_sli is a histogram. Each request increments:
- the bucket counter for every le= value ≥ the actual duration
- the _sum counter by the duration
- the _count counter by 1

Example: Request takes 1.3s
├─ elektra_sli_bucket{path="compute", method="get", le="0.05"}  → no increment
├─ elektra_sli_bucket{path="compute", method="get", le="0.1"}   → no increment
├─ elektra_sli_bucket{path="compute", method="get", le="0.25"}  → no increment
├─ elektra_sli_bucket{path="compute", method="get", le="0.5"}   → no increment
├─ elektra_sli_bucket{path="compute", method="get", le="1.0"}   → no increment
├─ elektra_sli_bucket{path="compute", method="get", le="2.5"}   → +1 ✅
├─ elektra_sli_bucket{path="compute", method="get", le="5.0"}   → +1 ✅
├─ elektra_sli_bucket{path="compute", method="get", le="10.0"}  → +1 ✅
├─ elektra_sli_bucket{path="compute", method="get", le="30.0"}  → +1 ✅
└─ elektra_sli_sum{path="compute", method="get"}                → +1.3
```

`histogram_quantile(0.95, ...)` uses these bucket counts to estimate the 95th percentile latency.

---

## Dashboard: Elektra Overview (P0)

**Purpose:** High-level health snapshot — answers "Is anything broken right now?"

**Metrics used:** `http_server_requests_total`, `http_server_request_duration_seconds`

**Panels (10 working / 3 broken):**

| Panel | What it shows | Status |
|---|---|---|
| Request rate by plugin (pie) | AJAX vs non-AJAX split per plugin | ✅ |
| Request rate by domain (bar) | Which domains generate most traffic | ✅ |
| HTTP status codes | Requests broken down by 2xx/3xx/4xx/5xx | ✅ |
| Error rate trend | 5xx rate over time | ✅ |
| p95 latency by plugin | Per-plugin latency comparison | ✅ |
| DB size | PostgreSQL database size | ✅ |
| Puma thread count | Active Puma threads | ❌ Metric removed |
| Puma request backlog | Requests waiting in queue | ❌ Metric removed |
| DB connections | Active database connections | ❌ PostgreSQL exporter unavailable |

**Important:** The overview uses `plugin!=""` in queries to filter out requests that don't match a known plugin (empty label). This prevents inflating numbers with internal/system requests while still avoiding unfiltered cardinality issues.

```promql
# Safe overview query pattern
sum by (plugin) (rate(http_server_requests_total{plugin!=""}[5m]))
```

---

## Dashboard: Elektra HTTP Details (P1)

**Purpose:** Per-plugin deep-dive — answers "Which actions in plugin X are slow or failing?"

**Metrics used:** `http_server_requests_total`, `http_server_request_duration_seconds`

**How it works:** Uses a `$plugin` template variable to generate one set of panels per plugin. Selecting `compute` in the dropdown shows only compute-related data.

```
$plugin = "compute"
     ↓
All queries become:
  rate(http_server_requests_total{plugin="compute"}[5m])
  rate(http_server_request_duration_seconds_bucket{plugin="compute"}[5m])
```

**Panels:**

| Panel | What it shows |
|---|---|
| Request rate by status code | How many 200/404/500s per minute for this plugin |
| Request rate by action | Which controller actions get the most traffic |
| Error rate | 5xx / total requests for this plugin |
| p99 latency by controller | Which controllers are slowest |
| XHR vs non-XHR split | How much traffic is AJAX vs page loads |

**⚠️ Cardinality warning:** Never remove the `$plugin` filter from these panels. An unfiltered query on `http_server_request_duration_seconds` will cause Prometheus to return "too many samples" and the browser to hang.

---

## Dashboard: Elektra HTTP Plugin Response Times (P1)

**Purpose:** Latency trends per plugin over time — answers "Is plugin X getting slower?"

**Metrics used:** `http_server_request_duration_seconds`

**Current status in Plutono: broken** — the dashboard loads indefinitely and never displays data. Root cause: the initial query runs without a default `$plugin` value, causing an unfiltered histogram query.

**Fix for Perses migration:** Set `compute` as the default plugin value so the dashboard always has a filter applied on load.

**Panels (to be built in Perses):**

| Panel | What it shows |
|---|---|
| p50 / p90 / p99 latency trend | Three percentile lines on one chart for selected plugin |
| Plugin comparison | p95 for all plugins on one chart — which plugin is slowest? |
| Request duration heatmap | Bucket distribution over time (shows whether latency is stable or spiky) |
| Slowest actions table | Top 10 controller/action pairs ranked by average duration |

---

## High-Cardinality Labels

`http_server_requests_total` and `http_server_request_duration_seconds` carry 9 labels. The combination of high-cardinality labels creates 10,000–100,000+ unique time series, which makes unfiltered queries fail.

### Label cardinality tiers

```
ALWAYS FILTER (before querying):
  domain   — 100s of values (monsoon3, ccadmin, bs, s4, convergedcloud, ...)
  project  — 1,000s of values (cc-demo, admin, master-data, api-support, ...)

FILTER BY DEFAULT (plugin filter constrains these automatically):
  controller — 50–100 values per plugin
  action     — typically 6–10 per controller (index, show, create, update, destroy, edit)

SAFE TO AGGREGATE FREELY:
  plugin  — 20–30 values        → use as primary filter
  host    — ~10 values          → use for multi-region breakdown
  code    — ~10 values (HTTP status codes)
  method  — 5 values (get, post, put, delete, patch)
  xhr     — 2 values (true, false)
```

### Filtering strategy

```promql
# ✅ Safe — plugin scopes the query to a manageable number of series
rate(http_server_requests_total{plugin="$plugin"}[5m])

# ✅ Safe — plugin!="" excludes unmatched paths, low cardinality result
sum by (plugin) (rate(http_server_requests_total{plugin!=""}[5m]))

# ✅ Safe — elektra_sli has only 2 labels (path, method)
histogram_quantile(0.95, sum by (path, le) (rate(elektra_sli_bucket[5m])))

# ❌ Never — browser hangs, Prometheus returns "too many samples"
rate(http_server_requests_total[5m])
rate(http_server_request_duration_seconds_bucket[5m])
```

---

## PromQL Query Reference

### SLI: p95 latency per plugin

```promql
histogram_quantile(0.95,
  sum by (path, le) (
    rate(elektra_sli_bucket[5m])
  )
)
```

### SLI: SLO compliance — % of requests under 2.5s

```promql
sum(rate(elektra_sli_bucket{le="2.5"}[5m]))
/
sum(rate(elektra_sli_count[5m]))
```

### SLI: Request throughput by plugin

```promql
sum by (path) (rate(elektra_sli_count[5m]))
```

### Overview: Error rate per plugin

```promql
sum by (plugin) (rate(http_server_requests_total{plugin!="", code=~"5.."}[5m]))
/
sum by (plugin) (rate(http_server_requests_total{plugin!=""}[5m]))
```

### Overview: Request split by plugin (pie chart)

```promql
sum by (plugin) (rate(http_server_requests_total{plugin!=""}[5m]))
```

### HTTP Details: Top 10 actions by volume (requires $plugin variable)

```promql
topk(10,
  sum by (controller, action) (
    rate(http_server_requests_total{plugin="$plugin"}[5m])
  )
)
```

### HTTP Details: p99 latency by controller (requires $plugin variable)

```promql
histogram_quantile(0.99,
  sum by (controller, le) (
    rate(http_server_request_duration_seconds_bucket{plugin="$plugin"}[5m])
  )
)
```

### Plugin Response Times: Multi-percentile trend (requires $plugin variable)

```promql
# p50
histogram_quantile(0.50, sum by (le) (rate(http_server_request_duration_seconds_bucket{plugin="$plugin"}[5m])))

# p90
histogram_quantile(0.90, sum by (le) (rate(http_server_request_duration_seconds_bucket{plugin="$plugin"}[5m])))

# p99
histogram_quantile(0.99, sum by (le) (rate(http_server_request_duration_seconds_bucket{plugin="$plugin"}[5m])))
```

### Plugin Response Times: Slowest actions table (requires $plugin variable)

```promql
topk(10,
  sum by (controller, action) (
    rate(http_server_request_duration_seconds_sum{plugin="$plugin"}[5m])
  )
  /
  sum by (controller, action) (
    rate(http_server_request_duration_seconds_count{plugin="$plugin"}[5m])
  )
)
```

### Plugin comparison: p95 across all plugins

```promql
histogram_quantile(0.95,
  sum by (plugin, le) (
    rate(http_server_request_duration_seconds_bucket{plugin!=""}[5m])
  )
)
```

---

**Last updated:** June 22, 2026
**Known issues:** `http_server_exceptions_total` broken; Plutono "Plugin Response Times" dashboard broken (unfiltered query on load)
