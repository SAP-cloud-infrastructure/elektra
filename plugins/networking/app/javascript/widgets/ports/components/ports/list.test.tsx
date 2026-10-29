import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"
import List from "./list.jsx"

interface PolicyType {
  isAllowed: (action: string, options?: any) => boolean
}

declare global {
  var policy: PolicyType
}

global.policy = {
  isAllowed: vi.fn(() => true),
}

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}))

vi.mock("lib/components/defeatable_link", () => ({
  DefeatableLink: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock("lib/components/search_field", () => ({
  SearchField: ({
    onChange,
    placeholder,
    text,
  }: {
    onChange: (term: string) => void
    placeholder: string
    text: string
  }) => (
    <div data-testid="search-field">
      <input data-testid="search-input" placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <span data-testid="search-help-text">{text}</span>
    </div>
  ),
}))

vi.mock("lib/components/ajax_paginate", () => ({
  AjaxPaginate: ({
    hasNext,
    isFetching,
    onLoadNext,
  }: {
    hasNext: boolean
    isFetching: boolean
    onLoadNext: () => void
  }) => (
    <div data-testid="ajax-paginate">
      {hasNext && (
        <button data-testid="load-next-button" onClick={onLoadNext} disabled={isFetching}>
          {isFetching ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  ),
}))

vi.mock("./item", () => ({
  default: ({ port, network }: any) => (
    <tr data-testid={`port-item-${port.id}`}>
      <td>{port.name}</td>
      <td>{port.description}</td>
      <td>{network?.name || port.network_id}</td>
    </tr>
  ),
}))

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  fixed_ips?: Array<{ ip_address: string; subnet_id: string }>
  device_id?: string
  device_owner?: string
  status?: string
  isHidden?: boolean
  isDeleting?: boolean
}

interface NetworksState {
  items: Array<{ id: string; name: string }>
  isFetching: boolean
}

interface SubnetsState {
  items: Array<{ id: string; name: string; network_id: string }>
  isFetching: boolean
}

interface SecurityGroupsState {
  items: Array<{ id: string; name: string }>
  isFetching: boolean
}

interface ListProps {
  items: Port[]
  networks: NetworksState
  subnets: SubnetsState
  securityGroups: SecurityGroupsState
  loadPortsOnce: () => void
  loadNetworksOnce: () => void
  loadSubnetsOnce: () => void
  loadSecurityGroupsOnce: () => void
  handleDelete: (portId: string) => void
  searchPorts: (term: string) => void
  searchTerm?: string
  isFetching: boolean
  hasNext: boolean
  loadNext: () => void
  instancesPath?: string
}

describe("Ports List", () => {
  let mockLoadPortsOnce: ReturnType<typeof vi.fn>
  let mockLoadNetworksOnce: ReturnType<typeof vi.fn>
  let mockLoadSubnetsOnce: ReturnType<typeof vi.fn>
  let mockLoadSecurityGroupsOnce: ReturnType<typeof vi.fn>
  let mockHandleDelete: ReturnType<typeof vi.fn>
  let mockSearchPorts: ReturnType<typeof vi.fn>
  let mockLoadNext: ReturnType<typeof vi.fn>

  const mockPortA: Port = {
    id: "port-a",
    name: "my-reserved-ip",
    description: "Reserved IP A",
    network_id: "network-1",
    fixed_ips: [{ ip_address: "192.168.1.10", subnet_id: "subnet-1" }],
    status: "ACTIVE",
  }

  const mockPortB: Port = {
    id: "port-b",
    name: "instance-port",
    description: "Instance Port B",
    network_id: "network-2",
    fixed_ips: [{ ip_address: "192.168.2.20", subnet_id: "subnet-2" }],
    device_id: "device-1",
    device_owner: "compute:nova",
    status: "ACTIVE",
  }

  const mockNetworks: NetworksState = {
    items: [
      { id: "network-1", name: "Network One" },
      { id: "network-2", name: "Network Two" },
    ],
    isFetching: false,
  }

  const mockSubnets: SubnetsState = {
    items: [
      { id: "subnet-1", name: "Subnet One", network_id: "network-1" },
      { id: "subnet-2", name: "Subnet Two", network_id: "network-2" },
    ],
    isFetching: false,
  }

  const mockSecurityGroups: SecurityGroupsState = {
    items: [{ id: "sg-1", name: "Security Group One" }],
    isFetching: false,
  }

  beforeEach(() => {
    mockLoadPortsOnce = vi.fn()
    mockLoadNetworksOnce = vi.fn()
    mockLoadSubnetsOnce = vi.fn()
    mockLoadSecurityGroupsOnce = vi.fn()
    mockHandleDelete = vi.fn()
    mockSearchPorts = vi.fn()
    mockLoadNext = vi.fn()
    global.policy.isAllowed = vi.fn(() => true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props?: Partial<ListProps>) => {
    const defaultProps: ListProps = {
      items: [mockPortA, mockPortB],
      networks: mockNetworks,
      subnets: mockSubnets,
      securityGroups: mockSecurityGroups,
      loadPortsOnce: mockLoadPortsOnce,
      loadNetworksOnce: mockLoadNetworksOnce,
      loadSubnetsOnce: mockLoadSubnetsOnce,
      loadSecurityGroupsOnce: mockLoadSecurityGroupsOnce,
      handleDelete: mockHandleDelete,
      searchPorts: mockSearchPorts,
      isFetching: false,
      hasNext: false,
      loadNext: mockLoadNext,
      ...props,
    }

    return render(<List {...defaultProps} />)
  }

  describe("Initial Rendering", () => {
    it("renders without crashing", () => {
      renderComponent()
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("calls all load dependencies on mount", () => {
      renderComponent()
      expect(mockLoadPortsOnce).toHaveBeenCalled()
      expect(mockLoadNetworksOnce).toHaveBeenCalled()
      expect(mockLoadSubnetsOnce).toHaveBeenCalled()
      expect(mockLoadSecurityGroupsOnce).toHaveBeenCalled()
    })

    it("renders table headers correctly", () => {
      renderComponent()
      const headers = screen.getAllByRole("columnheader").map((h) => h.textContent || "")
      expect(headers.some((t) => t.includes("Name / ID"))).toBe(true)
      expect(headers.some((t) => t.includes("Description"))).toBe(true)
      expect(headers.some((t) => t.includes("Network"))).toBe(true)
      expect(headers.some((t) => t.includes("Fixed IPs / Subnet"))).toBe(true)
      expect(headers.some((t) => t.includes("Device Owner / ID"))).toBe(true)
      expect(headers.some((t) => t.includes("Status"))).toBe(true)
    })

    it("sorts by a column when its header is clicked", () => {
      renderComponent()
      const nameHeader = screen.getAllByRole("columnheader").find((h) => (h.textContent || "").includes("Name / ID"))
      expect(nameHeader).toBeDefined()
      const link = nameHeader!.querySelector("a")!
      // clicking should not throw and should keep the rows rendered
      fireEvent.click(link)
      expect(screen.getByTestId("port-item-port-a")).toBeInTheDocument()
      expect(screen.getByTestId("port-item-port-b")).toBeInTheDocument()
    })

    it("does not render a Custom/System filter", () => {
      renderComponent()
      expect(screen.queryByLabelText("fixed ip ports")).not.toBeInTheDocument()
      expect(screen.queryByLabelText("other ports")).not.toBeInTheDocument()
    })

    it("renders the attachment filter (All / Attached / Free)", () => {
      renderComponent()
      expect(screen.getByText("Show:")).toBeInTheDocument()
      expect(screen.getByText("All ports")).toBeInTheDocument()
      expect(screen.getByText("Attached")).toBeInTheDocument()
      expect(screen.getByText("Free")).toBeInTheDocument()
    })

    it("shows all ports directly (no filter selection needed)", () => {
      renderComponent()
      expect(screen.getByTestId("port-item-port-a")).toBeInTheDocument()
      expect(screen.getByTestId("port-item-port-b")).toBeInTheDocument()
    })

    it("shows the visible port count in the toolbar", () => {
      renderComponent()
      expect(screen.getByText("2 ports")).toBeInTheDocument()
    })

    it("updates the count when the attachment filter narrows the list", () => {
      renderComponent()
      fireEvent.change(screen.getByDisplayValue("All ports"), { target: { value: "free" } })
      // only mockPortA is free
      expect(screen.getByText("1 port")).toBeInTheDocument()
    })

    it("does not render toolbar when no items available", () => {
      renderComponent({ items: [] })
      expect(screen.queryByTestId("search-field")).not.toBeInTheDocument()
    })
  })

  describe("Search", () => {
    it("calls searchPorts when search input changes", () => {
      renderComponent()
      fireEvent.change(screen.getByTestId("search-input"), { target: { value: "abc" } })
      expect(mockSearchPorts).toHaveBeenCalledWith("abc")
    })

    it("filters ports by name", () => {
      renderComponent({ searchTerm: "my-reserved-ip" })
      expect(screen.getByTestId("port-item-port-a")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-b")).not.toBeInTheDocument()
    })

    it("filters ports by description", () => {
      renderComponent({ searchTerm: "Instance Port B" })
      expect(screen.getByTestId("port-item-port-b")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-a")).not.toBeInTheDocument()
    })

    it("filters ports by IP address", () => {
      renderComponent({ searchTerm: "192.168.1.10" })
      expect(screen.getByTestId("port-item-port-a")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-b")).not.toBeInTheDocument()
    })

    it("filters case-insensitively", () => {
      renderComponent({ searchTerm: "INSTANCE PORT" })
      expect(screen.getByTestId("port-item-port-b")).toBeInTheDocument()
    })

    it("shows no results when search term doesn't match", () => {
      renderComponent({ searchTerm: "nonexistent" })
      expect(screen.queryByTestId("port-item-port-a")).not.toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-b")).not.toBeInTheDocument()
      expect(screen.getByText("No IPs found.")).toBeInTheDocument()
    })
  })

  describe("Attachment filter", () => {
    // mockPortA has no device_id (free), mockPortB has device_id (attached)
    it("shows only attached ports when 'Attached' is selected", () => {
      renderComponent()
      fireEvent.change(screen.getByDisplayValue("All ports"), { target: { value: "attached" } })
      expect(screen.getByTestId("port-item-port-b")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-a")).not.toBeInTheDocument()
    })

    it("shows only free ports when 'Free' is selected", () => {
      renderComponent()
      fireEvent.change(screen.getByDisplayValue("All ports"), { target: { value: "free" } })
      expect(screen.getByTestId("port-item-port-a")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-b")).not.toBeInTheDocument()
    })
  })

  describe("Port Display", () => {
    it("does not render hidden ports", () => {
      const hiddenPort: Port = { ...mockPortA, id: "port-hidden", isHidden: true }
      renderComponent({ items: [mockPortA, hiddenPort] })
      expect(screen.getByTestId("port-item-port-a")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-hidden")).not.toBeInTheDocument()
    })

    it("shows skeleton rows when fetching with no items", () => {
      renderComponent({ items: [], isFetching: true })
      expect(screen.getByTestId("ports-skeleton")).toBeInTheDocument()
      expect(screen.queryByText("No IPs found.")).not.toBeInTheDocument()
    })

    it("shows 'No IPs found' when no ports and not fetching", () => {
      renderComponent({ items: [], isFetching: false })
      expect(screen.getByText("No IPs found.")).toBeInTheDocument()
    })
  })

  describe("Pagination", () => {
    it("renders AjaxPaginate component", () => {
      renderComponent()
      expect(screen.getByTestId("ajax-paginate")).toBeInTheDocument()
    })

    it("shows 'Load More' button when hasNext is true", () => {
      renderComponent({ hasNext: true })
      expect(screen.getByTestId("load-next-button")).toBeInTheDocument()
    })

    it("calls loadNext when 'Load More' button is clicked", () => {
      renderComponent({ hasNext: true })
      fireEvent.click(screen.getByTestId("load-next-button"))
      expect(mockLoadNext).toHaveBeenCalledTimes(1)
    })

    it("disables 'Load More' button when fetching", () => {
      renderComponent({ hasNext: true, isFetching: true })
      expect(screen.getByTestId("load-next-button")).toBeDisabled()
    })
  })

  describe("Permissions", () => {
    it("shows table when policy allows viewing", () => {
      global.policy.isAllowed = vi.fn(() => true)
      renderComponent()
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("shows permission denied message when policy denies viewing", () => {
      global.policy.isAllowed = vi.fn((action) => {
        if (action === "shared_filesystem_storage:share_list") return false
        return true
      })
      renderComponent()
      expect(screen.getByText("You are not allowed to see this page")).toBeInTheDocument()
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    })
  })

  describe("Reserve New IP Button", () => {
    it("is always shown (no filter dependency)", () => {
      renderComponent()
      const reserveButton = screen.getByText("Reserve new IP")
      expect(reserveButton).toHaveAttribute("href", "/ports/new")
      expect(reserveButton).toHaveClass("btn", "btn-primary")
    })
  })
})
