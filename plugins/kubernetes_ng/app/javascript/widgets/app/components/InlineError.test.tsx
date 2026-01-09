import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import InlineError from "./InlineError"

describe("<InlineError />", () => {
  describe("when error is from type Error", () => {
    it("renders error name and message if error type Error", () => {
      const error = new Error("Something bad happened")
      error.name = "CustomError"

      render(<InlineError error={error} />)

      expect(screen.getByText("CustomError: Something bad happened")).toBeInTheDocument()
    })

    it("handles error messages with ', , ' at the beginning of the message", () => {
      const error = new Error(', , shoots.core.gardener.cloud "shoot" already exists')
      error.name = "ResourceExistsError"

      render(<InlineError error={error} />)

      expect(
        screen.getByText('ResourceExistsError: shoots.core.gardener.cloud "shoot" already exists')
      ).toBeInTheDocument()
    })

    it("handles error messages with ', ' at the beginning of the message", () => {
      const error = new Error(", Invalid value: []core.ShootAdvertisedAddress(nil)")
      error.name = "SomeError"

      render(<InlineError error={error} />)
      expect(screen.getByText("SomeError: Invalid value: []core.ShootAdvertisedAddress(nil)")).toBeInTheDocument()
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

      expect(screen.getByText("CustomError: An unknown error occurred. Try again.")).toBeInTheDocument()
    })
  })

  describe("when error is from tansktack router", () => {
    it("renders 'Server Error: ' prefix and message from error.data.message", () => {
      const error = {
        __isServerError: true,
        data: { message: "Server is down" },
      }

      render(<InlineError error={error} />)
      expect(screen.getByText("API Error: Server is down")).toBeInTheDocument()
    })
    it("falls back to 'Please try again later.' if error.data.message is empty", () => {
      const error = {
        __isServerError: true,
        data: {
          message: "",
        },
      }

      render(<InlineError error={error} />)
      expect(screen.getByText("API Error: Please try again later.")).toBeInTheDocument()
    })
  })

  describe("when no error is given", () => {
    it("renders 'An unknown error occurred. Try again.' message", () => {
      render(<InlineError />)
      expect(screen.getByText(/An unknown error occurred\. Try again\./)).toBeInTheDocument()
    })
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
