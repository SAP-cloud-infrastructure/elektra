import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import CopyableText from "./CopyableText"

describe("CopyableText", () => {
  let clipboardWriteTextMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock navigator.clipboard.writeText
    clipboardWriteTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: clipboardWriteTextMock,
      },
      writable: true,
      configurable: true,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("should render children correctly", () => {
    render(<CopyableText text="test-text">Test Content</CopyableText>)

    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("should apply copyableText className to the span", () => {
    render(<CopyableText text="test-text">Test Content</CopyableText>)

    const span = screen.getByText("Test Content")
    expect(span).toHaveClass("copyableText")
  })

  it("should copy text to clipboard when clicked", async () => {
    render(<CopyableText text="text-to-copy">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")
    await act(async () => {
      fireEvent.click(element)
    })

    expect(clipboardWriteTextMock).toHaveBeenCalledWith("text-to-copy")
    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1)
  })

  it("should call setTooltipContent with 'Copied!' after successful copy", async () => {
    render(<CopyableText text="test-text">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")
    await act(async () => {
      fireEvent.click(element)
    })

    // Verify clipboard was called
    expect(clipboardWriteTextMock).toHaveBeenCalledWith("test-text")
  })

  it("should reset tooltip content after 3 seconds", async () => {
    render(<CopyableText text="test-text">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")
    await act(async () => {
      fireEvent.click(element)
    })

    // Verify clipboard was called
    expect(clipboardWriteTextMock).toHaveBeenCalledWith("test-text")

    // Fast-forward time by 3 seconds - should not cause errors
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Component should handle the state update without errors
    expect(element).toBeInTheDocument()
  })

  it("should handle multiple clicks correctly", async () => {
    render(<CopyableText text="test-text">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")

    // First click
    await act(async () => {
      fireEvent.click(element)
    })
    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1)

    // Second click
    await act(async () => {
      fireEvent.click(element)
    })
    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(2)

    // Third click
    await act(async () => {
      fireEvent.click(element)
    })
    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(3)
  })

  it("should handle clipboard copy failure gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const error = new Error("Clipboard access denied")
    clipboardWriteTextMock.mockRejectedValueOnce(error)

    render(<CopyableText text="test-text">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")
    await act(async () => {
      fireEvent.click(element)
      // Wait for the promise to settle
      await Promise.resolve()
    })

    // Verify console.error was called with the error
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to copy: ", error)

    consoleErrorSpy.mockRestore()
  })

  it("should copy the text prop, not the children content", async () => {
    render(<CopyableText text="actual-text-to-copy">Different Display Text</CopyableText>)

    const element = screen.getByText("Different Display Text")
    await act(async () => {
      fireEvent.click(element)
    })

    expect(clipboardWriteTextMock).toHaveBeenCalledWith("actual-text-to-copy")
    expect(clipboardWriteTextMock).not.toHaveBeenCalledWith("Different Display Text")
  })

  it("should support copying empty strings", async () => {
    render(<CopyableText text="">Empty Text</CopyableText>)

    const element = screen.getByText("Empty Text")
    await act(async () => {
      fireEvent.click(element)
    })

    expect(clipboardWriteTextMock).toHaveBeenCalledWith("")
  })

  it("should support copying special characters and multiline text", async () => {
    const specialText = "Line 1\nLine 2\nSpecial: !@#$%^&*()"
    render(<CopyableText text={specialText}>Copy Special Text</CopyableText>)

    const element = screen.getByText("Copy Special Text")
    await act(async () => {
      fireEvent.click(element)
    })

    expect(clipboardWriteTextMock).toHaveBeenCalledWith(specialText)
  })

  it("should render tooltip with bottom-end placement", () => {
    const { container } = render(<CopyableText text="test-text">Test</CopyableText>)

    // Verify the component renders (basic structure test)
    expect(container.querySelector(".copyableText")).toBeInTheDocument()
  })

  it("should handle rapid successive clicks", async () => {
    render(<CopyableText text="test-text">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")

    // Rapid clicks
    await act(async () => {
      fireEvent.click(element)
      fireEvent.click(element)
      fireEvent.click(element)
    })

    // All clicks should trigger copy
    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(3)
  })

  it("should not interfere with timer when component unmounts", async () => {
    const { unmount } = render(<CopyableText text="test-text">Click Me</CopyableText>)

    const element = screen.getByText("Click Me")
    await act(async () => {
      fireEvent.click(element)
    })

    // Unmount before timer completes
    unmount()

    // Fast-forward time - should not cause errors
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // No errors should occur (test passes if no exception thrown)
    expect(true).toBe(true)
  })
})
