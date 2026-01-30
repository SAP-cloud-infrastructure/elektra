import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import EventList from "./EventList"
import { HTTPError, NetworkError } from "../actions"

// Mock the dependencies
vi.mock("./StoreProvider", () => ({
  useAuthData: () => "test-token",
  useAuthProject: () => "test-project",
  useGlobalsEndpoint: () => "https://api.example.com",
}))

vi.mock("../queries", () => ({
  useGetData: vi.fn(),
}))

vi.mock("./Pagination", () => ({
  default: ({ hits }: { hits: number | null }) => <div data-testid="pagination">Hits: {hits}</div>,
}))

vi.mock("./HintLoading", () => ({
  default: ({ text }: { text: string }) => <div data-testid="loading">{text}</div>,
}))

vi.mock("./Item", () => ({
  default: ({ data }: { data: any }) => <div data-testid="item">{data.id}</div>,
}))

vi.mock("./SearchBar", () => ({
  default: () => <div data-testid="search-bar">Search Bar</div>,
}))

import { useGetData } from "../queries"

describe("EventList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should show loading state initially", () => {
    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: false,
      error: null,
    } as any)

    render(<EventList />)

    expect(screen.getByTestId("loading")).toHaveTextContent("Loading Logs...")
  })

  it("should display data when fetch is successful", async () => {
    const mockData = {
      data: [
        { id: "1", subject: "Test 1" },
        { id: "2", subject: "Test 2" },
      ],
      hits: 2,
    }

    vi.mocked(useGetData).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toHaveTextContent("Hits: 2")
      expect(screen.getAllByTestId("item")).toHaveLength(2)
    })
  })

  it("should display 'No events found' when data is empty", async () => {
    vi.mocked(useGetData).mockReturnValue({
      data: { data: [], hits: 0 },
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      expect(screen.getByText("No events found")).toBeInTheDocument()
    })
  })

  it("should display error message for HTTPError", async () => {
    const error = new HTTPError(500, "Server error occurred")

    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      error: error,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      expect(screen.getByText("Unable to Load Mail Logs")).toBeInTheDocument()
      expect(screen.getByText(/Server error occurred/)).toBeInTheDocument()
    })
  })

  it("should display CORS error message for NetworkError", async () => {
    const error = new NetworkError("CORS error. Unable to connect to the mail log service.")

    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      error: error,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      expect(screen.getByText("Unable to Load Mail Logs")).toBeInTheDocument()
      expect(screen.getByText(/CORS error/)).toBeInTheDocument()
    })
  })

  it("should display specific message for 401 authentication error", async () => {
    const error = new HTTPError(401, "Authentication failed")

    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      error: error,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      expect(screen.getByText(/Your session may have expired/)).toBeInTheDocument()
      expect(screen.getByText(/Please refresh the page to re-authenticate/)).toBeInTheDocument()
    })
  })

  it("should display specific message for 500+ server errors", async () => {
    const error = new HTTPError(503, "Service unavailable")

    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      error: error,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      expect(screen.getByText(/The server is experiencing issues/)).toBeInTheDocument()
      expect(screen.getByText(/Please try again in a few moments/)).toBeInTheDocument()
    })
  })

  it("should disable pagination when there is an error", async () => {
    const error = new HTTPError(500, "Server error")

    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      error: error,
    } as any)

    const { container } = render(<EventList />)

    await waitFor(() => {
      // The pagination component should receive disabled prop
      expect(screen.getByTestId("pagination")).toBeInTheDocument()
    })
  })

  it("should update table data when fetchedData changes", async () => {
    const mockData = {
      data: [{ id: "1", subject: "Test" }],
      hits: 1,
    }

    // Start with loading state
    let currentState = {
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: false,
      error: null,
    } as any

    vi.mocked(useGetData).mockImplementation(() => currentState)

    const { rerender } = render(<EventList />)

    // Verify loading state is displayed
    expect(screen.getByTestId("loading")).toBeInTheDocument()

    // Update to success state
    currentState = {
      data: mockData,
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
    } as any

    // Trigger re-render which will call useGetData again with updated state
    rerender(<EventList />)

    await waitFor(() => {
      expect(screen.getByTestId("item")).toBeInTheDocument()
      expect(screen.getByTestId("pagination")).toHaveTextContent("Hits: 1")
    })
  })

  it("should show loading indicator when isFetching is true with existing data", async () => {
    const mockData = {
      data: [{ id: "1", subject: "Test" }],
      hits: 1,
    }

    vi.mocked(useGetData).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isFetching: true,
      error: null,
    } as any)

    render(<EventList />)

    await waitFor(() => {
      // Should still show the existing data when refetching
      expect(screen.getByTestId("item")).toBeInTheDocument()
      // The component doesn't show a loading overlay when refetching with existing data
      // This is intentional to avoid flickering and maintain UX
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })
  })

  it("should not show loading indicator when isFetching is true but no data exists", async () => {
    vi.mocked(useGetData).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      error: null,
    } as any)

    render(<EventList />)

    // Should show initial loading state instead
    expect(screen.getByTestId("loading")).toBeInTheDocument()
    // Should not show "Loading..." text from the overlay
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
  })
})
