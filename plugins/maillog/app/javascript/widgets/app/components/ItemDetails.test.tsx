import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import ItemDetails from "./ItemDetails"
import { MailLogEntry } from "../actions"

// Mock the Juno UI components
vi.mock("@cloudoperators/juno-ui-components", () => ({
  DataGridRow: ({ children }: { children: React.ReactNode }) => <div data-testid="datagrid-row">{children}</div>,
  DataGridCell: ({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) => (
    <div data-testid="datagrid-cell" data-colspan={colSpan}>
      {children}
    </div>
  ),
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon" data-icon={icon} />,
  JsonViewer: ({ data, expanded }: { data: unknown; expanded?: boolean }) => (
    <div data-testid="json-viewer" data-expanded={expanded}>
      {JSON.stringify(data)}
    </div>
  ),
}))

// Mock CopyableText component
vi.mock("./CopyableText", () => ({
  default: ({ children, text }: { children: React.ReactNode; text: string }) => (
    <span data-testid="copyable-text" data-text={text}>
      {children}
    </span>
  ),
}))

// Mock moment
vi.mock("moment", () => ({
  default: (date: string) => ({
    format: (formatStr: string) => {
      // Return mock formatted dates
      if (date === "2024-01-15T14:30:00Z") {
        return "2024-01-15, 14:30:00"
      }
      if (date === "2024-01-15T14:25:00Z") {
        return "2024-01-15, 14:25:00"
      }
      return "2024-01-01, 00:00:00"
    },
  }),
}))

describe("ItemDetails", () => {
  let mockData: MailLogEntry

  beforeEach(() => {
    mockData = {
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
          response: {
            code: "250",
            ext: "2.0.0",
            msg: "OK",
          },
        },
        {
          rcpt: "recipient2@example.com",
          relay: "relay2.example.com",
          response: {
            code: "250",
            ext: "2.0.0",
            msg: "Delivered",
          },
        },
      ],
      attempts: [
        {
          date: "2024-01-15T14:25:00Z",
          hostname: "smtp.example.com",
          dialog: {
            mailFrom: {
              response: {
                code: "250",
                msg: "Sender OK",
              },
            },
            data: {
              response: {
                code: "250",
                msg: "Data accepted",
              },
            },
          },
        },
      ],
      summary: {
        sent: 2,
        failed: 0,
        pending: 0,
      },
    }
  })

  it("should render all basic fields", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByText("Envelope From:")).toBeInTheDocument()
    expect(screen.getByText("Header From:")).toBeInTheDocument()
    expect(screen.getByText("Message ID:")).toBeInTheDocument()
    expect(screen.getByText("Request ID:")).toBeInTheDocument()
  })

  it("should render CopyableText for envelope from", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const envelopeFrom = copyableTexts.find((el) => el.getAttribute("data-text") === "sender@example.com")
    expect(envelopeFrom).toBeInTheDocument()
  })

  it("should render CopyableText for header from", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const headerFrom = copyableTexts.find((el) => el.getAttribute("data-text") === "Sender Name <sender@example.com>")
    expect(headerFrom).toBeInTheDocument()
  })

  it("should render CopyableText for message ID", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const messageId = copyableTexts.find((el) => el.getAttribute("data-text") === "<message-id-123@example.com>")
    expect(messageId).toBeInTheDocument()
  })

  it("should render CopyableText for request ID", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const requestId = copyableTexts.find((el) => el.getAttribute("data-text") === "test-id-123")
    expect(requestId).toBeInTheDocument()
  })

  it("should render attempts section when attempts exist", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByText("Attempts:")).toBeInTheDocument()
    expect(screen.getByText("Date:")).toBeInTheDocument()
    expect(screen.getByText("2024-01-15, 14:25:00")).toBeInTheDocument()
    expect(screen.getByText("Hostname Relay:")).toBeInTheDocument()
    expect(screen.getByText("Response Code:")).toBeInTheDocument()
    expect(screen.getByText("Message:")).toBeInTheDocument()
  })

  it("should render attempt hostname with CopyableText", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const hostname = copyableTexts.find((el) => el.getAttribute("data-text") === "smtp.example.com")
    expect(hostname).toBeInTheDocument()
  })

  it("should render attempt response code from dialog.data when available", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const responseCode = copyableTexts.find((el) => el.getAttribute("data-text") === "250")
    expect(responseCode).toBeInTheDocument()
  })

  it("should render attempt response message with CopyableText", () => {
    render(<ItemDetails data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const responseMsg = copyableTexts.find((el) => el.getAttribute("data-text") === "Data accepted")
    expect(responseMsg).toBeInTheDocument()
  })

  it("should use dialog.mailFrom when dialog.data is empty", () => {
    const dataWithoutDialogData: MailLogEntry = {
      ...mockData,
      attempts: [
        {
          date: "2024-01-15T14:25:00Z",
          hostname: "smtp.example.com",
          dialog: {
            mailFrom: {
              response: {
                code: "220",
                msg: "Mail From OK",
              },
            },
            data: undefined,
          },
        },
      ],
    }

    render(<ItemDetails data={dataWithoutDialogData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    const responseCode = copyableTexts.find((el) => el.getAttribute("data-text") === "220")
    const responseMsg = copyableTexts.find((el) => el.getAttribute("data-text") === "Mail From OK")
    expect(responseCode).toBeInTheDocument()
    expect(responseMsg).toBeInTheDocument()
  })

  it("should not render attempts section when attempts is undefined", () => {
    const dataWithoutAttempts: MailLogEntry = {
      ...mockData,
      attempts: undefined,
    }

    render(<ItemDetails data={dataWithoutAttempts} />)

    expect(screen.queryByText("Attempts:")).not.toBeInTheDocument()
    expect(screen.queryByText("Hostname Relay:")).not.toBeInTheDocument()
  })

  it("should not render attempts section when attempts array is empty", () => {
    const dataWithEmptyAttempts: MailLogEntry = {
      ...mockData,
      attempts: [],
    }

    render(<ItemDetails data={dataWithEmptyAttempts} />)

    expect(screen.queryByText("Attempts:")).not.toBeInTheDocument()
  })

  it("should render summary section", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByText("Summary:")).toBeInTheDocument()
    expect(screen.getByText("sent")).toBeInTheDocument()
  })

  it("should only render non-zero summary values", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByText("sent")).toBeInTheDocument()
    expect(screen.queryByText("failed")).not.toBeInTheDocument()
    expect(screen.queryByText("pending")).not.toBeInTheDocument()
  })

  it("should render recipients table with headers", () => {
    const { container } = render(<ItemDetails data={mockData} />)

    const table = container.querySelector("table")
    expect(table).toBeInTheDocument()

    expect(screen.getByText("Recipient")).toBeInTheDocument()
    expect(screen.getByText("Relay")).toBeInTheDocument()
    expect(screen.getByText("Response Code")).toBeInTheDocument()
    expect(screen.getByText("Ext")).toBeInTheDocument()
    expect(screen.getByText("Message")).toBeInTheDocument()
  })

  it("should render all recipients in the table", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByText("recipient1@example.com")).toBeInTheDocument()
    expect(screen.getByText("recipient2@example.com")).toBeInTheDocument()
    expect(screen.getByText("relay1.example.com")).toBeInTheDocument()
    expect(screen.getByText("relay2.example.com")).toBeInTheDocument()
  })

  it("should render recipient response details", () => {
    const { container } = render(<ItemDetails data={mockData} />)

    // Check in the recipients table specifically
    const table = container.querySelector("table")
    expect(table).toBeInTheDocument()

    // Use getAllByText for values that appear multiple times (both recipients have same response codes)
    expect(screen.getAllByText("250").length).toBeGreaterThan(0)
    expect(screen.getAllByText("2.0.0").length).toBeGreaterThan(0)
    expect(screen.getByText("OK")).toBeInTheDocument()
    expect(screen.getByText("Delivered")).toBeInTheDocument()
  })

  it("should not show JSON viewer initially", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.queryByTestId("json-viewer")).not.toBeInTheDocument()
  })

  it("should show 'Show JSON' text initially", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByText("Show JSON")).toBeInTheDocument()
  })

  it("should show expandMore icon initially", () => {
    render(<ItemDetails data={mockData} />)

    const icon = screen.getByTestId("icon")
    expect(icon).toHaveAttribute("data-icon", "expandMore")
  })

  it("should toggle JSON viewer when clicking Show JSON link", () => {
    render(<ItemDetails data={mockData} />)

    const showJsonLink = screen.getByText("Show JSON")
    fireEvent.click(showJsonLink)

    expect(screen.getByTestId("json-viewer")).toBeInTheDocument()
  })

  it("should change text to 'Hide JSON' after showing JSON", () => {
    render(<ItemDetails data={mockData} />)

    const showJsonLink = screen.getByText("Show JSON")
    fireEvent.click(showJsonLink)

    expect(screen.getByText("Hide JSON")).toBeInTheDocument()
    expect(screen.queryByText("Show JSON")).not.toBeInTheDocument()
  })

  it("should change icon to expandLess after showing JSON", () => {
    render(<ItemDetails data={mockData} />)

    const showJsonLink = screen.getByText("Show JSON")
    fireEvent.click(showJsonLink)

    const icon = screen.getByTestId("icon")
    expect(icon).toHaveAttribute("data-icon", "expandLess")
  })

  it("should hide JSON viewer when clicking Hide JSON link", () => {
    render(<ItemDetails data={mockData} />)

    // Show JSON first
    const showJsonLink = screen.getByText("Show JSON")
    fireEvent.click(showJsonLink)
    expect(screen.getByTestId("json-viewer")).toBeInTheDocument()

    // Hide JSON
    const hideJsonLink = screen.getByText("Hide JSON")
    fireEvent.click(hideJsonLink)

    expect(screen.queryByTestId("json-viewer")).not.toBeInTheDocument()
  })

  it("should prevent default action on JSON toggle link click", () => {
    render(<ItemDetails data={mockData} />)

    const showJsonLink = screen.getByText("Show JSON").closest("a")
    const event = new MouseEvent("click", { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, "preventDefault")

    showJsonLink?.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it("should pass data to JsonViewer when expanded", () => {
    render(<ItemDetails data={mockData} />)

    const showJsonLink = screen.getByText("Show JSON")
    fireEvent.click(showJsonLink)

    const jsonViewer = screen.getByTestId("json-viewer")
    expect(jsonViewer).toHaveAttribute("data-expanded", "true")
    expect(jsonViewer.textContent).toContain("test-id-123")
  })

  it("should render DataGridRow as root element", () => {
    render(<ItemDetails data={mockData} />)

    expect(screen.getByTestId("datagrid-row")).toBeInTheDocument()
  })

  it("should render DataGridCell with colSpan 6", () => {
    render(<ItemDetails data={mockData} />)

    const cell = screen.getByTestId("datagrid-cell")
    expect(cell).toHaveAttribute("data-colspan", "6")
  })

  it("should handle recipients without response data", () => {
    const dataWithoutResponse: MailLogEntry = {
      ...mockData,
      rcpts: [
        {
          rcpt: "test@example.com",
          relay: "relay.example.com",
          response: undefined,
        },
      ],
    }

    render(<ItemDetails data={dataWithoutResponse} />)

    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("relay.example.com")).toBeInTheDocument()
  })

  it("should handle empty summary object", () => {
    const dataWithEmptySummary: MailLogEntry = {
      ...mockData,
      summary: {},
    }

    render(<ItemDetails data={dataWithEmptySummary} />)

    expect(screen.getByText("Summary:")).toBeInTheDocument()
    // No summary items should be rendered
    expect(screen.queryByText("sent")).not.toBeInTheDocument()
  })

  it("should render multiple non-zero summary values", () => {
    const dataWithMultipleSummary: MailLogEntry = {
      ...mockData,
      summary: {
        sent: 5,
        failed: 2,
        pending: 0,
        deferred: 1,
      },
    }

    render(<ItemDetails data={dataWithMultipleSummary} />)

    expect(screen.getByText("sent")).toBeInTheDocument()
    expect(screen.getByText("failed")).toBeInTheDocument()
    expect(screen.getByText("deferred")).toBeInTheDocument()
    expect(screen.queryByText("pending")).not.toBeInTheDocument()
  })

  it("should apply correct styles to recipients table", () => {
    const { container } = render(<ItemDetails data={mockData} />)

    const table = container.querySelector("table")
    expect(table).toHaveStyle({ borderCollapse: "collapse", width: "100%" })
  })

  it("should handle attempts with missing response fields", () => {
    const dataWithIncompleteAttempt: MailLogEntry = {
      ...mockData,
      attempts: [
        {
          date: "2024-01-15T14:25:00Z",
          hostname: "smtp.example.com",
          dialog: {
            data: {
              response: undefined,
            },
          },
        },
      ],
    }

    render(<ItemDetails data={dataWithIncompleteAttempt} />)

    expect(screen.getByText("Attempts:")).toBeInTheDocument()
    expect(screen.getByText("Hostname Relay:")).toBeInTheDocument()
  })

  it("should handle special characters in email addresses", () => {
    const dataWithSpecialChars: MailLogEntry = {
      ...mockData,
      from: "user+tag@example.com",
      headerFrom: "User Name <user+tag@example.com>",
    }

    render(<ItemDetails data={dataWithSpecialChars} />)

    expect(screen.getByText("user+tag@example.com")).toBeInTheDocument()
    expect(screen.getByText("User Name <user+tag@example.com>")).toBeInTheDocument()
  })

  it("should render table rows for each recipient", () => {
    const { container } = render(<ItemDetails data={mockData} />)

    const tableRows = container.querySelectorAll("tbody tr")
    expect(tableRows.length).toBe(2)
  })

  it("should apply correct padding to table cells", () => {
    const { container } = render(<ItemDetails data={mockData} />)

    const firstCell = container.querySelector("tbody tr td")
    expect(firstCell).toHaveStyle({ padding: "8px" })
  })

  it("should apply correct styles to table headers", () => {
    const { container } = render(<ItemDetails data={mockData} />)

    const firstHeader = container.querySelector("thead tr th")
    expect(firstHeader).toHaveStyle({
      padding: "12px",
      textAlign: "left",
      borderBottom: "2px solid #ddd",
    })
  })
})
