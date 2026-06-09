import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import ShowShareNetwork from "./show"

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

vi.mock("react-bootstrap", () => ({
  Modal: Object.assign(
    ({ show, onHide, children }: any) =>
      show ? (
        <div data-testid="modal">{children}</div>
      ) : null,
    {
      Header: ({ children }: any) => <div data-testid="modal-header">{children}</div>,
      Title: ({ children }: any) => <h1 data-testid="modal-title">{children}</h1>,
      Body: ({ children }: any) => <div data-testid="modal-body">{children}</div>,
      Footer: ({ children }: any) => <div data-testid="modal-footer">{children}</div>,
    }
  ),
  Button: ({ onClick, children }: any) => (
    <button data-testid="close-btn" onClick={onClick}>
      {children}
    </button>
  ),
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  Tab: ({ title, children }: any) => (
    <div data-testid={`tab-${title.toLowerCase().replace(/\s+/g, "-")}`}>{children}</div>
  ),
}))

vi.mock("@cloudoperators/juno-ui-components", () => ({
  JsonViewer: ({ data }: any) => (
    <div data-testid="json-viewer">{JSON.stringify(data)}</div>
  ),
}))

const mockIsAllowed = vi.hoisted(() => vi.fn().mockReturnValue(true))

vi.mock("lib/policy", () => ({
  policy: { isAllowed: mockIsAllowed },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockShareNetwork = {
  id: "sn-1",
  name: "My Network",
  description: "Test network",
  cidr: "192.168.1.0/24",
  ip_version: 4,
  network_type: "vxlan",
  neutron_net_id: "net-1",
  neutron_subnet_id: "sub-1",
  project_id: "proj-1",
}

const mockNetwork = { id: "net-1", name: "Neutron Net 1", description: "Net desc", shared: false, status: "ACTIVE" }
const mockSubnet = { id: "sub-1", name: "Subnet 1", description: "Sub desc", cidr: "10.0.0.0/24", gateway_ip: "10.0.0.1", ip_version: 4, network_id: "net-1" }
const mockShareServers = [{ id: "srv-1", share_network_id: "sn-1" }]

const mockHistory = { replace: vi.fn() }

const defaultProps = {
  shareNetwork: mockShareNetwork,
  network: mockNetwork,
  subnet: mockSubnet,
  shareServerItems: mockShareServers,
  isFetchingShareServers: false,
  isFetchingNetwork: false,
  isFetchingSubnet: false,
  history: mockHistory,
  loadShareServersOnce: vi.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShowShareNetwork", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockIsAllowed.mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Modal visibility", () => {
    it("renders modal when shareNetwork is set", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()
    })

    it("does not render modal when shareNetwork is null", () => {
      render(<ShowShareNetwork {...defaultProps} shareNetwork={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
    })

    it("hides modal when shareNetwork changes to null", () => {
      const { rerender } = render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByTestId("modal")).toBeInTheDocument()

      rerender(<ShowShareNetwork {...defaultProps} shareNetwork={null} />)
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
    })
  })

  describe("Mount behaviour", () => {
    it("calls loadShareServersOnce on mount", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(defaultProps.loadShareServersOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Modal title", () => {
    it("renders the share network name in the title", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByTestId("modal-title")).toHaveTextContent("My Network")
    })

    it("renders empty title when shareNetwork has no name", () => {
      render(<ShowShareNetwork {...defaultProps} shareNetwork={{ ...mockShareNetwork, name: undefined }} />)
      expect(screen.getByTestId("modal-title")).toBeInTheDocument()
    })
  })

  describe("Overview tab", () => {
    it("renders share network fields", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByText("sn-1")).toBeInTheDocument()
      expect(screen.getByText("192.168.1.0/24")).toBeInTheDocument()
      expect(screen.getByText("proj-1")).toBeInTheDocument()
    })
  })

  describe("Share Servers tab", () => {
    it("shows Share Servers tab for admins", () => {
      mockIsAllowed.mockReturnValue(true)
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByTestId("tab-share-servers")).toBeInTheDocument()
    })

    it("hides Share Servers tab for non-admins", () => {
      mockIsAllowed.mockReturnValue(false)
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.queryByTestId("tab-share-servers")).not.toBeInTheDocument()
    })

    it("shows spinner while share servers are loading", () => {
      render(<ShowShareNetwork {...defaultProps} isFetchingShareServers={true} />)
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("renders JsonViewer with share server data", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByTestId("json-viewer")).toBeInTheDocument()
    })
  })

  describe("Network tab", () => {
    it("renders network details", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByText("Neutron Net 1")).toBeInTheDocument()
      expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    })
  })

  describe("Subnet tab", () => {
    it("renders subnet details", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      expect(screen.getByText("Subnet 1")).toBeInTheDocument()
      expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
    })
  })

  describe("Close button", () => {
    it("hides modal and navigates to /share-networks on close", () => {
      render(<ShowShareNetwork {...defaultProps} />)
      fireEvent.click(screen.getByTestId("close-btn"))

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
      vi.runAllTimers()
      expect(mockHistory.replace).toHaveBeenCalledWith("/share-networks")
    })
  })
})
