import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { describe, it, expect, vi, beforeEach } from "vitest"
import GardenerVersion from "./GardenerVersion"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createGardenerApi } from "../apiClient"

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Mock the useRouteContext hook
const mockUseRouteContext = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useRouteContext: () => mockUseRouteContext(),
}))

// Mock API client
const mockApiClient = {
  gardener: {
    getGardenerInfo: vi.fn(),
  },
} as unknown as ReturnType<typeof createGardenerApi>

describe("<GardenerVersion />", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows error when no apiClient is available", async () => {
    mockUseRouteContext.mockReturnValue({})
    render(<GardenerVersion />, { wrapper: createWrapper() })
    // Query runs, throws error "API client is not available", and we show it
    expect(await screen.findByText(/Gardener Version:.*API client is not available/)).toBeInTheDocument()
  })

  it("shows loading spinner when fetching", () => {
    mockUseRouteContext.mockReturnValue({ apiClient: mockApiClient })
    mockApiClient.gardener.getGardenerInfo = vi.fn(
      () => new Promise<{ version?: string } | null>(() => {})
    ) // Never resolves

    const { container } = render(<GardenerVersion />, { wrapper: createWrapper() })
    expect(screen.getByText("Gardener Version:")).toBeInTheDocument()
    // Spinner is present - check for the spinner's SVG element
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("shows version when data is available", async () => {
    mockUseRouteContext.mockReturnValue({ apiClient: mockApiClient })
    mockApiClient.gardener.getGardenerInfo = vi.fn(() =>
      Promise.resolve<{ version?: string } | null>({ version: "v1.148.3" })
    )

    render(<GardenerVersion />, { wrapper: createWrapper() })

    expect(await screen.findByText("Gardener Version: v1.148.3")).toBeInTheDocument()
  })

  it("shows 'Not available' when data is null", async () => {
    mockUseRouteContext.mockReturnValue({ apiClient: mockApiClient })
    mockApiClient.gardener.getGardenerInfo = vi.fn(() => Promise.resolve<{ version?: string } | null>(null))

    render(<GardenerVersion />, { wrapper: createWrapper() })

    expect(await screen.findByText("Gardener Version: Not available")).toBeInTheDocument()
  })

  it("shows error message when fetch fails", async () => {
    mockUseRouteContext.mockReturnValue({ apiClient: mockApiClient })
    const error = new Error("Network error")
    error.name = "Failed to fetch"
    mockApiClient.gardener.getGardenerInfo = vi.fn(() => Promise.reject<{ version?: string } | null>(error))

    render(<GardenerVersion />, { wrapper: createWrapper() })

    expect(await screen.findByText(/Gardener Version: Failed to fetch/)).toBeInTheDocument()
  })

  it("shows 'Not available' when version is not present in response", async () => {
    mockUseRouteContext.mockReturnValue({ apiClient: mockApiClient })
    mockApiClient.gardener.getGardenerInfo = vi.fn(() => Promise.resolve<{ version?: string } | null>({}))

    render(<GardenerVersion />, { wrapper: createWrapper() })

    expect(await screen.findByText("Gardener Version: Not available")).toBeInTheDocument()
  })
})
