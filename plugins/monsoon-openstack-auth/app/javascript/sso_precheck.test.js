// Mock window.location before importing the module so navigation can be asserted.
delete window.location
window.location = {
  href: "https://dashboard.eu-de-1.cloud.sap/monsoon3/auth/login",
  assign: vi.fn(),
}

import {
  performSsoPrecheck,
  verifyAndRedirect,
  showLoginForm,
  getCsrfToken,
} from "./sso_precheck"

const KEYSTONE_URL = "https://identity-3.eu-de-1.cloud.sap/v3/auth/tokens"
const VERIFY_URL = "/verify-auth-token"
const DOMAIN = "monsoon3"

// Builds the #sso-config element plus the spinner and login-content nodes the
// module toggles, mirroring _login_form.html.haml.
function setupDom({ afterLogin } = {}) {
  document.body.innerHTML = `
    <div id="sso-precheck-container"></div>
    <div id="login-content" class="login-hidden"></div>
    <div id="sso-config"
         data-keystone-url="${KEYSTONE_URL}"
         data-domain-name="${DOMAIN}"
         data-verify-url="${VERIFY_URL}"
         ${afterLogin ? `data-after-login="${afterLogin}"` : ""}
         data-login-form-id="login-content"
         data-spinner-id="sso-precheck-container"
         data-hidden-class="login-hidden"></div>
  `
}

function setCsrfMeta(token) {
  const existing = document.querySelector('meta[name="csrf-token"]')
  if (existing) existing.remove()
  if (token === null) return
  const meta = document.createElement("meta")
  meta.setAttribute("name", "csrf-token")
  meta.setAttribute("content", token)
  document.head.append(meta)
}

// Minimal fetch Response stub.
function mockResponse({ ok = true, status = 200, json = {}, headers = {} } = {}) {
  return Promise.resolve({
    ok,
    status,
    json: vi.fn().mockResolvedValue(json),
    text: vi.fn().mockResolvedValue(JSON.stringify(json)),
    headers: new Headers(headers),
  })
}

const originalFetch = global.fetch

beforeEach(() => {
  document.head.innerHTML = ""
  document.body.innerHTML = ""
  window.location.assign = vi.fn()
})

afterAll(() => {
  global.fetch = window.fetch = originalFetch
})

describe("getCsrfToken", () => {
  it("returns the token from the csrf-token meta tag", () => {
    setCsrfMeta("MY-CSRF-TOKEN")
    expect(getCsrfToken()).toBe("MY-CSRF-TOKEN")
  })

  it("returns null when the meta tag is absent", () => {
    setCsrfMeta(null)
    expect(getCsrfToken()).toBeNull()
  })
})

describe("showLoginForm", () => {
  it("hides the spinner and reveals the login form", () => {
    setupDom()
    showLoginForm()

    expect(document.getElementById("sso-precheck-container").style.display).toBe("none")
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })

  it("does nothing when the config element is missing", () => {
    document.body.innerHTML = ""
    expect(() => showLoginForm()).not.toThrow()
  })
})

describe("verifyAndRedirect", () => {
  beforeEach(() => {
    setupDom()
  })

  it("sends the token and CSRF header, then navigates to redirect_to", async () => {
    setCsrfMeta("CSRF-123")
    const redirectTo = `/${DOMAIN}/home`
    window.fetch = vi.fn().mockReturnValue(mockResponse({ json: { redirect_to: redirectTo } }))

    await verifyAndRedirect(VERIFY_URL, "subject-token", "/custom/path")

    expect(window.fetch).toHaveBeenCalledTimes(1)
    const [calledUrl, options] = window.fetch.mock.calls[0]
    expect(calledUrl).toBe(VERIFY_URL)
    expect(options.method).toBe("POST")
    expect(options.headers["X-CSRF-Token"]).toBe("CSRF-123")
    expect(options.headers["Content-Type"]).toBe("application/json")
    expect(options.headers.Accept).toBe("application/json")
    expect(JSON.parse(options.body)).toEqual({
      token: "subject-token",
      after_login: "/custom/path",
    })
    expect(window.location.assign).toHaveBeenCalledWith(redirectTo)
  })

  it("omits after_login from the body when not provided", async () => {
    setCsrfMeta("CSRF-123")
    window.fetch = vi.fn().mockReturnValue(mockResponse({ json: { redirect_to: "/x" } }))

    await verifyAndRedirect(VERIFY_URL, "subject-token")

    const options = window.fetch.mock.calls[0][1]
    expect(JSON.parse(options.body)).toEqual({ token: "subject-token" })
  })

  it("omits the CSRF header when no meta tag is present", async () => {
    setCsrfMeta(null)
    window.fetch = vi.fn().mockReturnValue(mockResponse({ json: { redirect_to: "/x" } }))

    await verifyAndRedirect(VERIFY_URL, "subject-token")

    const options = window.fetch.mock.calls[0][1]
    expect(options.headers["X-CSRF-Token"]).toBeUndefined()
  })

  it("falls back to the login form when the response is not ok", async () => {
    window.fetch = vi.fn().mockReturnValue(mockResponse({ ok: false, status: 403 }))

    await verifyAndRedirect(VERIFY_URL, "subject-token")

    expect(window.location.assign).not.toHaveBeenCalled()
    expect(document.getElementById("sso-precheck-container").style.display).toBe("none")
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })

  it("falls back to the login form when redirect_to is missing", async () => {
    window.fetch = vi.fn().mockReturnValue(mockResponse({ json: {} }))

    await verifyAndRedirect(VERIFY_URL, "subject-token")

    expect(window.location.assign).not.toHaveBeenCalled()
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })

  it("falls back to the login form when fetch rejects", async () => {
    window.fetch = vi.fn().mockRejectedValue(new Error("network"))

    await verifyAndRedirect(VERIFY_URL, "subject-token")

    expect(window.location.assign).not.toHaveBeenCalled()
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })
})

describe("performSsoPrecheck", () => {
  it("shows the login form immediately when there is no sso-config", async () => {
    document.body.innerHTML = `<div id="login-content" class="login-hidden"></div>`
    window.fetch = vi.fn()

    await performSsoPrecheck()

    // No config element means showLoginForm returns early; fetch must not run.
    expect(window.fetch).not.toHaveBeenCalled()
  })

  it("shows the login form when keystone url or domain is missing", async () => {
    document.body.innerHTML = `
      <div id="sso-precheck-container"></div>
      <div id="login-content" class="login-hidden"></div>
      <div id="sso-config" data-verify-url="${VERIFY_URL}"
           data-login-form-id="login-content"
           data-spinner-id="sso-precheck-container"
           data-hidden-class="login-hidden"></div>
    `
    window.fetch = vi.fn()

    await performSsoPrecheck()

    expect(window.fetch).not.toHaveBeenCalled()
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })

  it("verifies the subject token and navigates on a successful keystone response", async () => {
    setupDom({ afterLogin: "/custom/path" })
    setCsrfMeta("CSRF-123")
    const redirectTo = "/custom/path"

    window.fetch = vi
      .fn()
      // 1st call: keystone auth -> returns X-Subject-Token
      .mockReturnValueOnce(
        mockResponse({ headers: { "X-Subject-Token": "subject-token" } })
      )
      // 2nd call: verify endpoint -> returns redirect target
      .mockReturnValueOnce(mockResponse({ json: { redirect_to: redirectTo } }))

    await performSsoPrecheck()

    expect(window.fetch).toHaveBeenCalledTimes(2)
    const verifyCall = window.fetch.mock.calls[1]
    expect(verifyCall[0]).toBe(VERIFY_URL)
    expect(JSON.parse(verifyCall[1].body)).toEqual({
      token: "subject-token",
      after_login: "/custom/path",
    })
    expect(window.location.assign).toHaveBeenCalledWith(redirectTo)
  })

  it("shows the login form when keystone responds without a subject token", async () => {
    setupDom()
    window.fetch = vi.fn().mockReturnValue(mockResponse({ ok: true }))

    await performSsoPrecheck()

    expect(window.fetch).toHaveBeenCalledTimes(1)
    expect(window.location.assign).not.toHaveBeenCalled()
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })

  it("shows the login form when the keystone call fails", async () => {
    setupDom()
    window.fetch = vi.fn().mockRejectedValue(new Error("network"))

    await performSsoPrecheck()

    expect(window.location.assign).not.toHaveBeenCalled()
    expect(
      document.getElementById("login-content").classList.contains("login-hidden")
    ).toBe(false)
  })
})
