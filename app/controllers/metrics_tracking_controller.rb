# frozen_string_literal: true

# Controller for tracking outbound navigation metrics
# This endpoint is called via JavaScript before navigating to other dashboards
# Matches Aurora's analytics API pattern
class MetricsTrackingController < DashboardController
  

  # POST /metrics/track_outbound
  # Body: { to_dashboard: "aurora", entry_point: "object_storage_ceph_banner" }
  #
  # Tracks outbound navigation from Elektra to another dashboard.
  # The entry_point describes WHERE the user clicked (e.g., banner, sidebar, button)
  # The current_feature is read from the session cookie (set by middleware)
  def track_outbound
    to_dashboard = params[:to_dashboard]
    entry_point = params[:entry_point]

    unless to_dashboard.present? && entry_point.present?
      head :bad_request
      return
    end

    # Read current feature from session cookie (set by middleware)
    current_feature = read_current_feature_from_cookie || "unknown"
    current_hour = Time.now.strftime("%H")

    MetricsHelper.track_outbound_navigation(
      to_dashboard: to_dashboard,
      entry_point: entry_point,
      current_feature: current_feature,
      session_hour: current_hour
    )

    head :no_content
  rescue => e
    Rails.logger.error("[MetricsTracking] Error: #{e.message}")
    head :internal_server_error
  end

  private

  # Read current feature from metrics_session cookie
  # The cookie contains: {start, last_dur, features: ["feature1", "feature2"]}
  # We return the last feature in the array.
  def read_current_feature_from_cookie
    # Read from request.cookies (raw cookies from the browser)
    cookie = request.cookies["metrics_session"]
    return nil unless cookie

    data = JSON.parse(Base64.decode64(cookie), symbolize_names: true)
    features = data[:features]

    features&.last
  rescue => e
    Rails.logger.debug("[MetricsTracking] Failed to read feature from cookie: #{e.message}")
    nil
  end
end
