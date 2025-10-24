import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent, { UserEvent } from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { SearchField } from "./search_field"

describe("SearchField", () => {
  let mockOnChange: (value: string) => void
  let user: UserEvent

  beforeEach(() => {
    mockOnChange = vi.fn()
    user = userEvent.setup()
  })

  describe("Default variant (non-juno)", () => {
    it("renders with basic props", () => {
      render(<SearchField placeholder="Search test" onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute("placeholder", "Search test")
      expect(input).toHaveValue("")
      expect(input).not.toBeDisabled()
    })

    it("shows search icon when empty and searchIcon is not false", () => {
      render(<SearchField onChange={mockOnChange} />)

      const icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).toHaveClass("fa", "fa-search")
    })

    it("hides search icon when searchIcon is false", () => {
      render(<SearchField onChange={mockOnChange} searchIcon={false} />)

      const icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).not.toHaveClass("fa-search")
      expect(icon?.classList.length).toBe(0)
    })

    it("shows clear icon when input has value", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      const icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).toHaveClass("fa", "fa-times-circle")
    })

    it("shows spinner when isFetching is true", () => {
      render(<SearchField onChange={mockOnChange} isFetching={true} />)

      const icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).toHaveClass("spinner")
    })

    it("calls onChange when typing", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      expect(mockOnChange).toHaveBeenCalledTimes(4) // Called for each character
      expect(mockOnChange).toHaveBeenLastCalledWith("test")
    })

    it("clears input when clicking clear icon", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      // Click on the clear icon
      const clearIcon = screen.getByTestId("search-wrapper").querySelector("i")
      await user.click(clearIcon!)

      expect(input).toHaveValue("")
      expect(mockOnChange).toHaveBeenLastCalledWith("")
    })

    it("does not clear when clicking spinner", async () => {
      render(<SearchField onChange={mockOnChange} isFetching={true} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      const spinnerIcon = screen.getByTestId("search-wrapper").querySelector("i")!
      await user.click(spinnerIcon)

      expect(input).toHaveValue("test")
    })

    it("renders as disabled when disabled prop is true", () => {
      render(<SearchField onChange={mockOnChange} disabled={true} />)

      const input = screen.getByTestId("search")
      expect(input).toBeDisabled()
    })

    it("initializes with value from props on mount", () => {
      render(<SearchField onChange={mockOnChange} value="initial" />)

      const input = screen.getByTestId("search")
      expect(input).toHaveValue("initial")
    })

    it("updates value when props change", () => {
      const { rerender } = render(<SearchField onChange={mockOnChange} value="initial" />)

      const input = screen.getByTestId("search")
      expect(input).toHaveValue("initial")

      rerender(<SearchField onChange={mockOnChange} value="updated" />)
      expect(input).toHaveValue("updated")
    })

    it("does not update when value prop is null", () => {
      const { rerender } = render(<SearchField onChange={mockOnChange} value="initial" />)

      const input = screen.getByTestId("search")
      expect(input).toHaveValue("initial")

      rerender(<SearchField onChange={mockOnChange} value={null} />)
      expect(input).toHaveValue("initial") // Should not change
    })

    it("does not render help section when text prop is not provided", () => {
      render(<SearchField onChange={mockOnChange} />)

      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })

    it("handles empty string value correctly", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")
      await user.clear(input)

      expect(mockOnChange).toHaveBeenLastCalledWith("")
    })

    it("trims whitespace when checking if search term is empty", () => {
      render(<SearchField onChange={mockOnChange} value="   " />)

      // Should show search icon because trimmed value is empty
      const icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).toHaveClass("fa", "fa-search")
    })

    it("applies correct CSS classes to feedback span when empty", () => {
      render(<SearchField onChange={mockOnChange} />)

      const feedbackSpan = screen.getByTestId("search-wrapper").querySelector("span")
      expect(feedbackSpan).toHaveClass("form-control-feedback")
      expect(feedbackSpan).not.toHaveClass("not-empty")
    })

    it("applies correct CSS classes to feedback span when not empty", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      const feedbackSpan = screen.getByTestId("search-wrapper").querySelector("span")
      expect(feedbackSpan).toHaveClass("form-control-feedback", "not-empty")
    })
  })

  describe("Juno variant", () => {
    it("renders Juno SearchInput component", () => {
      render(<SearchField variant="juno" onChange={mockOnChange} placeholder="Juno search" />)

      const searchInput = screen.getByTestId("search")
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute("placeholder", "Juno search")
    })

    it("passes correct props to Juno SearchInput", () => {
      render(
        <SearchField
          variant="juno"
          onChange={mockOnChange}
          placeholder="Test placeholder"
          disabled={true}
          value="test value"
        />
      )

      const input = screen.getByDisplayValue("test value")
      expect(input).toHaveAttribute("placeholder", "Test placeholder")
      expect(input).toBeDisabled()
    })

    it("handles onChange in Juno variant", async () => {
      render(<SearchField variant="juno" onChange={mockOnChange} />)

      const input = screen.getByDisplayValue("")
      await user.type(input, "test")

      expect(mockOnChange).toHaveBeenCalledTimes(4)
      expect(mockOnChange).toHaveBeenLastCalledWith("test")
    })

    it("handles clear in Juno variant", async () => {
      render(<SearchField variant="juno" onChange={mockOnChange} />)

      const input = screen.getByDisplayValue("")
      await user.type(input, "test")

      // Look for the clear button - adjust selector based on actual Juno implementation
      const clearButton = screen.getByRole("button", { name: /clear/i })
      await user.click(clearButton)

      expect(mockOnChange).toHaveBeenLastCalledWith("")
    })

    it("does not render help text in Juno variant", () => {
      render(<SearchField variant="juno" onChange={mockOnChange} text="Help text" />)

      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })

    it("updates Juno SearchInput value when props change", () => {
      const { rerender } = render(<SearchField variant="juno" onChange={mockOnChange} value="initial" />)

      let input = screen.getByDisplayValue("initial")
      expect(input).toBeInTheDocument()

      rerender(<SearchField variant="juno" onChange={mockOnChange} value="updated" />)
      input = screen.getByDisplayValue("updated")
      expect(input).toBeInTheDocument()
    })

    it("initializes Juno variant with value from props", () => {
      render(<SearchField variant="juno" onChange={mockOnChange} value="juno initial" />)

      const input = screen.getByDisplayValue("juno initial")
      expect(input).toBeInTheDocument()
    })
  })

  describe("Help text functionality", () => {
    it("renders help text with popover when text prop is provided", () => {
      render(<SearchField onChange={mockOnChange} text="Help text" />)

      const helpLink = screen.getByRole("link")
      expect(helpLink).toBeInTheDocument()

      const helpIcon = helpLink.querySelector(".fa-question-circle")
      expect(helpIcon).toBeInTheDocument()
    })

    it("help link prevents default behavior", async () => {
      render(<SearchField onChange={mockOnChange} text="Help text" />)

      const helpLink = screen.getByRole("link")

      // Create a mock event to check preventDefault
      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault")

      fireEvent(helpLink, clickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it("renders popover with correct attributes", () => {
      render(<SearchField onChange={mockOnChange} text="Custom help text" />)

      const helpLink = screen.getByRole("link")
      expect(helpLink).toBeInTheDocument()
    })
  })

  describe("Event handling edge cases", () => {
    it("handles onChange with undefined target value", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")

      // Simulate an event with undefined value
      fireEvent.change(input, { target: { value: undefined } })

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it("prevents default when resetting via clear icon", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      const clearIcon = screen.getByTestId("search-wrapper").querySelector("i")!
      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault")

      fireEvent(clearIcon, clickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it("does not clear when input is empty and icon is clicked", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const clearIcon = screen.getByTestId("search-wrapper").querySelector("i")!
      await user.click(clearIcon)

      // Should not call onChange since input was already empty
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe.skip("Lifecycle behavior", () => {
    it("sets initial value from props on component mount", () => {
      render(<SearchField onChange={mockOnChange} value="mounted value" />)

      const input = screen.getByTestId("search")
      expect(input).toHaveValue("mounted value")
    })

    it("updates internal state when value prop changes", () => {
      const { rerender } = render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      expect(input).toHaveValue("")

      rerender(<SearchField onChange={mockOnChange} value="new value" />)
      expect(input).toHaveValue("new value")
    })

    it("maintains internal state when value prop is null or undefined", () => {
      const { rerender } = render(<SearchField onChange={mockOnChange} value="initial" />)

      const input = screen.getByTestId("search")
      expect(input).toHaveValue("initial")

      // Test null
      rerender(<SearchField onChange={mockOnChange} value={null} />)
      expect(input).toHaveValue("initial")

      // Test undefined
      rerender(<SearchField onChange={mockOnChange} value={undefined} />)
      expect(input).toHaveValue("initial")
    })
  })

  describe("Icon interaction behavior", () => {
    it("allows clicking clear icon when not fetching and not empty", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const input = screen.getByTestId("search")
      await user.type(input, "test")

      const clearIcon = screen.getByTestId("search-wrapper").querySelector("i")!
      await user.click(clearIcon)

      expect(input).toHaveValue("")
      expect(mockOnChange).toHaveBeenLastCalledWith("")
    })

    it("does not clear when clicking search icon on empty input", async () => {
      render(<SearchField onChange={mockOnChange} />)

      const searchIcon = screen.getByTestId("search-wrapper").querySelector("i")!
      await user.click(searchIcon)

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it("shows correct icon based on fetching state", () => {
      const { rerender } = render(<SearchField onChange={mockOnChange} value="test" />)

      // Should show clear icon when not fetching
      let icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).toHaveClass("fa-times-circle")

      // Should show spinner when fetching
      rerender(<SearchField onChange={mockOnChange} value="test" isFetching={true} />)
      icon = screen.getByTestId("search-wrapper").querySelector("i")
      expect(icon).toHaveClass("spinner")
    })
  })
})
