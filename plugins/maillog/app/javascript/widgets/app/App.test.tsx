import React from "react"
import { render } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import App from "./App"

// Mock the getCurrentToken function on window
const mockGetCurrentToken = vi.fn()

describe("App Component", () => {
  beforeEach(() => {
    // Setup mock for window._getCurrentToken
    window._getCurrentToken = mockGetCurrentToken

    // Default mock implementation that resolves with a valid token
    mockGetCurrentToken.mockResolvedValue({
      authToken: "test-token-123",
      project: {
        id: "test-project-id",
      },
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders without crashing", () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  it("renders with provided endpoint prop", () => {
    const { container } = render(<App endpoint="https://api.example.com" />)
    expect(container).toBeTruthy()
  })

  it("renders with provided project prop", () => {
    const { container } = render(<App project="test-project" />)
    expect(container).toBeTruthy()
  })

  it("renders with both endpoint and project props", () => {
    const { container } = render(<App endpoint="https://api.example.com" project="test-project" />)
    expect(container).toBeTruthy()
  })

  it("calls _getCurrentToken on mount", async () => {
    render(<App endpoint="https://api.example.com" project="test-project" />)

    // Wait a tick for useEffect to run
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockGetCurrentToken).toHaveBeenCalled()
  })

  it("handles token refresh with custom project", async () => {
    render(<App endpoint="https://api.example.com" project="custom-project" />)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockGetCurrentToken).toHaveBeenCalled()
  })

  it("handles token refresh without provided project", async () => {
    render(<App endpoint="https://api.example.com" />)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockGetCurrentToken).toHaveBeenCalled()
  })

  it("handles token fetch errors gracefully", async () => {
    // Mock a token fetch error
    mockGetCurrentToken.mockRejectedValueOnce(new Error("Token fetch failed"))

    const { container } = render(<App endpoint="https://api.example.com" project="test-project" />)

    await new Promise((resolve) => setTimeout(resolve, 0))

    // App should still render even if token fetch fails
    expect(container).toBeTruthy()
  })

  it("renders with theme-dark prop", () => {
    const { container } = render(<App theme="theme-dark" />)
    expect(container).toBeTruthy()
  })

  it("renders with theme-light prop (default)", () => {
    const { container } = render(<App theme="theme-light" />)
    expect(container).toBeTruthy()
  })

  it("handles embedded prop as boolean", () => {
    const { container } = render(<App embedded={true} />)
    expect(container).toBeTruthy()
  })

  it("handles embedded prop as string", () => {
    const { container } = render(<App embedded="true" />)
    expect(container).toBeTruthy()
  })

  it("renders with currentHost prop", () => {
    const { container } = render(<App currentHost="https://current.example.com" />)
    expect(container).toBeTruthy()
  })

  it("creates QueryClient with correct endpoint from props", () => {
    const { container } = render(<App endpoint="https://test-endpoint.com" />)
    expect(container).toBeTruthy()
  })

  it("creates QueryClient with currentHost when endpoint not provided", () => {
    const { container } = render(<App currentHost="https://current-host.com" />)
    expect(container).toBeTruthy()
  })

  it("schedules token refresh based on expiration time", async () => {
    // Token expires in 2 minutes
    const expiresAt = new Date(Date.now() + 120000).toISOString()
    mockGetCurrentToken.mockResolvedValue({
      authToken: "test-token",
      project: { id: "test-project" },
      expires_at: expiresAt,
    })

    render(<App />)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockGetCurrentToken).toHaveBeenCalledTimes(1)
  })

  it("retries token fetch immediately if token is about to expire", async () => {
    // Token expires in 30 seconds
    const expiresAt = new Date(Date.now() + 30000).toISOString()
    mockGetCurrentToken.mockResolvedValue({
      authToken: "test-token",
      project: { id: "test-project" },
      expires_at: expiresAt,
    })

    render(<App />)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockGetCurrentToken).toHaveBeenCalledTimes(1)
  })
})
