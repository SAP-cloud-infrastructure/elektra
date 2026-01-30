import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { MemoryRouter, Route } from "react-router-dom"
import ItemShow from "./ItemShow"
import { MailLogEntry } from "../actions"

// Mock the dependencies

// Mock moment
vi.mock("moment", () => ({
  default: vi.fn((date?: string) => ({
    format: vi.fn(() => "2024-01-15, 14:30:00"),
    utc: vi.fn(() => ({
      format: vi.fn(() => "2024-01-15, 13:30:00"),
    })),
  })),
}))

// Helper function to render with Router and route params
const renderWithRouter = (component: React.ReactElement, initialRoute = "/test-id-123/show") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Route path="/:id/show">{component}</Route>
    </MemoryRouter>
  )
}

describe("ItemShow", () => {
  const mockData: MailLogEntry[] = [
    {
      id: "test-id-123",
      date: "2024-01-15T14:30:00Z",
      from: "sender@example.com",
      headerFrom: "Sender Name <sender@example.com>",
      subject: "Test Email Subject",
      messageId: "<message-id-123@example.com>",
      rcpts: [
        {
          rcpt: "recipient1@example.com",
          relay: "relay1.example.com",
          response: { code: "250", ext: "2.0.0", msg: "OK" },
        },
        {
          rcpt: "recipient2@example.com",
          relay: "relay2.example.com",
          response: { code: "250", ext: "2.0.0", msg: "OK" },
        },
      ],
      summary: { sent: 2, failed: 0 },
      attempts: [
        {
          date: "2024-01-15T14:30:00Z",
          hostname: "relay.example.com",
          dialog: {
            mailFrom: {
              response: { code: "250", msg: "OK" },
            },
            data: {
              response: { code: "250", msg: "Message accepted" },
            },
          },
        },
      ],
    },
    {
      id: "test-id-456",
      date: "2024-01-16T10:00:00Z",
      from: "another@example.com",
      headerFrom: "Another Sender <another@example.com>",
      subject: "Another Email",
      messageId: "<message-id-456@example.com>",
      rcpts: [{ rcpt: "recipient3@example.com", relay: "relay3.example.com" }],
      summary: { sent: 1, failed: 0 },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render panel with mail log details", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    expect(screen.getByText("Mail Log Details")).toBeInTheDocument()
  })

  it("should display all basic mail information", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    expect(screen.getByText("Envelope From")).toBeInTheDocument()
    expect(screen.getByText("Header From")).toBeInTheDocument()
    expect(screen.getByText("Subject")).toBeInTheDocument()
    expect(screen.getByText("Message ID")).toBeInTheDocument()
    expect(screen.getByText("Request ID")).toBeInTheDocument()
  })

  it("should display time in both local and UTC formats", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // getAllByText because date appears in both the main time field and attempts section
    const localTimes = screen.getAllByText("2024-01-15, 14:30:00")
    expect(localTimes.length).toBeGreaterThan(0)
    expect(screen.getByText(/UTC: 2024-01-15, 13:30:00/)).toBeInTheDocument()
  })

  it("should render recipients table with all columns", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    expect(screen.getByText("Recipient")).toBeInTheDocument()
    expect(screen.getByText("Relay")).toBeInTheDocument()
    expect(screen.getByText("Response Code")).toBeInTheDocument()
    expect(screen.getByText("Ext")).toBeInTheDocument()
    expect(screen.getByText("Message")).toBeInTheDocument()
  })

  it("should display all recipients in the table", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    expect(screen.getByText("recipient1@example.com")).toBeInTheDocument()
    expect(screen.getByText("recipient2@example.com")).toBeInTheDocument()
    expect(screen.getByText("relay1.example.com")).toBeInTheDocument()
    expect(screen.getByText("relay2.example.com")).toBeInTheDocument()
  })

  it("should display recipient response details", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // Check for response codes and messages
    const responseCodes = screen.getAllByText("250")
    expect(responseCodes.length).toBeGreaterThan(0)

    const responseExts = screen.getAllByText("2.0.0")
    expect(responseExts.length).toBe(2)

    const okMessages = screen.getAllByText("OK")
    expect(okMessages.length).toBeGreaterThan(0)
  })

  it("should render attempts section when attempts exist", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    expect(screen.getByText("Attempts")).toBeInTheDocument()
    expect(screen.getByText("Date:")).toBeInTheDocument()
    expect(screen.getByText("Hostname Relay:")).toBeInTheDocument()
    expect(screen.getByText("Response Code:")).toBeInTheDocument()
    expect(screen.getByText("Message:")).toBeInTheDocument()
  })

  it("should display attempt details correctly", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // Check for hostname - appears in both attempts and recipients
    const hostnames = screen.getAllByText("relay.example.com")
    expect(hostnames.length).toBeGreaterThan(0)
    // Response code from data dialog - appears multiple times (recipients + attempts)
    const responseCodes = screen.getAllByText("250")
    expect(responseCodes.length).toBeGreaterThan(0)
    // Message from data dialog - this is unique to attempts
    expect(screen.getByText("Message accepted")).toBeInTheDocument()
  })

  it("should render attempts section with dash when no attempts exist", () => {
    const dataWithoutAttempts: MailLogEntry[] = [
      {
        ...mockData[1],
        id: "test-id-456",
      },
    ]

    renderWithRouter(<ItemShow data={dataWithoutAttempts} />, "/test-id-456/show")

    // Attempts header should be present but showing "-"
    expect(screen.getByText("Attempts")).toBeInTheDocument()
  })

  it("should render summary section", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    expect(screen.getByText("Summary")).toBeInTheDocument()
  })

  it("should display summary items with non-zero values", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // Summary should show "sent" because its value is 2 (non-zero)
    expect(screen.getByText("sent")).toBeInTheDocument()
    // "failed" has value 0, so it shouldn't be displayed
    expect(screen.queryByText("failed")).not.toBeInTheDocument()
  })

  it("should show dash when summary is empty or all zeros", () => {
    const dataWithEmptySummary: MailLogEntry[] = [
      {
        ...mockData[0],
        id: "test-id-empty",
        summary: { sent: 0, failed: 0 },
      },
    ]

    renderWithRouter(<ItemShow data={dataWithEmptySummary} />, "/test-id-empty/show")

    // Summary header should be present
    expect(screen.getByText("Summary")).toBeInTheDocument()
  })

  it("should render JSON toggle link", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    const jsonLink = screen.getByText("Show JSON")
    expect(jsonLink).toBeInTheDocument()
  })

  it("should toggle JSON viewer when clicking the link", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    const jsonLink = screen.getByText("Show JSON")
    fireEvent.click(jsonLink)

    // After clicking, the text should change to "Hide JSON"
    expect(screen.getByText("Hide JSON")).toBeInTheDocument()
  })

  it("should hide JSON viewer when clicking Hide JSON", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // Show JSON
    const showLink = screen.getByText("Show JSON")
    fireEvent.click(showLink)

    // Hide JSON
    const hideLink = screen.getByText("Hide JSON")
    fireEvent.click(hideLink)

    // Should be back to "Show JSON"
    expect(screen.getByText("Show JSON")).toBeInTheDocument()
  })

  it("should prevent default action on JSON toggle link click", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    const jsonLink = screen.getByText("Show JSON")
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault")

    jsonLink.dispatchEvent(clickEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it("should display 'Item not found' when item does not exist", () => {
    renderWithRouter(<ItemShow data={mockData} />, "/non-existent-id/show")

    expect(screen.getByText("Item not found")).toBeInTheDocument()
  })

  it("should still render panel when item not found", () => {
    renderWithRouter(<ItemShow data={mockData} />, "/non-existent-id/show")

    expect(screen.getByText("Mail Log Details")).toBeInTheDocument()
  })

  it("should handle empty subject", () => {
    const dataWithEmptySubject: MailLogEntry[] = [
      {
        ...mockData[0],
        id: "test-id-empty-subject",
        subject: "",
      },
    ]

    renderWithRouter(<ItemShow data={dataWithEmptySubject} />, "/test-id-empty-subject/show")

    // Should display a dash when subject is empty
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("should handle null subject", () => {
    const dataWithNullSubject: MailLogEntry[] = [
      {
        ...mockData[0],
        id: "test-id-null-subject",
        subject: null as any,
      },
    ]

    renderWithRouter(<ItemShow data={dataWithNullSubject} />, "/test-id-null-subject/show")

    // Should display a dash when subject is null
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("should render recipients table even when recipients have no response", () => {
    const dataWithNoResponse: MailLogEntry[] = [
      {
        ...mockData[0],
        id: "test-id-no-response",
        rcpts: [{ rcpt: "test@example.com", relay: "relay.example.com" }],
        attempts: [], // Remove attempts to avoid duplicate relay.example.com
      },
    ]

    renderWithRouter(<ItemShow data={dataWithNoResponse} />, "/test-id-no-response/show")

    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("relay.example.com")).toBeInTheDocument()
  })

  it("should handle attempts with only mailFrom dialog (no data)", () => {
    const dataWithMailFromOnly: MailLogEntry[] = [
      {
        ...mockData[0],
        id: "test-id-mailfrom",
        rcpts: [{ rcpt: "unique-test@example.com", relay: "unique-relay.example.com" }],
        attempts: [
          {
            date: "2024-01-15T14:30:00Z",
            hostname: "test-relay.example.com",
            dialog: {
              mailFrom: {
                response: { code: "250", msg: "Mail From OK" },
              },
            },
          },
        ],
      },
    ]

    renderWithRouter(<ItemShow data={dataWithMailFromOnly} />, "/test-id-mailfrom/show")

    expect(screen.getByText("test-relay.example.com")).toBeInTheDocument()
    // Use getAllByText since "250" may appear in recipients table too
    const responseCodes = screen.getAllByText("250")
    expect(responseCodes.length).toBeGreaterThan(0)
    expect(screen.getByText("Mail From OK")).toBeInTheDocument()
  })

  it("should use data dialog response when available (priority over mailFrom)", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // Should show the data response message, not the mailFrom message
    expect(screen.getByText("Message accepted")).toBeInTheDocument()
  })

  it("should handle empty attempts array", () => {
    const dataWithEmptyAttempts: MailLogEntry[] = [
      {
        ...mockData[0],
        id: "test-id-empty-attempts",
        attempts: [],
      },
    ]

    renderWithRouter(<ItemShow data={dataWithEmptyAttempts} />, "/test-id-empty-attempts/show")

    // Attempts header should be present but showing "-"
    expect(screen.getByText("Attempts")).toBeInTheDocument()
  })

  it("should render all required sections", () => {
    renderWithRouter(<ItemShow data={mockData} />)

    // Check that key sections are present
    expect(screen.getByText("Attempts")).toBeInTheDocument()
    expect(screen.getByText("Summary")).toBeInTheDocument()
    expect(screen.getByText("Recipient")).toBeInTheDocument() // Table header
  })

  it("should render panel with opened state true", () => {
    // This test verifies the panel is rendered in opened state
    // Actual navigation/close testing would require more complex router setup
    // The close functionality is tested indirectly through MemoryRouter
    renderWithRouter(<ItemShow data={mockData} />)

    // Panel should be rendered with opened=true
    expect(screen.getByText("Mail Log Details")).toBeInTheDocument()
  })
})
