import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { InfoTooltip } from "./InfoTooltip"

describe("InfoTooltip", () => {
  afterEach(() => cleanup())

  it("renders a default info trigger with an accessible label", () => {
    render(<InfoTooltip content="Availability Zone" />)
    expect(screen.getByRole("button", { name: "More information" })).toBeInTheDocument()
  })

  it("does not show the tooltip until hovered", () => {
    render(<InfoTooltip content="Availability Zone" />)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("shows the tooltip content on hover and hides it on leave", () => {
    render(<InfoTooltip content="Availability Zone" />)
    const trigger = screen.getByRole("button", { name: "More information" }).parentElement!

    fireEvent.mouseEnter(trigger)
    expect(screen.getByRole("tooltip")).toHaveTextContent("Availability Zone")

    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("shows the tooltip on keyboard focus", () => {
    render(<InfoTooltip content="Availability Zone" />)
    const trigger = screen.getByRole("button", { name: "More information" }).parentElement!
    fireEvent.focus(trigger)
    expect(screen.getByRole("tooltip")).toBeInTheDocument()
  })

  it("renders custom trigger children when provided", () => {
    render(
      <InfoTooltip content="More info">
        <span>?</span>
      </InfoTooltip>
    )
    expect(screen.getByText("?")).toBeInTheDocument()
  })
})
