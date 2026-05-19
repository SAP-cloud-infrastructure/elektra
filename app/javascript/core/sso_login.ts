/**
 * SSO Login via browser-side mTLS certificate authentication.
 *
 * This module auto-fires on DOMContentLoaded when the login page includes
 * specific meta tags. It performs a cross-origin fetch to Keystone's
 * /v3/auth/tokens endpoint using the browser's client certificate (via the
 * upstream ingress), then posts the resulting token back to Elektra's
 * consume-auth-token endpoint to establish a Rails session.
 *
 * Required meta tags (rendered by the login view):
 *   <meta name="keystone-url" content="https://identity.region.cloud.host.tld">
 *   <meta name="sso-domain-name" content="ccadmin">       (or sso-domain-id)
 *   <meta name="sso-consume-path" content="/auth/consume-auth-token">
 *
 * The csrf-token meta tag (standard Rails) must also be present.
 */

function getMeta(name: string): string {
  const el = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  )
  return el?.content ?? ""
}

export async function ssoBootstrap(): Promise<void> {
  const keystoneUrl = getMeta("keystone-url")
  const csrfToken = getMeta("csrf-token")
  const domainName = getMeta("sso-domain-name")
  const domainId = getMeta("sso-domain-id")
  const consumePath = getMeta("sso-consume-path")

  // Only proceed if all required meta tags are present
  const hasDomain = !!(domainName || domainId)
  if (!keystoneUrl || !hasDomain || !consumePath) {
    return
  }

  // Build headers for the Keystone request
  const keystoneHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (domainName) {
    keystoneHeaders["X-User-Domain-Name"] = domainName
  } else if (domainId) {
    keystoneHeaders["X-User-Domain-Id"] = domainId
  }

  // Step 1: Authenticate with Keystone via external (cc_x509) method
  let res: Response
  try {
    res = await fetch(`${keystoneUrl}/v3/auth/tokens`, {
      method: "POST",
      mode: "cors",
      headers: keystoneHeaders,
      body: JSON.stringify({
        auth: {
          identity: { methods: ["external"], external: {} },
          scope: "unscoped",
        },
      }),
    })
  } catch (_e) {
    // CORS error, network failure, or cert chooser was cancelled.
    // Silently fall through to let the user use the form login.
    return
  }

  if (!res.ok) {
    // Keystone rejected the request (401, 403, etc.)
    // Fall through to form login.
    return
  }

  const token = res.headers.get("X-Subject-Token")
  if (!token) {
    return
  }

  // Step 2: Post the raw token to Elektra's consume-auth-token endpoint
  // (same-origin, CSRF-protected)
  const formData = new URLSearchParams()
  formData.append("auth_token", token)
  formData.append("raw", "1")

  let consumeRes: Response
  try {
    consumeRes = await fetch(consumePath, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRF-Token": csrfToken,
      },
      body: formData.toString(),
    })
  } catch (_e) {
    return
  }

  // Step 3: Follow the redirect from Elektra
  if (consumeRes.redirected) {
    window.location.href = consumeRes.url
  } else if (consumeRes.ok) {
    // Session is now set; reload the page so Rails picks it up
    window.location.reload()
  }
  // On failure, do nothing — user stays on the login form
}

document.addEventListener("DOMContentLoaded", ssoBootstrap)
