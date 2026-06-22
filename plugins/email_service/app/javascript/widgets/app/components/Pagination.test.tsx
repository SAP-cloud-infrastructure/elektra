import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import Pagination from "./Pagination"

vi.mock("@cloudoperators/juno-ui-components", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}))

const prevBtn = () => screen.getByRole("button", { name: "‹ Prev" })
const nextBtn = () => screen.getByRole("button", { name: "Next ›" })
const pageSelect = () => screen.getByRole("combobox")

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

      expect(screen.getByText("Page 1 of 7")).toBeInTheDocument()
    })

    it("should render prev and next buttons", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      expect(prevBtn()).toBeInTheDocument()
      expect(nextBtn()).toBeInTheDocument()
    })

    it("should render page size select with default options", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      const select = pageSelect()
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

      const select = pageSelect() as HTMLSelectElement
      expect(select.value).toBe("30")
    })
  })

  describe("Total Pages Calculation", () => {
    it("should calculate total pages correctly for exact division", () => {
      render(
        <Pagination hits={90} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 30 }} />
      )

      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument()
    })

    it("should round up total pages for non-exact division", () => {
      render(
        <Pagination hits={95} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 30 }} />
      )

      expect(screen.getByText("Page 1 of 4")).toBeInTheDocument()
    })

    it("should show 0 pages when hits is 0", () => {
      render(
        <Pagination hits={0} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("Page 1 of 0")).toBeInTheDocument()
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

      expect(screen.getByText("Page 1 of 0")).toBeInTheDocument()
    })

    it("should calculate total pages with different page sizes", () => {
      const { rerender } = render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )
      expect(screen.getByText("Page 1 of 7")).toBeInTheDocument()

      rerender(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 50 }} />
      )
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()

      rerender(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 100 }} />
      )
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument()
    })
  })

  describe("Navigation Buttons", () => {
    it("should disable prev button on first page", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(prevBtn()).toBeDisabled()
    })

    it("should enable prev button on pages after first", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      expect(prevBtn()).not.toBeDisabled()
    })

    it("should disable next button on last page", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 7, pageSize: 15 }} />
      )

      expect(nextBtn()).toBeDisabled()
    })

    it("should enable next button on pages before last", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 6, pageSize: 15 }} />
      )

      expect(nextBtn()).not.toBeDisabled()
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

      expect(prevBtn()).toBeDisabled()
      expect(nextBtn()).toBeDisabled()
    })
  })

  describe("Navigation Actions", () => {
    it("should call onChanged with previous page when prev button clicked", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 3, pageSize: 15 }} />
      )

      await user.click(prevBtn())

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 2, pageSize: 15 })
    })

    it("should call onChanged with next page when next button clicked", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 3, pageSize: 15 }} />
      )

      await user.click(nextBtn())

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 4, pageSize: 15 })
    })

    it("should not call onChanged when clicking prev on first page", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      await user.click(prevBtn())

      expect(mockOnChanged).not.toHaveBeenCalled()
    })

    it("should not call onChanged when clicking next on last page", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 7, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      await user.click(nextBtn())

      expect(mockOnChanged).not.toHaveBeenCalled()
    })
  })

  describe("Page Size Selection", () => {
    it("should call onChanged with new page size and reset to page 1", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 3, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      await user.selectOptions(pageSelect(), "30")

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 30 })
    })

    it("should handle changing to page size 50", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 2, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      await user.selectOptions(pageSelect(), "50")

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 50 })
    })

    it("should handle changing to page size 100", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 5, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      await user.selectOptions(pageSelect(), "100")

      expect(mockOnChanged).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    })

    it("should always reset to page 1 when changing page size", async () => {
      const user = userEvent.setup()
      render(
        <Pagination hits={1000} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 10, pageSize: 15 }} />
      )

      mockOnChanged.mockClear()
      await user.selectOptions(pageSelect(), "100")

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

      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument()
      expect(prevBtn()).toBeDisabled()
      expect(nextBtn()).toBeDisabled()
    })

    it("should handle large number of hits", () => {
      render(
        <Pagination hits={10000} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("Page 1 of 667")).toBeInTheDocument()
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

      expect(screen.getByText("Page 500 of 667")).toBeInTheDocument()
    })

    it("should work correctly when hits equals pageSize", () => {
      render(
        <Pagination hits={15} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument()
      expect(nextBtn()).toBeDisabled()
    })

    it("should work correctly when hits is one more than pageSize", () => {
      render(
        <Pagination hits={16} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()
      expect(nextBtn()).not.toBeDisabled()
    })

    it("should render pagination container with correct styles", () => {
      const { container } = render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ display: "flex", alignItems: "center" })
    })
  })

  describe("isFetching Prop", () => {
    it("should render when isFetching is true", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={true} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("Page 1 of 7")).toBeInTheDocument()
    })

    it("should render when isFetching is false", () => {
      render(
        <Pagination hits={100} onChanged={mockOnChanged} isFetching={false} pageOptions={{ page: 1, pageSize: 15 }} />
      )

      expect(screen.getByText("Page 1 of 7")).toBeInTheDocument()
    })
  })
})
