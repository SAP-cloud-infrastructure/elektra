import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import EditShareNetworkForm from "./edit"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ show, onHide, children }: any) =>
      show ? (
        <div data-testid="modal" onClick={onHide}>
          {children}
        </div>
      ) : null,
    {
      Header: ({ children }: any) => <div data-testid="modal-header">{children}</div>,
      Title: ({ children }: any) => <h1 data-testid="modal-title">{children}</h1>,
      Body: ({ children }: any) => <div data-testid="modal-body">{children}</div>,
      Footer: ({ children }: any) => <div data-testid="modal-footer">{children}</div>,
    }
  ),
  Button: ({ onClick, children }: any) => (
    <button data-testid="cancel-btn" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock("lib/elektra-form", () => ({
  Form: Object.assign(
    ({ onSubmit, children, initialValues }: any) => (
      <form
        data-testid="form"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(initialValues)
        }}
      >
        {children}
      </form>
    ),
    {
      Errors: () => null,
      ElementHorizontal: ({ label, children }: any) => (
        <div data-testid={`field-${label.toLowerCase()}`}>{children}</div>
      ),
      Input: ({ name }: any) => <input data-testid={`input-${name}`} />,
      SubmitButton: ({ label }: any) => (
        <button type="submit" data-testid="submit-btn">
          {label}
        </button>
      ),
    }
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockShareNetwork = { id: "sn-1", name: "My Network", description: "Test network" }

const mockHistory = { replace: vi.fn() }

const defaultProps = {
  shareNetwork: mockShareNetwork,
  handleSubmit: vi.fn().mockResolvedValue(undefined),
  history: mockHistory,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EditShareNetworkForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Modal visibility", () => {
    it("renders modal when shareNetwork is set", () => {
      render(<EditShareNetworkForm {...defaultProps} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()
    })

    it("does not render modal when shareNetwork is null", () => {
      render(<EditShareNetworkForm {...defaultProps} shareNetwork={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
    })

    it("hides modal when shareNetwork changes to null", () => {
      const { rerender } = render(<EditShareNetworkForm {...defaultProps} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()

      rerender(<EditShareNetworkForm {...defaultProps} shareNetwork={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
    })

    it("shows modal when shareNetwork changes from null to a value", () => {
      const { rerender } = render(<EditShareNetworkForm {...defaultProps} shareNetwork={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()

      rerender(<EditShareNetworkForm {...defaultProps} shareNetwork={mockShareNetwork} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()
    })
  })

  describe("Form fields", () => {
    it("renders Name and Description fields", () => {
      render(<EditShareNetworkForm {...defaultProps} />)
      expect(screen.getByTestId("field-name")).toBeInTheDocument()
      expect(screen.getByTestId("field-description")).toBeInTheDocument()
    })

    it("renders modal title", () => {
      render(<EditShareNetworkForm {...defaultProps} />)
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Edit Share Network")
    })
  })

  describe("Cancel button", () => {
    it("hides modal and navigates to /share-networks on cancel", () => {
      render(<EditShareNetworkForm {...defaultProps} />)
      fireEvent.click(screen.getByTestId("cancel-btn"))

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
      vi.runAllTimers()
      expect(mockHistory.replace).toHaveBeenCalledWith("/share-networks")
    })
  })

  describe("Form submission", () => {
    it("calls handleSubmit with form values on submit", async () => {
      render(<EditShareNetworkForm {...defaultProps} />)
      fireEvent.submit(screen.getByTestId("form"))
      expect(defaultProps.handleSubmit).toHaveBeenCalledWith(mockShareNetwork)
    })

    it("navigates to /share-networks after successful submit", async () => {
      render(<EditShareNetworkForm {...defaultProps} />)
      fireEvent.submit(screen.getByTestId("form"))

      await vi.runAllTimersAsync()
      expect(mockHistory.replace).toHaveBeenCalledWith("/share-networks")
    })
  })
})
