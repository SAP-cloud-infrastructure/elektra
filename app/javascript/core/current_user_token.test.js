import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import "./current_user_token"

const fetchSpy = vi.fn()

describe("getCurrentUserToken", () => {
  beforeEach(() => {
    // Reset window globals before each test
    delete window.scopedProjectFid
    delete window.scopedDomainFid

    // Mock global fetch with default response
    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({ value: "default-token" }),
    })
    vi.stubGlobal("fetch", fetchSpy)
    fetchSpy.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should define _getCurrentToken on window object", () => {
    expect(window._getCurrentToken).toBeDefined()
  })

  it("should return a promise object", () => {
    expect(window._getCurrentToken()).toBeInstanceOf(Promise)
  })

  it("should call fetch with correct base path '/os-api/__token'", async () => {
    fetchSpy.mockResolvedValueOnce({
      json: () => Promise.resolve({ value: "token123" }),
    })

    await window._getCurrentToken()

    expect(fetchSpy).toHaveBeenCalledWith("/os-api/__token")
  })

  it("should build path with scopedProjectFid when set", async () => {
    window.scopedProjectFid = "proj-123"
    fetchSpy.mockResolvedValueOnce({
      json: () => Promise.resolve({ value: "token456" }),
    })

    await window._getCurrentToken()

    expect(fetchSpy).toHaveBeenCalledWith("proj-123/os-api/__token")
  })

  it("should build path with scopedDomainFid when set", async () => {
    window.scopedDomainFid = "domain-789"
    fetchSpy.mockResolvedValueOnce({
      json: () => Promise.resolve({ value: "token789" }),
    })

    await window._getCurrentToken()

    expect(fetchSpy).toHaveBeenCalledWith("/domain-789/os-api/__token")
  })

  it("should build full path with both scopedProjectFid and scopedDomainFid", async () => {
    window.scopedProjectFid = "proj-123"
    window.scopedDomainFid = "domain-789"
    fetchSpy.mockResolvedValueOnce({
      json: () => Promise.resolve({ value: "token-full" }),
    })

    await window._getCurrentToken()

    expect(fetchSpy).toHaveBeenCalledWith("/domain-789/proj-123/os-api/__token")
  })

  it("should return authToken and remaining token properties", async () => {
    fetchSpy.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          value: "secret-token",
          expires: "2026-01-20",
          userId: 123,
        }),
    })

    const result = await window._getCurrentToken()

    expect(result).toEqual({
      authToken: "secret-token",
      expires: "2026-01-20",
      userId: 123,
    })
  })

  it("should handle fetch error", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network error"))

    await expect(window._getCurrentToken()).rejects.toThrow()
  })
})
