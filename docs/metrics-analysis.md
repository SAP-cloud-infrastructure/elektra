# Elektra Metrics Analysis: Current State & Perses Migration Notes

## Scope

Covers the three working Elektra metrics that are candidates for Perses dashboard migration.
`http_server_exceptions_total` is excluded — broken at the middleware level, not a dashboard issue.
`elektra_open_inquiry_metrics` is excluded — confirmed out of scope per task description.

---

## 1. `elektra_sli` — Request Duration SLI

**Type:** Histogram  
**Labels:** `path`, `method`  
**Source:** `app/middleware/sli_metrics_middleware.rb`

### What it measures

Wall-clock request duration for every HTTP request to Elektra, grouped by the first URL path segment (`path` label) and HTTP method (`method` label). The `path` label is **not** a URL path — it is the plugin name extracted from the first segment:

- `/compute/v2/projects/abc/servers` → `path="compute"`
- `/networking/v2/routers` → `path="networking"`
- `/` → `path="root"`

Excluded from measurement: `/metrics`, `/assets/*`, `/system/*`.

### Implementation findings

| Finding | Detail |
|---|---|
| Label name misleading | `path` contains plugin name, not URL path. Causes misleading Plutono panel title "Current response time of landing page" — it actually measures all requests to a plugin. |
| Bucket boundaries wrong | Uses Prometheus default buckets: `[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]`. 9 of 14 buckets are below 250ms. Elektra proxies OpenStack APIs which regularly take 1–5s. Resolution is low exactly where it matters. |
| Wall-clock time | `Benchmark.realtime` measures user-perceived latency including I/O and external API wait — correct for SLI purposes. |
| No status code label | A 500 response at 50ms is indistinguishable from a 200 at 50ms. SLI calculations should ideally exclude or separate errors. |
| SLO threshold | Plutono uses 250ms as the quality threshold (`le="0.25"`). This is too tight for an OpenStack API proxy where 1–2s is typical for backend-dependent pages. |

### Current Plutono panels (7 panels, 4 working / 2 broken / 1 misleading)

| Panel | Status | Notes |
|---|---|---|
| Current response time | ✅ Working | Title says "landing page" but measures all plugins |
| Quality (< 250ms) | ✅ Working | 250ms threshold likely wrong for this app |
| Response latency | ✅ Working | Correct — p50/p90/p99 breakdown |
| Load (req/sec) | ✅ Working | Uses `elektra_sli_count` rate |
| Exception rate 24h | ❌ Broken | References `http_server_exceptions_total` (separate broken metric) |
| Exception rate graph | ❌ Broken | Same cause |

### Recommended PromQL for Perses

```promql
# p95 latency per plugin — rename legend label from "path" to "plugin"
histogram_quantile(0.95,
  sum by (path, le) (
    rate(elektra_sli_bucket[5m])
  )
)

# SLO compliance: % of requests completing under 2s (more realistic threshold)
sum by (path) (rate(elektra_sli_bucket{le="2.5"}[5m]))
/
sum by (path) (rate(elektra_sli_count[5m]))

# Throughput per plugin
sum by (path, method) (rate(elektra_sli_count[5m]))
```

### Recommended fixes before Perses migration

1. **Rename label** `path` → `plugin` in the middleware (breaking change — update dashboard at the same time).
2. **Replace histogram buckets** with API-proxy-appropriate values:
   ```ruby
   buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
   ```
3. **Fix SLO threshold** — agree with team on realistic target (suggest `le="2.5"` for p95).
4. **Fix panel title** — "Current response time of landing page" → "p95 response time by plugin".
5. **Drop exception panels** from Perses until `http_server_exceptions_total` is fixed.

---

## 2. `http_server_requests_total` — HTTP Request Counter

**Type:** Counter  
**Labels:** `code`, `method`, `host`, `domain`, `project`, `controller`, `action`, `plugin`, `xhr`  
**Source:** `app/middleware/http_metrics_collector_middleware.rb`

### What it measures

Total HTTP request count for every request to Elektra, with 9 labels providing full breakdown by response code, method, host, OpenStack domain/project, Rails controller/action, plugin, and whether the request was XHR.

### Implementation findings

| Finding | Detail |
|---|---|
| Debug code in production | `# byebug` and `# pp custom_labels` left as commented-out lines (lines 49–52). Dead code, should be removed. |
| Silent error swallowing | `rescue => e` with `pp` output. Metrics recording failures are swallowed and printed to stdout. Should use structured logging. |
| High cardinality confirmed | `domain` (100s of values) × `project` (1000s) × `controller` (50–100) × `action` (200–300) = 10K–100K+ time series. Prometheus returns "too many samples" on unfiltered queries. |
| Empty string fallback | `domain`, `project`, `controller`, `action`, `plugin` fall back to `""` when not set. This is correct — avoids label cardinality explosion from nil values. |
| `plugin` resolution | Uses `Core::PluginsManager.has?(plugin_name)` — only sets plugin label when the plugin is registered. Unknown paths get `plugin=""`. |
| `host` label | Includes the full hostname. In a multi-region deployment this adds cardinality but enables per-region filtering. |

### Current Plutono panels

The **Elektra HTTP Details** dashboard (P1) uses this metric with `$plugin` template variable to create one repeating row per plugin:
- HTTP requests by status code and action (filtered by plugin)
- HTTP request latencies by method (filtered by plugin)

Both panels work correctly **when a plugin filter is applied**. Unfiltered queries fail with "too many samples".

The **Elektra HTTP Plugin Response Times** dashboard (P1) is broken — loads indefinitely. Root cause is likely an unfiltered query on `http_server_request_duration_seconds` (same metric family, see below) without a plugin variable pre-applied on load.

### Recommended PromQL for Perses

```promql
# Request rate by status class, filtered by plugin (always require plugin label)
sum by (code) (
  rate(http_server_requests_total{plugin="$plugin"}[5m])
)

# Error rate per plugin
sum(rate(http_server_requests_total{plugin="$plugin", code=~"5.."}[5m]))
/
sum(rate(http_server_requests_total{plugin="$plugin"}[5m]))

# Top controllers by request volume (filtered by plugin)
topk(10,
  sum by (controller, action) (
    rate(http_server_requests_total{plugin="$plugin"}[5m])
  )
)

# XHR vs non-XHR split
sum by (xhr) (rate(http_server_requests_total{plugin="$plugin"}[5m]))
```

### Requirements for Perses

- **Always require `plugin` variable** — never render panels without a plugin filter applied. Set a default plugin value (e.g., `"compute"`) so the dashboard is never blank on load.
- **Add `host` variable** for multi-region filtering.
- Drop unfiltered panels entirely.

---

## 3. `http_server_request_duration_seconds` — HTTP Response Time Histogram

**Type:** Histogram  
**Labels:** `code`, `method`, `host`, `domain`, `project`, `controller`, `action`, `plugin`, `xhr`  
**Source:** `app/middleware/http_metrics_collector_middleware.rb` (same middleware as counter above)

### What it measures

HTTP response duration histogram for every request, with the same 9 labels as `http_server_requests_total`. Recorded together in the same `record()` call — the two metrics are always in sync.

### Implementation findings

Same findings as the counter above (debug code, silent error swallowing, high cardinality, empty string fallbacks). Additionally:

| Finding | Detail |
|---|---|
| Default histogram buckets | Same issue as `elektra_sli` — default buckets have too many sub-250ms buckets, too few in the 1–10s range where OpenStack API calls land. |
| No custom buckets defined | `@registry.histogram(...)` called with no `buckets:` argument. Both histograms in this middleware use defaults. |
| Shares all cardinality problems | Because it carries all 9 labels, this histogram has even higher cardinality than `elektra_sli`. Querying without a plugin filter causes the "too many samples" browser hang documented in the presentation. |

### Current Plutono panels

The **Elektra HTTP Plugin Response Times** dashboard uses this metric for per-plugin latency trends. It is broken (loads indefinitely), almost certainly because the dashboard either:
- Has no default plugin variable value, causing the initial query to run unfiltered, or
- Uses a query pattern like `histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket[5m]))` with no label filter

### Recommended PromQL for Perses

```promql
# p50/p90/p99 per plugin — always filter by plugin
histogram_quantile(0.99,
  sum by (le) (
    rate(http_server_request_duration_seconds_bucket{plugin="$plugin"}[5m])
  )
)

# Latency heatmap by controller (for HTTP Details view)
sum by (controller, le) (
  rate(http_server_request_duration_seconds_bucket{plugin="$plugin"}[5m])
)

# Average duration per action (quick overview)
sum by (controller, action) (
  rate(http_server_request_duration_seconds_sum{plugin="$plugin"}[5m])
)
/
sum by (controller, action) (
  rate(http_server_request_duration_seconds_count{plugin="$plugin"}[5m])
)
```

### Requirements for Perses

- Same as counter: **always require `plugin` variable**, never unfiltered.
- Fix histogram buckets in the middleware (same fix as `elektra_sli`):
  ```ruby
  buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0]
  ```
- Consider whether 9 labels are all needed. `domain` and `project` are the main cardinality drivers. If per-domain/project performance analysis is not a use case, dropping those two labels would reduce cardinality by ~100x.

---

## Cross-cutting issues to fix before Perses migration

| Issue | Affects | Fix |
|---|---|---|
| Debug code (`byebug`, `pp`) in production middleware | `http_server_requests_total`, `http_server_request_duration_seconds` | Remove lines 49–52 in `http_metrics_collector_middleware.rb` |
| Silent error swallowing with `pp` | Both HTTP metrics | Replace with proper logging: `Rails.logger.error` |
| Default histogram buckets | `elektra_sli`, `http_server_request_duration_seconds` | Set explicit buckets suited to 0.05–30s range |
| Misleading `path` label name | `elektra_sli` | Rename to `plugin` |
| Unfiltered queries cause browser hang | Both HTTP metrics | Enforce plugin variable in all Perses panels |
| Exception panels cannot be migrated | `elektra_sli` dashboard | Fix `http_server_exceptions_total` first (separate task) |

---

## Perses dashboard plan

### Dashboard 1: Elektra SLI (P0)
Migrate 4 working panels. Drop 2 broken exception panels until metric is fixed.

| Panel | Metric | PromQL approach |
|---|---|---|
| p95 latency by plugin | `elektra_sli` | `histogram_quantile(0.95, sum by (path, le)(rate(...[5m])))` |
| SLO compliance % | `elektra_sli` | `rate(bucket{le="2.5"}[5m]) / rate(count[5m])` — update threshold from 250ms to 2.5s |
| Latency percentile trends | `elektra_sli` | p50 + p90 + p99 lines |
| Throughput (req/sec) | `elektra_sli` | `sum by (path)(rate(elektra_sli_count[5m]))` |

### Dashboard 2: Elektra HTTP Details (P1)
Migrate with mandatory `$plugin` variable. Add `$host` variable for multi-region.

| Panel | Metric | PromQL approach |
|---|---|---|
| Request rate by status code | `http_server_requests_total` | Filtered by `plugin="$plugin"` |
| Error rate | `http_server_requests_total` | `code=~"5.."` / total, filtered by plugin |
| Top controllers by volume | `http_server_requests_total` | `topk(10, sum by(controller, action)(...))` |
| p95 latency by controller | `http_server_request_duration_seconds` | `histogram_quantile(0.95, sum by(controller, le)(...))` |
| XHR breakdown | `http_server_requests_total` | `sum by(xhr)(...)` |

### Dashboard 3: Elektra HTTP Plugin Response Times (P1)
Rebuild from scratch — current Plutono version is broken. Use `$plugin` variable with a default value.

| Panel | Metric | PromQL approach |
|---|---|---|
| Latency trend (p50/p90/p99) | `http_server_request_duration_seconds` | Three lines, filtered by plugin |
| Latency heatmap | `http_server_request_duration_seconds` | Bucket breakdown over time |
| Slowest actions | `http_server_request_duration_seconds` | Average duration by controller/action |
