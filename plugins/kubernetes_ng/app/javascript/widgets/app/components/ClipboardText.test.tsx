import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom"
import ClipboardText from "./ClipboardText"

describe("<ClipboardText />", () => {
  const text = "Hello Clipboard"
  const tooltipText = "Copied successfully!"

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("renders the text", () => {
    render(<ClipboardText text={text} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it("copies text to clipboard and shows tooltip", async () => {
    render(<ClipboardText text={text} tooltipContent={tooltipText} />)

    // Based on DOM structure, click the button instead of the text
    const button = screen.getByRole("button")

    await act(async () => {
      fireEvent.click(button)
    })

    // Clipboard should have been called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)

    // Tooltip appears immediately
    expect(screen.getByText(tooltipText)).toBeInTheDocument()

    // Advance timers to hide tooltip
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Check tooltip disappears
    expect(screen.queryByText(tooltipText)).not.toBeInTheDocument()
  })
})
