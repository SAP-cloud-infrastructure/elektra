import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { StatusPill } from "./StatusPill"

// The shared core StatusPill humanises the raw state ("active" -> "Active").
describe("StatusPill", () => {
  it("renders the semantic state label", () => {
    render(<StatusPill status={{ state: "active", transition: null }} />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders a second pill for an active transition", () => {
    render(<StatusPill status={{ state: "building", transition: "spawning" }} />)
    expect(screen.getByText("Building")).toBeInTheDocument()
    expect(screen.getByText("Spawning")).toBeInTheDocument()
  })

  it("does not render a transition pill when idle", () => {
    render(<StatusPill status={{ state: "stopped", transition: null }} />)
    expect(screen.queryByText("Spawning")).not.toBeInTheDocument()
  })

  it("renders an unknown state without crashing", () => {
    render(<StatusPill status={{ state: "weird-state" }} />)
    expect(screen.getByText("Weird state")).toBeInTheDocument()
  })
})
