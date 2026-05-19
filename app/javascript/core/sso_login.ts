/**
 * SSO Login via browser-side mTLS certificate authentication.
 *
 * This module auto-fires on DOMContentLoaded when the login page includes
 * specific meta tags. It performs a cross-origin fetch to Keystone's
 * /v3/auth/tokens endpoint using the browser's client certificate (via the
 * upstream ingress), then submits the resulting token to Elektra's existing
 * /verify-auth-token endpoint via a hidden form POST.
 *
 * Required meta tags (rendered by the login view):
 *   <meta name="keystone-url" content="https://identity.region.cloud.host.tld">
 *   <meta name="sso-domain-name" content="ccadmin">       (or sso-domain-id)
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

  // Only proceed if all required meta tags are present
  const hasDomain = !!(domainName || domainId)
  if (!keystoneUrl || !hasDomain) {
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

  // Step 2: Submit the token to Elektra's /verify-auth-token endpoint
  // via a hidden form POST. The server validates the token at Keystone,
  // extracts the user domain, and redirects to consume-auth-token to
  // establish the Rails session — the same flow used by federated SSO.
  const form = document.createElement("form")
  form.method = "POST"
  form.action = "/verify-auth-token"
  form.style.display = "none"

  const tokenInput = document.createElement("input")
  tokenInput.type = "hidden"
  tokenInput.name = "token"
  tokenInput.value = token
  form.appendChild(tokenInput)

  const csrfInput = document.createElement("input")
  csrfInput.type = "hidden"
  csrfInput.name = "authenticity_token"
  csrfInput.value = csrfToken
  form.appendChild(csrfInput)

  document.body.appendChild(form)
  form.submit()
}

document.addEventListener("DOMContentLoaded", ssoBootstrap)
