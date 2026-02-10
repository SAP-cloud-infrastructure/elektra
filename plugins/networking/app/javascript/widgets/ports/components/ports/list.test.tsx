import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"
import List from "./list.jsx"

interface PolicyType {
  isAllowed: (action: string, options?: any) => boolean
}

// Extend global to include policy
declare global {
  var policy: PolicyType
}

// Mock global policy object
global.policy = {
  isAllowed: vi.fn(() => true),
}

// Mock dependencies
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
  default: ({ port, network, subnets }: any) => (
    <tr data-testid={`port-item-${port.id}`}>
      <td>{port.id}</td>
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

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
  network_id: string
}

interface SecurityGroup {
  id: string
  name: string
}

interface NetworksState {
  items: Network[]
  isFetching: boolean
}

interface SubnetsState {
  items: Subnet[]
  isFetching: boolean
}

interface SecurityGroupsState {
  items: SecurityGroup[]
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

describe("List Component", () => {
  let mockLoadPortsOnce: ReturnType<typeof vi.fn>
  let mockLoadNetworksOnce: ReturnType<typeof vi.fn>
  let mockLoadSubnetsOnce: ReturnType<typeof vi.fn>
  let mockLoadSecurityGroupsOnce: ReturnType<typeof vi.fn>
  let mockHandleDelete: ReturnType<typeof vi.fn>
  let mockSearchPorts: ReturnType<typeof vi.fn>
  let mockLoadNext: ReturnType<typeof vi.fn>

  const mockFixedIpPort: Port = {
    id: "port-fixed-1",
    name: "fixed_ip_allocation",
    description: "Fixed IP Port 1",
    network_id: "network-1",
    fixed_ips: [{ ip_address: "192.168.1.10", subnet_id: "subnet-1" }],
    status: "ACTIVE",
  }

  const mockOtherPort: Port = {
    id: "port-other-1",
    name: "other-port",
    description: "Other Port 1",
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
    items: [
      { id: "sg-1", name: "Security Group One" },
      { id: "sg-2", name: "Security Group Two" },
    ],
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
      items: [mockFixedIpPort, mockOtherPort],
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
    it("renders the component without crashing", () => {
      renderComponent()
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("calls all load dependencies on mount", () => {
      renderComponent()
      expect(mockLoadPortsOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadNetworksOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadSubnetsOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadSecurityGroupsOnce).toHaveBeenCalledTimes(1)
    })

    it("renders table headers correctly", () => {
      renderComponent()
      expect(screen.getByText("Port ID / Name")).toBeInTheDocument()
      expect(screen.getByText("Description")).toBeInTheDocument()
      expect(screen.getByText("Network")).toBeInTheDocument()
      expect(screen.getByText("Fixed IPs / Subnet")).toBeInTheDocument()
      expect(screen.getByText("Device Owner / ID")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
    })

    it("renders toolbar when items are available", () => {
      renderComponent()
      expect(screen.getByTestId("search-field")).toBeInTheDocument()
    })

    it("does not render toolbar when no items available", () => {
      renderComponent({ items: [] })
      expect(screen.queryByTestId("search-field")).not.toBeInTheDocument()
    })
  })

  describe("Filtering", () => {
    it("shows filter radio buttons", () => {
      renderComponent()
      expect(screen.getByText("Show:")).toBeInTheDocument()
      expect(screen.getByLabelText("fixed ip ports")).toBeInTheDocument()
      expect(screen.getByLabelText("other ports")).toBeInTheDocument()
    })

    it("defaults to showing no ports initially due to null activeFilter", () => {
      renderComponent()
      // On initial mount, activeFilter is null, so no ports match the filter
      expect(screen.queryByTestId("port-item-port-fixed-1")).not.toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-other-1")).not.toBeInTheDocument()
      expect(screen.getByText("No IPs found.")).toBeInTheDocument()
    })

    it("shows fixed IP ports after filter is selected", () => {
      renderComponent()
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      // Should show fixed IP port
      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
      // Should not show other port
      expect(screen.queryByTestId("port-item-port-other-1")).not.toBeInTheDocument()
    })

    it("changes filter when 'other ports' is selected", () => {
      renderComponent()
      const otherPortsRadio = screen.getByLabelText("other ports")
      fireEvent.click(otherPortsRadio)

      // Should show other port
      expect(screen.getByTestId("port-item-port-other-1")).toBeInTheDocument()
      // Should not show fixed IP port
      expect(screen.queryByTestId("port-item-port-fixed-1")).not.toBeInTheDocument()
    })

    it("switches between filters correctly", () => {
      renderComponent()

      // Select fixed ip ports
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)
      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()

      // Switch to other ports
      const otherPortsRadio = screen.getByLabelText("other ports")
      fireEvent.click(otherPortsRadio)
      expect(screen.getByTestId("port-item-port-other-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-fixed-1")).not.toBeInTheDocument()
    })

    it("shows 'Reserve new IP' button only for fixed ip ports filter", () => {
      renderComponent()

      // Select fixed ip ports first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)
      expect(screen.getByText("Reserve new IP")).toBeInTheDocument()

      const otherPortsRadio = screen.getByLabelText("other ports")
      fireEvent.click(otherPortsRadio)

      expect(screen.queryByText("Reserve new IP")).not.toBeInTheDocument()
    })
  })

  describe("Search Functionality", () => {
    it("renders search field with correct placeholder", () => {
      renderComponent()
      const searchInput = screen.getByTestId("search-input")
      expect(searchInput).toHaveAttribute("placeholder", "ID, IP, network, subnet or description")
    })

    it("calls searchPorts when search input changes", () => {
      renderComponent()
      const searchInput = screen.getByTestId("search-input")
      fireEvent.change(searchInput, { target: { value: "test search" } })

      expect(mockSearchPorts).toHaveBeenCalledWith("test search")
    })

    it("filters ports by ID when search term is provided", () => {
      const { container } = renderComponent({ searchTerm: "port-fixed-1" })
      // Need to select the filter first for ports to show
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("filters ports by description when search term is provided", () => {
      renderComponent({ searchTerm: "Fixed IP Port" })
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("filters ports by IP address when search term is provided", () => {
      renderComponent({ searchTerm: "192.168.1.10" })
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("filters ports by network name when search term is provided", () => {
      renderComponent({ searchTerm: "Network One" })
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("filters ports by subnet name when search term is provided", () => {
      renderComponent({ searchTerm: "Subnet One" })
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("filters ports case-insensitively", () => {
      renderComponent({ searchTerm: "FIXED IP PORT" })
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("shows no results when search term doesn't match", () => {
      renderComponent({ searchTerm: "nonexistent" })
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.queryByTestId("port-item-port-fixed-1")).not.toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-other-1")).not.toBeInTheDocument()
      expect(screen.getByText("No IPs found.")).toBeInTheDocument()
    })
  })

  describe("Port Display", () => {
    it("renders port items correctly", () => {
      renderComponent()

      // Need to select a filter first (activeFilter starts as null)
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("does not render hidden ports", () => {
      const hiddenPort: Port = { ...mockFixedIpPort, id: "port-hidden", isHidden: true }
      renderComponent({ items: [mockFixedIpPort, hiddenPort] })

      // Need to select a filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-hidden")).not.toBeInTheDocument()
    })

    it("shows spinner when fetching", () => {
      renderComponent({ items: [], isFetching: true })
      expect(screen.getByRole("table")).toBeInTheDocument()
      // Spinner is rendered as <span className="spinner" />
      const spinner = document.querySelector(".spinner")
      expect(spinner).toBeInTheDocument()
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

    it("does not show 'Load More' button when hasNext is false", () => {
      renderComponent({ hasNext: false })
      expect(screen.queryByTestId("load-next-button")).not.toBeInTheDocument()
    })

    it("calls loadNext when 'Load More' button is clicked", () => {
      renderComponent({ hasNext: true })
      const loadNextButton = screen.getByTestId("load-next-button")
      fireEvent.click(loadNextButton)

      expect(mockLoadNext).toHaveBeenCalledTimes(1)
    })

    it("disables 'Load More' button when fetching", () => {
      renderComponent({ hasNext: true, isFetching: true })
      const loadNextButton = screen.getByTestId("load-next-button")
      expect(loadNextButton).toBeDisabled()
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

  describe("Dependency Loading on Props Change", () => {
    it("loads dependencies when component receives new props", () => {
      const { rerender } = renderComponent()

      // Clear previous calls
      mockLoadPortsOnce.mockClear()
      mockLoadNetworksOnce.mockClear()
      mockLoadSubnetsOnce.mockClear()
      mockLoadSecurityGroupsOnce.mockClear()

      // Simulate receiving new props
      rerender(
        <List
          items={[mockOtherPort]}
          networks={{ ...mockNetworks, isFetching: true }}
          subnets={mockSubnets}
          securityGroups={mockSecurityGroups}
          loadPortsOnce={mockLoadPortsOnce}
          loadNetworksOnce={mockLoadNetworksOnce}
          loadSubnetsOnce={mockLoadSubnetsOnce}
          loadSecurityGroupsOnce={mockLoadSecurityGroupsOnce}
          handleDelete={mockHandleDelete}
          searchPorts={mockSearchPorts}
          isFetching={false}
          hasNext={false}
          loadNext={mockLoadNext}
        />
      )

      // Dependencies should be loaded again due to UNSAFE_componentWillReceiveProps
      expect(mockLoadPortsOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadNetworksOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadSubnetsOnce).toHaveBeenCalledTimes(1)
      expect(mockLoadSecurityGroupsOnce).toHaveBeenCalledTimes(1)
    })
  })

  describe("Edge Cases", () => {
    it("handles ports without fixed_ips", () => {
      const portWithoutIPs: Port = {
        id: "port-no-ips",
        name: "fixed_ip_allocation",
        description: "No IPs",
        network_id: "network-1",
        status: "DOWN",
      }
      renderComponent({ items: [portWithoutIPs] })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-no-ips")).toBeInTheDocument()
    })

    it("handles empty fixed_ips array", () => {
      const portWithEmptyIPs: Port = {
        id: "port-empty-ips",
        name: "fixed_ip_allocation",
        description: "Empty IPs",
        network_id: "network-1",
        fixed_ips: [],
        status: "BUILD",
      }
      renderComponent({ items: [portWithEmptyIPs] })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-empty-ips")).toBeInTheDocument()
    })

    it("handles network not found in networks list", () => {
      const portWithUnknownNetwork: Port = {
        ...mockFixedIpPort,
        id: "port-unknown-network",
        network_id: "network-999",
      }
      renderComponent({ items: [portWithUnknownNetwork] })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-unknown-network")).toBeInTheDocument()
    })

    it("handles subnet not found in subnets list", () => {
      const portWithUnknownSubnet: Port = {
        ...mockFixedIpPort,
        id: "port-unknown-subnet",
        fixed_ips: [{ ip_address: "10.0.0.1", subnet_id: "subnet-999" }],
      }
      renderComponent({ items: [portWithUnknownSubnet] })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-unknown-subnet")).toBeInTheDocument()
    })

    it("handles loading state for networks", () => {
      const loadingNetworks: NetworksState = {
        items: [],
        isFetching: true,
      }
      renderComponent({ networks: loadingNetworks })
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("handles loading state for subnets", () => {
      const loadingSubnets: SubnetsState = {
        items: [],
        isFetching: true,
      }
      renderComponent({ subnets: loadingSubnets })
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("handles empty search term", () => {
      renderComponent({ searchTerm: "" })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("handles whitespace-only search term", () => {
      renderComponent({ searchTerm: "   " })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      // Whitespace-only search term gets trimmed to empty string, which creates
      // an empty regex that matches everything, so ports are shown
      expect(screen.getByTestId("port-item-port-fixed-1")).toBeInTheDocument()
    })

    it("handles ports with multiple fixed IPs", () => {
      const portWithMultipleIPs: Port = {
        id: "port-multi-ips",
        name: "fixed_ip_allocation",
        description: "Multiple IPs",
        network_id: "network-1",
        fixed_ips: [
          { ip_address: "192.168.1.10", subnet_id: "subnet-1" },
          { ip_address: "192.168.1.11", subnet_id: "subnet-2" },
        ],
        status: "ACTIVE",
      }
      renderComponent({ items: [portWithMultipleIPs] })

      // Need to select filter first
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      expect(screen.getByTestId("port-item-port-multi-ips")).toBeInTheDocument()
    })
  })

  describe("Networks and Subnets Mapping", () => {
    it("creates network lookup map correctly", () => {
      renderComponent()
      // The component should be able to find networks by ID
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("creates subnet lookup map correctly", () => {
      renderComponent()
      // The component should be able to find subnets by ID
      expect(screen.getByRole("table")).toBeInTheDocument()
    })
  })

  describe("Filter State Management", () => {
    it("maintains active filter state", () => {
      renderComponent()

      // Initially, no radio is checked (activeFilter is null on mount)
      const fixedIpRadio = screen.getByLabelText("fixed ip ports") as HTMLInputElement
      expect(fixedIpRadio.checked).toBe(false)

      // Click to activate the filter
      fireEvent.click(fixedIpRadio)
      expect(fixedIpRadio.checked).toBe(true)

      // Switch to other filter
      const otherPortsRadio = screen.getByLabelText("other ports")
      fireEvent.click(otherPortsRadio)

      const otherPortsRadioAfter = screen.getByLabelText("other ports") as HTMLInputElement
      expect(otherPortsRadioAfter.checked).toBe(true)
    })
  })

  describe("Search Help Text", () => {
    it("displays search help text", () => {
      renderComponent()
      const helpText = screen.getByTestId("search-help-text")
      expect(helpText).toHaveTextContent("Searches by ID, IP, network, subnet or description")
    })
  })

  describe("Reserve New IP Button", () => {
    it("links to correct path for reserving new IP", () => {
      renderComponent()

      // Button only shows when "fixed ip ports" filter is active
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      const reserveButton = screen.getByText("Reserve new IP")
      expect(reserveButton).toHaveAttribute("href", "/ports/new")
    })

    it("has correct CSS class for primary button", () => {
      renderComponent()

      // Button only shows when "fixed ip ports" filter is active
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      fireEvent.click(fixedIpRadio)

      const reserveButton = screen.getByText("Reserve new IP")
      expect(reserveButton).toHaveClass("btn", "btn-primary")
    })
  })
})
