# frozen_string_literal: true

# Helper module for tracking cross-dashboard navigation metrics
#
# The entry_point parameter should describe WHERE/HOW the user clicked:
# - "object_storage_ceph_banner" - clicked banner in object storage
# - "identity_project_banner" - clicked banner in identity project page
# - "sidenav_aurora_link" - clicked link in sidebar
#
# Usage in views:
#   <%= link_to "Go to Aurora",
#       aurora_url,
#       onclick: track_outbound_navigation_js("object_storage_ceph_banner"),
#       data: { turbo: false } %>
#
# This generates a metric like:
#   dashboard_cross_navigation_total{
#     from_dashboard="elektra",
#     to_dashboard="aurora",
#     entry_point="object_storage_ceph_banner",
#     last_feature_before_switch="object_storage_show",  # Read from cookie by controller
#     session_hour="14"
#   }
module MetricsHelper
  # Generate JavaScript to track outbound navigation before link follows
  #
  # @param entry_point [String] Descriptive identifier for where user clicked
  # @return [String] JavaScript code for onclick handler
  def track_outbound_navigation_js(entry_point)
    # Build the scoped path with friendly IDs (slugs), not UUIDs
    # This matches the pattern used by feedback_path
    if @scoped_project_fid.present?
      route_path = "/#{@scoped_domain_fid}/#{@scoped_project_fid}/metrics/track_outbound"
    else
      route_path = "/#{@scoped_domain_fid}/metrics/track_outbound"
    end

    "trackOutboundNavigation('#{entry_point.to_s.gsub("'", "\\\\'")}', '#{route_path}')"
  end

  # Track outbound navigation programmatically (server-side)
  #
  # @param to_dashboard [String] The destination dashboard ("aurora")
  # @param entry_point [String] Descriptive identifier for where user clicked
  # @param current_feature [String] The current feature user is on before leaving
  # @param session_hour [String] The current hour ("00" to "23")
  def self.track_outbound_navigation(to_dashboard:, entry_point:, current_feature:, session_hour:)
    metric = Prometheus::Client.registry.get(:dashboard_cross_navigation_total)
    return unless metric

    metric.increment(
      labels: {
        from_dashboard: "elektra",
        to_dashboard: to_dashboard,
        entry_point: entry_point,
        last_feature_before_switch: current_feature,
        session_hour: session_hour
      }
    )
  rescue => e
    Rails.logger.error("[MetricsHelper] Failed to track outbound navigation: #{e.message}")
  end
end
