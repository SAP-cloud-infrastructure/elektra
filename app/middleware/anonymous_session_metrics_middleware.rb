# frozen_string_literal: true

# Middleware for tracking anonymous session-based metrics
# Tracks unique sessions, timestamps, feature navigation, and cross-dashboard flows
#
# NOTE: Uses in-memory state per process. In multi-process deployments (Passenger, Puma),
# each worker maintains its own state, which may cause:
# - Slight over-counting of unique sessions (same session counted once per worker)
# - Inconsistent feature sequence tracking across workers
# For production accuracy, consider Redis-backed storage.
class AnonymousSessionMetricsMiddleware
  EXCLUDE_PATHS = %w[/metrics /assets /system /health].freeze

  # TTL for session state cleanup (24 hours)
  SESSION_TTL = 24 * 60 * 60

  # Cleanup interval - run cleanup every N requests to avoid overhead
  CLEANUP_INTERVAL = 1000

  # Maximum features to track per session (sliding window)
  MAX_FEATURES_PER_SESSION = 10

  def initialize(app, options = {})
    @app = app
    @registry = options[:registry] || Prometheus::Client.registry

    # Counter: Unique sessions (increments once per unique session)
    @unique_sessions =
      @registry.counter(
        :dashboard_unique_sessions_total,
        docstring: "Unique anonymous sessions (increments once per session)",
        labels: %i[anonymous_session_id],
      )

    # Gauge: Session start timestamps
    @session_start_time =
      @registry.gauge(
        :dashboard_session_start_timestamp,
        docstring: "Session start timestamp (seconds since epoch)",
        labels: %i[anonymous_session_id],
      )

    # Gauge: Last activity timestamps
    @session_last_activity =
      @registry.gauge(
        :dashboard_session_last_activity_timestamp,
        docstring: "Last activity timestamp per session",
        labels: %i[anonymous_session_id domain project],
      )

    # Counter: Feature sequences
    @feature_sequence =
      @registry.counter(
        :dashboard_feature_sequence_total,
        docstring: "Feature navigation sequences per session",
        labels: %i[anonymous_session_id previous_feature current_feature],
      )

    # Counter: Cross-dashboard navigation
    @cross_dashboard_nav =
      @registry.counter(
        :dashboard_cross_navigation_total,
        docstring: "Cross-dashboard navigation events",
        labels: %i[anonymous_session_id from_dashboard to_dashboard from_feature],
      )

    # In-memory tracking with TTL-based cleanup
    # Structure: { session_id => timestamp }
    @session_first_seen = {}
    # Structure: { session_id => [feature1, feature2, ...] } (limited by MAX_FEATURES_PER_SESSION)
    @session_features = {}

    # Cleanup tracking
    @request_count = 0
    @mutex = Mutex.new
  end

  def call(env)
    # Skip excluded paths
    path_info = env["PATH_INFO"]
    return @app.call(env) if should_skip_path?(path_info)

    # Periodic cleanup to prevent memory leaks
    cleanup_expired_sessions

    # Extract request details
    request = ActionDispatch::Request.new(env)

    # Get session token and generate anonymous ID
    session_token = request.cookies["dashboard-session-auth"]

    # Call the app first so Rails routing populates path_parameters
    response = @app.call(env)

    # Now extract context with full route information available (wrapped in rescue to prevent double execution)
    begin
      if session_token
        anonymous_id = AnonymousMetrics.generate_id(session_token)
        path_params = env["action_dispatch.request.path_parameters"] || {}

        # Extract context
        domain = path_params[:domain_id] || path_params[:domain_fid] || "unknown"
        project = path_params[:project_id] || "unknown"
        current_feature = extract_feature(path_params)

        # Track unique session (only on first request)
        if first_request_for_session?(anonymous_id)
          @mutex.synchronize do
            @unique_sessions.increment(
              labels: { anonymous_session_id: anonymous_id },
            )
            @session_start_time.set(
              Time.now.to_i,
              labels: { anonymous_session_id: anonymous_id },
            )
            @session_first_seen[anonymous_id] = Time.now
          end
        end

        # Update last activity timestamp
        @session_last_activity.set(
          Time.now.to_i,
          labels: {
            anonymous_session_id: anonymous_id,
            domain: domain,
            project: project,
          },
        )

        # Track feature sequences
        if current_feature
          @mutex.synchronize do
            previous_feature = @session_features[anonymous_id]&.last

            @feature_sequence.increment(
              labels: {
                anonymous_session_id: anonymous_id,
                previous_feature: previous_feature || "entry",
                current_feature: current_feature,
              },
            )

            @session_features[anonymous_id] ||= []
            @session_features[anonymous_id] << current_feature
            # Keep only the last N features (sliding window)
            @session_features[anonymous_id] = @session_features[anonymous_id].last(MAX_FEATURES_PER_SESSION)
          end
        end

        # Track cross-dashboard navigation
        track_cross_dashboard_navigation(
          request,
          anonymous_id,
          current_feature,
        )
      end
    rescue => e
      Rails.logger.error(
        "AnonymousSessionMetricsMiddleware error: #{e.message}",
      )
      Rails.logger.error(e.backtrace.first(5).join("\n")) if Rails.env.development?
      # Don't re-call app, just log and continue
    end

    response
  end

  private

  def cleanup_expired_sessions
    @request_count += 1
    return unless @request_count % CLEANUP_INTERVAL == 0

    @mutex.synchronize do
      now = Time.now
      cutoff = now - SESSION_TTL

      # Remove expired sessions from first_seen tracking
      @session_first_seen.delete_if { |_id, timestamp| timestamp < cutoff }

      # Remove expired sessions from features tracking
      # (use first_seen as source of truth for expiration)
      @session_features.delete_if { |id, _features| !@session_first_seen.key?(id) }

      Rails.logger.info(
        "[AnonymousSessionMetrics] Cleanup: #{@session_first_seen.size} active sessions, " \
        "#{@session_features.size} with feature tracking"
      ) if Rails.env.development?
    end
  rescue => e
    Rails.logger.error("[AnonymousSessionMetrics] Cleanup failed: #{e.message}")
    # Don't let cleanup failures break request processing
  end

  def should_skip_path?(path)
    EXCLUDE_PATHS.any? { |excluded| path.start_with?(excluded) }
  end

  def extract_feature(path_params)
    controller = path_params[:controller]
    return nil unless controller

    # Extract plugin and action
    plugin = controller.split("/").first
    action = path_params[:action]

    return nil unless plugin && action

    "#{plugin}_#{action}"
  end

  def first_request_for_session?(anonymous_id)
    !@session_first_seen.key?(anonymous_id)
  end

  def track_cross_dashboard_navigation(request, anonymous_id, current_feature)
    referrer = request.referer
    return unless referrer

    # Extract dashboard from referrer (e.g., "aurora" or "elektra")
    referrer_dashboard = extract_dashboard_from_url(referrer)
    return unless referrer_dashboard

    # Extract current dashboard from request host
    current_dashboard = extract_dashboard_from_url(request.url)
    return if referrer_dashboard == current_dashboard
    return unless current_dashboard

    # Extract feature from referrer URL
    referrer_feature = extract_feature_from_url(referrer)

    @cross_dashboard_nav.increment(
      labels: {
        anonymous_session_id: anonymous_id,
        from_dashboard: referrer_dashboard,
        to_dashboard: current_dashboard,
        from_feature: referrer_feature || "unknown",
      },
    )
  end

  def extract_dashboard_from_url(url)
    return nil unless url

    # Parse URL to extract host
    uri = URI.parse(url)
    host = uri.host
    return nil unless host

    # URL patterns:
    # Elektra: dashboard.{region}.cloud.sap (e.g., dashboard.qa-de-1.cloud.sap)
    # Aurora: dashboard-aurora.{region}.cloud.sap (e.g., dashboard-aurora.qa-de-1.cloud.sap)
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

  def extract_feature_from_url(url)
    uri = URI.parse(url)
    path_segments = uri.path.split("/").reject(&:blank?)

    # Path structure: /domain/project/plugin/action
    # Extract plugin (3rd segment) if present
    path_segments[2] if path_segments.length > 2
  rescue
    nil
  end
end
