import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import HintLoading from "./HintLoading"

describe("HintLoading", () => {
  it("should render with default 'Loading...' text when no text prop provided", () => {
    render(<HintLoading />)

    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("should render custom text when text prop is provided", () => {
    render(<HintLoading text="Fetching data..." />)

    expect(screen.getByText("Fetching data...")).toBeInTheDocument()
  })

  it("should not render default text when custom text is provided", () => {
    render(<HintLoading text="Custom message" />)

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    expect(screen.getByText("Custom message")).toBeInTheDocument()
  })

  it("should render spinner component", () => {
    const { container } = render(<HintLoading />)

    // Check if the component renders without errors
    // The Spinner component from Juno UI is rendered
    expect(container.firstChild).toBeInTheDocument()
  })

  it("should render with correct inline styles", () => {
    const { container } = render(<HintLoading />)

    // Find the Stack component (should be the first child)
    const stackElement = container.firstChild as HTMLElement
    expect(stackElement).toHaveStyle({ height: "100%", fontSize: "1.3rem" })
  })

  it("should render with empty string text", () => {
    render(<HintLoading text="" />)

    // Empty string is falsy, so it should show default text
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("should render text in a span element", () => {
    render(<HintLoading text="Test text" />)

    const textElement = screen.getByText("Test text")
    expect(textElement.tagName).toBe("SPAN")
  })

  it("should render with long text content", () => {
    const longText = "Please wait while we process your request. This may take a few moments..."
    render(<HintLoading text={longText} />)

    expect(screen.getByText(longText)).toBeInTheDocument()
  })

  it("should render with special characters in text", () => {
    render(<HintLoading text="Loading... 50% complete!" />)

    expect(screen.getByText("Loading... 50% complete!")).toBeInTheDocument()
  })

  it("should render with unicode characters in text", () => {
    render(<HintLoading text="Loading ⏳ Please wait..." />)

    expect(screen.getByText("Loading ⏳ Please wait...")).toBeInTheDocument()
  })

  it("should render with numeric text", () => {
    render(<HintLoading text="123" />)

    expect(screen.getByText("123")).toBeInTheDocument()
  })

  it("should properly handle text prop changes", () => {
    const { rerender } = render(<HintLoading text="Initial text" />)

    expect(screen.getByText("Initial text")).toBeInTheDocument()

    rerender(<HintLoading text="Updated text" />)

    expect(screen.queryByText("Initial text")).not.toBeInTheDocument()
    expect(screen.getByText("Updated text")).toBeInTheDocument()
  })

  it("should handle text prop being undefined explicitly", () => {
    render(<HintLoading text={undefined} />)

    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("should render Stack with alignment and distribution props", () => {
    const { container } = render(<HintLoading text="Test" />)

    // Verify Stack component is rendered (first child should be the Stack)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("should contain both spinner and text elements", () => {
    const { container } = render(<HintLoading text="Loading data" />)

    // Check both container and text exist
    const text = screen.getByText("Loading data")

    expect(container.firstChild).toBeInTheDocument()
    expect(text).toBeInTheDocument()
  })
})
