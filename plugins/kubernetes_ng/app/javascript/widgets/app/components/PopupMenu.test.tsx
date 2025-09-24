import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import PopupMenu from "./PopupMenu"

describe("<PopupMenu />", () => {
  it("applies temporary custom popup menu styles", () => {
    render(<PopupMenu data-testid="popup-menu">Content</PopupMenu>)

    const container = screen.getByTestId("popup-menu")
    expect(container).toHaveClass("popup-menu-container")
    expect(container).toHaveClass("juno-button")
    expect(container).toHaveClass("juno-button-default")
    expect(container).toHaveClass("juno-button-small-size")
    expect(container).toHaveClass("jn-font-bold")
    expect(container).toHaveClass("jn-inline-flex")
    expect(container).toHaveClass("jn-justify-center")
    expect(container).toHaveClass("jn-items-center")
    expect(container).toHaveClass("jn-rounded")
    expect(container).toHaveClass("jn-py-[0.3125rem]")
    expect(container).toHaveClass("jn-px-[0.5rem]")
  })
})
