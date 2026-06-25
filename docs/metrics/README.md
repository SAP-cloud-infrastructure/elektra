# Elektra Metrics Documentation

**Last updated:** June 25, 2026

---

## Overview

Elektra collects two types of metrics to monitor application health and user behavior:

### 1. [Performance Metrics](./performance.md)

**What:** HTTP request/response telemetry  
**Purpose:** Monitor application performance, latency, and errors  
**Middleware:** `HttpMetricsCollectorMiddleware`, `SLIMetricsMiddleware`

**Key metrics:**
- `elektra_sli` - Request duration histogram
- `http_server_requests_total` - Request counter with 9 labels
- `http_server_request_duration_seconds` - Response time histogram
- `http_server_exceptions_total` - Exception counter

**Use cases:**
- SLI/SLO tracking
- Performance debugging
- Error rate monitoring
- Per-plugin latency analysis

---

### 2. [Session Metrics](./session.md)

**What:** Anonymous user activity tracking  
**Purpose:** Understand user behavior and feature adoption  
**Middleware:** `AnonymousSessionMetricsMiddleware`

**Key metrics:**
- `dashboard_active_browser_hours_total` - Active browser instances per hour
- `dashboard_feature_usage_total` - Feature access counts
- `dashboard_feature_transitions_total` - Navigation flow
- `dashboard_cross_navigation_total` - Elektra ↔ Aurora switches
- `dashboard_session_duration_seconds` - Session duration histogram

**Use cases:**
- Daily/Weekly Active Users (DAU/WAU)
- Feature usage analysis
- Aurora adoption tracking
- User journey mapping

---

## Middleware Stack

All metrics middleware runs before the Rails application:

```
Incoming request
       ↓
AnonymousSessionMetricsMiddleware  ← session tracking
       ↓
HttpMetricsCollectorMiddleware     ← http_server_* metrics
       ↓
SLIMetricsMiddleware               ← elektra_sli metric
       ↓
HttpMetricsExporterMiddleware      ← serves /metrics endpoint
       ↓
Rails application
```

**Order matters:**
1. **AnonymousSessionMetricsMiddleware** runs first to track session context
2. **HttpMetricsCollectorMiddleware** records detailed HTTP metrics
3. **SLIMetricsMiddleware** records simplified SLI metrics
4. **HttpMetricsExporterMiddleware** exposes all metrics at `/metrics`

---

## Privacy & Security

### Performance Metrics
- ✅ No PII - only HTTP metadata (method, status, host, controller, action)
- ✅ Domain/project IDs included (organizational units, not personal data)
- ✅ High-cardinality labels require filtering to avoid Prometheus overload

### Session Metrics
- ✅ No PII - no user IDs, emails, or IP addresses
- ✅ Cookie-based deduplication (24-hour expiry)
- ✅ Tracks browser instances, not individuals
- ✅ HttpOnly, Secure, SameSite=Lax cookies

---

## Quick Links

- [Performance Metrics Implementation →](./performance.md)
- [Session Metrics Implementation →](./session.md)
- [Prometheus Endpoint](../../config/routes.rb) - `/metrics`
- [Middleware Configuration](../../config/application.rb)

---

## Testing

**Performance Metrics Tests:**
- `spec/middleware/http_metrics_collector_middleware_spec.rb`
- `spec/middleware/sli_metrics_middleware_spec.rb`

**Session Metrics Tests:**
- `spec/middleware/anonymous_session_metrics_middleware_spec.rb`

Run all metrics tests:
```bash
bundle exec rspec spec/middleware/
```
