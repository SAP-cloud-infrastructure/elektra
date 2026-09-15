/**
 * SSO Precheck - Attempts automatic SSO login before showing login form
 * Falls back to manual login if SSO is unavailable or fails
 */

const SSO_TIMEOUT = 5000 // 5 seconds

async function performSsoPrecheck() {
  const configEl = document.getElementById("sso-config")
  if (!configEl) {
    return
  }

  const keystoneUrl = configEl.dataset.keystoneUrl
  const domainName = configEl.dataset.domainName
  const verifyUrl = configEl.dataset.verifyUrl
  const afterLogin = configEl.dataset.afterLogin

  if (!keystoneUrl || !domainName) {
    showLoginForm()
    return
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SSO_TIMEOUT)

    const response = await fetch(keystoneUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Domain-Name": domainName,
      },
      body: JSON.stringify({
        auth: {
          identity: {
            methods: ["external"],
            external: {},
          },
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const subjectToken = response.headers.get("X-Subject-Token")
      if (subjectToken) {
        await verifyAndRedirect(verifyUrl, subjectToken, afterLogin)
        return
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("SSO precheck timed out")
    } else {
      console.error("SSO precheck failed:", error)
    }
  }

  showLoginForm()
}

async function verifyAndRedirect(url, token, afterLogin) {
  try {
    const body = { token: token }
    if (afterLogin) {
      body.after_login = afterLogin
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }
    // Same-origin precheck must send the Rails CSRF token so the verify
    // endpoint can enforce CSRF protection for this flow.
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      if (data && data.redirect_to) {
        // Real top-level navigation so the URL bar updates and the target
        // page's scripts/assets load normally.
        window.location.assign(data.redirect_to)
      } else {
        showLoginForm()
      }
    } else {
      showLoginForm()
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    showLoginForm()
  }
}

function showLoginForm() {
  const configEl = document.getElementById("sso-config")
  if (!configEl) return

  const spinnerId = configEl.dataset.spinnerId
  const loginFormId = configEl.dataset.loginFormId
  const hiddenClass = configEl.dataset.hiddenClass || "login-hidden"

  const spinner = spinnerId && document.getElementById(spinnerId)
  const content = loginFormId && document.getElementById(loginFormId)

  if (spinner) spinner.style.display = "none"
  if (content) content.classList.remove(hiddenClass)
}

// Reads the Rails CSRF token from the standard meta tag rendered by
// csrf_meta_tags in the layout. Returns null when absent.
function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return (meta && meta.getAttribute("content")) || null
}

// Auto-initialize on DOM load
document.addEventListener("DOMContentLoaded", performSsoPrecheck)

// Export for testing
export { performSsoPrecheck, verifyAndRedirect, showLoginForm, getCsrfToken }
