# frozen_string_literal: true

# Helper module for tracking cross-dashboard navigation metrics
#
# Matches Aurora's pattern where a client-side API call tracks navigation BEFORE the user leaves.
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
  # The current feature is automatically read from the session cookie by the controller,
  # so you only need to pass the entry_point identifier.
  #
  # @param entry_point [String] Descriptive identifier for where user clicked
  # @return [String] JavaScript code for onclick handler
  def track_outbound_navigation_js(entry_point)
    "trackOutboundNavigation('#{entry_point.to_s.gsub("'", "\\\\'")}')"
  end

  # Track outbound navigation programmatically (server-side)
  #
  # @param to_dashboard [String] The destination dashboard ("aurora")
  # @param entry_point [String] Descriptive identifier for where user clicked
  # @param current_feature [String] The current feature user is on before leaving
  # @param session_hour [String] The current hour ("00" to "23")
  # @param registry [Prometheus::Client::Registry] Optional registry (defaults to global)
  def self.track_outbound_navigation(to_dashboard:, entry_point:, current_feature:, session_hour:, registry: nil)
    registry ||= Prometheus::Client.registry

    metric = registry.get(:dashboard_cross_navigation_total)
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
