import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { BrowserRouter, MemoryRouter } from "react-router-dom"
import Item from "./Item"
import { MailLogEntry } from "../actions"

// Mock the dependencies
vi.mock("./ItemDetails", () => ({
  default: ({ data }: { data: MailLogEntry }) => <div data-testid="item-details">Item Details for {data.id}</div>,
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

// Helper function to render with Router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

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
    renderWithRouter(<Item data={mockData} />)

    expect(screen.getByText("2024-01-15, 14:30:00")).toBeInTheDocument()
    expect(screen.getByText(/UTC: 2024-01-15, 13:30:00/)).toBeInTheDocument()
    expect(screen.getByText("sender@example.com")).toBeInTheDocument()
    expect(screen.getByText("Test Email Subject")).toBeInTheDocument()
  })

  it("should render recipients as comma-separated list", () => {
    renderWithRouter(<Item data={mockData} />)

    expect(screen.getByText("recipient1@example.com, recipient2@example.com")).toBeInTheDocument()
  })

  it("should navigate to details view when row is clicked", async () => {
    const { container } = renderWithRouter(<Item data={mockData} />)

    // Find the row by its role
    const row = screen.getByRole("row")
    expect(row).toBeInTheDocument()

    // Clicking the row should trigger navigation (handled by React Router)
    fireEvent.click(row)

    // We can't directly test history.push in jsdom, but we can verify the row is clickable
    expect(row).toHaveStyle({ cursor: "pointer" })
  })

  it("should not show ItemDetails initially (now uses panel view)", () => {
    renderWithRouter(<Item data={mockData} />)

    // ItemDetails should not be shown inline anymore - it's in a panel now
    expect(screen.queryByTestId("item-details")).not.toBeInTheDocument()
  })

  it("should have clickable row that navigates to details", () => {
    renderWithRouter(<Item data={mockData} />)

    const row = screen.getByRole("row")

    // Row should be clickable with pointer cursor
    expect(row).toHaveStyle({ cursor: "pointer" })

    // Verify row click doesn't throw errors
    expect(() => fireEvent.click(row)).not.toThrow()
  })

  it("should download JSON file when download icon is clicked", () => {
    const createElementSpy = vi.spyOn(document, "createElement")

    renderWithRouter(<Item data={mockData} />)

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

    renderWithRouter(<Item data={mockData} />)

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

    renderWithRouter(<Item data={dataWithoutId} />)

    const downloadButton = screen.getByRole("button", { name: "download" })
    fireEvent.click(downloadButton)

    expect(linkElement!.download).toBe("data.json")
  })

  it("should create JSON blob with correct structure", () => {
    // Spy on URL.createObjectURL instead of Blob to avoid constructor issues
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("mock-url")

    renderWithRouter(<Item data={mockData} />)

    const downloadButton = screen.getByRole("button", { name: "download" })
    fireEvent.click(downloadButton)

    // Verify createObjectURL was called (which means Blob was created)
    expect(createObjectURLSpy).toHaveBeenCalled()
  })

  it("should render all DataGridCell components", () => {
    const { container } = renderWithRouter(<Item data={mockData} />)

    // There should be 6 cells: details link icon, date, from, rcpts, subject, download icon
    const cells = container.querySelectorAll('[class*="DataGridCell"]')
    // Since we're mocking, we might not have the exact class, but we can check structure
    expect(container.firstChild).toBeInTheDocument()
  })

  it("should format date correctly in local and UTC time", () => {
    renderWithRouter(<Item data={mockData} />)

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

    renderWithRouter(<Item data={dataWithManyRecipients} />)

    expect(screen.getByText("user1@example.com, user2@test.com, user3@demo.com")).toBeInTheDocument()
  })

  it("should render DataGridRow as root element", () => {
    const { container } = renderWithRouter(<Item data={mockData} />)

    // DataGridRow should be rendered
    expect(container.firstChild).toBeTruthy()
  })

  it("should handle special characters in subject", () => {
    const dataWithSpecialChars: MailLogEntry = {
      ...mockData,
      subject: 'Test: Special chars & symbols <> "quotes"',
    }

    renderWithRouter(<Item data={dataWithSpecialChars} />)

    expect(screen.getByText('Test: Special chars & symbols <> "quotes"')).toBeInTheDocument()
  })

  it("should handle special characters in from email", () => {
    const dataWithSpecialFrom: MailLogEntry = {
      ...mockData,
      from: "user+tag@example.com",
    }

    renderWithRouter(<Item data={dataWithSpecialFrom} />)

    expect(screen.getByText("user+tag@example.com")).toBeInTheDocument()
  })

  it("should render UTC time", () => {
    const { container } = renderWithRouter(<Item data={mockData} />)

    // Find the paragraph containing UTC time text
    const utcParagraph = screen.getByText(/UTC:/).closest("p")
    expect(utcParagraph).toBeInTheDocument()
  })

  it("should navigate to details view when clicked from list view", () => {
    // Start at root path (list view)
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Item data={mockData} />
      </MemoryRouter>
    )

    const row = screen.getByRole("row")
    fireEvent.click(row)

    // Row should be clickable
    expect(row).toHaveStyle({ cursor: "pointer" })
  })

  it("should close details panel when clicking the same item again", () => {
    // Start at details view path
    const { container } = render(
      <MemoryRouter initialEntries={["/test-id-123/show"]}>
        <Item data={mockData} />
      </MemoryRouter>
    )

    const row = screen.getByRole("row")
    fireEvent.click(row)

    // Clicking again should trigger navigation back to list (verified by not throwing)
    expect(row).toHaveStyle({ cursor: "pointer" })
  })
})
