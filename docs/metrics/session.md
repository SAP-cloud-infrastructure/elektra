# How Anonymous Session Metrics Work

[← Back to Metrics Overview](./README.md)

**Date:** June 11, 2026  
**Implementation:** Phase 2 - Hybrid Cookie-Based Solution  
**File:** `app/middleware/anonymous_session_metrics_middleware.rb`  
**Tests:** `spec/middleware/anonymous_session_metrics_middleware_spec.rb`

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
- Can't tell how many active browser instances visit per day/week/month
- Can't see which features are most used
- Can't track cross-dashboard navigation (Elektra ↔ Aurora)
- Same browser instance counted 4× (once per pod)

**With this system:**
- Accurate browser-hour counts (deduplicated across pods, not across devices)
- Feature usage and navigation patterns
- Aurora adoption metrics
- Session duration tracking

**Important:** This tracks **active authenticated browser instances**, not unique users:
- Same browser at 13:00 and 14:00 = 2 counts (2 browser-hours)
- Same user on laptop + phone = 2 counts (2 browser instances)
- Same browser across 4 pods = 1 count (cookie deduplication)

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
│  ├─ Cookie metrics_hours doesn't contain "13"
│  ├─ Increment counter: dashboard_active_browser_hours_total{session_hour="13", platform="elektra"}
│  └─ Update cookie: metrics_hours=13 (expires +24h)
│
├─ 13:15 → Second request in hour 13
│  ├─ Cookie metrics_hours=13 (contains "13")
│  └─ Don't increment counter (already counted this hour)
│
├─ 13:45 → Third request in hour 13
│  ├─ Cookie metrics_hours=13 (contains "13")
│  └─ Don't increment counter (already counted this hour)
│
└─ 14:00 → First request in hour 14
   ├─ Cookie metrics_hours=13 (doesn't contain "14")
   ├─ Increment counter: dashboard_active_browser_hours_total{session_hour="14", platform="elektra"}
   └─ Update cookie: metrics_hours=13,14 (expires +24h)

Result:
- Hour 13: Counted once ✅
- Hour 14: Counted once ✅
- Daily total: 2 hourly counts (browser active in 2 hours)
```

---

## Hourly Time Windows

### Why Hourly Windows?

**Traditional approach (high cardinality):**
```ruby
dashboard_active_browser_hours_total{anonymous_session_id="a1b2c3d4e5f6g7h8"}
```
- Creates 1 time series per unique session
- 10,000 users = 10,000 time series
- Prometheus can't handle millions of time series

**Our approach (low cardinality):**
```ruby
dashboard_active_browser_hours_total{session_hour="14", platform="elektra"}
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
├─ Cookie: metrics_hours=13
└─ Browser counted in hour 13

Server Time: 14:00:10
├─ Cookie: metrics_hours=13 (doesn't contain "14")
└─ Browser counted in hour 14 (new hour added)
└─ Cookie updated to: metrics_hours=13,14
```

**Important:** Browser active at 13:59 and 14:01 → counted in **both hours**

---

## Cookies Explained

The system uses **2 cookies** for tracking (consolidated from previous 27-cookie approach):

### 1. Visited Hours Cookie: `metrics_hours`

**Purpose:** Track which hours the user has been active in (replaces 24 separate hourly cookies)

**Format:**
```
Cookie: metrics_hours=14,15,16
Path: /
Domain: .parent-domain.example
HttpOnly; Secure; SameSite=Lax
Expires: Thu, 12 Jun 2026 14:00:00 GMT
```

**Content:** Comma-separated list of hour strings ("00" to "23")

**Lifecycle:**
1. **Set:** On first request with current hour
2. **Updated:** Each time user visits in a new hour (hour appended to list)
3. **Expires:** After 24 hours (browser auto-cleanup)

**Example progression:**
```
13:00 → Set: metrics_hours=13
14:05 → Update: metrics_hours=13,14
15:30 → Update: metrics_hours=13,14,15
```

**Why comma-separated instead of 24 cookies?**
- Reduces cookie count from 24 to 1
- Still lightweight (~15 bytes for typical session)
- Same deduplication behavior
- Cleaner browser DevTools view

**Size:** ~15 bytes (for typical 3-hour session)

---

### 2. Session Data Cookie: `metrics_session`

**Purpose:** Store all session-related data in one structured cookie (replaces 3 separate cookies)

**Format:**
```
Cookie: metrics_session=eyJzdGFydCI6MTYyMzY3NTYwMCwibGFzdF9kdXIiOjE2MjM2NzU5MDAsImZlYXR1cmVzIjpbImNvbXB1dGVfaW5kZXgiLCJjb21wdXRlX3Nob3ciXX0=
Path: /
Domain: .parent-domain.example
HttpOnly; Secure; SameSite=Lax
Expires: Thu, 12 Jun 2026 13:00:00 GMT
```

**Content:** Base64-encoded JSON object with structure:

```json
{
  "start": 1623675600,
  "last_dur": 1623675900,
  "features": ["compute_index", "compute_show"]
}
```

**Fields:**
- `start` - Unix timestamp when session started (for duration calculation)
- `last_dur` - Unix timestamp of last duration recording (throttles to every 5 minutes)
- `features` - Array of last 5 features visited (for navigation flow analysis)

**Lifecycle:**
1. **Set:** On first request with initial timestamp
2. **Updated:** On each request to update duration timestamp or add features
3. **Expires:** After 24 hours

**Decoded example:**
```ruby
cookie = "eyJzdGFydCI6MTYyMzY3NTYwMCwibGFzdF9kdXIiOjE2MjM2NzU5MDAsImZlYXR1cmVzIjpbImNvbXB1dGVfaW5kZXgiLCJjb21wdXRlX3Nob3ciXX0="

decoded = Base64.decode64(cookie)
# => '{"start":1623675600,"last_dur":1623675900,"features":["compute_index","compute_show"]}'

data = JSON.parse(decoded, symbolize_names: true)
# => {start: 1623675600, last_dur: 1623675900, features: ["compute_index", "compute_show"]}
```

**Usage example:**
```ruby
# User visits compute/instances/index
session_data = {
  start: 1623675600,
  last_dur: 1623675600,
  features: ["compute_index"]
}

# User visits compute/instances/show
session_data = read_session_data(request)
# => {start: 1623675600, last_dur: 1623675600, features: ["compute_index"]}

previous_feature = session_data[:features].last  # "compute_index"
current_feature = "compute_show"

# Track transition: compute_index → compute_show
@feature_transitions.increment(
  labels: {
    last_feature_before_switch: "compute_index",
    to_feature: "compute_show",
    platform: "elektra",
    session_hour: "14"
  }
)

# Update session data (last 5 features)
session_data[:features] = ["compute_index", "compute_show"]
store_session_data(response, session_data, global_domain)
```

**Why consolidate into one cookie?**
- Reduces cookie count from 3 to 1
- Easier to maintain and debug
- Single parse operation per request
- Cleaner separation: hours (simple string) vs session data (structured JSON)

**Size:** ~100 bytes (Base64-encoded JSON with 5 features)

---

## Complete User Journey

### Scenario: User works from 13:00 to 15:30

```
13:00 - User logs into Elektra (domain: dashboard.example.com)
├─ Auth cookie: dashboard-session-auth=OS123... (set by OAuth2-proxy)
├─ Metrics middleware called
├─ Read auth cookie → check session token
├─ current_hour = "13"
├─ No cookies present
│
├─ Actions taken:
│  ├─ Increment: dashboard_active_browser_hours_total{session_hour="13", platform="elektra"}
│  ├─ Set cookie: metrics_hours=13 (expires +24h)
│  └─ Set cookie: metrics_session={"start":1623675600,"last_dur":1623675600,"features":[]} (expires +24h)
│
└─ Result: User counted in hour 13 ✅

13:15 - User visits /compute/instances/index
├─ Cookies present: metrics_hours=13, metrics_session={...}
├─ current_hour = "13"
│
├─ Actions taken:
│  ├─ Check metrics_hours → "13" present → don't increment unique sessions
│  ├─ Calculate duration: 15 minutes (since 13:00)
│  ├─ Last record: 13:00 → only 15 min ago → don't record duration yet (need 5 min)
│  ├─ Increment: dashboard_feature_usage_total{feature="compute_index", platform="elektra", session_hour="13"}
│  └─ Update cookie: metrics_session={..., "features":["compute_index"]}
│
└─ Result: Feature usage tracked, duration not recorded yet

13:20 - User visits /compute/instances/123 (show)
├─ Cookies present: metrics_hours=13, metrics_session={"start":1623675600,"last_dur":1623675600,"features":["compute_index"]}
├─ current_hour = "13"
│
├─ Actions taken:
│  ├─ Check metrics_hours → "13" present → don't increment unique sessions
│  ├─ Calculate duration: 20 minutes (since 13:00)
│  ├─ Last record: 13:00 → 20 min ago → record duration! ✅
│  ├─ Observe: dashboard_session_duration_seconds{platform="elektra"} = 1200 (20 minutes)
│  ├─ Update cookie: metrics_session={..., "last_dur":1623676800}
│  ├─ Increment: dashboard_feature_usage_total{feature="compute_show", ...}
│  ├─ Read previous feature: "compute_index"
│  ├─ Increment: dashboard_feature_transitions_total{last_feature_before_switch="compute_index", to_feature="compute_show", ...}
│  └─ Update cookie: metrics_session={..., "features":["compute_index", "compute_show"]}
│
└─ Result: Duration recorded, feature transition tracked ✅

14:00 - User still active (hour changes)
├─ Cookies present: metrics_hours=13, metrics_session={...}
├─ current_hour = "14"
│
├─ Actions taken:
│  ├─ Check metrics_hours → "14" NOT present → increment unique sessions!
│  ├─ Increment: dashboard_active_browser_hours_total{session_hour="14", platform="elektra"}
│  ├─ Update cookie: metrics_hours=13,14 (expires +24h)
│  └─ Continue tracking features...
│
└─ Result: User counted in hour 14 ✅ (new hour)

14:05 - User clicks link to Aurora (dashboard-aurora.example.com)
├─ Referrer: dashboard.example.com/ccadmin/cloud_admin/compute/instances
├─ Cookies sent: metrics_hours=13,14, metrics_session={...} (domain .example.com matches!)
├─ current_hour = "14"
│
├─ Actions taken:
│  ├─ Check metrics_hours → "14" present (from Elektra!) → don't increment unique sessions
│  ├─ Detect cross-dashboard navigation:
│  │  ├─ Referrer: dashboard.example.com → "elektra"
│  │  └─ Current: dashboard-aurora.example.com → "aurora"
│  ├─ Increment: dashboard_cross_navigation_total{from_dashboard="elektra", to_dashboard="aurora", last_feature_before_switch="compute_show", session_hour="14"}
│  └─ Continue tracking on Aurora...
│
└─ Result: Cross-dashboard navigation tracked, not double-counted ✅

15:30 - User logs out
├─ Session ended
├─ Cookies present: metrics_hours=13,14,15, metrics_session={...}
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
dashboard_active_browser_hours_total{session_hour="13", platform="elektra"} = 1
dashboard_active_browser_hours_total{session_hour="14", platform="elektra"} = 1
dashboard_active_browser_hours_total{session_hour="15", platform="aurora"} = 1

# Daily Active Users (sum all hours)
sum(increase(dashboard_active_browser_hours_total{platform="elektra"}[24h]))
# Result: 2 (hours 13 + 14)

sum(increase(dashboard_active_browser_hours_total{platform="aurora"}[24h]))
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
│  ├─ No "14" in metrics_hours cookie
│  ├─ Increment counter
│  └─ Set cookie: metrics_hours=14; Domain=.example.com
│
├─ Request 2 → Pod 3
│  ├─ Cookie metrics_hours=14 present (shared domain!)
│  └─ Don't increment counter
│
├─ Request 3 → Pod 2
│  ├─ Cookie metrics_hours=14 present (shared domain!)
│  └─ Don't increment counter
│
├─ Request 4 → Pod 4
│  ├─ Cookie metrics_hours=14 present (shared domain!)
│  └─ Don't increment counter
│
└─ Requests 5-100 → Any pod → Cookie present → Don't count

Result: User counted 1× (cookie shared across all pods) ✅
```

**Key insight:** Cookie domain `.example.com` is shared across all pods, so all pods see the same cookie.

---

## Cross-Dashboard Tracking

Elektra and Aurora run on different subdomains but share the parent domain:

- Elektra: `dashboard.example.com`
- Aurora: `dashboard-aurora.example.com`
- **Shared domain:** `.example.com`

### Cookie Sharing

Cookies with domain `.example.com` are sent to **both** Elektra and Aurora:

```
User in Elektra (hour 14):
├─ URL: dashboard.example.com
├─ Cookie: metrics_hours=14; Domain=.example.com
└─ Counter: dashboard_active_browser_hours_total{session_hour="14", platform="elektra"} = 1

User clicks link to Aurora:
├─ URL: dashboard-aurora.example.com
├─ Browser sends: metrics_hours=14 (domain matches!)
├─ Aurora middleware checks: "14" in metrics_hours
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
referrer = "https://dashboard.example.com/ccadmin/cloud_admin/compute/instances"
current_url = "https://dashboard-aurora.example.com/ccadmin/cloud_admin"

referrer_dashboard = "elektra"
current_dashboard = "aurora"

# Read last feature from session cookie
session_data = read_session_data(request)
referrer_feature = session_data[:features].last  # "compute_show"

@cross_dashboard_nav.increment(
  labels: {
    from_dashboard: "elektra",
    to_dashboard: "aurora",
    last_feature_before_switch: referrer_feature,
    session_hour: "14"
  }
)
```

**This answers:** "How many users are switching from Elektra to Aurora?"

---

## Metrics Collected

### 1. Unique Sessions by Hour

**Metric:** `dashboard_active_browser_hours_total`

**Labels:**
- `session_hour`: "00" to "23"
- `platform`: "elektra" or "aurora"

**Purpose:** Count unique sessions per hour (deduplicated)

**Example:**
```promql
dashboard_active_browser_hours_total{session_hour="14", platform="elektra"} = 523
```
Meaning: 523 active authenticated browser instances in Elektra during hour 14 today

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
- `last_feature_before_switch`: Previous feature
- `to_feature`: Current feature
- `platform`: "elektra" or "aurora"
- `session_hour`: "00" to "23"

**Purpose:** Track navigation flow (which features lead to which)

**Example:**
```promql
dashboard_feature_transitions_total{
  last_feature_before_switch="compute_index",
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
- `last_feature_before_switch`: Feature user was on before switching
- `session_hour`: "00" to "23"

**Purpose:** Track when users switch between Elektra and Aurora

**Important:** `last_feature_before_switch` represents the last feature stored in the cookie before the dashboard switch, which may not be the exact feature on the HTTP referrer page. This is a best-effort attribution based on cookie history.

**Example:**
```promql
dashboard_cross_navigation_total{
  from_dashboard="elektra",
  to_dashboard="aurora",
  last_feature_before_switch="compute_index",
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
sum(increase(dashboard_active_browser_hours_total{platform="elektra"}[24h]))

# Aurora DAU
sum(increase(dashboard_active_browser_hours_total{platform="aurora"}[24h]))

# Total DAU (both platforms)
sum(increase(dashboard_active_browser_hours_total[24h]))
```

### Weekly Active Users (WAU)

```promql
sum(increase(dashboard_active_browser_hours_total{platform="elektra"}[7d]))
```

### Aurora Adoption Rate

```promql
# What percentage of users are on Aurora?
sum(increase(dashboard_active_browser_hours_total{platform="aurora"}[7d]))
/ sum(increase(dashboard_active_browser_hours_total[7d]))
* 100
```

### Aurora Return Rate

```promql
# How many Aurora users come back to Elektra?
sum(increase(dashboard_cross_navigation_total{
  from_dashboard="aurora",
  to_dashboard="elektra"
}[7d]))
/ sum(increase(dashboard_active_browser_hours_total{platform="aurora"}[7d]))
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
sum by (session_hour) (increase(dashboard_active_browser_hours_total{
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
- `Domain=.{parent-domain}` - Shared across Elektra/Aurora
- Auto-expiration (24 hours)

### Cookie Storage Size

**Total cookie overhead per session:**
- `metrics_hours`: ~15 bytes (typical 3-hour session)
- `metrics_session`: ~100 bytes (Base64 JSON with 5 features)
- **Total: ~115 bytes** (well under 4KB browser limit)

**Previous approach (27 cookies):**
- 24 hourly cookies: 24 × 10 bytes = 240 bytes
- 3 session cookies: 3 × 15-50 bytes = ~80 bytes
- **Total: ~320 bytes**

**Improvement: 64% reduction in cookie size + cleaner DevTools view**

---

## Summary

### How It Works in One Sentence

**"We use hourly cookies to count active authenticated browser instances across pods and platforms, recording when browsers are active (by hour), what features they use, and how they navigate between Elektra and Aurora."**

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
