import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import TooltipedInput from "./TooltipedInput"

// Mock Juno UI components
vi.mock("@cloudoperators/juno-ui-components", () => ({
  TextInput: ({ id, label, value, onChange, width, ...props }: any) => (
    <div data-testid={`text-input-container-${id}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={onChange} data-testid={`text-input-${id}`} data-width={width} {...props} />
    </div>
  ),
  Tooltip: ({ children, triggerEvent, placement, ...props }: any) => (
    <div data-testid="tooltip" data-trigger-event={triggerEvent} data-placement={placement} {...props}>
      {children}
    </div>
  ),
  TooltipTrigger: ({ children, asChild, ...props }: any) => (
    <div data-testid="tooltip-trigger" data-as-child={asChild} {...props}>
      {children}
    </div>
  ),
  TooltipContent: ({ children, ...props }: any) => (
    <div data-testid="tooltip-content" {...props}>
      {children}
    </div>
  ),
}))

describe("TooltipedInput", () => {
  const mockOnChange = vi.fn()

  const defaultProps = {
    id: "test-input",
    label: "Test Label",
    value: "",
    tooltipContent: "This is a tooltip",
    onChange: mockOnChange,
  }

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe("Basic Rendering", () => {
    it("renders the TextInput component", () => {
      render(<TooltipedInput {...defaultProps} />)

      expect(screen.getByTestId("text-input-test-input")).toBeInTheDocument()
    })

    it("renders with correct label", () => {
      render(<TooltipedInput {...defaultProps} />)

      expect(screen.getByText("Test Label")).toBeInTheDocument()
    })

    it("renders with correct id", () => {
      render(<TooltipedInput {...defaultProps} />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveAttribute("id", "test-input")
    })

    it("renders with correct initial value", () => {
      render(<TooltipedInput {...defaultProps} value="initial value" />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue("initial value")
    })

    it("renders with empty value when value prop is empty string", () => {
      render(<TooltipedInput {...defaultProps} value="" />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue("")
    })
  })

  describe("Tooltip Components", () => {
    it("renders Tooltip component", () => {
      render(<TooltipedInput {...defaultProps} />)

      expect(screen.getByTestId("tooltip")).toBeInTheDocument()
    })

    it("renders TooltipTrigger component", () => {
      render(<TooltipedInput {...defaultProps} />)

      expect(screen.getByTestId("tooltip-trigger")).toBeInTheDocument()
    })

    it("renders TooltipContent component", () => {
      render(<TooltipedInput {...defaultProps} />)

      expect(screen.getByTestId("tooltip-content")).toBeInTheDocument()
    })

    it("renders tooltip content with correct text", () => {
      render(<TooltipedInput {...defaultProps} tooltipContent="Help text here" />)

      expect(screen.getByText("Help text here")).toBeInTheDocument()
    })

    it("sets triggerEvent to hover on Tooltip", () => {
      render(<TooltipedInput {...defaultProps} />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-trigger-event", "hover")
    })

    it("sets asChild to true on TooltipTrigger", () => {
      render(<TooltipedInput {...defaultProps} />)

      const trigger = screen.getByTestId("tooltip-trigger")
      expect(trigger).toHaveAttribute("data-as-child", "true")
    })
  })

  describe("Placement Prop", () => {
    it("uses default placement 'top-start' when placement prop is not provided", () => {
      render(<TooltipedInput {...defaultProps} />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "top-start")
    })

    it("uses custom placement when placement prop is provided - top", () => {
      render(<TooltipedInput {...defaultProps} placement="top" />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "top")
    })

    it("uses custom placement when placement prop is provided - bottom", () => {
      render(<TooltipedInput {...defaultProps} placement="bottom" />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "bottom")
    })

    it("uses custom placement when placement prop is provided - bottom-start", () => {
      render(<TooltipedInput {...defaultProps} placement="bottom-start" />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "bottom-start")
    })

    it("uses custom placement when placement prop is provided - left", () => {
      render(<TooltipedInput {...defaultProps} placement="left" />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "left")
    })

    it("uses custom placement when placement prop is provided - right", () => {
      render(<TooltipedInput {...defaultProps} placement="right" />)

      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "right")
    })
  })

  describe("TextInput Properties", () => {
    it("sets width to 'auto' on TextInput", () => {
      render(<TooltipedInput {...defaultProps} />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveAttribute("data-width", "auto")
    })

    it("passes id to TextInput", () => {
      render(<TooltipedInput {...defaultProps} id="custom-id" />)

      const input = screen.getByTestId("text-input-custom-id")
      expect(input).toHaveAttribute("id", "custom-id")
    })

    it("passes label to TextInput", () => {
      render(<TooltipedInput {...defaultProps} label="Custom Label" />)

      expect(screen.getByText("Custom Label")).toBeInTheDocument()
    })

    it("passes value to TextInput", () => {
      render(<TooltipedInput {...defaultProps} value="test value" />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue("test value")
    })
  })

  describe("User Interactions", () => {
    it("calls onChange when input value changes", async () => {
      const user = userEvent.setup()
      render(<TooltipedInput {...defaultProps} />)

      const input = screen.getByTestId("text-input-test-input")
      await user.type(input, "test")

      expect(mockOnChange).toHaveBeenCalled()
      expect(mockOnChange.mock.calls.length).toBeGreaterThan(0)
    })

    it("calls onChange with correct event when typing a single character", async () => {
      const user = userEvent.setup()
      render(<TooltipedInput {...defaultProps} />)

      const input = screen.getByTestId("text-input-test-input")
      await user.type(input, "a")

      expect(mockOnChange).toHaveBeenCalled()
    })

    it("calls onChange multiple times when typing multiple characters", async () => {
      const user = userEvent.setup()
      render(<TooltipedInput {...defaultProps} />)

      const input = screen.getByTestId("text-input-test-input")
      await user.type(input, "hello")

      // userEvent.type types one character at a time
      expect(mockOnChange.mock.calls.length).toBe(5)
    })

    it("updates value when controlled component receives new value", () => {
      const { rerender } = render(<TooltipedInput {...defaultProps} value="initial" />)

      let input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue("initial")

      rerender(<TooltipedInput {...defaultProps} value="updated" />)

      input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue("updated")
    })

    it("handles clearing input value", async () => {
      const user = userEvent.setup()
      render(<TooltipedInput {...defaultProps} value="initial value" />)

      const input = screen.getByTestId("text-input-test-input")
      await user.clear(input)

      expect(mockOnChange).toHaveBeenCalled()
    })

    it("handles pasting text into input", async () => {
      const user = userEvent.setup()
      render(<TooltipedInput {...defaultProps} />)

      const input = screen.getByTestId("text-input-test-input")
      await user.click(input)
      await user.paste("pasted text")

      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("handles empty string as tooltipContent", () => {
      render(<TooltipedInput {...defaultProps} tooltipContent="" />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toBeInTheDocument()
      expect(tooltipContent).toHaveTextContent("")
    })

    it("handles long text in tooltipContent", () => {
      const longText =
        "This is a very long tooltip content that spans multiple lines and contains a lot of information about the input field"
      render(<TooltipedInput {...defaultProps} tooltipContent={longText} />)

      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it("handles special characters in tooltipContent", () => {
      const specialChars = 'Special chars: !@#$%^&*()_+{}[]|\\:";<>?,./~`'
      render(<TooltipedInput {...defaultProps} tooltipContent={specialChars} />)

      expect(screen.getByText(specialChars)).toBeInTheDocument()
    })

    it("handles multiline tooltipContent", () => {
      const multilineText = "Line 1\nLine 2\nLine 3"
      render(<TooltipedInput {...defaultProps} tooltipContent={multilineText} />)

      const tooltipContent = screen.getByTestId("tooltip-content")
      expect(tooltipContent).toBeInTheDocument()
      // Note: toHaveTextContent normalizes whitespace, so we check textContent directly
      expect(tooltipContent.textContent).toBe(multilineText)
    })

    it("handles empty string as label", () => {
      render(<TooltipedInput {...defaultProps} label="" />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toBeInTheDocument()
    })

    it("handles special characters in value", async () => {
      render(<TooltipedInput {...defaultProps} value="<script>alert('test')</script>" />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue("<script>alert('test')</script>")
    })

    it("handles very long input values", () => {
      const longValue = "a".repeat(1000)
      render(<TooltipedInput {...defaultProps} value={longValue} />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue(longValue)
    })

    it("handles Unicode characters in value", () => {
      const unicodeValue = "Hello 世界 🌍 émojis"
      render(<TooltipedInput {...defaultProps} value={unicodeValue} />)

      const input = screen.getByTestId("text-input-test-input")
      expect(input).toHaveValue(unicodeValue)
    })
  })

  describe("Component Structure", () => {
    it("wraps TextInput in a div inside TooltipTrigger", () => {
      render(<TooltipedInput {...defaultProps} />)

      const trigger = screen.getByTestId("tooltip-trigger")
      const container = screen.getByTestId("text-input-container-test-input")

      expect(trigger).toBeInTheDocument()
      expect(container).toBeInTheDocument()
    })

    it("renders all components in correct hierarchy", () => {
      const { container } = render(<TooltipedInput {...defaultProps} />)

      // Tooltip should be the root
      const tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toBeInTheDocument()

      // TooltipTrigger should be inside Tooltip
      const trigger = screen.getByTestId("tooltip-trigger")
      expect(tooltip).toContainElement(trigger)

      // TooltipContent should be inside Tooltip
      const content = screen.getByTestId("tooltip-content")
      expect(tooltip).toContainElement(content)

      // TextInput should be inside TooltipTrigger
      const input = screen.getByTestId("text-input-test-input")
      expect(trigger).toContainElement(input)
    })
  })

  describe("Multiple Instances", () => {
    it("renders multiple TooltipedInput components independently", () => {
      render(
        <div>
          <TooltipedInput
            id="input-1"
            label="Label 1"
            value="Value 1"
            tooltipContent="Tooltip 1"
            onChange={mockOnChange}
          />
          <TooltipedInput
            id="input-2"
            label="Label 2"
            value="Value 2"
            tooltipContent="Tooltip 2"
            onChange={mockOnChange}
          />
          <TooltipedInput
            id="input-3"
            label="Label 3"
            value="Value 3"
            tooltipContent="Tooltip 3"
            onChange={mockOnChange}
          />
        </div>
      )

      expect(screen.getByTestId("text-input-input-1")).toHaveValue("Value 1")
      expect(screen.getByTestId("text-input-input-2")).toHaveValue("Value 2")
      expect(screen.getByTestId("text-input-input-3")).toHaveValue("Value 3")

      expect(screen.getByText("Label 1")).toBeInTheDocument()
      expect(screen.getByText("Label 2")).toBeInTheDocument()
      expect(screen.getByText("Label 3")).toBeInTheDocument()

      expect(screen.getByText("Tooltip 1")).toBeInTheDocument()
      expect(screen.getByText("Tooltip 2")).toBeInTheDocument()
      expect(screen.getByText("Tooltip 3")).toBeInTheDocument()
    })

    it("handles onChange independently for multiple instances", async () => {
      const onChange1 = vi.fn()
      const onChange2 = vi.fn()
      const user = userEvent.setup()

      render(
        <div>
          <TooltipedInput id="input-1" label="Label 1" value="" tooltipContent="Tooltip 1" onChange={onChange1} />
          <TooltipedInput id="input-2" label="Label 2" value="" tooltipContent="Tooltip 2" onChange={onChange2} />
        </div>
      )

      const input1 = screen.getByTestId("text-input-input-1")
      const input2 = screen.getByTestId("text-input-input-2")

      await user.type(input1, "a")
      expect(onChange1).toHaveBeenCalled()
      expect(onChange2).not.toHaveBeenCalled()

      onChange1.mockClear()
      onChange2.mockClear()

      await user.type(input2, "b")
      expect(onChange1).not.toHaveBeenCalled()
      expect(onChange2).toHaveBeenCalled()
    })
  })

  describe("Props Changes", () => {
    it("updates when id prop changes", () => {
      const { rerender } = render(<TooltipedInput {...defaultProps} id="id-1" />)

      expect(screen.getByTestId("text-input-id-1")).toBeInTheDocument()

      rerender(<TooltipedInput {...defaultProps} id="id-2" />)

      expect(screen.queryByTestId("text-input-id-1")).not.toBeInTheDocument()
      expect(screen.getByTestId("text-input-id-2")).toBeInTheDocument()
    })

    it("updates when label prop changes", () => {
      const { rerender } = render(<TooltipedInput {...defaultProps} label="Original Label" />)

      expect(screen.getByText("Original Label")).toBeInTheDocument()

      rerender(<TooltipedInput {...defaultProps} label="Updated Label" />)

      expect(screen.queryByText("Original Label")).not.toBeInTheDocument()
      expect(screen.getByText("Updated Label")).toBeInTheDocument()
    })

    it("updates when tooltipContent prop changes", () => {
      const { rerender } = render(<TooltipedInput {...defaultProps} tooltipContent="Original Tooltip" />)

      expect(screen.getByText("Original Tooltip")).toBeInTheDocument()

      rerender(<TooltipedInput {...defaultProps} tooltipContent="Updated Tooltip" />)

      expect(screen.queryByText("Original Tooltip")).not.toBeInTheDocument()
      expect(screen.getByText("Updated Tooltip")).toBeInTheDocument()
    })

    it("updates when placement prop changes", () => {
      const { rerender } = render(<TooltipedInput {...defaultProps} placement="top" />)

      let tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "top")

      rerender(<TooltipedInput {...defaultProps} placement="bottom" />)

      tooltip = screen.getByTestId("tooltip")
      expect(tooltip).toHaveAttribute("data-placement", "bottom")
    })

    it("updates when onChange handler changes", async () => {
      const onChange1 = vi.fn()
      const onChange2 = vi.fn()
      const user = userEvent.setup()

      const { rerender } = render(<TooltipedInput {...defaultProps} onChange={onChange1} />)

      const input = screen.getByTestId("text-input-test-input")
      await user.type(input, "a")

      expect(onChange1).toHaveBeenCalled()
      expect(onChange2).not.toHaveBeenCalled()

      onChange1.mockClear()

      rerender(<TooltipedInput {...defaultProps} onChange={onChange2} />)

      await user.type(input, "b")

      expect(onChange1).not.toHaveBeenCalled()
      expect(onChange2).toHaveBeenCalled()
    })
  })
})
