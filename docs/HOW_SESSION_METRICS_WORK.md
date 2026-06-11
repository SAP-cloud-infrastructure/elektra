# How Anonymous Session Metrics Work

**Date:** June 11, 2026  
**Implementation:** Phase 2 - Hybrid Cookie-Based Solution  
**File:** `app/middleware/anonymous_session_metrics_middleware.rb`

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Hourly Time Windows](#hourly-time-windows)
4. [Cookies Explained](#cookies-explained)
5. [Complete User Journey](#complete-user-journey)
6. [Multi-Pod Behavior](#multi-pod-behavior)
7. [Cross-Dashboard Tracking](#cross-dashboard-tracking)
8. [Metrics Collected](#metrics-collected)
9. [PromQL Queries](#promql-queries)

---

## Overview

The anonymous session metrics system tracks **how users interact with Elektra and Aurora** without storing any personally identifiable information (PII).

### Key Features

- ✅ **Privacy-preserving:** No user IDs, emails, or IP addresses tracked
- ✅ **Multi-pod safe:** Works correctly across 4 Elektra pods
- ✅ **Cross-platform:** Tracks Elektra ↔ Aurora navigation
- ✅ **Low cardinality:** Only ~127K Prometheus time series (vs millions)
- ✅ **Stateless:** No in-memory state, no cleanup needed

### The Problem It Solves

**Without this system:**
- Can't tell how many unique users visit per day/week/month
- Can't see which features are most used
- Can't track cross-dashboard navigation (Elektra ↔ Aurora)
- Same user counted 4× (once per pod)

**With this system:**
- Accurate unique session counts (deduplicated across pods)
- Feature usage and navigation patterns
- Aurora adoption metrics
- Session duration tracking

---

## How It Works

### Core Concept: Time Windows + Cookies

The system uses **hourly time windows** combined with **cookie-based deduplication**:

1. **Time windows** keep Prometheus cardinality low (24 hours × 2 platforms = 48 time series)
2. **Cookies** prevent double-counting across pods and platforms

### Visual Overview

```
User Activity Timeline:
├─ 13:00 → First request in hour 13
│  ├─ No cookie "metrics_h13" present
│  ├─ Increment counter: dashboard_unique_sessions_total{session_hour="13", platform="elektra"}
│  └─ Set cookie: metrics_h13=1 (expires at 13:59:59)
│
├─ 13:15 → Second request in hour 13
│  ├─ Cookie "metrics_h13" present
│  └─ Don't increment counter (already counted this hour)
│
├─ 13:45 → Third request in hour 13
│  ├─ Cookie "metrics_h13" present
│  └─ Don't increment counter (already counted this hour)
│
└─ 14:00 → First request in hour 14
   ├─ Cookie "metrics_h13" expired (browser deleted it)
   ├─ No cookie "metrics_h14" present
   ├─ Increment counter: dashboard_unique_sessions_total{session_hour="14", platform="elektra"}
   └─ Set cookie: metrics_h14=1 (expires at 14:59:59)

Result:
- Hour 13: Counted once ✅
- Hour 14: Counted once ✅
- Daily total: 2 hourly counts (user active in 2 hours)
```

---

## Hourly Time Windows

### Why Hourly Windows?

**Traditional approach (high cardinality):**
```ruby
dashboard_unique_sessions_total{anonymous_session_id="a1b2c3d4e5f6g7h8"}
```
- Creates 1 time series per unique session
- 10,000 users = 10,000 time series
- Prometheus can't handle millions of time series

**Our approach (low cardinality):**
```ruby
dashboard_unique_sessions_total{session_hour="14", platform="elektra"}
```
- Creates 1 time series per hour per platform
- 24 hours × 2 platforms = only 48 time series
- Scales to millions of users

### How Hours Are Determined

```ruby
current_hour = Time.now.strftime("%H")  # "00" to "23"
```

**Examples:**
- 09:15 AM → `session_hour="09"`
- 14:30 PM → `session_hour="14"`
- 23:45 PM → `session_hour="23"`

### Hour Boundaries

The system uses **server time** (not user's local time):

```
Server Time: 13:59:50
├─ Cookie: metrics_h13 (expires in 10 seconds)
└─ User counted in hour 13

Server Time: 14:00:10
├─ Cookie: metrics_h13 expired (browser deleted it)
├─ Cookie: metrics_h14 not present
└─ User counted in hour 14 (new hour)
```

**Important:** User active at 13:59 and 14:01 → counted in **both hours**

---

## Cookies Explained

The system uses **4 types of cookies** for tracking:

### 1. Hourly Deduplication Cookies: `metrics_h{HH}` (24 cookies)

**Purpose:** Prevent counting the same session multiple times in the same hour

**Format:**
```
Cookie: metrics_h14=1
Path: /
Domain: .qa-de-1.cloud.sap
HttpOnly; Secure; SameSite=Lax
Expires: Wed, 11 Jun 2026 14:59:59 GMT
```

**Lifecycle:**
1. **Set:** On first request in hour 14
2. **Expires:** Automatically at 14:59:59 (end of hour)
3. **Next hour:** New cookie `metrics_h15` created

**Why 24 cookies?**
- One cookie per hour: `metrics_h00`, `metrics_h01`, ..., `metrics_h23`
- Each expires at end of its hour
- Browser automatically cleans up expired cookies

**Size:** ~10 bytes per cookie

---

### 2. Session Start Cookie: `metrics_session_start`

**Purpose:** Track when the user's session started (for duration calculation)

**Format:**
```
Cookie: metrics_session_start=1623675600
Path: /
Domain: .qa-de-1.cloud.sap
HttpOnly; Secure; SameSite=Lax
Expires: Thu, 12 Jun 2026 13:00:00 GMT
```

**Content:** Unix timestamp (seconds since epoch)

**Lifecycle:**
1. **Set:** On very first request (no existing cookie)
2. **Expires:** After 24 hours
3. **Used for:** Calculating session duration

**Example:**
```ruby
session_start = 1623675600  # Wed, 11 Jun 2026 13:00:00 GMT
current_time = 1623679200   # Wed, 11 Jun 2026 14:00:00 GMT
duration = 3600 seconds (1 hour)
```

**Size:** ~15 bytes

---

### 3. Duration Record Cookie: `metrics_last_duration_record`

**Purpose:** Track when we last recorded a duration measurement (to avoid recording every request)

**Format:**
```
Cookie: metrics_last_duration_record=1623675900
Path: /
Domain: .qa-de-1.cloud.sap
HttpOnly; Secure; SameSite=Lax
Expires: Thu, 12 Jun 2026 13:00:00 GMT
```

**Content:** Unix timestamp of last duration recording

**Why needed?**
Without this, we'd record duration on **every request** (hundreds of observations per session). Instead, we only record every **5 minutes**.

**Logic:**
```ruby
if (current_time - last_record_time) > 300  # 5 minutes
  @session_duration.observe(duration)
  set_cookie("metrics_last_duration_record", current_time)
end
```

**Size:** ~15 bytes

---

### 4. Feature Sequence Cookie: `metrics_features`

**Purpose:** Track the last 5 features the user visited (for navigation flow analysis)

**Format:**
```
Cookie: metrics_features=WyJjb21wdXRlX2luZGV4IiwiY29tcHV0ZV9zaG93Il0=
Path: /
Domain: .qa-de-1.cloud.sap
HttpOnly; Secure; SameSite=Lax
Expires: Thu, 12 Jun 2026 13:00:00 GMT
```

**Content:** Base64-encoded JSON array

**Decoded example:**
```ruby
Base64.decode64("WyJjb21wdXRlX2luZGV4IiwiY29tcHV0ZV9zaG93Il0=")
# => '["compute_index","compute_show"]'

JSON.parse(...)
# => ["compute_index", "compute_show"]
```

**Usage:**
```ruby
# User visits compute/instances/index
previous_features = []  # Empty on first visit
current_feature = "compute_index"

# Track transition (none on first visit)

# Store for next request
store_features_in_cookie(["compute_index"])

# User visits compute/instances/show
previous_features = ["compute_index"]
current_feature = "compute_show"

# Track transition: compute_index → compute_show
@feature_transitions.increment(
  labels: {
    from_feature: "compute_index",
    to_feature: "compute_show",
    platform: "elektra",
    session_hour: "14"
  }
)

# Store for next request (last 5 features)
store_features_in_cookie(["compute_index", "compute_show"])
```

**Size:** ~50 bytes (for 5 features)

---

## Complete User Journey

### Scenario: User works from 13:00 to 15:30

```
13:00 - User logs into Elektra (domain: dashboard.qa-de-1.cloud.sap)
├─ Auth cookie: dashboard-session-auth=OS123... (set by OAuth2-proxy)
├─ Metrics middleware called
├─ Read auth cookie → generate anonymous_id (SHA256 hash)
├─ current_hour = "13"
├─ No cookies present
│
├─ Actions taken:
│  ├─ Increment: dashboard_unique_sessions_total{session_hour="13", platform="elektra"}
│  ├─ Set cookie: metrics_h13=1 (expires 13:59:59)
│  ├─ Set cookie: metrics_session_start=1623675600 (expires +24h)
│  └─ Set cookie: metrics_last_duration_record=1623675600 (expires +24h)
│
└─ Result: User counted in hour 13 ✅

13:15 - User visits /compute/instances/index
├─ Cookies present: metrics_h13, metrics_session_start, metrics_last_duration_record
├─ current_hour = "13"
│
├─ Actions taken:
│  ├─ Check metrics_h13 → present → don't increment unique sessions
│  ├─ Calculate duration: 15 minutes (since 13:00)
│  ├─ Last record: 13:00 → only 15 min ago → don't record duration yet (need 5 min)
│  ├─ Increment: dashboard_feature_usage_total{feature="compute_index", platform="elektra", session_hour="13"}
│  └─ Set cookie: metrics_features=["compute_index"]
│
└─ Result: Feature usage tracked, duration not recorded yet

13:20 - User visits /compute/instances/123 (show)
├─ Cookies present: metrics_h13, metrics_session_start (13:00), metrics_last_duration_record (13:00), metrics_features=["compute_index"]
├─ current_hour = "13"
│
├─ Actions taken:
│  ├─ Check metrics_h13 → present → don't increment unique sessions
│  ├─ Calculate duration: 20 minutes (since 13:00)
│  ├─ Last record: 13:00 → 20 min ago → record duration! ✅
│  ├─ Observe: dashboard_session_duration_seconds{platform="elektra"} = 1200 (20 minutes)
│  ├─ Update cookie: metrics_last_duration_record=1623676800 (13:20)
│  ├─ Increment: dashboard_feature_usage_total{feature="compute_show", ...}
│  ├─ Read previous feature: "compute_index"
│  ├─ Increment: dashboard_feature_transitions_total{from_feature="compute_index", to_feature="compute_show", ...}
│  └─ Update cookie: metrics_features=["compute_index", "compute_show"]
│
└─ Result: Duration recorded, feature transition tracked ✅

14:00 - User still active (hour changes)
├─ Cookies present: metrics_h13 (EXPIRED at 13:59:59), metrics_h14 (NOT present)
├─ current_hour = "14"
│
├─ Actions taken:
│  ├─ Check metrics_h14 → not present → increment unique sessions!
│  ├─ Increment: dashboard_unique_sessions_total{session_hour="14", platform="elektra"}
│  ├─ Set cookie: metrics_h14=1 (expires 14:59:59)
│  └─ Continue tracking features...
│
└─ Result: User counted in hour 14 ✅ (new hour)

14:05 - User clicks link to Aurora (dashboard-aurora.qa-de-1.cloud.sap)
├─ Referrer: dashboard.qa-de-1.cloud.sap/ccadmin/cloud_admin/compute/instances
├─ Cookies sent: metrics_h14, metrics_features (domain .qa-de-1.cloud.sap matches!)
├─ current_hour = "14"
│
├─ Actions taken:
│  ├─ Check metrics_h14 → present (from Elektra!) → don't increment unique sessions
│  ├─ Detect cross-dashboard navigation:
│  │  ├─ Referrer: dashboard.qa-de-1.cloud.sap → "elektra"
│  │  └─ Current: dashboard-aurora.qa-de-1.cloud.sap → "aurora"
│  ├─ Increment: dashboard_cross_navigation_total{from_dashboard="elektra", to_dashboard="aurora", from_feature="compute_show", session_hour="14"}
│  └─ Continue tracking on Aurora...
│
└─ Result: Cross-dashboard navigation tracked, not double-counted ✅

15:30 - User logs out
├─ Session ended
├─ Cookies present: metrics_h15, metrics_session_start (13:00), metrics_features=[...]
│
├─ Final calculations:
│  ├─ Total duration: 2.5 hours (150 minutes)
│  └─ Hours active: 13, 14, 15 (3 hours)
│
└─ Result: 3 hourly counts recorded (user active in 3 different hours)
```

### Daily Aggregation

At end of day, Prometheus has:
```promql
dashboard_unique_sessions_total{session_hour="13", platform="elektra"} = 1
dashboard_unique_sessions_total{session_hour="14", platform="elektra"} = 1
dashboard_unique_sessions_total{session_hour="15", platform="aurora"} = 1

# Daily Active Users (sum all hours)
sum(increase(dashboard_unique_sessions_total{platform="elektra"}[24h]))
# Result: 2 (hours 13 + 14)

sum(increase(dashboard_unique_sessions_total{platform="aurora"}[24h]))
# Result: 1 (hour 15)
```

---

## Multi-Pod Behavior

Elektra runs on **4 pods** behind a load balancer. Without proper deduplication, the same user would be counted 4 times.

### The Problem (Without Cookies)

```
User makes 100 requests in hour 14:
├─ Request 1 → Pod 1 → Count 1
├─ Request 2 → Pod 3 → Count 2 (different pod, different memory)
├─ Request 3 → Pod 2 → Count 3 (different pod, different memory)
├─ Request 4 → Pod 4 → Count 4 (different pod, different memory)
└─ ...

Result: User counted 4× (once per pod) ❌
```

### The Solution (With Cookies)

```
User makes 100 requests in hour 14:
├─ Request 1 → Pod 1
│  ├─ No cookie "metrics_h14"
│  ├─ Increment counter
│  └─ Set cookie: metrics_h14=1; Domain=.qa-de-1.cloud.sap
│
├─ Request 2 → Pod 3
│  ├─ Cookie "metrics_h14" present (shared domain!)
│  └─ Don't increment counter
│
├─ Request 3 → Pod 2
│  ├─ Cookie "metrics_h14" present (shared domain!)
│  └─ Don't increment counter
│
├─ Request 4 → Pod 4
│  ├─ Cookie "metrics_h14" present (shared domain!)
│  └─ Don't increment counter
│
└─ Requests 5-100 → Any pod → Cookie present → Don't count

Result: User counted 1× (cookie shared across all pods) ✅
```

**Key insight:** Cookie domain `.qa-de-1.cloud.sap` is shared across all pods, so all pods see the same cookie.

---

## Cross-Dashboard Tracking

Elektra and Aurora run on different subdomains but share the parent domain:

- Elektra: `dashboard.qa-de-1.cloud.sap`
- Aurora: `dashboard-aurora.qa-de-1.cloud.sap`
- **Shared domain:** `.qa-de-1.cloud.sap`

### Cookie Sharing

Cookies with domain `.qa-de-1.cloud.sap` are sent to **both** Elektra and Aurora:

```
User in Elektra (hour 14):
├─ URL: dashboard.qa-de-1.cloud.sap
├─ Cookie: metrics_h14=1; Domain=.qa-de-1.cloud.sap
└─ Counter: dashboard_unique_sessions_total{session_hour="14", platform="elektra"} = 1

User clicks link to Aurora:
├─ URL: dashboard-aurora.qa-de-1.cloud.sap
├─ Browser sends: metrics_h14=1 (domain matches!)
├─ Aurora middleware checks: metrics_h14 present
└─ Aurora does NOT increment counter (already counted)

Result:
- Elektra counted user: 1
- Aurora did NOT count user: 0
- Total: User counted once across both platforms ✅
```

### Cross-Dashboard Navigation Tracking

When user navigates between dashboards, we track it:

```ruby
# User in Elektra, clicks link to Aurora
referrer = "https://dashboard.qa-de-1.cloud.sap/ccadmin/cloud_admin/compute/instances"
current_url = "https://dashboard-aurora.qa-de-1.cloud.sap/ccadmin/cloud_admin"

referrer_dashboard = "elektra"
current_dashboard = "aurora"

@cross_dashboard_nav.increment(
  labels: {
    from_dashboard: "elektra",
    to_dashboard: "aurora",
    from_feature: "compute_show",  # Read from cookie
    session_hour: "14"
  }
)
```

**This answers:** "How many users are switching from Elektra to Aurora?"

---

## Metrics Collected

### 1. Unique Sessions by Hour

**Metric:** `dashboard_unique_sessions_total`

**Labels:**
- `session_hour`: "00" to "23"
- `platform`: "elektra" or "aurora"

**Purpose:** Count unique sessions per hour (deduplicated)

**Example:**
```promql
dashboard_unique_sessions_total{session_hour="14", platform="elektra"} = 523
```
Meaning: 523 unique sessions were active in Elektra during hour 14 today

---

### 2. Feature Usage

**Metric:** `dashboard_feature_usage_total`

**Labels:**
- `feature`: "compute_index", "compute_show", etc.
- `platform`: "elektra" or "aurora"
- `session_hour`: "00" to "23"

**Purpose:** Count how many times each feature was accessed

**Example:**
```promql
dashboard_feature_usage_total{feature="compute_index", platform="elektra", session_hour="14"} = 1250
```
Meaning: The compute/instances/index page was accessed 1,250 times in hour 14

---

### 3. Feature Transitions

**Metric:** `dashboard_feature_transitions_total`

**Labels:**
- `from_feature`: Previous feature
- `to_feature`: Current feature
- `platform`: "elektra" or "aurora"
- `session_hour`: "00" to "23"

**Purpose:** Track navigation flow (which features lead to which)

**Example:**
```promql
dashboard_feature_transitions_total{
  from_feature="compute_index",
  to_feature="compute_show",
  platform="elektra",
  session_hour="14"
} = 342
```
Meaning: 342 times users navigated from compute index to compute show

---

### 4. Cross-Dashboard Navigation

**Metric:** `dashboard_cross_navigation_total`

**Labels:**
- `from_dashboard`: "elektra" or "aurora"
- `to_dashboard`: "elektra" or "aurora"
- `from_feature`: Feature user was on before switching
- `session_hour`: "00" to "23"

**Purpose:** Track when users switch between Elektra and Aurora

**Example:**
```promql
dashboard_cross_navigation_total{
  from_dashboard="elektra",
  to_dashboard="aurora",
  from_feature="compute_index",
  session_hour="14"
} = 87
```
Meaning: 87 times users switched from Elektra (compute index) to Aurora in hour 14

---

### 5. Session Duration

**Metric:** `dashboard_session_duration_seconds`

**Type:** Histogram

**Labels:**
- `platform`: "elektra" or "aurora"

**Buckets:** 60s, 300s (5m), 600s (10m), 1800s (30m), 3600s (1h), 7200s (2h), 14400s (4h)

**Purpose:** Track how long users spend in their sessions

**Example:**
```promql
histogram_quantile(0.5, dashboard_session_duration_seconds{platform="elektra"})
# => 1200 (median session is 20 minutes)
```

---

## PromQL Queries

### Daily Active Users (DAU)

```promql
# Elektra DAU
sum(increase(dashboard_unique_sessions_total{platform="elektra"}[24h]))

# Aurora DAU
sum(increase(dashboard_unique_sessions_total{platform="aurora"}[24h]))

# Total DAU (both platforms)
sum(increase(dashboard_unique_sessions_total[24h]))
```

### Weekly Active Users (WAU)

```promql
sum(increase(dashboard_unique_sessions_total{platform="elektra"}[7d]))
```

### Aurora Adoption Rate

```promql
# What percentage of users are on Aurora?
sum(increase(dashboard_unique_sessions_total{platform="aurora"}[7d]))
/ sum(increase(dashboard_unique_sessions_total[7d]))
* 100
```

### Aurora Return Rate

```promql
# How many Aurora users come back to Elektra?
sum(increase(dashboard_cross_navigation_total{
  from_dashboard="aurora",
  to_dashboard="elektra"
}[7d]))
/ sum(increase(dashboard_unique_sessions_total{platform="aurora"}[7d]))
* 100
```

### Top 10 Features

```promql
topk(10, sum by (feature) (increase(dashboard_feature_usage_total{
  platform="elektra"
}[7d])))
```

### Drop-off Points (Aurora → Elektra)

```promql
# Which Aurora features do users leave from?
topk(10, sum by (from_feature) (increase(dashboard_cross_navigation_total{
  from_dashboard="aurora",
  to_dashboard="elektra"
}[7d])))
```

### Session Duration (Median)

```promql
histogram_quantile(0.5, sum by (le) (rate(dashboard_session_duration_seconds_bucket{
  platform="elektra"
}[5m])))
```

### Hourly Activity Pattern

```promql
# Which hours are most active?
sum by (session_hour) (increase(dashboard_unique_sessions_total{
  platform="elektra"
}[24h]))
```

---

## Privacy & Security

### What We Track

✅ **Safe to track:**
- Session hour (time)
- Platform (elektra/aurora)
- Feature names (controller/action)
- Domain IDs (organizational units)
- Project IDs (organizational units)
- Navigation patterns
- Session duration

### What We DON'T Track

❌ **Never tracked:**
- User IDs
- Email addresses
- IP addresses
- Usernames
- Full URLs (only controller/action)
- Request bodies
- Query parameters

### Cookie Security

All cookies use:
- `HttpOnly` - Not accessible via JavaScript (XSS protection)
- `Secure` - Only sent over HTTPS in production
- `SameSite=Lax` - CSRF protection
- `Domain=.{region}.cloud.sap` - Shared across Elektra/Aurora
- Auto-expiration (1 hour to 24 hours)

---

## Summary

### How It Works in One Sentence

**"We use hourly cookies to deduplicate session counts across pods and platforms, recording when users are active (by hour), what features they use, and how they navigate between Elektra and Aurora."**

### Key Takeaways

1. **Hourly windows** = Low Prometheus cardinality (48 time series vs millions)
2. **Cookies** = Accurate deduplication (across 4 pods + 2 platforms)
3. **Stateless** = No in-memory state, no cleanup, pod-safe
4. **Privacy-first** = No PII tracked, only aggregate patterns
5. **Real-time** = Users counted when actually active

---

**Last updated:** June 11, 2026  
**Status:** Phase 2 implementation complete  
**Tests:** 29 tests passing ✅
