# frozen_string_literal: true

# Middleware for tracking anonymous session-based metrics
#
# Keys:
# - Low cardinality: Uses session_hour labels instead of anonymous_session_id
# - Multi-pod safe: Cookie-based deduplication works across all Elektra pods
# - Cross-platform: Cookies shared between Elektra and Aurora via domain
# - Stateless: No in-memory state, no cleanup needed
# - Minimal cookies: Uses only 2 cookies (metrics_hours_elektra, metrics_session)
#
# Cookie structure:
# 1. metrics_hours_elektra: Platform-specific comma-separated list of visited hours (e.g., "14,15,16")
# 2. metrics_session: Base64-encoded JSON with {start, last_dur, features} (SHARED with Aurora)
#
# This allows accurate adoption metrics since users may access both dashboards,
# and we want to track each platform's usage independently.
class AnonymousSessionMetricsMiddleware
  EXCLUDE_PATHS = %w[/metrics /assets /system /health].freeze

  # Features to exclude from tracking (e.g., utility endpoints, avatars)
  EXCLUDE_FEATURES = %w[
    avatars_show
    metrics_tracking_track_outbound
    os_api_token
    os_api_reverse_proxy
  ].freeze

  # Maximum features to track per session (sliding window)
  MAX_FEATURES_PER_SESSION = 5

  # Platform-specific cookie for Elektra (Aurora uses metrics_hours_aurora)
  METRICS_HOURS_COOKIE = "metrics_hours_elektra".freeze

  # Shared session cookie for cross-dashboard tracking
  METRICS_SESSION_COOKIE = "metrics_session".freeze

  # Cookie expiry duration (24 hours)
  COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60

  def initialize(app, options = {})
    @app = app
    @registry = options[:registry] || Prometheus::Client.registry

    # Active browser instances by hour (cookie-deduplicated across pods)
    # Cardinality: 24 hours × 2 platforms = 48 time series
    # Note: Counts active authenticated browser instances per hour, NOT unique users
    # - Same browser in multiple hours = multiple counts
    # - Same user on different browsers/devices = multiple counts
    # - Same browser across multiple pods = single count (cookie deduplication)
    @active_browser_hours = @registry.counter(
      :dashboard_active_browser_hours_total,
      docstring: "Active authenticated browser instances by hour",
      labels: %i[session_hour platform]
    )

    # Feature usage counter (no deduplication needed)
    # Cardinality: ~50 features × 2 platforms × 24 hours = 2,400 time series
    @feature_usage = @registry.counter(
      :dashboard_feature_usage_total,
      docstring: "Feature usage count",
      labels: %i[feature platform session_hour]
    )

    # Feature transitions (navigation flow)
    # Cardinality: 50 × 50 × 2 × 24 = 120,000 time series
    @feature_transitions = @registry.counter(
      :dashboard_feature_transitions_total,
      docstring: "Feature navigation transitions",
      labels: %i[from_feature to_feature platform session_hour]
    )

    # Cross-dashboard navigation (outbound tracking via API endpoint)
    # Cardinality: 2 × 2 × ~20 entry_points × ~50 features × 24 hours = ~96,000 time series
    # Note: Tracked via POST /metrics/track_outbound API endpoint (called from JavaScript before navigation)
    # entry_point describes WHERE the user clicked (e.g., "object_storage_ceph_banner")
    # last_feature_before_switch is the actual feature/path they were on
    @cross_dashboard_nav = @registry.counter(
      :dashboard_cross_navigation_total,
      docstring: "Cross-dashboard navigation events",
      labels: %i[from_dashboard to_dashboard entry_point last_feature_before_switch session_hour]
    )

    # Session duration histogram
    # Cardinality: 2 platforms × 8 buckets = 16 time series
    @session_duration = @registry.histogram(
      :dashboard_session_duration_seconds,
      docstring: "Session duration distribution",
      labels: %i[platform],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400]  # 1m, 5m, 10m, 30m, 1h, 2h, 4h
    )

  end

  def call(env)
    path_info = env["PATH_INFO"]
    return @app.call(env) if should_skip_path?(path_info)

    request = ActionDispatch::Request.new(env)
    session_token = request.cookies["dashboard-session-auth"]

    # DEBUG: Log initial state
    Rails.logger.debug("[AnonymousMetrics] Request: #{request.method} #{path_info}")
    Rails.logger.debug("[AnonymousMetrics] Session token present: #{session_token.present?}")

    # Call app to populate path_parameters
    response = @app.call(env)

    unless session_token
      Rails.logger.debug("[AnonymousMetrics] No session token - skipping metrics")
      return response
    end

    begin
      current_hour = Time.now.strftime("%H")  # "00" to "23"
      path_params = env["action_dispatch.request.path_parameters"] || {}

      current_feature = extract_feature(path_params)

      # Extract global domain (matches auth_session.rb pattern)
      global_domain = extract_global_domain(request.host)

      Rails.logger.debug("[AnonymousMetrics] Hour: #{current_hour}, Feature: #{current_feature}, Domain: #{global_domain}")

      # Read session data once at the beginning
      session_data = read_session_data(request)
      session_data_modified = false

      # Track unique session (cookie deduplication)
      track_unique_session(request, response, current_hour, global_domain)

      # Track session duration (updates session_data)
      if track_session_duration_internal(session_data)
        session_data_modified = true
      end

      # Track feature usage and transitions
      if current_feature
        track_feature_usage(current_feature, current_hour)
        if track_feature_transitions_internal(session_data, current_feature, current_hour)
          session_data_modified = true
        end
      else
        Rails.logger.debug("[AnonymousMetrics] No feature extracted from path_params: #{path_params.inspect}")
      end

      # Write session data once at the end if modified
      if session_data_modified
        store_session_data(response, session_data, global_domain)
      end

    rescue => e
      Rails.logger.error("[AnonymousMetrics] Error: #{e.message}")
      Rails.logger.error(e.backtrace.first(5).join("\n")) if Rails.env.development?
    end

    response
  end

  private

  def should_skip_path?(path)
    EXCLUDE_PATHS.any? { |excluded| path.start_with?(excluded) }
  end

  def extract_feature(path_params)
    controller = path_params[:controller]
    return nil unless controller

    plugin = controller.split("/").first
    action = path_params[:action]

    return nil unless plugin && action

    feature = "#{plugin}_#{action}"

    # Exclude specific features from tracking
    return nil if EXCLUDE_FEATURES.include?(feature)

    feature
  end

  # ==========================================
  # UNIQUE SESSION TRACKING (cookie-based)
  # ==========================================

  def track_unique_session(request, response, current_hour, global_domain)
    visited_hours = read_visited_hours(request)

    unless visited_hours.include?(current_hour)
      # First request this hour from this browser - count it!
      @active_browser_hours.increment(
        labels: {
          session_hour: current_hour,
          platform: "elektra"
        }
      )

      # Add current hour to visited hours
      visited_hours << current_hour
      store_visited_hours(response, visited_hours, global_domain)
    end
  end

  # ==========================================
  # SESSION DURATION TRACKING (cookie-based)
  # ==========================================

  def track_session_duration_internal(session_data)
    if session_data[:start]
      # Calculate current duration
      duration = Time.now.to_i - session_data[:start]

      # Record duration periodically (every 5 minutes)
      if (Time.now.to_i - session_data[:last_dur]) > 300  # 5 minutes
        @session_duration.observe(duration, labels: { platform: "elektra" })
        session_data[:last_dur] = Time.now.to_i
        return true  # Modified
      end
      return false  # Not modified
    else
      # First request - store session start time
      session_data[:start] = Time.now.to_i
      session_data[:last_dur] = Time.now.to_i
      session_data[:features] ||= []  # Ensure features array exists
      return true  # Modified
    end
  end

  # ==========================================
  # FEATURE USAGE (no deduplication needed)
  # ==========================================

  def track_feature_usage(feature, current_hour)
    @feature_usage.increment(
      labels: {
        feature: feature,
        platform: "elektra",
        session_hour: current_hour
      }
    )
  end

  # ==========================================
  # FEATURE TRANSITIONS (cookie-based)
  # ==========================================

  def track_feature_transitions_internal(session_data, current_feature, current_hour)
    # Read previous features from session data
    previous_features = session_data[:features] || []
    previous_feature = previous_features.last

    Rails.logger.debug("[AnonymousMetrics] Previous features: #{previous_features.inspect}")
    Rails.logger.debug("[AnonymousMetrics] Previous feature: #{previous_feature.inspect}, Current feature: #{current_feature}")

    if previous_feature
      Rails.logger.debug("[AnonymousMetrics] Recording transition: #{previous_feature} → #{current_feature}")
      @feature_transitions.increment(
        labels: {
          from_feature: previous_feature,
          to_feature: current_feature,
          platform: "elektra",
          session_hour: current_hour
        }
      )
    else
      Rails.logger.debug("[AnonymousMetrics] No previous feature - first visit, no transition recorded")
    end

    # Store current feature in session data (sliding window)
    updated_features = (previous_features + [current_feature]).last(MAX_FEATURES_PER_SESSION)
    Rails.logger.debug("[AnonymousMetrics] Storing features in session: #{updated_features.inspect}")
    session_data[:features] = updated_features
    return true  # Modified
  end

  # ==========================================
  # COOKIE HELPERS
  # ==========================================

  # Extract global domain - matches auth_session.rb pattern (lines 170-176)
  def extract_global_domain(host)
    parts = host.split('.')
    if parts.length > 2
      ".#{parts[-3..-1].join('.')}"  # Returns ".qa-de-1.cloud.sap"
    else
      ".#{host}"  # Fallback to current host (e.g., ".localhost")
    end
  end

  # Read visited hours from cookie (platform-specific)
  def read_visited_hours(request)
    cookie = request.cookies[METRICS_HOURS_COOKIE]
    return [] unless cookie

    cookie.split(',').map(&:strip)
  rescue
    []
  end

  # Store visited hours in cookie (comma-separated string)
  def store_visited_hours(response, hours, global_domain)
    # Clean up hours older than 24h
    current_time = Time.now
    valid_hours = hours.select do |hour|
      # Keep all hours from today
      true  # Simple approach: cookie expires in 24h anyway
    end

    cookie_value = valid_hours.join(',')
    expires = (Time.now + COOKIE_MAX_AGE_SECONDS.seconds).httpdate

    Rails.logger.debug("[AnonymousMetrics] Storing visited hours: #{cookie_value}")

    cookie_header = "#{METRICS_HOURS_COOKIE}=#{cookie_value}; " \
                    "Path=/; " \
                    "Domain=#{global_domain}; " \
                    "HttpOnly; " \
                    "#{secure_attribute}" \
                    "SameSite=Lax; " \
                    "Max-Age=#{COOKIE_MAX_AGE_SECONDS}; " \
                    "Expires=#{expires}"

    append_cookie(response, cookie_header)
  end

  # Read session data from cookie (JSON structure)
  def read_session_data(request)
    cookie = request.cookies[METRICS_SESSION_COOKIE]
    return {} unless cookie

    data = JSON.parse(Base64.decode64(cookie), symbolize_names: true)
    {
      start: data[:start],
      last_dur: data[:last_dur] || data[:start],
      features: data[:features] || []
    }
  rescue => e
    Rails.logger.debug("[AnonymousMetrics] Error parsing session data: #{e.message}")
    {}
  end

  # Store session data in cookie (JSON structure)
  def store_session_data(response, data, global_domain)
    cookie_value = Base64.strict_encode64(data.to_json)
    expires = (Time.now + COOKIE_MAX_AGE_SECONDS.seconds).httpdate

    Rails.logger.debug("[AnonymousMetrics] Storing session data: #{data.inspect}")

    cookie_header = "#{METRICS_SESSION_COOKIE}=#{cookie_value}; " \
                    "Path=/; " \
                    "Domain=#{global_domain}; " \
                    "HttpOnly; " \
                    "#{secure_attribute}" \
                    "SameSite=Lax; " \
                    "Max-Age=#{COOKIE_MAX_AGE_SECONDS}; " \
                    "Expires=#{expires}"

    append_cookie(response, cookie_header)
  end

  def append_cookie(response, cookie_header)
    Rails.logger.debug("[AnonymousMetrics] Appending cookie: #{cookie_header}")

    # Rails response format: [status, headers, body]
    # According to Rack spec, multiple Set-Cookie headers must be stored as an array
    existing = response[1]["Set-Cookie"]

    if existing.nil?
      response[1]["Set-Cookie"] = cookie_header
    elsif existing.is_a?(Array)
      response[1]["Set-Cookie"] << cookie_header
    else
      # Convert single header to array
      response[1]["Set-Cookie"] = [existing, cookie_header]
    end
  end

  def secure_attribute
    Rails.env.production? ? "Secure; " : ""
  end
end
