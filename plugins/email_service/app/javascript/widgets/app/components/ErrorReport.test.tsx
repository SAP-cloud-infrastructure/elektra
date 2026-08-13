import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ErrorReport, { fetchAllTagged } from "./ErrorReport"
import { MailLogEntry, dataFn, HTTPError } from "../actions"

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
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Total Error Events")).toBeInTheDocument()
      expect(screen.getByText("Temporary (4xx)")).toBeInTheDocument()
      expect(screen.getByText("Permanent (5xx)")).toBeInTheDocument()
    })
  })

  it("shows 'No error responses' when there are no errors in range", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error responses in the selected time range/)).toBeInTheDocument()
    })
  })

  it("shows 'No error events' row when table is empty", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error events in the selected time range/)).toBeInTheDocument()
    })
  })

  it("shows partial data warning when some pages failed", async () => {
    const entries = Array.from({ length: 100 }, (_, i) => makeEntry({ id: `r${i}` }))
    vi.mocked(dataFn)
      .mockResolvedValueOnce({ data: entries, hits: 200 })
      .mockRejectedValue(new HTTPError(500, "Server Error"))

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/Some mail records could not be loaded/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it("shows error message banner when fetch fails", async () => {
    vi.mocked(dataFn).mockRejectedValue(new HTTPError(401, "Unauthorized"))

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument()
    })
  })

  it("renders DaySelector with 7 day buttons", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      ;[1, 2, 3, 4, 5, 6, 7].forEach((d) => {
        expect(screen.getByRole("button", { name: `${d}d` })).toBeInTheDocument()
      })
    })
  })

  it("persists selected day to localStorage", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    const btn3 = await screen.findByRole("button", { name: "3d" })
    fireEvent.click(btn3)

    expect(localStorage.getItem("email_service_report_days")).toBe("3")
  })

  it("reads initial day from localStorage", async () => {
    localStorage.setItem("email_service_report_days", "5")
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    const btn5 = await screen.findByRole("button", { name: "5d" })
    expect(btn5).toHaveStyle({ fontWeight: 700 })
  })

  it("ignores invalid day value in localStorage and defaults to 1", async () => {
    localStorage.setItem("email_service_report_days", "99")
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    const btn1 = await screen.findByRole("button", { name: "1d" })
    expect(btn1).toHaveStyle({ fontWeight: 700 })
  })

  it("renders the 'Error Report' heading", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Error Report")).toBeInTheDocument()
    })
  })

  it("renders the 'Top Error Responses' heading", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Error Summary")).toBeInTheDocument()
    })
  })

  it("renders the 'Error Events' heading", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("Error Events")).toBeInTheDocument()
    })
  })

  it("renders data grid column headers", async () => {
    vi.mocked(dataFn).mockResolvedValue({ data: [], hits: 0 })

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
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("1 total")).toHaveLength(2)
    })
  })

  it("renders PERM badge for 5xx error codes", async () => {
    const entries = [makeEntryWithRcptError("550")]
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("PERM")).toBeInTheDocument()
    })
  })

  it("renders TEMP badge for 4xx error codes", async () => {
    const entries = [makeEntryWithRcptError("421")]
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("TEMP")).toBeInTheDocument()
    })
  })

  it("clicking a bar row selects the code as a filter", async () => {
    const entries = [makeEntryWithRcptError("550")]
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

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
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

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
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

    const selects = await screen.findAllByRole("combobox")
    expect(selects.length).toBeGreaterThan(0)

    fireEvent.change(selects[0], { target: { value: "15" } })

    await waitFor(() => {
      expect(screen.getAllByText("20 total")).toHaveLength(2)
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
    vi.mocked(dataFn).mockResolvedValue({ data: [entry], hits: 1 })

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
    vi.mocked(dataFn).mockResolvedValue({ data: [entry], hits: 1 })

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
    vi.mocked(dataFn).mockResolvedValue({ data: [entry], hits: 1 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText("TEMP")).toBeInTheDocument()
    })
  })

  it("counts permanent errors correctly in stats", async () => {
    const permEntry1 = makeEntryWithRcptError("550")
    const permEntry2 = makeEntryWithRcptError("553")
    const tempEntry = makeEntryWithRcptError("421")
    vi.mocked(dataFn).mockResolvedValue({ data: [permEntry1, permEntry2, tempEntry], hits: 3 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("3 total")).toHaveLength(2)
    })
  })

  it("does not produce error events for clean 2xx mails", async () => {
    const cleanEntry = makeEntry({
      rcpts: [{ rcpt: "ok@example.com", relay: "relay.example.com", response: { code: "250", msg: "OK" } }],
    })
    vi.mocked(dataFn).mockResolvedValue({ data: [cleanEntry], hits: 1 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getByText(/No error responses in the selected time range/)).toBeInTheDocument()
    })
  })

  it("ignores mails with no response code at all", async () => {
    const entry = makeEntry({
      rcpts: [{ rcpt: "ok@example.com", relay: "relay.example.com" }],
    })
    vi.mocked(dataFn).mockResolvedValue({ data: [entry], hits: 1 })

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
    vi.mocked(dataFn).mockResolvedValue({ data: entries, hits: entries.length })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      const permBadges = screen.getAllByText("PERM")
      expect(permBadges.length).toBeLessThanOrEqual(12)
    })
  })

  it("uses longest response string as the fullName for the bar label", async () => {
    const entry1 = makeEntry({
      id: "r1",
      rcpts: [{ rcpt: "a@x.com", relay: "r", response: { code: "550", ext: "5.1.1", msg: "short" } }],
    })
    const entry2 = makeEntry({
      id: "r2",
      rcpts: [{ rcpt: "b@x.com", relay: "r", response: { code: "550", ext: "5.1.1", msg: "a much longer error message with details" } }],
    })
    vi.mocked(dataFn).mockResolvedValue({ data: [entry1, entry2], hits: 2 })

    await act(async () => { render(<ErrorReport />) })

    await waitFor(() => {
      expect(screen.getAllByText("2 total")).toHaveLength(2)
      const tooltips = screen.getAllByTestId("tooltip-content")
      expect(tooltips).toHaveLength(1)
      expect(tooltips[0]).toHaveTextContent("550 5.1.1 a much longer error message with details")
    })
  })
})

describe("fetchAllTagged", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it("returns full result without partial flag when total fits in one page", async () => {
    const entries = [makeEntry()]
    vi.mocked(dataFn).mockResolvedValueOnce({ data: entries, hits: 1 })

    const result = await fetchAllTagged("token", "https://api.example.com", {})

    expect(result).toEqual({ data: entries, partial: false, total: 1 })
    expect(vi.mocked(dataFn)).toHaveBeenCalledTimes(1)
  })

  it("fetches extra pages and merges all data when total > 100", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeEntry({ id: `r${i}` }))
    const page2 = [makeEntry({ id: "r100" })]
    vi.mocked(dataFn)
      .mockResolvedValueOnce({ data: page1, hits: 101 })
      .mockResolvedValueOnce({ data: page2, hits: 101 })

    const result = await fetchAllTagged("token", "https://api.example.com", {})

    expect(result.data).toHaveLength(101)
    expect(result.partial).toBe(false)
    expect(result.total).toBe(101)
    expect(vi.mocked(dataFn)).toHaveBeenCalledTimes(2)
  })

  it("sets partial=true and returns available data when an extra page fails after retry", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeEntry({ id: `r${i}` }))
    vi.mocked(dataFn)
      .mockResolvedValueOnce({ data: page1, hits: 200 })
      .mockRejectedValue(new HTTPError(500, "Server Error"))

    const result = await fetchAllTagged("token", "https://api.example.com", {})

    expect(result.partial).toBe(true)
    expect(result.data).toHaveLength(100)
    expect(result.total).toBe(200)
  })

  it("does not retry on non-transient (4xx) errors for extra pages", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeEntry({ id: `r${i}` }))
    vi.mocked(dataFn)
      .mockResolvedValueOnce({ data: page1, hits: 101 })
      .mockRejectedValueOnce(new HTTPError(403, "Forbidden"))

    const result = await fetchAllTagged("token", "https://api.example.com", {})

    expect(result.partial).toBe(true)
    expect(vi.mocked(dataFn)).toHaveBeenCalledTimes(2) // page1 + page2 first attempt only, no retry
  })

  it("fetches all pages even when total exceeds 1000", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeEntry({ id: `r${i}` }))
    const extraPage = [makeEntry({ id: "extra" })]
    vi.mocked(dataFn)
      .mockResolvedValueOnce({ data: page1, hits: 1100 })
      .mockResolvedValue({ data: extraPage, hits: 1100 })

    const result = await fetchAllTagged("token", "https://api.example.com", {})

    expect(result.partial).toBe(false)
    expect(result.total).toBe(1100)
    expect(vi.mocked(dataFn)).toHaveBeenCalledTimes(11) // page 1 + 10 extra (no cap)
    expect(result.data).toHaveLength(110)
  })

  it("throws on transient first page error after one retry", async () => {
    vi.mocked(dataFn).mockRejectedValue(new HTTPError(500, "Server Error"))

    await expect(fetchAllTagged("token", "https://api.example.com", {})).rejects.toThrow("Server Error")
    expect(vi.mocked(dataFn)).toHaveBeenCalledTimes(2) // initial attempt + one retry
  })

  it("throws immediately on non-transient first page error without retrying", async () => {
    vi.mocked(dataFn).mockRejectedValueOnce(new HTTPError(401, "Unauthorized"))

    await expect(fetchAllTagged("token", "https://api.example.com", {})).rejects.toThrow("Unauthorized")
    expect(vi.mocked(dataFn)).toHaveBeenCalledTimes(1) // no retry on 401
  })
})
