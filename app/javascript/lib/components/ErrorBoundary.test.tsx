import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { ErrorBoundary } from "./ErrorBoundary"

// A child that throws on demand, so we can exercise the boundary.
function Boom({ when }: { when: boolean }) {
  if (when) throw new Error("kaboom")
  return <div>all good</div>
}

describe("ErrorBoundary", () => {
  // The boundary logs caught errors; silence that noise in the test output.
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}))
  afterEach(() => vi.restoreAllMocks())

  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <Boom when={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText("all good")).toBeInTheDocument()
  })

  it("renders the default alert with the error message when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom when={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.")
    expect(screen.getByRole("alert")).toHaveTextContent("kaboom")
  })

  it("renders a custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={(error) => <div data-testid="custom">custom: {error.message}</div>}>
        <Boom when={true} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId("custom")).toHaveTextContent("custom: kaboom")
  })

  it("passes a reset callback to the custom fallback", () => {
    const fallback = vi.fn((_error: Error, reset: () => void) => (
      <button type="button" onClick={reset}>
        retry
      </button>
    ))
    render(
      <ErrorBoundary fallback={fallback}>
        <Boom when={true} />
      </ErrorBoundary>
    )
    // The fallback received a reset function; clicking it does not throw.
    expect(fallback).toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "retry" }))
  })
})
