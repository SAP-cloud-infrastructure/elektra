import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import React from "react"
import { Modal } from "./Modal"

describe("Modal", () => {
  afterEach(() => {
    cleanup()
  })

  const Sample: React.FC<{ show: boolean; onHide?: () => void; onExited?: () => void; [k: string]: any }> = ({
    show,
    onHide,
    onExited,
    ...rest
  }) => (
    <Modal show={show} onHide={onHide} onExited={onExited} aria-labelledby="title-id" {...rest}>
      <Modal.Header closeButton>
        <Modal.Title id="title-id">My Title</Modal.Title>
      </Modal.Header>
      <Modal.Body>Body content</Modal.Body>
      <Modal.Footer>
        <button onClick={onHide}>Close</button>
      </Modal.Footer>
    </Modal>
  )

  it("does not render when show is false", () => {
    render(<Sample show={false} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders exactly one role=dialog when shown", () => {
    render(<Sample show />)
    expect(screen.getAllByRole("dialog")).toHaveLength(1)
  })

  it("wires aria-labelledby and the title id", () => {
    render(<Sample show />)
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "title-id")
    expect(document.getElementById("title-id")).toHaveTextContent("My Title")
  })

  it("renders header/body/footer with Bootstrap 3 classes", () => {
    render(<Sample show />)
    expect(document.querySelector(".modal-header")).toBeInTheDocument()
    expect(document.querySelector(".modal-body")).toHaveTextContent("Body content")
    expect(document.querySelector(".modal-footer")).toBeInTheDocument()
  })

  it("renders a close button when closeButton is set", () => {
    render(<Sample show />)
    const closeButtons = screen.getAllByRole("button", { name: /close/i })
    expect(closeButtons.length).toBeGreaterThan(0)
  })

  it("calls onHide when the header close button is clicked", async () => {
    const user = userEvent.setup()
    const onHide = vi.fn()
    render(<Sample show onHide={onHide} />)
    const x = document.querySelector("button.close") as HTMLElement
    await user.click(x)
    expect(onHide).toHaveBeenCalled()
  })

  it("calls onHide on Escape", async () => {
    const user = userEvent.setup()
    const onHide = vi.fn()
    render(<Sample show onHide={onHide} />)
    await user.keyboard("{Escape}")
    expect(onHide).toHaveBeenCalled()
  })

  it("does not call onHide on Escape when keyboard=false", async () => {
    const user = userEvent.setup()
    const onHide = vi.fn()
    render(<Sample show onHide={onHide} keyboard={false} />)
    await user.keyboard("{Escape}")
    expect(onHide).not.toHaveBeenCalled()
  })

  it("unmounts the dialog and fires onExited when show flips to false", async () => {
    const onExited = vi.fn()
    const { rerender } = render(<Sample show onExited={onExited} />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    rerender(<Sample show={false} onExited={onExited} />)
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(onExited).toHaveBeenCalled()
  })

  it("applies size class from bsSize (large -> modal-lg)", () => {
    render(<Sample show bsSize="large" />)
    expect(document.querySelector(".modal-dialog")).toHaveClass("modal-lg")
  })

  it("applies size class from size (sm -> modal-sm)", () => {
    render(<Sample show size="sm" />)
    expect(document.querySelector(".modal-dialog")).toHaveClass("modal-sm")
  })

  it("applies dialogClassName to the .modal-dialog", () => {
    render(<Sample show dialogClassName="modal-xl" />)
    expect(document.querySelector(".modal-dialog")).toHaveClass("modal-xl")
  })

  it("does not close on static backdrop click", async () => {
    const user = userEvent.setup()
    const onHide = vi.fn()
    render(<Sample show onHide={onHide} backdrop="static" />)
    await user.click(screen.getByRole("dialog"))
    expect(onHide).not.toHaveBeenCalled()
  })

  it("closes on backdrop click by default", async () => {
    const user = userEvent.setup()
    const onHide = vi.fn()
    render(<Sample show onHide={onHide} />)
    await user.click(screen.getByRole("dialog"))
    expect(onHide).toHaveBeenCalled()
  })
})
