import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { StatusPill } from "./StatusPill"

// The overview pill shows the Nova vm_state (status) as text and colour.
describe("StatusPill", () => {
  it("shows the humanised status and tints by its category", () => {
    render(<StatusPill status={{ state: "active", transition: null }} />)
    const pill = screen.getByText("Active")
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveClass("status-pill-ok")
  })

  it("surfaces the power state in a tooltip on hover", () => {
    const { container } = render(<StatusPill status={{ state: "active", transition: null, power_state: "Running" }} />)
    fireEvent.mouseEnter(container.firstChild as Element)
    expect(screen.getByRole("tooltip")).toHaveTextContent("Power state: Running")
  })

  it("shows the fault message in the tooltip for an errored server", () => {
    const { container } = render(
      <StatusPill status={{ state: "error", transition: null, fault_message: "No valid host was found" }} />
    )
    fireEvent.mouseEnter(container.firstChild as Element)
    expect(screen.getByRole("tooltip")).toHaveTextContent("Error: No valid host was found")
  })

  it("renders a single capsule with the status and the task_state while transitioning", () => {
    const { container } = render(<StatusPill status={{ state: "building", transition: "spawning" }} />)
    // One status-pill capsule containing both the status and the task_state.
    const pills = container.querySelectorAll(".status-pill")
    expect(pills).toHaveLength(1)
    expect(pills[0]).toHaveTextContent("Building")
    expect(pills[0]).toHaveTextContent("Spawning")
  })

  it("shows a loading spinner while a transition is in progress", () => {
    const { container } = render(<StatusPill status={{ state: "building", transition: "spawning" }} />)
    expect(container.querySelector("span.spinner")).toBeInTheDocument()
  })

  it("shows no spinner when idle (no transition)", () => {
    const { container } = render(<StatusPill status={{ state: "active", transition: null }} />)
    expect(container.querySelector("span.spinner")).not.toBeInTheDocument()
  })

  it("shows a spinner while building even without a task_state", () => {
    const { container } = render(<StatusPill status={{ state: "building", transition: null }} />)
    expect(container.querySelector("span.spinner")).toBeInTheDocument()
  })

  it("flags verify_resize without a spinner (waits for user confirmation)", () => {
    const { container } = render(<StatusPill status={{ state: "verify_resize", transition: null }} />)
    expect(screen.getByText("Verify resize")).toBeInTheDocument()
    expect(container.querySelector("span.spinner")).not.toBeInTheDocument()
  })

  it("does not render a transition pill when idle", () => {
    render(<StatusPill status={{ state: "stopped", transition: null }} />)
    expect(screen.queryByText("Spawning")).not.toBeInTheDocument()
  })

  it("renders an unknown state without crashing", () => {
    render(<StatusPill status={{ state: "weird-state" }} />)
    expect(screen.getByText("Weird state")).toBeInTheDocument()
  })

  it("colours the transitioning capsule by the status category, not a fixed 'busy'", () => {
    // state "active" maps to the "ok" category; the transitioning capsule must
    // share that colour rather than always being "busy".
    const { container } = render(<StatusPill status={{ state: "active", transition: "rebooting" }} />)
    const pill = container.querySelector(".status-pill")!
    expect(pill).toHaveClass("status-pill-ok")
    expect(pill).not.toHaveClass("status-pill-busy")
    expect(pill).toHaveTextContent("Rebooting")
  })
})
