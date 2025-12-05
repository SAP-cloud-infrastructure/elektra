import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import LastErrors from "./LastErrors"
import { lastError1, lastError2 } from "../../../mocks/data"

describe("LastErrors component", () => {
  it("renders nothing if errors is empty", () => {
    const { container } = render(<LastErrors errors={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("always displays the first error", () => {
    render(<LastErrors errors={[lastError1, lastError2]} />)
    expect(screen.getByText(lastError1.description)).toBeInTheDocument()
    expect(screen.getByText(lastError1.taskID)).toBeInTheDocument()
    expect(screen.getByText(new Date(lastError1.lastUpdateTime).toLocaleString())).toBeInTheDocument()
  })

  it("does not show toggle button if only one error", () => {
    render(<LastErrors errors={[lastError1]} />)
    const button = screen.queryByRole("button")
    expect(button).toBeNull()
  })

  it("shows toggle button if more than one error", () => {
    render(<LastErrors errors={[lastError1, lastError2]} />)
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent("Show all errors")
  })

  it("toggles visibility of remaining errors when button is clicked", async () => {
    render(<LastErrors errors={[lastError1, lastError2]} />)

    // Second error should be in the collapse
    const collapse = screen.getByRole("region", { name: /Show all errors/i })
    expect(within(collapse).getByText(lastError2.description)).toBeInTheDocument()

    const button = screen.getByRole("button")
    fireEvent.click(button)

    // Button text should change
    expect(button).toHaveTextContent("Hide all errors")

    // Click again to hide
    fireEvent.click(button)
    expect(within(collapse).getByText(lastError2.description)).toBeInTheDocument()
  })
})
