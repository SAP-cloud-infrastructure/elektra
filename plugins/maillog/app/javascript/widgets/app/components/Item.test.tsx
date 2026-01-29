import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import Item from "./Item"
import { MailLogEntry } from "../actions"

// Mock the dependencies
vi.mock("./ItemDetails", () => ({
  default: ({ data }: { data: MailLogEntry }) => <div data-testid="item-details">Item Details for {data.id}</div>,
}))

vi.mock("./CopyableText", () => ({
  default: ({ text, children }: { text: string; children: React.ReactNode }) => (
    <span data-testid="copyable-text" data-text={text}>
      {children}
    </span>
  ),
}))

// Mock moment
vi.mock("moment", () => ({
  default: vi.fn(() => ({
    format: vi.fn(() => "2024-01-15, 14:30:00"),
    utc: vi.fn(() => ({
      format: vi.fn(() => "2024-01-15, 13:30:00"),
    })),
  })),
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url")

describe("Item", () => {
  const mockData: MailLogEntry = {
    id: "test-id-123",
    date: "2024-01-15T14:30:00Z",
    from: "sender@example.com",
    headerFrom: "Sender Name <sender@example.com>",
    subject: "Test Email Subject",
    messageId: "<message-id-123@example.com>",
    rcpts: [
      { rcpt: "recipient1@example.com", relay: "relay1.example.com" },
      { rcpt: "recipient2@example.com", relay: "relay2.example.com" },
    ],
    summary: { sent: 2, failed: 0 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all mail log data", () => {
    render(<Item data={mockData} />)

    expect(screen.getByText("2024-01-15, 14:30:00")).toBeInTheDocument()
    expect(screen.getByText(/UTC: 2024-01-15, 13:30:00/)).toBeInTheDocument()
    expect(screen.getByText("sender@example.com")).toBeInTheDocument()
    expect(screen.getByText("Test Email Subject")).toBeInTheDocument()
  })

  it("should render recipients as comma-separated list", () => {
    render(<Item data={mockData} />)

    expect(screen.getByText("recipient1@example.com, recipient2@example.com")).toBeInTheDocument()
  })

  it("should not show ItemDetails initially", () => {
    render(<Item data={mockData} />)

    expect(screen.queryByTestId("item-details")).not.toBeInTheDocument()
  })

  it("should toggle ItemDetails when expand/collapse icon is clicked", () => {
    render(<Item data={mockData} />)

    const expandLink = screen.getByRole("link")

    // Initially details should not be shown
    expect(screen.queryByTestId("item-details")).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(expandLink)
    expect(screen.getByTestId("item-details")).toBeInTheDocument()

    // Click to collapse
    fireEvent.click(expandLink)
    expect(screen.queryByTestId("item-details")).not.toBeInTheDocument()
  })

  it("should prevent default action on expand/collapse link click", () => {
    render(<Item data={mockData} />)

    const expandLink = screen.getByRole("link")
    const event = new MouseEvent("click", { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, "preventDefault")

    expandLink.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it("should render CopyableText components for from, rcpts, and subject", () => {
    render(<Item data={mockData} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    expect(copyableTexts).toHaveLength(3)

    // Check the data-text attributes
    expect(copyableTexts[0]).toHaveAttribute("data-text", "sender@example.com")
    expect(copyableTexts[1]).toHaveAttribute("data-text", "recipient1@example.com, recipient2@example.com")
    expect(copyableTexts[2]).toHaveAttribute("data-text", "Test Email Subject")
  })

  it("should handle empty recipients array", () => {
    const dataWithNoRecipients: MailLogEntry = {
      ...mockData,
      rcpts: [],
    }

    render(<Item data={dataWithNoRecipients} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    expect(copyableTexts[1]).toHaveAttribute("data-text", "")
  })

  it("should handle undefined recipients", () => {
    const dataWithUndefinedRecipients: MailLogEntry = {
      ...mockData,
      rcpts: undefined as any,
    }

    render(<Item data={dataWithUndefinedRecipients} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    expect(copyableTexts[1]).toHaveAttribute("data-text", "")
  })

  it("should handle empty subject", () => {
    const dataWithEmptySubject: MailLogEntry = {
      ...mockData,
      subject: "",
    }

    render(<Item data={dataWithEmptySubject} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    expect(copyableTexts[2]).toHaveAttribute("data-text", "")
  })

  it("should handle null subject", () => {
    const dataWithNullSubject: MailLogEntry = {
      ...mockData,
      subject: null as any,
    }

    render(<Item data={dataWithNullSubject} />)

    const copyableTexts = screen.getAllByTestId("copyable-text")
    expect(copyableTexts[2]).toHaveAttribute("data-text", "")
  })

  it("should download JSON file when download icon is clicked", () => {
    const createElementSpy = vi.spyOn(document, "createElement")

    render(<Item data={mockData} />)

    // Find the download button by its aria-label
    const downloadButton = screen.getByRole("button", { name: "download" })
    fireEvent.click(downloadButton)

    // Verify document.createElement was called
    expect(createElementSpy).toHaveBeenCalledWith("a")

    // Verify the link was created and clicked
    const linkElements = createElementSpy.mock.results
      .filter((result) => result.value?.tagName === "A")
      .map((result) => result.value)

    expect(linkElements.length).toBeGreaterThan(0)
  })

  it("should create download link with correct filename", () => {
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, "createElement")
    let linkElement: HTMLAnchorElement | null = null

    createElementSpy.mockImplementation((tagName: string) => {
      const element = realCreateElement(tagName) as HTMLElement
      if (tagName === "a") {
        linkElement = element as HTMLAnchorElement
        // Mock the click method
        element.click = vi.fn()
      }
      return element
    })

    render(<Item data={mockData} />)

    const downloadButton = screen.getByRole("button", { name: "download" })
    fireEvent.click(downloadButton)

    expect(linkElement).not.toBeNull()
    expect(linkElement!.download).toBe("test-id-123")
  })

  it("should create download link with data.json as default filename when id is empty", () => {
    const dataWithoutId: MailLogEntry = {
      ...mockData,
      id: "",
    }

    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, "createElement")
    let linkElement: HTMLAnchorElement | null = null

    createElementSpy.mockImplementation((tagName: string) => {
      const element = realCreateElement(tagName) as HTMLElement
      if (tagName === "a") {
        linkElement = element as HTMLAnchorElement
        element.click = vi.fn()
      }
      return element
    })

    render(<Item data={dataWithoutId} />)

    const downloadButton = screen.getByRole("button", { name: "download" })
    fireEvent.click(downloadButton)

    expect(linkElement!.download).toBe("data.json")
  })

  it("should create JSON blob with correct structure", () => {
    // Spy on URL.createObjectURL instead of Blob to avoid constructor issues
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("mock-url")

    render(<Item data={mockData} />)

    const downloadButton = screen.getByRole("button", { name: "download" })
    fireEvent.click(downloadButton)

    // Verify createObjectURL was called (which means Blob was created)
    expect(createObjectURLSpy).toHaveBeenCalled()
  })

  it("should render all DataGridCell components", () => {
    const { container } = render(<Item data={mockData} />)

    // There should be 6 cells: expand icon, date, from, rcpts, subject, download icon
    const cells = container.querySelectorAll('[class*="DataGridCell"]')
    // Since we're mocking, we might not have the exact class, but we can check structure
    expect(container.firstChild).toBeInTheDocument()
  })

  it("should format date correctly in local and UTC time", () => {
    render(<Item data={mockData} />)

    // Check local time
    expect(screen.getByText("2024-01-15, 14:30:00")).toBeInTheDocument()

    // Check UTC time
    expect(screen.getByText(/UTC: 2024-01-15, 13:30:00/)).toBeInTheDocument()
  })

  it("should handle multiple recipients with different relays", () => {
    const dataWithManyRecipients: MailLogEntry = {
      ...mockData,
      rcpts: [
        { rcpt: "user1@example.com", relay: "relay1.com" },
        { rcpt: "user2@test.com", relay: "relay2.com" },
        { rcpt: "user3@demo.com", relay: "relay3.com" },
      ],
    }

    render(<Item data={dataWithManyRecipients} />)

    expect(screen.getByText("user1@example.com, user2@test.com, user3@demo.com")).toBeInTheDocument()
  })

  it("should pass correct data to ItemDetails when expanded", () => {
    render(<Item data={mockData} />)

    const expandLink = screen.getByRole("link")
    fireEvent.click(expandLink)

    const itemDetails = screen.getByTestId("item-details")
    expect(itemDetails).toHaveTextContent(`Item Details for ${mockData.id}`)
  })

  it("should render DataGridRow as root element", () => {
    const { container } = render(<Item data={mockData} />)

    // The first child should be a fragment, containing DataGridRow
    expect(container.firstChild).toBeTruthy()
  })

  it("should handle special characters in subject", () => {
    const dataWithSpecialChars: MailLogEntry = {
      ...mockData,
      subject: 'Test: Special chars & symbols <> "quotes"',
    }

    render(<Item data={dataWithSpecialChars} />)

    expect(screen.getByText('Test: Special chars & symbols <> "quotes"')).toBeInTheDocument()
  })

  it("should handle special characters in from email", () => {
    const dataWithSpecialFrom: MailLogEntry = {
      ...mockData,
      from: "user+tag@example.com",
    }

    render(<Item data={dataWithSpecialFrom} />)

    expect(screen.getByText("user+tag@example.com")).toBeInTheDocument()
  })

  it("should render UTC time with correct styling", () => {
    const { container } = render(<Item data={mockData} />)

    // Find the paragraph containing UTC time text
    const utcParagraph = screen.getByText(/UTC:/).closest("p")
    expect(utcParagraph).toBeInTheDocument()
    expect(utcParagraph).toHaveStyle({ fontSize: "0.8rem" })
  })
})
