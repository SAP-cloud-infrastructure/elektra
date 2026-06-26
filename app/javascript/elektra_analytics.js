/**
 * Analytics module for user behavior tracking in Elektra.
 *
 * - Current feature is read from session cookie by the controller (server-side)
 * - Only need to pass entry_point from JavaScript
 */

/**
 * Track outbound navigation to another dashboard.
 * Call this when user clicks a link leaving Elektra.
 *
 * The current feature is automatically read from the session cookie by the controller.
 *
 * @param {string} entryPoint - Identifier for where user clicked (e.g., "object_storage_ceph_banner")
 * @param {string} url - The scoped route URL from Rails route helper
 *
 * @example
 * <a href="..." onclick="trackOutboundNavigation('object_storage_ceph_banner', '/:domain_id/:project_id/metrics/track_outbound')">
 *   Go to Aurora
 * </a>
 */
window.trackOutboundNavigation = function (entryPoint, url) {
  sendAnalytics(
    {
      to_dashboard: "aurora",
      entry_point: entryPoint,
    },
    url
  )
}

/**
 * Get CSRF token from meta tag
 */
function getCsrfToken() {
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  return metaTag ? metaTag.content : null
}

/**
 * Send analytics data to server
 */
function sendAnalytics(data, url) {
  try {
    const csrfToken = getCsrfToken()

    if (!csrfToken) {
      console.debug("Elektra analytics: No CSRF token available")
      return
    }

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(function (error) {
      console.debug("Elektra analytics tracking failed:", error)
    })
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug("Elektra analytics error:", error)
  }
}
