import { describe, it, expect, vi } from "vitest"
import type { ReactNode } from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Stub TanStack Router's <Link> with a plain anchor so the toolbar can be unit
// tested without a RouterProvider (the Create New button is a Link to the
// create-instance route).
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: { children: ReactNode; to?: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

import { InstancesToolbar } from "./InstancesToolbar"

const baseProps = {
  searchTerm: "",
  onSearch: vi.fn(),
  visibleCount: 0,
  statusOptions: ["active", "error"],
  azOptions: ["qa-de-1a", "qa-de-1b"],
  status: "",
  az: "",
  onStatusChange: vi.fn(),
  onAzChange: vi.fn(),
}

describe("InstancesToolbar", () => {
  it("renders the visible count with correct pluralisation", () => {
    const { rerender, container } = render(<InstancesToolbar {...baseProps} visibleCount={1} />)
    expect(container.textContent).toContain("1 server")
    expect(container.textContent).not.toContain("1 servers")

    rerender(<InstancesToolbar {...baseProps} visibleCount={3} />)
    expect(container.textContent).toContain("3 servers")
  })

  it("calls onSearch when the user types in the search field", () => {
    const onSearch = vi.fn()
    render(<InstancesToolbar {...baseProps} onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId("search"), { target: { value: "web" } })
    expect(onSearch).toHaveBeenCalledWith("web")
  })

  it("renders a Create New link to the create-instance route", () => {
    render(<InstancesToolbar {...baseProps} />)
    const link = screen.getByRole("link", { name: "Create New" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/instances/new")
  })

  it("offers status and AZ facet filters and reports changes", () => {
    const onStatusChange = vi.fn()
    const onAzChange = vi.fn()
    render(<InstancesToolbar {...baseProps} onStatusChange={onStatusChange} onAzChange={onAzChange} />)

    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "error" } })
    expect(onStatusChange).toHaveBeenCalledWith("error")

    fireEvent.change(screen.getByLabelText("Filter by availability zone"), { target: { value: "qa-de-1b" } })
    expect(onAzChange).toHaveBeenCalledWith("qa-de-1b")
  })
})
