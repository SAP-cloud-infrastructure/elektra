import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import SecurityServiceList from "./list"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

const mockIsAllowed = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock("lib/policy", () => ({
  policy: { isAllowed: mockIsAllowed },
}))

vi.mock("lib/components/defeatable_link", () => ({
  DefeatableLink: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock("lib/components/Overlay", () => ({
  Popover: ({ children, title }: any) => (
    <div data-testid="popover" data-title={title}>
      {children}
    </div>
  ),
}))

vi.mock("./item", () => ({
  default: ({ securityService }: any) => (
    <tr data-testid="security-service-item" data-id={securityService.id}>
      <td>{securityService.name}</td>
    </tr>
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSecurityService = { id: "ss-1", name: "LDAP Service", type: "ldap" }

const defaultProps = {
  active: true,
  isFetching: false,
  securityServices: [mockSecurityService],
  handleDelete: vi.fn(),
  loadSecurityServicesOnce: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SecurityServiceList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAllowed.mockReturnValue(true)
  })

  describe("Loading dependencies", () => {
    it("calls loadSecurityServicesOnce on mount when active is true", () => {
      render(<SecurityServiceList {...defaultProps} />)
      expect(defaultProps.loadSecurityServicesOnce).toHaveBeenCalledTimes(1)
    })

    it("does not call loadSecurityServicesOnce when active is false", () => {
      render(<SecurityServiceList {...defaultProps} active={false} />)
      expect(defaultProps.loadSecurityServicesOnce).not.toHaveBeenCalled()
    })

    it("calls loadSecurityServicesOnce when active changes to true", () => {
      const { rerender } = render(
        <SecurityServiceList {...defaultProps} active={false} />
      )
      expect(defaultProps.loadSecurityServicesOnce).not.toHaveBeenCalled()

      rerender(<SecurityServiceList {...defaultProps} active={true} />)
      expect(defaultProps.loadSecurityServicesOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Loading state", () => {
    it("shows spinner when isFetching is true", () => {
      render(<SecurityServiceList {...defaultProps} isFetching={true} />)
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("does not show spinner when isFetching is false", () => {
      render(<SecurityServiceList {...defaultProps} />)
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })
  })

  describe("Table rendering", () => {
    it("renders a security service row for each item", () => {
      const services = [
        { id: "ss-1", name: "LDAP Service", type: "ldap" },
        { id: "ss-2", name: "Kerberos Service", type: "kerberos" },
      ]
      render(<SecurityServiceList {...defaultProps} securityServices={services} />)
      const rows = screen.getAllByTestId("security-service-item")
      expect(rows).toHaveLength(2)
    })

    it("shows empty state message when no security services exist", () => {
      render(<SecurityServiceList {...defaultProps} securityServices={[]} />)
      expect(screen.getByText("No Security Service found.")).toBeInTheDocument()
    })
  })

  describe("Create New button", () => {
    it("renders Create New link when permission is granted", () => {
      mockIsAllowed.mockReturnValue(true)
      render(<SecurityServiceList {...defaultProps} />)
      expect(screen.getByRole("link", { name: /create new/i })).toBeInTheDocument()
    })

    it("renders disabled button inside Popover when permission is denied", () => {
      mockIsAllowed.mockReturnValue(false)
      render(<SecurityServiceList {...defaultProps} />)
      expect(screen.getByTestId("popover")).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: /create new/i })).not.toBeInTheDocument()
    })
  })
})
