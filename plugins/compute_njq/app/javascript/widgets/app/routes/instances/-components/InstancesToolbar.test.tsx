import { describe, it, expect, vi, beforeEach } from "vitest"
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

// The Create New button is gated on the compute_njq:instance_create policy rule
// (client-side hide; the BFF enforces the same rule server-side). Mock the
// shared policy module so each test controls isAllowed. vi.hoisted lets the
// hoisted vi.mock factory reference the spy without a TDZ error.
const { isAllowed } = vi.hoisted(() => ({ isAllowed: vi.fn() }))
vi.mock("lib/policy", () => ({ policy: { isAllowed } }))

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
  scope: {},
}

describe("InstancesToolbar", () => {
  beforeEach(() => {
    // Default: the user may create. Individual tests override.
    isAllowed.mockReset().mockReturnValue(true)
  })

  it("renders the visible count with correct pluralisation", () => {
    const { rerender, container } = render(<InstancesToolbar {...baseProps} visibleCount={1} />)
    expect(container.textContent).toContain("1 server")
    expect(container.textContent).not.toContain("1 servers")

    rerender(<InstancesToolbar {...baseProps} visibleCount={3} />)
    expect(container.textContent).toContain("3 servers")
  })

  it("announces the visible count via an aria-live region", () => {
    const { container } = render(<InstancesToolbar {...baseProps} visibleCount={2} />)
    const live = container.querySelector('[aria-live="polite"]')
    expect(live).not.toBeNull()
    expect(live).toHaveTextContent("2 servers")
  })

  it("calls onSearch when the user types in the search field", () => {
    const onSearch = vi.fn()
    render(<InstancesToolbar {...baseProps} onSearch={onSearch} />)
    fireEvent.change(screen.getByTestId("search"), { target: { value: "web" } })
    expect(onSearch).toHaveBeenCalledWith("web")
  })

  it("renders a Create New link to the create-instance route when allowed", () => {
    render(<InstancesToolbar {...baseProps} />)
    const link = screen.getByRole("link", { name: "Create New" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/instances/new")
    expect(isAllowed).toHaveBeenCalledWith("compute_njq:instance_create", { target: {} })
  })

  it("hides the Create New link when the user may not create", () => {
    isAllowed.mockReturnValue(false)
    render(<InstancesToolbar {...baseProps} />)
    expect(screen.queryByRole("link", { name: "Create New" })).toBeNull()
  })

  it("hides the Create New link (fail-closed) when the policy rule is unevaluable", () => {
    // A missing/typo'd rule makes policy.isAllowed throw. Treat that as "not
    // allowed" — hide the button rather than let the throw crash the list.
    isAllowed.mockImplementation(() => {
      throw new Error("Policy Engine Error: rule compute_njq:instance_create not found.")
    })
    expect(() => render(<InstancesToolbar {...baseProps} />)).not.toThrow()
    expect(screen.queryByRole("link", { name: "Create New" })).toBeNull()
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
