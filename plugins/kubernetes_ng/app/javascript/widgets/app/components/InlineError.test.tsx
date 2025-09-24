import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import InlineError from "./InlineError"

describe("<InlineError />", () => {
  it("renders error name and message", () => {
    const error = new Error("Something bad happened")
    error.name = "CustomError"

    render(<InlineError error={error} />)

    expect(screen.getByText("CustomError: Something bad happened")).toBeInTheDocument()
  })

  it("falls back to 'Error: ' prefix if error.name is missing", () => {
    const error = new Error("Oops")
    error.name = ""

    render(<InlineError error={error} />)

    expect(screen.getByText("Error: Oops")).toBeInTheDocument()
  })

  it("falls back to 'Something went wrong' if error.message is empty", () => {
    const error = new Error("")
    error.name = "CustomError"

    render(<InlineError error={error} />)

    expect(screen.getByText("CustomError: Something went wrong")).toBeInTheDocument()
  })

  it("applies the provided className", () => {
    const error = new Error("Failure")

    render(<InlineError error={error} className="extra-class" />)

    const wrapper = screen.getByText(/Failure/).closest(".inline-error")
    expect(wrapper).toHaveClass("extra-class")
  })

  it("forwards additional props to the container", () => {
    const error = new Error("Boom")

    render(<InlineError error={error} data-testid="inline-error" />)

    expect(screen.getByTestId("inline-error")).toBeInTheDocument()
  })

  it("renders the danger icon", () => {
    const error = new Error("Critical issue")

    render(<InlineError error={error} />)

    // assuming Icon renders with role="img"
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument()
  })
})
