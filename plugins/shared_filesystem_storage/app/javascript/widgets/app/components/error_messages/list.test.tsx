import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ErrorMessageList from "./list"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ show, onExited, onHide, children }: any) => (
      <div data-testid="modal" data-show={String(show)} onTransitionEnd={onExited}>
        <button data-testid="modal-backdrop" onClick={onHide} />
        {children}
      </div>
    ),
    {
      Header: ({ children }: any) => <div data-testid="modal-header">{children}</div>,
      Title: ({ children }: any) => <h1 data-testid="modal-title">{children}</h1>,
      Body: ({ children }: any) => <div data-testid="modal-body">{children}</div>,
      Footer: ({ children }: any) => <div data-testid="modal-footer">{children}</div>,
    }
  ),
  Button: ({ children, onClick }: any) => (
    <button data-testid="close-btn" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock("./item", () => ({
  default: ({ errorMessage }: any) => (
    <tr data-testid="error-message-item">
      <td>{errorMessage.message_level}</td>
      <td>{errorMessage.user_message}</td>
    </tr>
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockErrorMessages = {
  isFetching: false,
  items: [
    { id: "em-1", message_level: "ERROR", user_message: "Something went wrong", created_at: "2024-01-01T00:00:00Z" },
    { id: "em-2", message_level: "WARNING", user_message: "Low disk space", created_at: "2024-01-02T00:00:00Z" },
  ],
}

const mockHistory = { replace: vi.fn() }
const mockMatch = { params: { type: "shares" } }
const mockLoadErrorMessagesOnce = vi.fn()

const defaultProps = {
  errorMessages: mockErrorMessages,
  loadErrorMessagesOnce: mockLoadErrorMessagesOnce,
  history: mockHistory,
  match: mockMatch,
}

const renderComponent = (props = {}) => render(<ErrorMessageList {...defaultProps} {...props} />)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ErrorMessageList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Initial rendering ──────────────────────────────────────────────────────

  describe("Initial rendering", () => {
    it("renders the modal", () => {
      renderComponent()
      expect(screen.getByTestId("modal")).toBeInTheDocument()
      expect(screen.getByTestId("modal")).toHaveAttribute("data-show", "true")
    })

    it("renders the modal title", () => {
      renderComponent()
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Error Log")
    })

    it("renders the Close button", () => {
      renderComponent()
      expect(screen.getByTestId("close-btn")).toBeInTheDocument()
    })

    it("calls loadErrorMessagesOnce on mount", () => {
      renderComponent()
      expect(mockLoadErrorMessagesOnce).toHaveBeenCalledTimes(1)
    })
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe("Loading state", () => {
    it("shows spinner when errorMessages is undefined", () => {
      renderComponent({ errorMessages: undefined })
      expect(document.querySelector(".spinner")).toBeInTheDocument()
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("shows spinner when isFetching is true", () => {
      renderComponent({ errorMessages: { isFetching: true, items: [] } })
      expect(document.querySelector(".spinner")).toBeInTheDocument()
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("shows table when errorMessages are loaded", () => {
      renderComponent()
      expect(document.querySelector("table.table.error-messages")).toBeInTheDocument()
    })
  })

  // ── Table content ──────────────────────────────────────────────────────────

  describe("Table content", () => {
    it("renders table headers: Level, Error, Created", () => {
      renderComponent()
      expect(screen.getByText("Level")).toBeInTheDocument()
      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Created")).toBeInTheDocument()
    })

    it("renders one ErrorMessageItem per error message", () => {
      renderComponent()
      const items = screen.getAllByTestId("error-message-item")
      expect(items).toHaveLength(2)
    })

    it("shows 'No errors found.' when items list is empty", () => {
      renderComponent({ errorMessages: { isFetching: false, items: [] } })
      expect(screen.getByText("No errors found.")).toBeInTheDocument()
    })
  })

  // ── Close behaviour ────────────────────────────────────────────────────────

  describe("Close behaviour", () => {
    it("hides modal when Close button is clicked", () => {
      renderComponent()
      fireEvent.click(screen.getByTestId("close-btn"))
      expect(screen.getByTestId("modal")).toHaveAttribute("data-show", "false")
    })

    it("navigates to match.params.type on close", () => {
      renderComponent()
      fireEvent.click(screen.getByTestId("close-btn"))
      // Simulate onExited (modal transition end)
      fireEvent.transitionEnd(screen.getByTestId("modal"))
      expect(mockHistory.replace).toHaveBeenCalledWith("shares")
    })

    it("navigates to 'shares' fallback when match.params.type is undefined", () => {
      renderComponent({ match: { params: {} } })
      fireEvent.click(screen.getByTestId("close-btn"))
      fireEvent.transitionEnd(screen.getByTestId("modal"))
      expect(mockHistory.replace).toHaveBeenCalledWith("shares")
    })

    it("does not navigate when modal is still visible", () => {
      renderComponent()
      // Fire transition without closing first
      fireEvent.transitionEnd(screen.getByTestId("modal"))
      expect(mockHistory.replace).not.toHaveBeenCalled()
    })
  })
})
