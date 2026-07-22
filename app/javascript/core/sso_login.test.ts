/**
 * Tests for sso_login.ts — browser-side mTLS SSO via /verify-auth-token.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ssoBootstrap } from "./sso_login"

function setMeta(name: string, content: string) {
  const meta = document.createElement("meta")
  meta.name = name
  meta.content = content
  document.head.appendChild(meta)
}

describe("ssoBootstrap", () => {
  let fetchSpy: ReturnType<typeof vi.fn>
  let formSubmitSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.head.innerHTML = ""
    document.body.innerHTML = ""
    fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy
    formSubmitSpy = vi.fn()
    // Mock form.submit() since jsdom doesn't support it
    vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(
      formSubmitSpy
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- No-op cases ---

  it("does nothing when keystone-url meta is missing", async () => {
    setMeta("sso-domain-name", "ccadmin")

    await ssoBootstrap()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("does nothing when both domain meta tags are missing", async () => {
    setMeta("keystone-url", "https://identity.example.com")

    await ssoBootstrap()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  // --- Step 1: Keystone fetch ---

  it("sends correct request to Keystone with X-User-Domain-Name", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("csrf-token", "csrf123")

    fetchSpy.mockResolvedValue({
      ok: true,
      headers: new Headers({ "X-Subject-Token": "tok_abc123" }),
    })

    await ssoBootstrap()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe("https://identity.example.com/v3/auth/tokens")
    expect(opts.method).toBe("POST")
    expect(opts.mode).toBe("cors")
    expect(opts.credentials).toBeUndefined()
    expect(opts.headers["X-User-Domain-Name"]).toBe("ccadmin")
    expect(opts.headers["Content-Type"]).toBe("application/json")

    const body = JSON.parse(opts.body)
    expect(body.auth.identity.methods).toEqual(["external"])
  })

  it("sends X-User-Domain-Id when domain-name is absent", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-id", "domain-uuid-123")
    setMeta("csrf-token", "csrf123")

    fetchSpy.mockResolvedValue({
      ok: true,
      headers: new Headers({ "X-Subject-Token": "tok_abc123" }),
    })

    await ssoBootstrap()

    const [, opts] = fetchSpy.mock.calls[0]
    expect(opts.headers["X-User-Domain-Id"]).toBe("domain-uuid-123")
    expect(opts.headers["X-User-Domain-Name"]).toBeUndefined()
  })

  // --- Step 1 failure modes ---

  it("does nothing on CORS/network error (fetch throws)", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("csrf-token", "csrf123")

    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"))

    await ssoBootstrap()

    expect(formSubmitSpy).not.toHaveBeenCalled()
  })

  it("does nothing when Keystone returns non-2xx", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("csrf-token", "csrf123")

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
    })

    await ssoBootstrap()

    expect(formSubmitSpy).not.toHaveBeenCalled()
  })

  it("does nothing when X-Subject-Token header is missing", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("csrf-token", "csrf123")

    fetchSpy.mockResolvedValue({
      ok: true,
      headers: new Headers({}),
    })

    await ssoBootstrap()

    expect(formSubmitSpy).not.toHaveBeenCalled()
  })

  // --- Step 2: Form submission to /verify-auth-token ---

  it("submits a form to /verify-auth-token with token and CSRF", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("csrf-token", "csrf123")

    fetchSpy.mockResolvedValue({
      ok: true,
      headers: new Headers({ "X-Subject-Token": "gAAAAABk_token_value" }),
    })

    await ssoBootstrap()

    expect(formSubmitSpy).toHaveBeenCalledTimes(1)

    // Find the form that was appended to the body
    const form = document.body.querySelector("form")
    expect(form).not.toBeNull()
    expect(form!.method).toBe("post")
    expect(form!.action).toContain("/verify-auth-token")
    expect(form!.style.display).toBe("none")

    // Verify token input
    const tokenInput = form!.querySelector(
      'input[name="token"]'
    ) as HTMLInputElement
    expect(tokenInput).not.toBeNull()
    expect(tokenInput.value).toBe("gAAAAABk_token_value")
    expect(tokenInput.type).toBe("hidden")

    // Verify CSRF input
    const csrfInput = form!.querySelector(
      'input[name="authenticity_token"]'
    ) as HTMLInputElement
    expect(csrfInput).not.toBeNull()
    expect(csrfInput.value).toBe("csrf123")
    expect(csrfInput.type).toBe("hidden")
  })

  it("works with domain-id instead of domain-name for form flow", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("sso-domain-id", "domain-uuid-456")
    setMeta("csrf-token", "tok_csrf")

    fetchSpy.mockResolvedValue({
      ok: true,
      headers: new Headers({ "X-Subject-Token": "tok_xyz" }),
    })

    await ssoBootstrap()

    expect(formSubmitSpy).toHaveBeenCalledTimes(1)
    const form = document.body.querySelector("form")
    const tokenInput = form!.querySelector(
      'input[name="token"]'
    ) as HTMLInputElement
    expect(tokenInput.value).toBe("tok_xyz")
  })
})
