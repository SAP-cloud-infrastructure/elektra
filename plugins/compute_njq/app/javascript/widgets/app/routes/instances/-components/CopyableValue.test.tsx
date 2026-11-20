import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { CopyableValue } from "./CopyableValue"

describe("CopyableValue", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders the value", () => {
    render(<CopyableValue value="10.0.0.1" />)
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
  })

  it("copies the value to the clipboard on click", () => {
    render(<CopyableValue value="10.0.0.1" label="IP address" />)
    fireEvent.click(screen.getByRole("button", { name: "Copy IP address" }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("10.0.0.1")
  })

  it("uses a generic label by default", () => {
    render(<CopyableValue value="x" />)
    expect(screen.getByRole("button", { name: "Copy value" })).toBeInTheDocument()
  })

  it("swaps the icon to a checkmark after copying", async () => {
    render(<CopyableValue value="10.0.0.1" label="IP address" />)
    const button = screen.getByRole("button", { name: "Copy IP address" })
    expect(button.querySelector("i.fa-copy")).toBeInTheDocument()

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" }).querySelector("i.fa-check")).toBeInTheDocument()
    })
  })
})
