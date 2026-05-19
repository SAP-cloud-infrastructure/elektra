import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ssoBootstrap } from "./sso_login"

function setMeta(name: string, content: string) {
  const meta = document.createElement("meta")
  meta.setAttribute("name", name)
  meta.setAttribute("content", content)
  document.head.appendChild(meta)
}

function clearMeta() {
  document.head
    .querySelectorAll(
      'meta[name="keystone-url"], meta[name="csrf-token"], meta[name="sso-domain-name"], meta[name="sso-domain-id"], meta[name="sso-consume-path"]'
    )
    .forEach((el) => el.remove())
}

describe("ssoBootstrap", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearMeta()
    fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
  })

  afterEach(() => {
    clearMeta()
    vi.restoreAllMocks()
  })

  it("does nothing when keystone-url meta tag is missing", async () => {
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    await ssoBootstrap()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("does nothing when both domain meta tags are empty", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "")
    setMeta("sso-domain-id", "")
    setMeta("sso-consume-path", "/auth/consume")

    await ssoBootstrap()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("does nothing when sso-consume-path is missing", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")

    await ssoBootstrap()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("calls Keystone with correct URL, method, and headers when domain-name is set", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
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
    expect(body.auth.scope).toBe("unscoped")
  })

  it("uses X-User-Domain-Id when domain-id is set and domain-name is not", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-id", "abc123")
    setMeta("sso-consume-path", "/auth/consume")

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
    })

    await ssoBootstrap()

    const [, opts] = fetchSpy.mock.calls[0]
    expect(opts.headers["X-User-Domain-Id"]).toBe("abc123")
    expect(opts.headers["X-User-Domain-Name"]).toBeUndefined()
  })

  it("does not call consume endpoint when Keystone returns non-ok", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
    })

    await ssoBootstrap()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("does not call consume endpoint when X-Subject-Token header is missing", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({}), // no X-Subject-Token
    })

    await ssoBootstrap()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("posts token to consume endpoint with correct params after successful Keystone auth", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "my-csrf-token")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    const keystoneHeaders = new Headers()
    keystoneHeaders.set("X-Subject-Token", "keystone-token-abc")

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: keystoneHeaders,
      })
      .mockResolvedValueOnce({
        ok: true,
        redirected: false,
        status: 200,
      })

    // Mock window.location.reload
    const reloadMock = vi.fn()
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    })

    await ssoBootstrap()

    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const [consumeUrl, consumeOpts] = fetchSpy.mock.calls[1]
    expect(consumeUrl).toBe("/auth/consume")
    expect(consumeOpts.method).toBe("POST")
    expect(consumeOpts.credentials).toBe("same-origin")
    expect(consumeOpts.headers["X-CSRF-Token"]).toBe("my-csrf-token")
    expect(consumeOpts.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded"
    )
    expect(consumeOpts.body).toContain("auth_token=keystone-token-abc")
    expect(consumeOpts.body).toContain("raw=1")
  })

  it("redirects to the URL from consume response when redirected", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "my-csrf-token")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    const keystoneHeaders = new Headers()
    keystoneHeaders.set("X-Subject-Token", "keystone-token-abc")

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: keystoneHeaders,
      })
      .mockResolvedValueOnce({
        ok: true,
        redirected: true,
        url: "https://dashboard.example.com/home",
        status: 200,
      })

    const locationHrefSetter = vi.fn()
    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    })
    Object.defineProperty(window.location, "href", {
      set: locationHrefSetter,
    })

    await ssoBootstrap()

    expect(locationHrefSetter).toHaveBeenCalledWith(
      "https://dashboard.example.com/home"
    )
  })

  it("handles network error on Keystone fetch gracefully", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    fetchSpy.mockRejectedValueOnce(new TypeError("Failed to fetch"))

    // Should not throw
    await expect(ssoBootstrap()).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("handles network error on consume fetch gracefully", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-consume-path", "/auth/consume")

    const keystoneHeaders = new Headers()
    keystoneHeaders.set("X-Subject-Token", "keystone-token-abc")

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: keystoneHeaders,
      })
      .mockRejectedValueOnce(new TypeError("Network error"))

    // Should not throw
    await expect(ssoBootstrap()).resolves.toBeUndefined()
  })

  it("prefers domain-name over domain-id when both are present", async () => {
    setMeta("keystone-url", "https://identity.example.com")
    setMeta("csrf-token", "test-csrf")
    setMeta("sso-domain-name", "ccadmin")
    setMeta("sso-domain-id", "abc123")
    setMeta("sso-consume-path", "/auth/consume")

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
    })

    await ssoBootstrap()

    const [, opts] = fetchSpy.mock.calls[0]
    expect(opts.headers["X-User-Domain-Name"]).toBe("ccadmin")
    expect(opts.headers["X-User-Domain-Id"]).toBeUndefined()
  })
})
