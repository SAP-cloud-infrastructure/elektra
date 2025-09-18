import React from "react"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ClipboardText from "./ClipboardText"

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

jest.useFakeTimers() // For testing setTimeout

describe("<ClipboardText />", () => {
  const text = "Hello Clipboard"
  const tooltipText = "Copied successfully!"

  it("renders the text", () => {
    render(<ClipboardText text={text} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it("copies text to clipboard and shows tooltip", async () => {
    render(<ClipboardText text={text} tooltipContent={tooltipText} />)
    const trigger = screen.getByText(text)

    // Wrap click in act to flush state updates
    await act(async () => {
      fireEvent.click(trigger)
    })

    // Clipboard should have been called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)

    // Tooltip appears immediately
    expect(screen.getByText(tooltipText)).toBeInTheDocument()

    // Advance timers 1000ms to hide tooltip
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(screen.queryByText(tooltipText)).not.toBeInTheDocument()
    })
  })
})
