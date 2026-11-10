import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { StatusPill } from "./StatusPill"

describe("StatusPill", () => {
  it("renders the semantic state label", () => {
    render(<StatusPill status={{ state: "active", transition: null }} />)
    expect(screen.getByText("active")).toBeInTheDocument()
  })

  it("renders a second badge for an active transition", () => {
    render(<StatusPill status={{ state: "building", transition: "spawning" }} />)
    expect(screen.getByText("building")).toBeInTheDocument()
    expect(screen.getByText("spawning")).toBeInTheDocument()
  })

  it("does not render a transition badge when idle", () => {
    render(<StatusPill status={{ state: "stopped", transition: null }} />)
    expect(screen.queryByText("spawning")).not.toBeInTheDocument()
  })

  it("renders an unknown state without crashing", () => {
    render(<StatusPill status={{ state: "weird-state" }} />)
    expect(screen.getByText("weird-state")).toBeInTheDocument()
  })
})
