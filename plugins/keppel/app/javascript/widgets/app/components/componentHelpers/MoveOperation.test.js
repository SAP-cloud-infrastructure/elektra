import React from "react"
import { render, fireEvent } from "@testing-library/react"
import { screen } from "@testing-library/dom"
import { MoveOperation } from "./MoveOperation"

describe("MoveOperation", () => {
  const onMove = jest.fn()
  let itemCount = 4

  it("renders the buttons correctly", () => {
    render(<MoveOperation index={1} itemCount={itemCount} onMove={onMove} />)
    expect(screen.getByText("Move up")).toBeDefined()
    expect(screen.getByText("Move down")).toBeDefined()
  })

  it("calls onMove with correct arguments when move up is clicked", () => {
    render(<MoveOperation index={1} itemCount={itemCount} onMove={onMove} />)

    fireEvent.click(screen.getByText("Move up"))
    expect(onMove).toHaveBeenCalledWith({ index: 1, step: -1 })
  })

  it("calls onMove with correct arguments when move down is clicked", () => {
    render(<MoveOperation index={1} itemCount={itemCount} onMove={onMove} />)

    fireEvent.click(screen.getByText("Move down"))
    expect(onMove).toHaveBeenCalledWith({ index: 1, step: 1 })
  })

  it("disables the move up button when index is 0", () => {
    render(<MoveOperation index={0} itemCount={itemCount} onMove={onMove} />)

    const moveUpButton = screen.getByText("Move up")
    expect(moveUpButton.disabled).toBe(true)
  })

  it("disables the move down button when index is the last item", () => {
    render(
      <MoveOperation
        index={itemCount - 1}
        itemCount={itemCount}
        onMove={onMove}
      />
    )

    const moveUpButton = screen.getByText("Move down")
    expect(moveUpButton.disabled).toBe(true)
  })
})
