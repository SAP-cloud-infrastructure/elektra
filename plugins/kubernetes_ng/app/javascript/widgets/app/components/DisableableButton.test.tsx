import React from "react"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import "@testing-library/jest-dom"
import DisableableButton from "./DisableableButton"
import { PortalProvider } from "@cloudoperators/juno-ui-components"

// Helper to render with PortalProvider
const renderWithPortal = (component: React.ReactElement) => {
  return render(<PortalProvider>{component}</PortalProvider>)
}

describe("<DisableableButton />", () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders button as enabled when disabled is false", () => {
    renderWithPortal(<DisableableButton label="Click me" onClick={mockOnClick} disabled={false} />)

    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).not.toBeDisabled()
  })

  it("renders button as disabled when disabled is true", () => {
    renderWithPortal(<DisableableButton label="Click me" onClick={mockOnClick} disabled={true} />)

    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeDisabled()
  })

  it("shows tooltip on hover when disabled with message", async () => {
    const user = userEvent.setup()
    const disabledMessage = "This action is not allowed"
    renderWithPortal(
      <DisableableButton label="Click me" onClick={mockOnClick} disabled={true} disabledMessage={disabledMessage} />
    )

    const button = await screen.getByRole("button", { name: /click me/i })

    // Hover over the button
    act(() => {
      user.hover(button)
    })

    // Wait for tooltip to appear
    expect(await screen.findByText(disabledMessage)).toBeInTheDocument()
  })

  it("does not show tooltip when not disabled", async () => {
    const user = userEvent.setup()
    const disabledMessage = "This action is not allowed"
    renderWithPortal(
      <DisableableButton label="Click me" onClick={mockOnClick} disabled={false} disabledMessage={disabledMessage} />
    )

    const button = screen.getByRole("button", { name: /click me/i })

    // Hover over the button
    act(() => {
      user.hover(button)
    })

    // Tooltip should not appear
    expect(screen.queryByText(disabledMessage)).not.toBeInTheDocument()
  })

  it("does not show tooltip when disabled without message", async () => {
    const user = userEvent.setup()
    renderWithPortal(<DisableableButton label="Click me" onClick={mockOnClick} disabled={true} />)

    const button = screen.getByRole("button", { name: /click me/i })

    // Hover over the button
    act(() => {
      user.hover(button)
    })

    // Wait a bit to ensure no tooltip appears
    await new Promise((resolve) => setTimeout(resolve, 100))

    // No tooltip text should be in the document
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })
})
