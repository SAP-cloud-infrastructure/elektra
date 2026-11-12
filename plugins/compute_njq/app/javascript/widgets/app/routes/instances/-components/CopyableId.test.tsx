import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { CopyableId } from "./CopyableId"

describe("CopyableId", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders the id", () => {
    render(<CopyableId id="abc-123" />)
    expect(screen.getByText("abc-123")).toBeInTheDocument()
  })

  it("copies the id to the clipboard on click", () => {
    render(<CopyableId id="abc-123" />)
    fireEvent.click(screen.getByRole("button", { name: "Copy ID" }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc-123")
  })

  it("swaps the icon to a checkmark after copying", async () => {
    render(<CopyableId id="abc-123" />)
    const button = screen.getByRole("button", { name: "Copy ID" })
    expect(button.querySelector("i.fa-copy")).toBeInTheDocument()

    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copied" }).querySelector("i.fa-check")).toBeInTheDocument()
    })
  })
})
