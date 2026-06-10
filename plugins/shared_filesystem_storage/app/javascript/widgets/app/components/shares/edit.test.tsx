import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import EditShareForm from "./edit"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ show, onHide, children }: any) =>
      show ? (
        <div data-testid="modal">{children}</div>
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

const mockShare = { id: "share-1", name: "My Share", description: "Test share" }

const mockHistory = { replace: vi.fn() }

const defaultProps = {
  share: mockShare,
  handleSubmit: vi.fn().mockResolvedValue(undefined),
  history: mockHistory,
  match: { params: { parent: "shares" } },
  loadShareTypesOnce: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EditShareForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Modal visibility", () => {
    it("renders modal when share is set", () => {
      render(<EditShareForm {...defaultProps} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()
    })

    it("does not render modal when share is null", () => {
      render(<EditShareForm {...defaultProps} share={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
    })

    it("hides modal when share changes to null", () => {
      const { rerender } = render(<EditShareForm {...defaultProps} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()

      rerender(<EditShareForm {...defaultProps} share={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
    })

    it("shows modal when share changes from null to a value", () => {
      const { rerender } = render(<EditShareForm {...defaultProps} share={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()

      rerender(<EditShareForm {...defaultProps} share={mockShare} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()
    })
  })

  describe("Mount behaviour", () => {
    it("calls loadShareTypesOnce on mount", () => {
      render(<EditShareForm {...defaultProps} />)
      expect(defaultProps.loadShareTypesOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Form fields", () => {
    it("renders modal title", () => {
      render(<EditShareForm {...defaultProps} />)
      expect(screen.getByTestId("modal-title")).toHaveTextContent("Edit Share")
    })

    it("renders Name and Description fields", () => {
      render(<EditShareForm {...defaultProps} />)
      expect(screen.getByTestId("field-name")).toBeInTheDocument()
      expect(screen.getByTestId("field-description")).toBeInTheDocument()
    })
  })

  describe("Cancel button", () => {
    it("hides modal and navigates to parent route on cancel", () => {
      render(<EditShareForm {...defaultProps} />)
      fireEvent.click(screen.getByTestId("cancel-btn"))

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
      vi.runAllTimers()
      expect(mockHistory.replace).toHaveBeenCalledWith("/shares")
    })
  })

  describe("Form submission", () => {
    it("calls handleSubmit with form values on submit", () => {
      render(<EditShareForm {...defaultProps} />)
      fireEvent.submit(screen.getByTestId("form"))
      expect(defaultProps.handleSubmit).toHaveBeenCalledWith(mockShare)
    })

    it("navigates to parent route after successful submit", async () => {
      render(<EditShareForm {...defaultProps} />)
      fireEvent.submit(screen.getByTestId("form"))

      await vi.runAllTimersAsync()
      expect(mockHistory.replace).toHaveBeenCalledWith("/shares")
    })
  })
})
