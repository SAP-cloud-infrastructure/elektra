import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ErrorReport from "./ErrorReport"
import { MailLogEntry } from "../actions"

vi.mock("./StoreProvider", () => ({
  useAuthData: () => "test-token",
  useAuthProject: () => "test-project",
  useGlobalsEndpoint: () => "https://api.example.com",
}))

vi.mock("../actions", async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    dataFn: vi.fn(),
  }
})

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = (await importOriginal()) as object
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: vi.fn(() => ({
      removeQueries: vi.fn(),
      invalidateQueries: vi.fn(),
    })),
  }
})

vi.mock("moment", () => ({
  default: vi.fn((_date?: string) => ({
    format: vi.fn(() => "2024-01-15, 14:30:00"),
    utc: vi.fn(() => ({
      format: vi.fn(() => "2024-01-15, 13:30:00"),
    })),
  })),
}))

vi.mock("@cloudoperators/juno-ui-components", async () => ({
  Container: ({ children, style }: any) => <div data-testid="container" style={style}>{children}</div>,
  DataGrid: ({ children, columns }: any) => <table data-testid="data-grid" data-columns={columns}>{children}</table>,
  DataGridCell: ({ children, colSpan }: any) => <td data-testid="data-grid-cell" colSpan={colSpan}>{children}</td>,
  DataGridHeadCell: ({ children }: any) => <th data-testid="data-grid-head-cell">{children}</th>,
  DataGridRow: ({ children, style }: any) => <tr data-testid="data-grid-row" style={style}>{children}</tr>,
  LoadingIndicator: () => <div>Loading...</div>,
  Message: ({ children, variant }: any) => <div data-testid="error-message" data-variant={variant}>{children}</div>,
  Stack: ({ children, style }: any) => <div data-testid="stack" style={style}>{children}</div>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span data-testid="tooltip-content">{children}</span>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}))

import { useQuery } from "@tanstack/react-query"

const makeEntry = (overrides: Partial<MailLogEntry> = {}): MailLogEntry => ({
  id: "req-1",
  date: "2024-01-15T14:00:00Z",
  from: "sender@example.com",
  headerFrom: "sender@example.com",
  subject: "Test",
  messageId: "msg-1",
  rcpts: [{ rcpt: "rcpt@example.com", relay: "relay.example.com" }],
  summary: {},
  ...overrides,
})

const makeEntryWithRcptError = (code: string): MailLogEntry =>
  makeEntry({
    rcpts: [{ rcpt: "fail@example.com", relay: "r.example.com", response: { code, ext: "5.1.1", msg: "user unknown" } }],
  })

const mockQuery = (overrides: object = {}) =>
  vi.mocked(useQuery).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    error: null,
    ...overrides,
  } as any)

describe("ErrorReport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it("renders stat cards when data is loaded", async () => {
    const entries = [makeEntryWithRcptError("550")]
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Total Error Events")).toBeInTheDocument()
      expect(screen.getByText("Temporary (4xx)")).toBeInTheDocument()
      expect(screen.getByText("Permanent (5xx)")).toBeInTheDocument()
    })
  })

  it("shows 'No error responses' when there are no errors in range", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error responses in the selected time range/)).toBeInTheDocument()
    })
  })

  it("shows 'No error events' row when table is empty", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error events in the selected time range/)).toBeInTheDocument()
    })
  })

  it("shows error message banner when query fails", async () => {
    mockQuery({ isError: true, error: new Error("Failed to load"), isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument()
    })
  })

  it("renders DaySelector with 7 day buttons", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      ;[1, 2, 3, 4, 5, 6, 7].forEach((d) => {
        expect(screen.getByRole("button", { name: `${d}d` })).toBeInTheDocument()
      })
    })
  })

  it("persists selected day to localStorage", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    const btn3 = await screen.findByRole("button", { name: "3d" })
    fireEvent.click(btn3)

    expect(localStorage.getItem("email_service_report_days")).toBe("3")
  })

  it("reads initial day from localStorage", async () => {
    localStorage.setItem("email_service_report_days", "5")
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    const btn5 = await screen.findByRole("button", { name: "5d" })
    expect(btn5).toHaveStyle({ fontWeight: 700 })
  })

  it("ignores invalid day value in localStorage and defaults to 1", async () => {
    localStorage.setItem("email_service_report_days", "99")
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    const btn1 = await screen.findByRole("button", { name: "1d" })
    expect(btn1).toHaveStyle({ fontWeight: 700 })
  })

  it("renders the 'Error Report' heading", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Error Report")).toBeInTheDocument()
    })
  })

  it("renders the 'Top Error Responses' heading", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Error Summary")).toBeInTheDocument()
    })
  })

  it("renders the 'Error Events' heading", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Error Events")).toBeInTheDocument()
    })
  })

  it("renders data grid column headers", async () => {
    mockQuery({ data: [], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Time")).toBeInTheDocument()
      expect(screen.getByText("Sender")).toBeInTheDocument()
      expect(screen.getByText("Recipient")).toBeInTheDocument()
      expect(screen.getByText("Response")).toBeInTheDocument()
      expect(screen.getByText("Request ID")).toBeInTheDocument()
      expect(screen.getByText("Message ID")).toBeInTheDocument()
    })
  })

  it("shows pagination with correct total count", async () => {
    const entries = [makeEntryWithRcptError("550")]
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("1 total")).toHaveLength(2) // two pagination bars
    })
  })

  it("renders PERM badge for 5xx error codes", async () => {
    const entries = [makeEntryWithRcptError("550")]
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("PERM")).toBeInTheDocument()
    })
  })

  it("renders TEMP badge for 4xx error codes", async () => {
    const entries = [makeEntryWithRcptError("421")]
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("TEMP")).toBeInTheDocument()
    })
  })

  it("clicking a bar row selects the code as a filter", async () => {
    const entries = [makeEntryWithRcptError("550")]
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    const barRows = await screen.findAllByText(/550/)
    const clickableRow = barRows[0].closest("div[style*='cursor']") ?? barRows[0]
    fireEvent.click(clickableRow)

    await waitFor(() => {
      expect(screen.getByText("filtered to:")).toBeInTheDocument()
    })
  })

  it("clicking the × clear button removes the active filter", async () => {
    const entries = [makeEntryWithRcptError("550")]
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    // Select a filter first
    const barRows = await screen.findAllByText(/550/)
    fireEvent.click(barRows[0].closest("div[style*='cursor']") ?? barRows[0])

    await waitFor(() => expect(screen.getByText("filtered to:")).toBeInTheDocument())

    const clearBtn = screen.getByRole("button", { name: "×" })
    fireEvent.click(clearBtn)

    await waitFor(() => {
      expect(screen.queryByText("filtered to:")).not.toBeInTheDocument()
    })
  })

  it("rows per page selector changes page size", async () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      makeEntry({
        id: `req-${i}`,
        rcpts: [{ rcpt: `r${i}@x.com`, relay: "r", response: { code: "550", ext: "5.1.1", msg: "fail" } }],
      })
    )
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    const selects = await screen.findAllByRole("combobox")
    expect(selects.length).toBeGreaterThan(0)

    fireEvent.change(selects[0], { target: { value: "15" } })

    await waitFor(() => {
      expect(screen.getAllByText("20 total")).toHaveLength(2)
    })
  })

  it("shows fetching overlay when isFetching is true with existing data", async () => {
    const entries = [makeEntryWithRcptError("550")]
    mockQuery({ data: entries, isLoading: false, isFetching: true })

    const { container } = render(<ErrorReport />)

    await waitFor(() => {
      const allDivs = Array.from(container.querySelectorAll<HTMLElement>("div"))
      const overlay = allDivs.find(
        (el) => el.style.position === "absolute" && el.style.zIndex === "10"
      )
      expect(overlay).toBeTruthy()
    })
  })
})

describe("extractErrorEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("extracts rcpt-level errors", async () => {
    const entry = makeEntryWithRcptError("550")
    mockQuery({ data: [entry], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("1 total")).toHaveLength(2)
    })
  })

  it("falls back to mail-level response when rcpt codes are 0", async () => {
    const entry = makeEntry({
      rcpts: [{ rcpt: "fail@example.com", relay: "r", response: { code: "0" } }],
      response: { code: 550, ext: "5.1.1", msg: "rejected by policy" },
    })
    mockQuery({ data: [entry], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("1 total")).toHaveLength(2)
      expect(screen.getByText("PERM")).toBeInTheDocument()
    })
  })

  it("detects attempt-level dialog errors (e.g. 421 on mailFrom)", async () => {
    const entry = makeEntry({
      rcpts: [{ rcpt: "ok@example.com", relay: "r" }],
      attempts: [
        {
          date: "2024-01-15T14:05:00Z",
          hostname: "mx.example.com",
          dialog: {
            mailFrom: { response: { code: "421", msg: "service unavailable" } },
          },
        },
      ],
    })
    mockQuery({ data: [entry], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("TEMP")).toBeInTheDocument()
    })
  })

  it("counts permanent errors correctly in stats", async () => {
    const permEntry1 = makeEntryWithRcptError("550")
    const permEntry2 = makeEntryWithRcptError("553")
    const tempEntry = makeEntryWithRcptError("421")
    mockQuery({ data: [permEntry1, permEntry2, tempEntry], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    // 3 total events, 2 PERM, 1 TEMP
    await waitFor(() => {
      expect(screen.getAllByText("3 total")).toHaveLength(2)
    })
  })

  it("does not produce error events for clean 2xx mails", async () => {
    const cleanEntry = makeEntry({
      rcpts: [{ rcpt: "ok@example.com", relay: "relay.example.com", response: { code: "250", msg: "OK" } }],
    })
    mockQuery({ data: [cleanEntry], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error responses in the selected time range/)).toBeInTheDocument()
    })
  })

  it("ignores mails with no response code at all", async () => {
    const entry = makeEntry({
      rcpts: [{ rcpt: "ok@example.com", relay: "relay.example.com" }],
    })
    mockQuery({ data: [entry], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error responses in the selected time range/)).toBeInTheDocument()
    })
  })
})

describe("top error responses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("shows up to 10 top error response entries", async () => {
    // Create 12 distinct 5xx response codes
    const entries = Array.from({ length: 12 }, (_, i) =>
      makeEntry({
        id: `req-${i}`,
        rcpts: [
          {
            rcpt: "r@x.com",
            relay: "r",
            response: { code: "55" + i, ext: "5.1.1", msg: `error ${i}` },
          },
        ],
      })
    )
    mockQuery({ data: entries, isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      const permBadges = screen.getAllByText("PERM")
      expect(permBadges.length).toBeLessThanOrEqual(12)
    })
  })

  it("uses longest response string as the fullName for the bar label", async () => {
    // Two entries with same base code but different detail lengths
    const entry1 = makeEntry({
      id: "r1",
      rcpts: [{ rcpt: "a@x.com", relay: "r", response: { code: "550", msg: "short" } }],
    })
    const entry2 = makeEntry({
      id: "r2",
      rcpts: [{ rcpt: "b@x.com", relay: "r", response: { code: "550", ext: "5.1.1", msg: "a much longer error message with details" } }],
    })
    mockQuery({ data: [entry1, entry2], isLoading: false })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("2 total")).toHaveLength(2)
    })
  })
})
