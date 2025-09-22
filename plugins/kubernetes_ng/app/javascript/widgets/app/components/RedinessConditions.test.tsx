import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import RedinessConditions from "./RedinessConditions"

describe("<RedinessConditions />", () => {
  it("renders conditions with correct text", () => {
    const conditions = [
      { type: "Ready", status: "True", displayValue: "Ready Displayname" },
      { type: "Healthy", status: "False", displayValue: "Unhealthy Displayname" },
      { type: "Pending", status: "Unknown", displayValue: "Pending Displayname" },
    ]

    render(<RedinessConditions conditions={conditions} />)

    expect(screen.getByText("Ready Displayname")).toBeInTheDocument()
    expect(screen.getByText("Unhealthy Displayname")).toBeInTheDocument()
    expect(screen.getByText("Pending Displayname")).toBeInTheDocument()
  })

  it("applies success variant when status is True", () => {
    const conditions = [{ type: "Ready", status: "True", displayValue: "Ready Displayname" }]
    render(<RedinessConditions conditions={conditions} data-testid="rediness-conditions" />)

    const badge = within(screen.getByTestId("rediness-conditions")).getByText("Ready Displayname")
    expect(badge).toHaveAttribute("data-variant", "success")
  })

  it("applies error variant when status is False", () => {
    const conditions = [{ type: "Healthy", status: "False", displayValue: "Unhealthy Displayname" }]
    render(<RedinessConditions conditions={conditions} data-testid="rediness-conditions" />)

    const badge = within(screen.getByTestId("rediness-conditions")).getByText("Unhealthy Displayname")
    expect(badge).toHaveAttribute("data-variant", "error")
  })

  it("applies warning variant for any other status", () => {
    const conditions = [{ type: "Pending", status: "Unknown", displayValue: "Pending Displayname" }]
    render(<RedinessConditions conditions={conditions} data-testid="rediness-conditions" />)

    const badge = within(screen.getByTestId("rediness-conditions")).getByText("Pending Displayname")
    expect(badge).toHaveAttribute("data-variant", "warning")
  })
})
