import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act, within } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import EditShareForm from "./edit"

// ─── Module mocks ─────────────────────────────────────────────────────────────

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
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("does not render modal when share is null", () => {
      render(<EditShareForm {...defaultProps} share={null} />)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("hides modal when share changes to null", () => {
      const { rerender } = render(<EditShareForm {...defaultProps} />)
      expect(screen.getByRole("dialog")).toBeInTheDocument()

      rerender(<EditShareForm {...defaultProps} share={null} />)
      act(() => {
        vi.runAllTimers()
      })
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("shows modal when share changes from null to a value", () => {
      const { rerender } = render(<EditShareForm {...defaultProps} share={null} />)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      rerender(<EditShareForm {...defaultProps} share={mockShare} />)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
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
      expect(document.querySelector(".modal-title")).toHaveTextContent("Edit Share")
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
      const footer = document.querySelector(".modal-footer") as HTMLElement
      fireEvent.click(within(footer).getByRole("button", { name: "Cancel" }))

      act(() => {
        vi.runAllTimers()
      })
      expect(mockHistory.replace).toHaveBeenCalledWith("/shares")
    })
  })

  describe("Form submission", () => {
    it("calls handleSubmit with form values on submit", async () => {
      render(<EditShareForm {...defaultProps} />)
      await act(async () => {
        fireEvent.submit(screen.getByTestId("form"))
        await vi.runAllTimersAsync()
      })
      expect(defaultProps.handleSubmit).toHaveBeenCalledWith(mockShare)
    })

    it("navigates to parent route after successful submit", async () => {
      render(<EditShareForm {...defaultProps} />)
      fireEvent.submit(screen.getByTestId("form"))

      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(mockHistory.replace).toHaveBeenCalledWith("/shares")
    })
  })
})
