import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ShareNetworkList from "./list"

// ─── Module mocks ─────────────────────────────────────────────────────────────

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
  default: ({ shareNetwork, network, subnet }: any) => (
    <tr data-testid="share-network-item" data-id={shareNetwork.id}>
      <td>{shareNetwork.name}</td>
      <td>{typeof network === "string" ? network : network?.name}</td>
      <td>{typeof subnet === "string" ? subnet : subnet?.name}</td>
    </tr>
  ),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockShareNetworks = [
  { id: "sn-1", name: "Network A", neutron_net_id: "net-1", neutron_subnet_id: "sub-1" },
  { id: "sn-2", name: "Network B", neutron_net_id: "net-2", neutron_subnet_id: "sub-2" },
]

const mockNetworks = {
  isFetching: false,
  items: [
    { id: "net-1", name: "Neutron Net 1" },
    { id: "net-2", name: "Neutron Net 2" },
  ],
}

const mockSubnets = {
  "net-1": { isFetching: false, items: [{ id: "sub-1", name: "Subnet 1" }] },
  "net-2": { isFetching: false, items: [{ id: "sub-2", name: "Subnet 2" }] },
}

const defaultProps = {
  active: true,
  isFetching: false,
  shareNetworks: mockShareNetworks,
  networks: mockNetworks,
  subnets: mockSubnets,
  handleDelete: vi.fn(),
  policy: { isAllowed: mockIsAllowed },
  loadShareNetworksOnce: vi.fn(),
  loadSecurityServicesOnce: vi.fn(),
  loadNetworksOnce: vi.fn(),
  loadSubnetsOnce: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShareNetworkList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAllowed.mockReturnValue(true)
  })

  describe("Loading dependencies", () => {
    it("calls loadShareNetworksOnce when active on mount", () => {
      render(<ShareNetworkList {...defaultProps} />)
      expect(defaultProps.loadShareNetworksOnce).toHaveBeenCalledTimes(1)
    })

    it("calls loadSecurityServicesOnce when active on mount", () => {
      render(<ShareNetworkList {...defaultProps} />)
      expect(defaultProps.loadSecurityServicesOnce).toHaveBeenCalledTimes(1)
    })

    it("calls loadNetworksOnce when active on mount", () => {
      render(<ShareNetworkList {...defaultProps} />)
      expect(defaultProps.loadNetworksOnce).toHaveBeenCalledTimes(1)
    })

    it("calls loadSubnetsOnce for each share network", () => {
      render(<ShareNetworkList {...defaultProps} />)
      expect(defaultProps.loadSubnetsOnce).toHaveBeenCalledWith("net-1")
      expect(defaultProps.loadSubnetsOnce).toHaveBeenCalledWith("net-2")
    })

    it("does not call load functions when active is false", () => {
      render(<ShareNetworkList {...defaultProps} active={false} />)
      expect(defaultProps.loadShareNetworksOnce).not.toHaveBeenCalled()
      expect(defaultProps.loadSecurityServicesOnce).not.toHaveBeenCalled()
      expect(defaultProps.loadNetworksOnce).not.toHaveBeenCalled()
      expect(defaultProps.loadSubnetsOnce).not.toHaveBeenCalled()
    })

    it("calls load functions when active changes to true", () => {
      const { rerender } = render(<ShareNetworkList {...defaultProps} active={false} />)
      expect(defaultProps.loadShareNetworksOnce).not.toHaveBeenCalled()

      rerender(<ShareNetworkList {...defaultProps} active={true} />)
      expect(defaultProps.loadShareNetworksOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Loading state", () => {
    it("shows spinner when isFetching is true", () => {
      render(<ShareNetworkList {...defaultProps} isFetching={true} />)
      expect(screen.getByText("Loading...")).toBeInTheDocument()
    })

    it("hides table when isFetching is true", () => {
      render(<ShareNetworkList {...defaultProps} isFetching={true} />)
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    })
  })

  describe("Table rendering", () => {
    it("renders a row for each share network", () => {
      render(<ShareNetworkList {...defaultProps} />)
      expect(screen.getAllByTestId("share-network-item")).toHaveLength(2)
    })

    it("shows empty state message when no share networks exist", () => {
      render(<ShareNetworkList {...defaultProps} shareNetworks={[]} />)
      expect(screen.getByText("No Share Networks found.")).toBeInTheDocument()
    })

    it("passes resolved network to ShareNetworkItem", () => {
      render(<ShareNetworkList {...defaultProps} />)
      const items = screen.getAllByTestId("share-network-item")
      expect(items[0]).toHaveTextContent("Neutron Net 1")
    })

    it("passes resolved subnet to ShareNetworkItem", () => {
      render(<ShareNetworkList {...defaultProps} />)
      const items = screen.getAllByTestId("share-network-item")
      expect(items[0]).toHaveTextContent("Subnet 1")
    })

    it("returns 'loading' for network when networks are fetching", () => {
      const props = {
        ...defaultProps,
        networks: { isFetching: true, items: [] },
      }
      render(<ShareNetworkList {...props} />)
      expect(screen.getAllByText("loading").length).toBeGreaterThan(0)
    })
  })

  describe("Create New button", () => {
    it("renders Create New link when permission is granted", () => {
      mockIsAllowed.mockReturnValue(true)
      render(<ShareNetworkList {...defaultProps} />)
      expect(screen.getByRole("link", { name: /create new/i })).toBeInTheDocument()
    })

    it("renders disabled button inside Popover when permission is denied", () => {
      mockIsAllowed.mockReturnValue(false)
      render(<ShareNetworkList {...defaultProps} />)
      expect(screen.getByTestId("popover")).toBeInTheDocument()
      expect(screen.queryByRole("link", { name: /create new/i })).not.toBeInTheDocument()
    })
  })
})
