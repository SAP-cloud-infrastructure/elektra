import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import Collapse from "./Collapse"

describe("Collapse", () => {
  beforeEach(() => {
    // Mock scrollHeight because JSDOM does not calculate layout or element heights.
    // In the Collapse component, we rely on `el.scrollHeight` to set the height
    // when expanding. Without mocking, `scrollHeight` would be 0, causing tests
    // to fail or produce incorrect heights. By defining a getter here, we ensure
    // the component behaves as if the element has actual content height.
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 150, // consistent height for all tests
    })
  })

  it("renders closed by default when isOpen=false", () => {
    render(
      <Collapse isOpen={false} data-testid="my-collapse">
        Hello collapse
      </Collapse>
    )
    const collapse = screen.getByTestId("my-collapse")
    const styles = window.getComputedStyle(collapse)

    expect(collapse).toHaveAttribute("style")
    expect(styles.height).toBe("0px")
  })

  it("renders open by default when isOpen=true", async () => {
    render(
      <Collapse isOpen={true} data-testid="my-collapse">
        <div>Hello collapse</div>
      </Collapse>
    )

    const collapse = await screen.findByTestId("my-collapse")
    const styles = window.getComputedStyle(collapse)
    expect(styles.height).toBe("150px")
  })

  it("expands when isOpen goes from false → true", () => {
    const { rerender } = render(
      <Collapse isOpen={false} data-testid="my-collapse">
        Hello collapse
      </Collapse>
    )
    const collapse = screen.getByTestId("my-collapse")

    // Initially collapsed
    expect(window.getComputedStyle(collapse).height).toBe("0px")

    // Expand
    rerender(
      <Collapse isOpen={true} data-testid="my-collapse">
        Hello collapse
      </Collapse>
    )

    // After rerender, height should reflect scrollHeight
    expect(window.getComputedStyle(collapse).height).toBe("150px")
  })

  it("collapses when isOpen goes from true → false", () => {
    const { rerender } = render(
      <Collapse isOpen={true} data-testid="my-collapse">
        Hello collapse
      </Collapse>
    )
    const collapse = screen.getByTestId("my-collapse")

    // Initially expanded
    expect(window.getComputedStyle(collapse).height).toBe("150px")

    // Collapse
    rerender(
      <Collapse isOpen={false} data-testid="my-collapse">
        Hello collapse
      </Collapse>
    )

    expect(window.getComputedStyle(collapse).height).toBe("0px")
  })
})
