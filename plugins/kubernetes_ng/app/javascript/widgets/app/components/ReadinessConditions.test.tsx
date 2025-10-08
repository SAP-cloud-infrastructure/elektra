import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import ReadinessConditions from "./ReadinessConditions"

describe("<ReadinessConditions />", () => {
  it("renders conditions with correct text", () => {
    const conditions = [
      { type: "Ready", status: "True", displayValue: "Ready Displayname" },
      { type: "Healthy", status: "False", displayValue: "Unhealthy Displayname" },
      { type: "Pending", status: "Unknown", displayValue: "Pending Displayname" },
    ]

    render(<ReadinessConditions conditions={conditions} />)

    expect(screen.getByText("Ready Displayname")).toBeInTheDocument()
    expect(screen.getByText("Unhealthy Displayname")).toBeInTheDocument()
    expect(screen.getByText("Pending Displayname")).toBeInTheDocument()
  })

  it("applies success variant when status is True without icon", () => {
    const conditions = [{ type: "Ready", status: "True", displayValue: "Ready Displayname" }]
    render(<ReadinessConditions conditions={conditions} data-testid="readiness-conditions" />)

    const badge = within(screen.getByTestId("readiness-conditions")).getByText("Ready Displayname")
    expect(badge).toHaveAttribute("data-variant", "success")
    expect(within(badge).queryByRole("img")).not.toBeInTheDocument()
  })

  it("applies error variant when status is False and icon is present", () => {
    const conditions = [{ type: "Healthy", status: "False", displayValue: "Unhealthy Displayname" }]
    render(<ReadinessConditions conditions={conditions} data-testid="readiness-conditions" />)

    const badge = within(screen.getByTestId("readiness-conditions")).getByText("Unhealthy Displayname")
    expect(badge).toHaveAttribute("data-variant", "error")
    expect(within(badge).queryByRole("img")).toBeInTheDocument()
  })

  it("applies warning variant for any other status and icon is present", () => {
    const conditions = [{ type: "Pending", status: "Unknown", displayValue: "Pending Displayname" }]
    render(<ReadinessConditions conditions={conditions} data-testid="readiness-conditions" />)

    const badge = within(screen.getByTestId("readiness-conditions")).getByText("Pending Displayname")
    expect(badge).toHaveAttribute("data-variant", "warning")
    expect(within(badge).queryByRole("img")).toBeInTheDocument()
  })
})
