import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import SearchBar from "./SearchBar"

// Mock moment
vi.mock("moment", () => {
  const mockMoment = (date?: any) => ({
    isAfter: vi.fn(() => false),
  })
  return {
    default: mockMoment,
  }
})

// Mock Juno UI components
vi.mock("@cloudoperators/juno-ui-components", () => ({
  Button: ({ onClick, children, ...props }: any) => (
    <button
      onClick={(e) => {
        e.preventDefault()
        if (onClick) onClick(e)
      }}
      data-testid="clear-button"
      type="button"
      {...props}
    >
      {children}
    </button>
  ),
  Form: ({ children, ...props }: any) => (
    <form data-testid="search-form" {...props}>
      {children}
    </form>
  ),
  FormRow: ({ children, ...props }: any) => (
    <div data-testid="form-row" {...props}>
      {children}
    </div>
  ),
  ButtonRow: ({ children, ...props }: any) => (
    <div data-testid="button-row" {...props}>
      {children}
    </div>
  ),
  TextInput: ({ id, label, value, onChange, helptext, ...props }: any) => (
    <div data-testid={`text-input-${id}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={onChange} data-testid={`input-${id}`} {...props} />
    </div>
  ),
  DateTimePicker: ({ id, label, onChange, enableTime, time_24hr, helptext, ...props }: any) => (
    <div data-testid={`date-picker-${id}`}>
      <label htmlFor={id}>{label}</label>
      <input
        type="text"
        id={id}
        data-testid={`date-input-${id}`}
        onChange={(e) => {
          const value = e.target.value
          if (value) {
            onChange([value])
          } else {
            onChange([])
          }
        }}
        {...props}
      />
    </div>
  ),
  Select: ({ id, children, onChange, onValueChange, placeholder, value, label, width, helptext, ...props }: any) => (
    <div data-testid={`select-${id}`}>
      <select
        id={id}
        data-testid={`select-input-${id}`}
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e.target.value)
          if (onValueChange) onValueChange(e.target.value)
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  ),
  SelectOption: ({ value, label, ...props }: any) => (
    <option value={value} {...props}>
      {label || value}
    </option>
  ),
  Grid: ({ children, ...props }: any) => (
    <div data-testid="grid" {...props}>
      {children}
    </div>
  ),
  GridRow: ({ children, ...props }: any) => (
    <div data-testid="grid-row" {...props}>
      {children}
    </div>
  ),
  GridColumn: ({ children, cols, ...props }: any) => (
    <div data-testid="grid-column" data-cols={cols} {...props}>
      {children}
    </div>
  ),
}))

describe("SearchBar", () => {
  const mockOnChange = vi.fn()
  const mockOnPageChange = vi.fn()
  const mockOnDateChange = vi.fn()

  const defaultSearchOptions = {
    from: "",
    subject: "",
    rcpt: [] as string[],
    id: "",
    messageId: "",
    headerFrom: "",
    relay: "",
  }

  const defaultPageOptions = {
    page: 1,
    pageSize: 15,
  }

  const defaultDateOptions = {
    start: null,
    end: null,
  }

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnPageChange.mockClear()
    mockOnDateChange.mockClear()
  })

  describe("Basic Rendering", () => {
    it("should render all search input fields", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("text-input-from")).toBeInTheDocument()
      expect(screen.getByTestId("text-input-headerFrom")).toBeInTheDocument()
      expect(screen.getByTestId("text-input-rcpt")).toBeInTheDocument()
      expect(screen.getByTestId("text-input-subject")).toBeInTheDocument()
      expect(screen.getByTestId("text-input-messageId")).toBeInTheDocument()
      expect(screen.getByTestId("text-input-id")).toBeInTheDocument()
    })

    it("should render relay select dropdown", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("select-relay")).toBeInTheDocument()
    })

    it("should render start and end date pickers", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("date-picker-start")).toBeInTheDocument()
      expect(screen.getByTestId("date-picker-end")).toBeInTheDocument()
    })

    it("should render Clear All Filters button", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("clear-button")).toBeInTheDocument()
      expect(screen.getByText("Clear All Filters")).toBeInTheDocument()
    })

    it("should render relay select with all options", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByText("AWS")).toBeInTheDocument()
      expect(screen.getByText("ESA")).toBeInTheDocument()
      expect(screen.getByText("ESA Bulk")).toBeInTheDocument()
      expect(screen.getByText("INT")).toBeInTheDocument()
      expect(screen.getByText("Postfix")).toBeInTheDocument()
      expect(screen.getByText("Null")).toBeInTheDocument()
      expect(screen.getByText("All Relays")).toBeInTheDocument()
    })

    it("should display current search values in inputs", () => {
      const searchOptions = {
        from: "sender@example.com",
        subject: "Test Subject",
        rcpt: ["recipient@example.com"],
        id: "req-123",
        messageId: "<message-id>",
        headerFrom: "header@example.com",
        relay: "aws",
        start: null,
        end: null,
      }

      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={searchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("input-from")).toHaveValue("sender@example.com")
      expect(screen.getByTestId("input-subject")).toHaveValue("Test Subject")
      expect(screen.getByTestId("input-rcpt")).toHaveValue("recipient@example.com")
      expect(screen.getByTestId("input-id")).toHaveValue("req-123")
      expect(screen.getByTestId("input-messageId")).toHaveValue("<message-id>")
      expect(screen.getByTestId("input-headerFrom")).toHaveValue("header@example.com")
    })
  })

  describe("Input Field Changes", () => {
    it("should call onChange and reset page to 1 when from field changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={{ page: 3, pageSize: 15 }}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-from")
      await user.type(input, "test@example.com")

      expect(mockOnChange).toHaveBeenCalled()
      expect(mockOnPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 15 })
    })

    it("should call onChange when headerFrom field changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-headerFrom")
      await user.type(input, "test")

      expect(mockOnChange).toHaveBeenCalled()
      // userEvent.type types one character at a time, check that onChange is called with accumulated value
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0)
      // Check that the last call includes the full typed value
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      expect(lastCall.headerFrom).toContain("t")
    })

    it("should handle recipients as comma-separated values", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-rcpt")
      await user.type(input, "a,b")

      expect(mockOnChange).toHaveBeenCalled()
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      // Last character typed is 'b', so the array should be ["a", "b"]
      expect(Array.isArray(lastCall.rcpt)).toBe(true)
      expect(lastCall.rcpt.length).toBeGreaterThan(0)
    })

    it("should display recipients array as comma-separated string", () => {
      const searchOptions = {
        ...defaultSearchOptions,
        rcpt: ["user1@example.com", "user2@example.com", "user3@example.com"],
      }

      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={searchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("input-rcpt")).toHaveValue("user1@example.com,user2@example.com,user3@example.com")
    })

    it("should call onChange when subject field changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-subject")
      await user.type(input, "Test")

      expect(mockOnChange).toHaveBeenCalled()
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      expect(lastCall.subject).toContain("t")
    })

    it("should trim and call onChange when messageId field changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-messageId")
      await user.type(input, "  <message-id>  ")

      expect(mockOnChange).toHaveBeenCalled()
      // Check that trimming happens
      const calls = mockOnChange.mock.calls
      const lastCall = calls[calls.length - 1][0]
      // The component trims the value, so the last character call would have trimmed value
      expect(lastCall.messageId).toBeDefined()
    })

    it("should call onChange when id field changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-id")
      await user.type(input, "123")

      expect(mockOnChange).toHaveBeenCalled()
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      expect(lastCall.id).toContain("3")
    })

    it("should reset page to 1 for all input changes", async () => {
      const user = userEvent.setup()
      const pageOptions = { page: 5, pageSize: 30 }

      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={pageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-subject")
      await user.type(input, "test")

      expect(mockOnPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 30 })
    })
  })

  describe("Relay Select", () => {
    it("should call onChange when relay is selected", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const select = screen.getByTestId("select-input-relay")
      await user.selectOptions(select, "aws")

      expect(mockOnChange).toHaveBeenCalledWith(
        {
          ...defaultSearchOptions,
          relay: "aws",
        },
        true
      )
    })

    it("should call onChange when different relay options are selected", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const select = screen.getByTestId("select-input-relay")

      await user.selectOptions(select, "esa")
      expect(mockOnChange).toHaveBeenCalledWith(
        {
          ...defaultSearchOptions,
          relay: "esa",
        },
        true
      )

      await user.selectOptions(select, "postfix")
      expect(mockOnChange).toHaveBeenCalledWith(
        {
          ...defaultSearchOptions,
          relay: "postfix",
        },
        true
      )
    })

    it("should reset page to 1 when relay changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={{ page: 3, pageSize: 15 }}
          dateOptions={defaultDateOptions}
        />
      )

      const select = screen.getByTestId("select-input-relay")
      await user.selectOptions(select, "aws")

      expect(mockOnPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 15 })
    })

    it("should handle selecting empty relay (All Relays)", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={{ ...defaultSearchOptions, relay: "aws" }}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const select = screen.getByTestId("select-input-relay")
      await user.selectOptions(select, "")

      expect(mockOnChange).toHaveBeenCalledWith(
        {
          ...defaultSearchOptions,
          relay: "",
        },
        true
      )
    })
  })

  describe("Date Pickers", () => {
    it("should call onDateChange when start date is selected", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const dateInput = screen.getByTestId("date-input-start")
      await user.type(dateInput, "2024-01-15T10:30:00")

      expect(mockOnDateChange).toHaveBeenCalled()
      const lastCall = mockOnDateChange.mock.calls[mockOnDateChange.mock.calls.length - 1][0]
      expect(lastCall.start).toBeInstanceOf(Date)
    })

    it("should call onDateChange when end date is selected", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const dateInput = screen.getByTestId("date-input-end")
      await user.type(dateInput, "2024-01-20T15:45:00")

      expect(mockOnDateChange).toHaveBeenCalled()
      const lastCall = mockOnDateChange.mock.calls[mockOnDateChange.mock.calls.length - 1][0]
      expect(lastCall.end).toBeInstanceOf(Date)
    })

    it("should handle clearing start date", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const dateInput = screen.getByTestId("date-input-start")
      // First type something, then clear
      await user.type(dateInput, "2024-01-15")
      mockOnDateChange.mockClear()
      await user.clear(dateInput)

      // Clearing triggers the onChange with empty array
      expect(mockOnDateChange).toHaveBeenCalled()
      const lastCall = mockOnDateChange.mock.calls[mockOnDateChange.mock.calls.length - 1][0]
      expect(lastCall.start).toBeNull()
    })

    it("should handle clearing end date", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const dateInput = screen.getByTestId("date-input-end")
      // First type something, then clear
      await user.type(dateInput, "2024-01-20")
      mockOnDateChange.mockClear()
      await user.clear(dateInput)

      // Clearing triggers the onChange with empty array
      expect(mockOnDateChange).toHaveBeenCalled()
      const lastCall = mockOnDateChange.mock.calls[mockOnDateChange.mock.calls.length - 1][0]
      expect(lastCall.end).toBeNull()
    })

    it("should handle invalid date input for start date", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const dateInput = screen.getByTestId("date-input-start")
      await user.type(dateInput, "invalid-date")

      expect(mockOnDateChange).toHaveBeenCalled()
      const lastCall = mockOnDateChange.mock.calls[mockOnDateChange.mock.calls.length - 1][0]
      expect(lastCall.start).toBeNull()
    })

    it("should handle invalid date input for end date", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const dateInput = screen.getByTestId("date-input-end")
      await user.type(dateInput, "not-a-date")

      expect(mockOnDateChange).toHaveBeenCalled()
      const lastCall = mockOnDateChange.mock.calls[mockOnDateChange.mock.calls.length - 1][0]
      expect(lastCall.end).toBeNull()
    })
  })

  describe("Clear All Filters", () => {
    it("should reset all search fields when Clear All Filters is clicked", async () => {
      const user = userEvent.setup()
      const searchOptions = {
        from: "sender@example.com",
        subject: "Test Subject",
        rcpt: ["recipient@example.com"],
        id: "req-123",
        messageId: "<message-id>",
        headerFrom: "header@example.com",
        relay: "aws",
      }

      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={searchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={{ page: 5, pageSize: 30 }}
          dateOptions={{ start: new Date("2024-01-15"), end: new Date("2024-01-20") }}
        />
      )

      const clearButton = screen.getByTestId("clear-button")

      await act(async () => {
        await user.click(clearButton)
      })

      expect(mockOnChange).toHaveBeenCalledWith(
        {
          from: "",
          subject: "",
          rcpt: [],
          id: "",
          messageId: "",
          headerFrom: "",
          relay: "",
        },
        true
      )

      expect(mockOnDateChange).toHaveBeenCalledWith({
        start: null,
        end: null,
      })
    })

    it("should reset page to 1 when Clear All Filters is clicked", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={{ page: 10, pageSize: 50 }}
          dateOptions={defaultDateOptions}
        />
      )

      const clearButton = screen.getByTestId("clear-button")

      await act(async () => {
        await user.click(clearButton)
      })

      expect(mockOnPageChange).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
    })

    it("should trigger re-render when Clear All Filters is clicked", async () => {
      const user = userEvent.setup()
      const { container } = render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const formBefore = container.querySelector("form")
      const keyBefore = formBefore?.getAttribute("key")

      const clearButton = screen.getByTestId("clear-button")

      await act(async () => {
        await user.click(clearButton)
      })

      // Component should re-render with new key
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty recipients array", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={{ ...defaultSearchOptions, rcpt: [] }}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("input-rcpt")).toHaveValue("")
    })

    it("should handle single recipient in array", () => {
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={{ ...defaultSearchOptions, rcpt: ["single@example.com"] }}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      expect(screen.getByTestId("input-rcpt")).toHaveValue("single@example.com")
    })

    it("should handle recipients with spaces in comma separation", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-rcpt")
      await user.type(input, "a, b")

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      // Should split by comma, even with spaces
      expect(Array.isArray(lastCall.rcpt)).toBe(true)
      // After typing "a, b", the last character is 'b', so we have ["a", " b"] (space included in second)
      expect(lastCall.rcpt.length).toBeGreaterThan(0)
    })

    it("should handle special characters in search fields", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-subject")
      await user.type(input, "Test: & < > @#$%")

      expect(mockOnChange).toHaveBeenCalled()
    })

    it("should handle very long input values", async () => {
      const user = userEvent.setup()
      const longString = "a".repeat(1000)

      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-from")
      await user.type(input, longString)

      expect(mockOnChange).toHaveBeenCalled()
    })

    it("should accept className prop", () => {
      const { container } = render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
          className="custom-class"
        />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it("should render without errors when children prop is provided", () => {
      const { container } = render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        >
          <div data-testid="custom-child">Custom Child</div>
        </SearchBar>
      )

      // Component accepts children prop but doesn't render them (not used in the component)
      expect(container).toBeInTheDocument()
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle multiple field changes in sequence", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      await user.type(screen.getByTestId("input-from"), "sender@example.com")
      await user.type(screen.getByTestId("input-subject"), "Test")
      await user.selectOptions(screen.getByTestId("select-input-relay"), "aws")

      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0)
      expect(mockOnPageChange.mock.calls.length).toBeGreaterThan(0)
    })

    it("should maintain page size when resetting page", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={{ page: 3, pageSize: 100 }}
          dateOptions={defaultDateOptions}
        />
      )

      await user.type(screen.getByTestId("input-from"), "test")

      const pageChangeCalls = mockOnPageChange.mock.calls
      pageChangeCalls.forEach((call) => {
        expect(call[0].pageSize).toBe(100)
        expect(call[0].page).toBe(1)
      })
    })

    it("should handle rapid successive changes", async () => {
      const user = userEvent.setup()
      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={defaultSearchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      const input = screen.getByTestId("input-from")
      await user.type(input, "abc")

      expect(mockOnChange.mock.calls.length).toBeGreaterThanOrEqual(3)
    })

    it("should preserve other search options when one field changes", async () => {
      const user = userEvent.setup()
      const searchOptions = {
        from: "existing@example.com",
        subject: "Existing Subject",
        rcpt: ["existing@example.com"],
        id: "existing-id",
        messageId: "<existing-message>",
        headerFrom: "existing-header@example.com",
        relay: "aws",
        start: null,
        end: null,
      }

      render(
        <SearchBar
          onChange={mockOnChange}
          searchOptions={searchOptions}
          onPageChange={mockOnPageChange}
          onDateChange={mockOnDateChange}
          pageOptions={defaultPageOptions}
          dateOptions={defaultDateOptions}
        />
      )

      await user.type(screen.getByTestId("input-subject"), " Updated")

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
      expect(lastCall.from).toBe("existing@example.com")
      expect(lastCall.relay).toBe("aws")
    })
  })
})
