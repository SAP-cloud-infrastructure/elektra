# How Anonymous Session Metrics Work

[← Back to Metrics Overview](./README.md)

**Date:** June 25, 2026  
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
│  ├─ Cookie metrics_hours_elektra doesn't contain "13"
│  ├─ Increment counter: dashboard_active_browser_hours_total{session_hour="13", platform="elektra"}
│  └─ Update cookie: metrics_hours_elektra=13 (expires +24h)
│
├─ 13:15 → Second request in hour 13
│  ├─ Cookie metrics_hours_elektra=13 (contains "13")
│  └─ Don't increment counter (already counted this hour)
│
├─ 13:45 → Third request in hour 13
│  ├─ Cookie metrics_hours_elektra=13 (contains "13")
│  └─ Don't increment counter (already counted this hour)
│
└─ 14:00 → First request in hour 14
   ├─ Cookie metrics_hours_elektra=13 (doesn't contain "14")
   ├─ Increment counter: dashboard_active_browser_hours_total{session_hour="14", platform="elektra"}
   └─ Update cookie: metrics_hours_elektra=13,14 (expires +24h)

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

### 1. Visited Hours Cookie: `metrics_hours_elektra` (Platform-Specific)

**Purpose:** Track which hours the user has been active in Elektra (Aurora uses `metrics_hours_aurora`)

**Format:**
```
Cookie: metrics_hours_elektra=14,15,16
Path: /
Domain: .parent-domain.example
HttpOnly; Secure; SameSite=Lax
Expires: Thu, 12 Jun 2026 14:00:00 GMT
```

**Content:** Comma-separated list of hour strings ("00" to "23")

**Platform-Specific Design (PR #2107):**
- Elektra uses: `metrics_hours_elektra`
- Aurora uses: `metrics_hours_aurora`
- **No cross-platform deduplication** - each platform tracks independently
- Prevents session conflicts when users navigate between dashboards

**Lifecycle:**
1. **Set:** On first request with current hour
2. **Updated:** Each time user visits in a new hour (hour appended to list)
3. **Expires:** After 24 hours (browser auto-cleanup)

**Example progression:**
```
13:00 → Set: metrics_hours_elektra=13
14:05 → Update: metrics_hours_elektra=13,14
15:30 → Update: metrics_hours_elektra=13,14,15
```

**Why platform-specific cookies?**
- Each platform tracks its own active browser instances
- User visiting both Elektra AND Aurora in the same hour = 2 counts (intentional)
- No cookie conflicts between platforms
- Clearer adoption metrics (how many use ONLY Elektra vs BOTH)

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
│  ├─ Set cookie: metrics_hours_elektra=13 (expires +24h)
│  └─ Set cookie: metrics_session={"start":1623675600,"last_dur":1623675600,"features":[]} (expires +24h)
│
└─ Result: User counted in hour 13 ✅

13:15 - User visits /compute/instances/index
├─ Cookies present: metrics_hours_elektra=13, metrics_session={...}
├─ current_hour = "13"
│
├─ Actions taken:
│  ├─ Check metrics_hours_elektra → "13" present → don't increment unique sessions
│  ├─ Calculate duration: 15 minutes (since 13:00)
│  ├─ Last record: 13:00 → only 15 min ago → don't record duration yet (need 5 min)
│  ├─ Increment: dashboard_feature_usage_total{feature="compute_index", platform="elektra", session_hour="13"}
│  └─ Update cookie: metrics_session={..., "features":["compute_index"]}
│
└─ Result: Feature usage tracked, duration not recorded yet

13:20 - User visits /compute/instances/123 (show)
├─ Cookies present: metrics_hours_elektra=13, metrics_session={"start":1623675600,"last_dur":1623675600,"features":["compute_index"]}
├─ current_hour = "13"
│
├─ Actions taken:
│  ├─ Check metrics_hours_elektra → "13" present → don't increment unique sessions
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
├─ Cookies present: metrics_hours_elektra=13, metrics_session={...}
├─ current_hour = "14"
│
├─ Actions taken:
│  ├─ Check metrics_hours_elektra → "14" NOT present → increment unique sessions!
│  ├─ Increment: dashboard_active_browser_hours_total{session_hour="14", platform="elektra"}
│  ├─ Update cookie: metrics_hours_elektra=13,14 (expires +24h)
│  └─ Continue tracking features...
│
└─ Result: User counted in hour 14 ✅ (new hour)

14:05 - User clicks link to Aurora with tracking
├─ JavaScript calls: trackOutboundNavigation('object_storage_banner')
├─ POST /metrics/track_outbound
├─ Increment: dashboard_cross_navigation_total{
│    from_dashboard="elektra",
│    to_dashboard="aurora",
│    entry_point="object_storage_banner",
│    last_feature_before_switch="compute_show",
│    session_hour="14"
│  }
├─ User navigates to: dashboard-aurora.example.com
├─ Browser sends: metrics_hours_elektra=13,14 (Aurora ignores this)
└─ Aurora creates: metrics_hours_aurora=14 (separate cookie)

Result:
- Elektra counted user in hour 14: 1 ✅
- Outbound navigation tracked: 1 ✅
- Aurora will count separately with its own cookie ✅

15:30 - User logs out
├─ Session ended
├─ Cookies present: metrics_hours_elektra=13,14, metrics_hours_aurora=14,15, metrics_session={...}
│
├─ Final calculations:
│  ├─ Total duration: 2.5 hours (150 minutes)
│  └─ Elektra hours: 13, 14 (2 hours)
│  └─ Aurora hours: 14, 15 (2 hours)
│
└─ Result: Each platform tracked independently
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
│  ├─ No "14" in metrics_hours_elektra cookie
│  ├─ Increment counter
│  └─ Set cookie: metrics_hours_elektra=14; Domain=.example.com
│
├─ Request 2 → Pod 3
│  ├─ Cookie metrics_hours_elektra=14 present (shared domain!)
│  └─ Don't increment counter
│
├─ Request 3 → Pod 2
│  ├─ Cookie metrics_hours_elektra=14 present (shared domain!)
│  └─ Don't increment counter
│
├─ Request 4 → Pod 4
│  ├─ Cookie metrics_hours_elektra=14 present (shared domain!)
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

### Outbound Navigation Tracking (Via JavaScript API)

**Important:** Cross-dashboard navigation is tracked via the **MetricsTrackingController** (`POST /metrics/track_outbound`), NOT in the middleware's `call` method.

The middleware only **defines** the `dashboard_cross_navigation_total` counter. Actual tracking happens when JavaScript explicitly calls the API endpoint before navigation.

### How It Works

1. **JavaScript detects user will navigate to Aurora:**
   ```javascript
   // elektra_analytics.js
   function trackOutboundNavigation(entryPoint) {
     fetch('/metrics/track_outbound', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         to_dashboard: 'aurora',
         entry_point: entryPoint,
         // Additional context sent by JavaScript
       })
     });
   }
   ```

2. **Controller receives API call:**
   ```ruby
   # MetricsTrackingController#track_outbound
   def track_outbound
     # Extract parameters from request body
     # Increment: dashboard_cross_navigation_total
   end
   ```

3. **Metric is recorded with 5 labels:**
   - `from_dashboard`: "elektra" (detected from request host)
   - `to_dashboard`: "aurora" (from request body)
   - `entry_point`: "object_storage_ceph_banner" (WHERE user clicked)
   - `last_feature_before_switch`: "compute_index" (WHAT page they were on)
   - `session_hour`: "14"

### Adding Outbound Tracking to Links

Add `onclick` handler to links that navigate to Aurora:

```erb
<%= link_to "View in Aurora", 
    aurora_url,
    onclick: "trackOutboundNavigation('object_storage_ceph_banner'); return true;",
    class: "btn btn-primary" %>
```

**What happens:**
1. User clicks link in Elektra (e.g., from `compute_index` page)
2. JavaScript calls `/metrics/track_outbound` API
3. API records: `elektra → aurora` with `entry_point=object_storage_ceph_banner`
4. User navigates to Aurora

### Platform-Specific Cookies (No Cross-Platform Deduplication)

Each platform uses its own hourly cookie:

```
User in Elektra (hour 14):
├─ URL: dashboard.example.com
├─ Cookie: metrics_hours_elektra=14; Domain=.example.com
└─ Counter: dashboard_active_browser_hours_total{session_hour="14", platform="elektra"} = 1

User navigates to Aurora:
├─ JavaScript calls /metrics/track_outbound first
├─ Increment: dashboard_cross_navigation_total{from_dashboard="elektra", to_dashboard="aurora", ...}
├─ Then navigates to: dashboard-aurora.example.com
├─ Browser sends: metrics_hours_elektra=14 (domain matches, but Aurora ignores it)
└─ Aurora creates NEW cookie: metrics_hours_aurora=14

Result:
- Elektra counted user in hour 14: 1 ✅
- Aurora counted user in hour 14: 1 ✅
- Cross-navigation tracked: 1 ✅
- Total counts: 2 (intentional - each platform tracks independently)
```

**Key insight:** Each platform tracks its own active browser instances using platform-specific cookies. A user visiting BOTH dashboards in the same hour = 2 counts (one per platform), which gives accurate adoption metrics.

---

## Metrics Collected

### 1. Unique Sessions by Hour

**Metric:** `dashboard_active_browser_hours_total`

**What it measures:**
This counter tracks **browser-hours**, not unique users or unique sessions. A browser-hour means "one browser was active during one specific hour." The same browser active in multiple hours generates multiple counts, and the same user on different devices/browsers generates separate counts.

**Key behaviors:**
- **Cookie deduplication within hour:** A browser making 100 requests during hour 14 = counted once in hour 14
- **No deduplication across hours:** Same browser active at 13:00 and 14:00 = 2 counts (one per hour)
- **No deduplication across devices:** Same user on laptop and phone = 2 counts (different browsers)
- **Multi-pod safe:** Same browser counted once even if requests hit different pods (shared cookie domain)

**Why this design:**
Using hourly buckets keeps Prometheus cardinality low (24 hours × 2 platforms = 48 time series) instead of creating one time series per unique session (which could be millions).

**Important:** Summing across hours does NOT give you "unique users per day." It gives you "total browser-hours." A user active for 3 hours contributes 3 to the daily sum.

**Labels:**
- `session_hour`: "00" to "23"
- `platform`: "elektra" or "aurora"

**Example:**
```promql
dashboard_active_browser_hours_total{session_hour="14", platform="elektra"} = 523
```
Meaning: 523 different browser instances were active in Elektra during hour 14 today (each counted once regardless of request count)

---

### 2. Feature Usage

**Metric:** `dashboard_feature_usage_total`

**What it measures:**
This counter increments on **every request** to a tracked feature (controller/action pair). Unlike session tracking, there is no deduplication - each page view increments the counter.

**Key behaviors:**
- **No deduplication:** Same user refreshing a page 10 times = 10 counts
- **Granular tracking:** Tracks individual controller/action pairs (e.g., "compute_index", "compute_show")
- **Excludes utility endpoints:** Some features are excluded (avatars, metrics endpoints, API proxies)
- **Hour label:** Includes `session_hour` to see when features are most used

**Why this design:**
Provides raw traffic data per feature. Useful for understanding which features get the most requests (not just which features are visited by unique users).

**Use cases:**
- Identify most-accessed features
- Detect unusual traffic patterns (spikes, drops)
- Compare feature popularity across hours
- Calculate feature usage rates (total requests / unique sessions)

**Labels:**
- `feature`: "compute_index", "compute_show", etc.
- `platform`: "elektra" or "aurora"
- `session_hour`: "00" to "23"

**Example:**
```promql
dashboard_feature_usage_total{feature="compute_index", platform="elektra", session_hour="14"} = 1250
```
Meaning: The compute/instances/index page received 1,250 requests during hour 14 (includes multiple requests from same users)

---

### 3. Feature Transitions

**Metric:** `dashboard_feature_transitions_total`

**What it measures:**
This counter tracks **sequential navigation** between features. It increments when a user moves from one feature to another, capturing workflow patterns.

**Key behaviors:**
- **Requires previous feature:** Only increments when transitioning from feature A to feature B (first page visit has no transition)
- **Cookie-based state:** Uses `metrics_session` cookie to remember last 5 features visited
- **One transition per request:** Each request can generate at most one transition (from previous feature to current feature)
- **Not deduplicated:** User navigating compute_index → compute_show → compute_index → compute_show generates 3 transitions

**Why this design:**
Reveals user navigation patterns and workflows. Shows which features naturally lead to others, helping identify common user journeys and potential UX improvements.

**Use cases:**
- Identify common navigation paths (e.g., "users typically go from compute_index to compute_show")
- Detect unexpected navigation patterns (e.g., users frequently backtracking)
- Understand feature relationships (which features are used together)
- Find navigation bottlenecks or dead ends

**Implementation detail:**
Stores last 5 features in cookie to handle back/forward navigation and refresh scenarios without losing context.

**Labels:**
- `from_feature`: Previous feature
- `to_feature`: Current feature
- `platform`: "elektra" or "aurora"
- `session_hour`: "00" to "23"

**Example:**
```promql
dashboard_feature_transitions_total{
  from_feature="compute_index",
  to_feature="compute_show",
  platform="elektra",
  session_hour="14"
} = 342
```
Meaning: During hour 14, there were 342 navigation events where users went from the compute index page to a compute detail page

---

### 4. Cross-Dashboard Navigation

**Metric:** `dashboard_cross_navigation_total`

**What it measures:**
This counter tracks **explicit cross-dashboard navigation events** when users click instrumented links to move between Elektra and Aurora. This is NOT automatically tracked - it requires JavaScript API calls.

**Key behaviors:**
- **Explicit tracking only:** Incremented via `POST /metrics/track_outbound` API endpoint (called from JavaScript)
- **NOT automatic:** Middleware only defines the metric, it doesn't increment it automatically
- **Requires instrumentation:** Each cross-dashboard link must have `onclick="trackOutboundNavigation('entry_point_name')"`
- **Two-dimensional context:** Captures both WHERE user clicked (`entry_point`) and WHAT page they were on (`last_feature_before_switch`)

**Why this design:**
Provides rich context for understanding Aurora adoption. By tracking both the UI element clicked and the feature context, we can identify which entry points are most effective and which features drive users to try Aurora.

**Use cases:**
- Measure Aurora adoption rate (what % of Elektra users try Aurora)
- Identify most effective entry points (which buttons/banners drive adoption)
- Understand feature-specific adoption (which Elektra features lead users to try Aurora)
- Track bidirectional flow (Elektra → Aurora vs Aurora → Elektra)

**Important considerations:**
- **Not all cross-navigation is tracked:** Only instrumented links increment this metric
- **User could navigate without tracking:** Direct URL entry, bookmarks, or non-instrumented links won't be captured
- **Entry point taxonomy:** Requires consistent naming convention for entry points across UI

**Labels:**
- `from_dashboard`: "elektra" or "aurora"
- `to_dashboard`: "elektra" or "aurora"
- `entry_point`: WHERE the user clicked (e.g., "object_storage_ceph_banner", "identity_users_table")
- `last_feature_before_switch`: Feature user was on before switching (e.g., "compute_index")
- `session_hour`: "00" to "23"

**Example:**
```promql
dashboard_cross_navigation_total{
  from_dashboard="elektra",
  to_dashboard="aurora",
  entry_point="object_storage_ceph_banner",
  last_feature_before_switch="compute_index",
  session_hour="14"
} = 87
```
Meaning: During hour 14, 87 users clicked the object storage Ceph announcement banner while viewing the compute index page, which navigated them to Aurora

**How it's tracked:**
```javascript
// JavaScript in Elektra view
trackOutboundNavigation('object_storage_ceph_banner');
// → POST /metrics/track_outbound
// → Controller increments dashboard_cross_navigation_total
```

**Adding tracking to new links:**
```erb
<%= link_to "Try Aurora", 
    aurora_url,
    onclick: "trackOutboundNavigation('new_feature_banner'); return true;",
    class: "btn btn-primary" %>
```

---

### 5. Session Duration

**Metric:** `dashboard_session_duration_seconds`

**Type:** Histogram

**What it measures:**
This histogram observes **elapsed session time** from session start to current request, recorded periodically (every 5 minutes) to reduce metric volume.

**Key behaviors:**
- **Calculated, not measured:** Duration = current_time - session_start_time (stored in cookie)
- **Periodic observations:** Only records every 5 minutes (not on every request) to limit Prometheus cardinality
- **Multiple observations per session:** A 2-hour session generates ~24 observations (one every 5 minutes)
- **Histogram buckets:** Observations distributed across 7 buckets (1m, 5m, 10m, 30m, 1h, 2h, 4h) for quantile analysis

**Why this design:**
Provides distribution data (p50, p90, p99) without overwhelming Prometheus. The 5-minute throttle balances accuracy with cardinality.

**Use cases:**
- Calculate median/p90/p99 session duration
- Identify short vs long sessions
- Detect session length patterns by time of day
- Compare session duration across platforms (Elektra vs Aurora)

**Important considerations:**
- **Not exact logout time:** Records during session, not at end (user may close browser without final observation)
- **Last observation lag:** Final duration may be up to 5 minutes old (e.g., user active for 32 minutes might have last observation at 30 minutes)
- **Multiple sessions sum:** Histogram counts observations, not sessions. One user with 3 sessions generates 3 sets of observations.

**Histogram mechanics:**
Each observation increments the bucket counter for all buckets >= the observed value. This allows Prometheus to calculate quantiles using `histogram_quantile()`.

**Labels:**
- `platform`: "elektra" or "aurora"

**Buckets:** 60s, 300s (5m), 600s (10m), 1800s (30m), 3600s (1h), 7200s (2h), 14400s (4h)

**Example:**
```promql
histogram_quantile(0.5, dashboard_session_duration_seconds{platform="elektra"})
# => 1200 (median session is 20 minutes)

histogram_quantile(0.9, dashboard_session_duration_seconds{platform="elektra"})
# => 3600 (90th percentile session is 1 hour)
```

**Reading histogram data:**
- `p50` (median): Half of sessions are shorter, half are longer
- `p90`: 90% of sessions are shorter than this duration
- `p99`: Only 1% of sessions exceed this duration

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
# What percentage of Elektra users navigate to Aurora?
sum(increase(dashboard_cross_navigation_total{
  from_dashboard="elektra",
  to_dashboard="aurora"
}[7d]))
/ sum(increase(dashboard_active_browser_hours_total{platform="elektra"}[7d]))
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

### Drop-off Points (Elektra → Aurora)

```promql
# Which Elektra features AND entry points do users leave from to go to Aurora?
topk(10, sum by (last_feature_before_switch, entry_point) (increase(dashboard_cross_navigation_total{
  from_dashboard="elektra",
  to_dashboard="aurora"
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
- `metrics_hours_elektra`: ~20 bytes (typical 3-hour session with platform-specific name)
- `metrics_session`: ~100 bytes (Base64 JSON with 5 features)
- **Total: ~120 bytes** (well under 4KB browser limit)

**Previous approach (27 cookies):**
- 24 hourly cookies: 24 × 10 bytes = 240 bytes
- 3 session cookies: 3 × 15-50 bytes = ~80 bytes
- **Total: ~320 bytes**

**Improvement: 63% reduction in cookie size + cleaner DevTools view**

---

## Summary

### How It Works in One Sentence

**"We use platform-specific hourly cookies to count active authenticated browser instances across pods, recording when browsers are active (by hour), what features they use, and explicitly track outbound navigation via JavaScript API calls."**

### Key Takeaways

1. **Hourly windows** = Low Prometheus cardinality (48 time series vs millions)
2. **Platform-specific cookies** = Each platform (Elektra, Aurora) tracks independently (no cross-platform deduplication)
3. **Cookie deduplication** = Accurate counts across 4 Elektra pods
4. **Outbound tracking** = Via JavaScript + API endpoint (`POST /metrics/track_outbound`), not automatic in middleware
5. **Stateless** = No in-memory state, no cleanup, pod-safe
6. **Privacy-first** = No PII tracked, only aggregate patterns
7. **Real-time** = Users counted when actually active

---

**Last updated:** June 26, 2026  
**Tests:** 21 tests passing ✅
