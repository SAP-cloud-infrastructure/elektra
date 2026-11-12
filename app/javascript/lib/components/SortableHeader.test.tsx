import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import { SortableHeader, type SortState } from "./SortableHeader"

// Render a single sortable header inside a minimal table so the <th> is valid.
const renderHeader = (sort: SortState, onSort = vi.fn()) =>
  render(
    <table>
      <thead>
        <tr>
          <SortableHeader label="Name" column="name" sort={sort} onSort={onSort} />
        </tr>
      </thead>
    </table>
  )

describe("SortableHeader", () => {
  afterEach(() => cleanup())

  it("renders the neutral sort icon when the column is not the active sort", () => {
    const { container } = renderHeader({ column: null, direction: "asc" })
    expect(container.querySelector("i.fa.fa-sort")).toBeInTheDocument()
    expect(container.querySelector("i.fa.fa-sort-asc")).not.toBeInTheDocument()
  })

  it("renders the ascending icon when active and ascending", () => {
    const { container } = renderHeader({ column: "name", direction: "asc" })
    expect(container.querySelector("i.fa.fa-sort-asc")).toBeInTheDocument()
  })

  it("renders the descending icon when active and descending", () => {
    const { container } = renderHeader({ column: "name", direction: "desc" })
    expect(container.querySelector("i.fa.fa-sort-desc")).toBeInTheDocument()
  })

  it("calls onSort with the column key when clicked", () => {
    const onSort = vi.fn()
    renderHeader({ column: null, direction: "asc" }, onSort)
    fireEvent.click(screen.getByText("Name"))
    expect(onSort).toHaveBeenCalledWith("name")
  })

  it("shows an explanatory tooltip on hover when `tooltip` is given", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="AZ"
              column="az"
              sort={{ column: null, direction: "asc" }}
              onSort={vi.fn()}
              tooltip="Availability Zone"
            />
          </tr>
        </thead>
      </table>
    )
    // No tooltip until hovered.
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByText("AZ").closest("span")!)
    expect(screen.getByRole("tooltip")).toHaveTextContent("Availability Zone")
  })

  it("still sorts when clicking the label of a tooltipped header", () => {
    const onSort = vi.fn()
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="AZ"
              column="az"
              sort={{ column: null, direction: "asc" }}
              onSort={onSort}
              tooltip="Availability Zone"
            />
          </tr>
        </thead>
      </table>
    )
    fireEvent.click(screen.getByText("AZ"))
    expect(onSort).toHaveBeenCalledWith("az")
  })
})
