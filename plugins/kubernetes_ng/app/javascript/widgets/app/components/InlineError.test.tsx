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

      expect(screen.getByText(/CustomError/)).toBeInTheDocument()
      expect(screen.getByText(/Something bad happened/)).toBeInTheDocument()
    })

    it("handles error messages with ', , ' at the beginning of the message", () => {
      const error = new Error(', , shoots.core.gardener.cloud "shoot" already exists')
      error.name = "ResourceExistsError"

      render(<InlineError error={error} />)

      expect(screen.getByText(/ResourceExistsError/)).toBeInTheDocument()
      expect(screen.getByText(/shoots\.core\.gardener\.cloud "shoot" already exists/)).toBeInTheDocument()
    })

    it("handles error messages with ', ' at the beginning of the message", () => {
      const error = new Error(", Invalid value: []core.ShootAdvertisedAddress(nil)")
      error.name = "SomeError"

      render(<InlineError error={error} />)
      expect(screen.getByText(/SomeError/)).toBeInTheDocument()
      expect(screen.getByText(/Invalid value: \[\]core\.ShootAdvertisedAddress\(nil\)/)).toBeInTheDocument()
    })

    it("falls back to empty prefix if error.name is missing", () => {
      const error = new Error("Oops")
      error.name = ""

      render(<InlineError error={error} />)

      expect(screen.getByText(/Oops/)).toBeInTheDocument()
    })

    it("falls back to 'Something went wrong' if error.message is empty", () => {
      const error = new Error("")
      error.name = "CustomError"

      render(<InlineError error={error} />)

      expect(screen.getByText(/CustomError/)).toBeInTheDocument()
      expect(screen.getByText(/An unknown error occurred\. Try again\./)).toBeInTheDocument()
    })

    it("renders details when error has details property", () => {
      const error = new Error("Invalid response") as Error & { details?: unknown }
      error.name = "Failed to fetch clusters"
      error.details = [{ code: "invalid_type", message: "Expected array" }]

      render(<InlineError error={error} />)

      expect(screen.getByText(/Failed to fetch clusters/)).toBeInTheDocument()
      expect(screen.getByText(/Invalid response/)).toBeInTheDocument()
      expect(screen.getByLabelText("Error details")).toBeInTheDocument()
    })
  })

  describe("when error is from tansktack router", () => {
    it("renders 'API Error: ' prefix and message from error.data.message", () => {
      const error = {
        __isServerError: true,
        data: { message: "Server is down" },
      }

      render(<InlineError error={error} />)
      expect(screen.getByText(/API Error:/)).toBeInTheDocument()
      expect(screen.getByText(/Server is down/)).toBeInTheDocument()
    })
    it("falls back to 'Please try again later.' if error.data.message is empty", () => {
      const error = {
        __isServerError: true,
        data: {
          message: "",
        },
      }

      render(<InlineError error={error} />)
      expect(screen.getByText(/API Error:/)).toBeInTheDocument()
      expect(screen.getByText(/Please try again later\./)).toBeInTheDocument()
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

    const wrapper = screen.getByRole("alert")
    expect(wrapper).toHaveClass("extra-class")
  })
})
