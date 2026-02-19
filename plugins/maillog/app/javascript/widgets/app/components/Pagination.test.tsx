import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import Pagination from "./Pagination"

// Mock Juno UI components
vi.mock("@cloudoperators/juno-ui-components", () => ({
  Stack: ({ children, ...props }: any) => (
    <div data-testid="stack" {...props}>
      {children}
    </div>
  ),
  Button: ({ label, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid={`button-${label}`} {...props}>
      {label}
    </button>
  ),
  Select: ({ children, onChange, value, placeholder, ...props }: any) => (
    <select data-testid="page-size-select" onChange={(e) => onChange(e.target.value)} value={value} {...props}>
      {children}
    </select>
  ),
  SelectOption: ({ value, ...props }: any) => (
    <option value={value} {...props}>
      {value}
    </option>
  ),
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

describe("Pagination", () => {
  const mockOnChanged = vi.fn()

  beforeEach(() => {
    mockOnChanged.mockClear()
  })

  describe("Basic Rendering", () => {
    it("should render pagination with current page and total pages", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 7")).toBeInTheDocument()
    })

    it("should render prev and next buttons", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      expect(screen.getByTestId("button-<")).toBeInTheDocument()
      expect(screen.getByTestId("button->")).toBeInTheDocument()
    })

    it("should render page size select with default options", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      const select = screen.getByTestId("page-size-select")
      expect(select).toBeInTheDocument()
      expect(screen.getByText("15")).toBeInTheDocument()
      expect(screen.getByText("30")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
      expect(screen.getByText("100")).toBeInTheDocument()
    })

    it("should display current pageSize in select", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 30 }} />
      )

      const select = screen.getByTestId("page-size-select") as HTMLSelectElement
      expect(select.value).toBe("30")
    })
  })

  describe("Total Pages Calculation", () => {
    it("should calculate total pages correctly for exact division", () => {
      render(
        <Pagination hits={90} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 30 }} />
      )

      expect(screen.getByText("1 / 3")).toBeInTheDocument()
    })

    it("should round up total pages for non-exact division", () => {
      render(
        <Pagination hits={95} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 30 }} />
      )

      expect(screen.getByText("1 / 4")).toBeInTheDocument()
    })

    it("should show 0 pages when hits is 0", () => {
      render(
        <Pagination hits={0} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 0")).toBeInTheDocument()
    })

    it("should handle undefined hits as 0", () => {
      render(
        <Pagination
          hits={undefined as any}
          onChanged={mockOnChanged}
          isFetching={false}
          pageOptions={{ page: 1, pageSize: 15 }}
        />
      )

      expect(screen.getByText("1 / 0")).toBeInTheDocument()
    })

    it("should calculate total pages with different page sizes", () => {
      const { rerender } = render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )
      expect(screen.getByText("1 / 7")).toBeInTheDocument()

      rerender(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 50 }} />
      )
      expect(screen.getByText("1 / 2")).toBeInTheDocument()

      rerender(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 100 }} />
      )
      expect(screen.getByText("1 / 1")).toBeInTheDocument()
    })
  })

  describe("Navigation Buttons", () => {
    it("should disable prev button on first page", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      const prevButton = screen.getByTestId("button-<")
      expect(prevButton).toBeDisabled()
    })

    it("should enable prev button on pages after first", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      const prevButton = screen.getByTestId("button-<")
      expect(prevButton).not.toBeDisabled()
    })

    it("should disable next button on last page", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 7, pageSize: 15 }} />
      )

      const nextButton = screen.getByTestId("button->")
      expect(nextButton).toBeDisabled()
    })

    it("should enable next button on pages before last", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 6, pageSize: 15 }} />
      )

      const nextButton = screen.getByTestId("button->")
      expect(nextButton).not.toBeDisabled()
    })

    it("should disable both buttons when disabled prop is true", () => {
      render(
        <Pagination
          hits={100}
          onChanged={mockOnChanged}
          isFetching={false}
          pageOptions={{ page: 3, pageSize: 15 }}
          disabled={true}
        />
      )

      const prevButton = screen.getByTestId("button-<")
      const nextButton = screen.getByTestId("button->")
      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    })
  })

  describe("Navigation Actions", () => {
    it("should call onChanged with previous page when prev button clicked", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 3, pageSize: 15 }} />
      )

      const prevButton = screen.getByTestId("button-<")
      await user.click(prevButton)

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 2, pageSize: 15 })
    })

    it("should call onChanged with next page when next button clicked", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 3, pageSize: 15 }} />
      )

      const nextButton = screen.getByTestId("button->")
      await user.click(nextButton)

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 4, pageSize: 15 })
    })

    it("should not call onChanged when clicking prev on first page", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      mockOnChanged.mockClear() // Clear the useEffect call
      const prevButton = screen.getByTestId("button-<")
      await user.click(prevButton)

      // Button is disabled, so click should not trigger anything
      expect(mockOnChanged).not.toHaveBeenCalled()
    })

    it("should not call onChanged when clicking next on last page", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 7, pageSize: 15 }} />
      )

      mockOnChanged.mockClear() // Clear the useEffect call
      const nextButton = screen.getByTestId("button->")
      await user.click(nextButton)

      // Button is disabled, so click should not trigger anything
      expect(mockOnChanged).not.toHaveBeenCalled()
    })
  })

  describe("Page Size Selection", () => {
    it("should call onChanged with new page size and reset to page 1", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 3, pageSize: 15 }} />
      )

      mockOnChanged.mockClear() // Clear the useEffect call
      const select = screen.getByTestId("page-size-select")
      await user.selectOptions(select, "30")

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 30 })
    })

    it("should handle changing to page size 50", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      const select = screen.getByTestId("page-size-select")
      await user.selectOptions(select, "50")

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
    })

    it("should handle changing to page size 100", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 5, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      const select = screen.getByTestId("page-size-select")
      await user.selectOptions(select, "100")

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    })

    it("should always reset to page 1 when changing page size", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={1000} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 10, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      const select = screen.getByTestId("page-size-select")
      await user.selectOptions(select, "100")

      const call = mockOnChanged.mock.calls[0][0]
      expect(call.page).toBe(1)
      expect(call.pageSize).toBe(100)
    })
  })

  describe("useEffect Behavior", () => {
    it("should call onChanged on mount", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 30 }} />
      )

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 2, pageSize: 30 })
    })

    it("should call onChanged when page changes", () => {
      const { rerender } = render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()

      rerender(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 2, pageSize: 15 })
    })

    it("should call onChanged when pageSize changes", () => {
      const { rerender } = render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()

      rerender(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 30 }} />
      )

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 30 })
    })
  })

  describe("Edge Cases", () => {
    it("should handle single page scenario", () => {
      render(
        <Pagination hits={10} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 1")).toBeInTheDocument()
      expect(screen.getByTestId("button-<")).toBeDisabled()
      expect(screen.getByTestId("button->")).toBeDisabled()
    })

    it("should handle large number of hits", () => {
      render(
        <Pagination hits={10000} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 667")).toBeInTheDocument()
    })

    it("should handle very large page numbers", () => {
      render(
        <Pagination
          hits={10000}
          onChanged={mockOnChanged}
          isFetching={false}
          pageOptions={{ page: 500, pageSize: 15 }}
        />
      )

      expect(screen.getByText("500 / 667")).toBeInTheDocument()
    })

    it("should work correctly when hits equals pageSize", () => {
      render(
        <Pagination hits={15} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 1")).toBeInTheDocument()
      expect(screen.getByTestId("button->")).toBeDisabled()
    })

    it("should work correctly when hits is one more than pageSize", () => {
      render(
        <Pagination hits={16} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 2")).toBeInTheDocument()
      expect(screen.getByTestId("button->")).not.toBeDisabled()
    })

    it("should render Stack component with correct props", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      const stack = screen.getByTestId("stack")
      expect(stack).toHaveAttribute("alignment", "center")
      expect(stack).toHaveAttribute("distribution", "end")
    })
  })

  describe("isFetching Prop", () => {
    it("should render when isFetching is true", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={true} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 7")).toBeInTheDocument()
    })

    it("should render when isFetching is false", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("1 / 7")).toBeInTheDocument()
    })

    // Note: isFetching prop is passed but not used in current implementation
    // This test documents the current behavior
  })
})
