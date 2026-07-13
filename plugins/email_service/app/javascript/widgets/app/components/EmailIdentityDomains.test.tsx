import { render, screen, waitFor, act } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { describe, it, expect, vi, beforeEach } from "vitest"
import EmailIdentityDomains from "./EmailIdentityDomains"

vi.mock("./StoreProvider", () => ({
  useAuthData: () => "test-token",
  useGlobalsCronusEndpoint: () => "https://cronus-api.qa-de-1.cloud.sap",
}))

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  }
})

import { useQuery } from "@tanstack/react-query"

const mockQuery = (overrides: object = {}) =>
  vi.mocked(useQuery).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as any)

const mockDomains = [
  { domain: "example.com", object: "header_domain" },
  { domain: "test.sap.com", object: "header_domain" },
]

describe("EmailIdentityDomains", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the heading", async () => {
    mockQuery({ data: { data: [] }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })
    expect(screen.getByText("Email Identity Domains")).toBeInTheDocument()
  })

  it("renders the Add Domain button", async () => {
    mockQuery({ data: { data: [] }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })
    expect(screen.getByRole("button", { name: "Add Domain" })).toBeInTheDocument()
  })

  it("renders column headers", async () => {
    mockQuery({ data: { data: [] }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })
    expect(screen.getByText("Domain")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("DKIM")).toBeInTheDocument()
  })

  it("does not render Configuration Set or Actions column headers", async () => {
    mockQuery({ data: { data: [] }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })
    expect(screen.queryByText("Configuration Set")).not.toBeInTheDocument()
    expect(screen.queryByText("Actions")).not.toBeInTheDocument()
  })

  it("shows empty state when no domains", async () => {
    mockQuery({ data: { data: [] }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })
    expect(screen.getByText("No domains configured.")).toBeInTheDocument()
  })

  it("renders domain rows when data is loaded", async () => {
    mockQuery({ data: { data: mockDomains }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })

    await waitFor(() => {
      expect(screen.getByText("example.com")).toBeInTheDocument()
      expect(screen.getByText("test.sap.com")).toBeInTheDocument()
    })
  })

  it("renders trash icon Remove buttons for each domain", async () => {
    mockQuery({ data: { data: mockDomains }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })

    await waitFor(() => {
      expect(screen.getAllByTitle("Remove domain")).toHaveLength(2)
    })
  })

  it("shows permission error message for 401 errors", async () => {
    mockQuery({
      isError: true,
      error: new Error("Authentication failed (401). Please refresh the page to re-authenticate."),
      isLoading: false,
    })
    await act(async () => { render(<EmailIdentityDomains />) })

    await waitFor(() => {
      expect(screen.getByText(/don't have the required permissions/)).toBeInTheDocument()
    })
  })

  it("shows permission error message for insufficient permissions error", async () => {
    mockQuery({
      isError: true,
      error: new Error("Service temporarily unavailable (500). insufficient permissions"),
      isLoading: false,
    })
    await act(async () => { render(<EmailIdentityDomains />) })

    await waitFor(() => {
      expect(screen.getByText(/email_user or email_admin/)).toBeInTheDocument()
    })
  })

  it("shows generic error message for other errors", async () => {
    mockQuery({
      isError: true,
      error: new Error("Network error"),
      isLoading: false,
    })
    await act(async () => { render(<EmailIdentityDomains />) })

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument()
    })
  })

  it("opens modal with step 1 when Add Domain is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event")
    const user = userEvent.setup()
    mockQuery({ data: { data: [] }, isLoading: false })

    await act(async () => { render(<EmailIdentityDomains />) })

    await user.click(screen.getByRole("button", { name: "Add Domain" }))

    expect(screen.getByText("Domain & Selector")).toBeInTheDocument()
  })

  it("shows confirm delete modal when trash icon clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event")
    const user = userEvent.setup()
    mockQuery({ data: { data: mockDomains }, isLoading: false })

    await act(async () => { render(<EmailIdentityDomains />) })

    const trashButtons = await screen.findAllByTitle("Remove domain")
    await user.click(trashButtons[0])

    await waitFor(() => {
      expect(screen.getByText("Remove Domain")).toBeInTheDocument()
      expect(screen.getByText("Are you sure you want to remove:")).toBeInTheDocument()
    })
  })

  it("shows not configured message when cronusEndpoint is empty", async () => {
    vi.doMock("./StoreProvider", () => ({
      useAuthData: () => "test-token",
      useGlobalsCronusEndpoint: () => "",
    }))

    mockQuery({ data: { data: [] }, isLoading: false })
    await act(async () => { render(<EmailIdentityDomains />) })

    expect(screen.queryByText("Loading…")).not.toBeInTheDocument()
  })
})
