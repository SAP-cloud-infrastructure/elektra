import { normalizeError } from "./commonHelpers.jsx"

describe("normalizeError", () => {
  it("handles serialized server error", () => {
    const error = {
      data: {
        message: ", , Forbidden action",
      },
      __isServerError: true,
    }

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "API Error",
      message: "Forbidden action",
    })
  })

  it("handles error object (data.error)", () => {
    const error = {
      data: {
        error: {
          code: 403,
          title: "Forbidden",
          description: "You are not authorized",
        },
      },
    }

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "API Error",
      message: "You are not authorized",
    })
  })

  it("handles errors array (data.errors)", () => {
    const error = {
      data: {
        errors: [{ message: "Not authorized" }, { message: "Policy violation" }],
      },
    }

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "API Error",
      message: "Not authorized, Policy violation",
    })
  })

  it("handles native Error instance", () => {
    const error = new Error("Something went wrong")

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "Error",
      message: "Something went wrong",
    })
  })

  it("handles native Error without message", () => {
    const error = new Error("")

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "Error",
      message: "An unknown error occurred.",
    })
  })

  it("handles string error", () => {
    const error = "Plain string error"

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "Error",
      message: "Plain string error",
    })
  })

  it("handles unknown object error", () => {
    const error = { foo: "bar" }

    const result = normalizeError(error)

    expect(result).toEqual({
      title: "Unknown Error",
      message: "An unexpected error occurred. Please try again.",
    })
  })

  it("handles null error", () => {
    const result = normalizeError(null)

    expect(result).toEqual({
      title: "Unknown Error",
      message: "An unexpected error occurred. Please try again.",
    })
  })

  it("handles undefined error", () => {
    const result = normalizeError(undefined)

    expect(result).toEqual({
      title: "Unknown Error",
      message: "An unexpected error occurred. Please try again.",
    })
  })
})
