# frozen_string_literal: true

# Middleware for tracking anonymous session-based metrics
# Phase 2: Hybrid solution with time-based windows + cookie deduplication
#
# Key improvements:
# - Low cardinality: Uses session_hour labels instead of anonymous_session_id
# - Multi-pod safe: Cookie-based deduplication works across all Elektra pods
# - Cross-platform: Cookies shared between Elektra and Aurora via domain
# - Stateless: No in-memory state, no cleanup needed
class AnonymousSessionMetricsMiddleware
  EXCLUDE_PATHS = %w[/metrics /assets /system /health].freeze

  # Maximum features to track per session (sliding window)
  MAX_FEATURES_PER_SESSION = 5

  def initialize(app, options = {})
    @app = app
    @registry = options[:registry] || Prometheus::Client.registry

    # Unique sessions by hour (cookie-deduplicated)
    # Cardinality: 24 hours × 2 platforms = 48 time series
    @unique_sessions = @registry.counter(
      :dashboard_unique_sessions_total,
      docstring: "Unique sessions by hour",
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

    # Cross-dashboard navigation
    # Cardinality: 2 × 2 × 50 × 24 = 4,800 time series
    @cross_dashboard_nav = @registry.counter(
      :dashboard_cross_navigation_total,
      docstring: "Cross-dashboard navigation events",
      labels: %i[from_dashboard to_dashboard from_feature session_hour]
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

    # Call app to populate path_parameters
    response = @app.call(env)

    return response unless session_token

    begin
      anonymous_id = AnonymousMetrics.generate_id(session_token)
      current_hour = Time.now.strftime("%H")  # "00" to "23"
      path_params = env["action_dispatch.request.path_parameters"] || {}

      domain = path_params[:domain_id] || path_params[:domain_fid] || "unknown"
      project = path_params[:project_id] || "unknown"
      current_feature = extract_feature(path_params)

      # Extract global domain (matches auth_session.rb pattern)
      global_domain = extract_global_domain(request.host)

      # Track unique session (cookie deduplication)
      track_unique_session(request, response, current_hour, global_domain)

      # Track session duration (cookie-based)
      track_session_duration(request, response, global_domain)

      # Track feature usage and transitions
      if current_feature
        track_feature_usage(current_feature, current_hour)
        track_feature_transitions(request, response, current_feature, current_hour, global_domain)
      end

      # Track cross-dashboard navigation
      track_cross_dashboard_navigation(request, current_feature, current_hour)

    rescue => e
      Rails.logger.error("AnonymousSessionMetrics error: #{e.message}")
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

    "#{plugin}_#{action}"
  end

  # ==========================================
  # UNIQUE SESSION TRACKING (cookie-based)
  # ==========================================

  def track_unique_session(request, response, current_hour, global_domain)
    cookie_name = "metrics_h#{current_hour}"

    unless request.cookies[cookie_name]
      # First request this hour - count it!
      @unique_sessions.increment(
        labels: {
          session_hour: current_hour,
          platform: "elektra"
        }
      )

      # Set cookie that expires at end of hour
      set_hourly_cookie(response, cookie_name, global_domain)
    end
  end

  # ==========================================
  # SESSION DURATION TRACKING (cookie-based)
  # ==========================================

  def track_session_duration(request, response, global_domain)
    session_start_cookie = request.cookies["metrics_session_start"]

    if session_start_cookie
      # Calculate current duration
      start_time = session_start_cookie.to_i
      duration = Time.now.to_i - start_time

      # Record duration periodically (every 5 minutes)
      last_record_cookie = request.cookies["metrics_last_duration_record"]
      last_record_time = last_record_cookie.to_i rescue 0

      if (Time.now.to_i - last_record_time) > 300  # 5 minutes
        @session_duration.observe(duration, labels: { platform: "elektra" })
        set_cookie(response, "metrics_last_duration_record", Time.now.to_i.to_s, global_domain, 24.hours)
      end
    else
      # First request - store session start time
      set_cookie(response, "metrics_session_start", Time.now.to_i.to_s, global_domain, 24.hours)
      set_cookie(response, "metrics_last_duration_record", Time.now.to_i.to_s, global_domain, 24.hours)
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

  def track_feature_transitions(request, response, current_feature, current_hour, global_domain)
    # Read previous features from cookie
    previous_features = read_features_from_cookie(request)
    previous_feature = previous_features.last

    if previous_feature
      @feature_transitions.increment(
        labels: {
          from_feature: previous_feature,
          to_feature: current_feature,
          platform: "elektra",
          session_hour: current_hour
        }
      )
    end

    # Store current feature in cookie (sliding window)
    updated_features = (previous_features + [current_feature]).last(MAX_FEATURES_PER_SESSION)
    store_features_in_cookie(response, updated_features, global_domain)
  end

  # ==========================================
  # CROSS-DASHBOARD NAVIGATION
  # ==========================================

  def track_cross_dashboard_navigation(request, current_feature, current_hour)
    referrer = request.referer
    return unless referrer

    referrer_dashboard = extract_dashboard_from_url(referrer)
    return unless referrer_dashboard

    current_dashboard = extract_dashboard_from_url(request.url)
    return if referrer_dashboard == current_dashboard
    return unless current_dashboard

    # Get feature from referrer (stored in cookie by other platform)
    referrer_feature = read_features_from_cookie(request).last || "unknown"

    @cross_dashboard_nav.increment(
      labels: {
        from_dashboard: referrer_dashboard,
        to_dashboard: current_dashboard,
        from_feature: referrer_feature,
        session_hour: current_hour
      }
    )
  end

  # ==========================================
  # URL HELPERS
  # ==========================================

  def extract_dashboard_from_url(url)
    return nil unless url

    uri = URI.parse(url)
    host = uri.host
    return nil unless host

    if host.start_with?("dashboard-aurora.")
      "aurora"
    elsif host.start_with?("dashboard.")
      "elektra"
    else
      nil
    end
  rescue URI::InvalidURIError
    nil
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
      ".#{host}"  # Fallback to current host
    end
  end

  def set_hourly_cookie(response, cookie_name, global_domain)
    hour_end = Time.now.end_of_hour

    # Cookie shared across Elektra and Aurora via domain
    cookie_header = "#{cookie_name}=1; " \
                    "Path=/; " \
                    "Domain=#{global_domain}; " \
                    "HttpOnly; " \
                    "#{secure_attribute}" \
                    "SameSite=Lax; " \
                    "Expires=#{hour_end.httpdate}"

    append_cookie(response, cookie_header)
  end

  def set_cookie(response, name, value, global_domain, expires_in)
    expires = (Time.now + expires_in).httpdate

    cookie_header = "#{name}=#{value}; " \
                    "Path=/; " \
                    "Domain=#{global_domain}; " \
                    "HttpOnly; " \
                    "#{secure_attribute}" \
                    "SameSite=Lax; " \
                    "Expires=#{expires}"

    append_cookie(response, cookie_header)
  end

  def append_cookie(response, cookie_header)
    # Rails response format: [status, headers, body]
    if response[1]["Set-Cookie"]
      response[1]["Set-Cookie"] << "\n#{cookie_header}"
    else
      response[1]["Set-Cookie"] = cookie_header
    end
  end

  def read_features_from_cookie(request)
    cookie = request.cookies["metrics_features"]
    return [] unless cookie

    JSON.parse(Base64.decode64(cookie)) rescue []
  end

  def store_features_in_cookie(response, features, global_domain)
    cookie_value = Base64.strict_encode64(features.to_json)
    set_cookie(response, "metrics_features", cookie_value, global_domain, 24.hours)
  end

  def secure_attribute
    Rails.env.production? ? "Secure; " : ""
  end
end
