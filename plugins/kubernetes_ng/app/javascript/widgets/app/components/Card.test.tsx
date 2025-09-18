import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import Card from "./Card"

describe("<Card />", () => {
  it("renders children", () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText("Card Content")).toBeInTheDocument()
  })

  it("applies padding when padding={true}", () => {
    render(<Card padding>With Padding</Card>)
    const card = screen.getByText("With Padding").closest("div")
    expect(card).toHaveClass("tw-p-4")
  })

  it("does not apply padding when padding={false}", () => {
    render(<Card padding={false}>No Padding</Card>)
    const card = screen.getByText("No Padding").closest("div")
    expect(card).not.toHaveClass("tw-p-4")
  })

  it("merges custom className with default classes", () => {
    render(<Card className="custom-class">Custom</Card>)
    const card = screen.getByText("Custom").closest("div")
    expect(card).toHaveClass("gardener-card")
    expect(card).toHaveClass("custom-class")
  })

  it("forwards extra props to the div", () => {
    render(
      <Card data-testid="card" aria-label="card-label">
        Props Test
      </Card>
    )
    const card = screen.getByTestId("card")
    expect(card).toHaveAttribute("aria-label", "card-label")
    expect(card).toHaveTextContent("Props Test")
  })
})
