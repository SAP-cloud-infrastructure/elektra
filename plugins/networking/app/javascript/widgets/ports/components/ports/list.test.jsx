import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import List from "./list.tsx"

// Mock global policy object
global.policy = {
  isAllowed: vi.fn(() => true),
}

// Mock PortItem component
vi.mock("./item", () => ({
  default: ({ port, network, subnets }) => (
    <tr data-testid={`port-item-${port.id}`}>
      <td>{port.id}</td>
      <td>{port.name}</td>
      <td>{port.description}</td>
      <td>{network?.name || "Loading..."}</td>
      <td>{port.status}</td>
    </tr>
  ),
}))

// Mock data helpers
const createPort = (overrides = {}) => ({
  id: "port-1",
  name: "test-port",
  description: "Test port description",
  network_id: "network-1",
  status: "ACTIVE",
  fixed_ips: [{ subnet_id: "subnet-1", ip_address: "192.168.1.10" }],
  device_owner: "compute:nova",
  device_id: "instance-1",
  isHidden: false,
  ...overrides,
})

const createNetwork = (overrides = {}) => ({
  id: "network-1",
  name: "test-network",
  ...overrides,
})

const createSubnet = (overrides = {}) => ({
  id: "subnet-1",
  name: "test-subnet",
  cidr: "192.168.1.0/24",
  ...overrides,
})

const createSecurityGroup = (overrides = {}) => ({
  id: "sg-1",
  name: "default",
  ...overrides,
})

describe("List (Ports)", () => {
  let mockLoadPortsOnce
  let mockLoadNetworksOnce
  let mockLoadSubnetsOnce
  let mockLoadSecurityGroupsOnce
  let mockSearchPorts
  let mockHandleDelete
  let mockLoadNext
  let user

  beforeEach(() => {
    user = userEvent.setup()
    mockLoadPortsOnce = vi.fn()
    mockLoadNetworksOnce = vi.fn()
    mockLoadSubnetsOnce = vi.fn()
    mockLoadSecurityGroupsOnce = vi.fn()
    mockSearchPorts = vi.fn()
    mockHandleDelete = vi.fn()
    mockLoadNext = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    const defaultProps = {
      items: [],
      networks: { items: [], isFetching: false },
      subnets: { items: [], isFetching: false },
      securityGroups: { items: [] },
      isFetching: false,
      hasNext: false,
      searchTerm: "",
      instancesPath: "/instances",
      loadPortsOnce: mockLoadPortsOnce,
      loadNetworksOnce: mockLoadNetworksOnce,
      loadSubnetsOnce: mockLoadSubnetsOnce,
      loadSecurityGroupsOnce: mockLoadSecurityGroupsOnce,
      searchPorts: mockSearchPorts,
      handleDelete: mockHandleDelete,
      loadNext: mockLoadNext,
      ...props,
    }

    return render(
      <BrowserRouter>
        <List {...defaultProps} />
      </BrowserRouter>
    )
  }

  describe("Initial Rendering", () => {
    it("renders without crashing", () => {
      renderComponent()
      // Table should be present even with no items (shows "No IPs found")
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("loads dependencies on mount", () => {
      renderComponent()
      expect(mockLoadPortsOnce).toHaveBeenCalled()
      expect(mockLoadNetworksOnce).toHaveBeenCalled()
      expect(mockLoadSubnetsOnce).toHaveBeenCalled()
      expect(mockLoadSecurityGroupsOnce).toHaveBeenCalled()
    })

    it("shows table when policy is allowed", () => {
      const port = createPort({ name: "fixed_ip_allocation" })
      renderComponent({ items: [port] })
      expect(screen.getByRole("table")).toBeInTheDocument()
    })

    it("shows access denied message when policy is not allowed", () => {
      global.policy.isAllowed = vi.fn(() => false)
      renderComponent()
      expect(screen.getByText("You are not allowed to see this page")).toBeInTheDocument()
      global.policy.isAllowed = vi.fn(() => true) // Reset
    })

    it("displays table headers correctly", () => {
      const port = createPort()
      renderComponent({ items: [port] })

      expect(screen.getByText("Port ID / Name")).toBeInTheDocument()
      expect(screen.getByText("Description")).toBeInTheDocument()
      expect(screen.getByText("Network")).toBeInTheDocument()
      expect(screen.getByText("Fixed IPs / Subnet")).toBeInTheDocument()
      expect(screen.getByText("Device Owner / ID")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
    })
  })

  describe("Port Display", () => {
    it("displays ports correctly", () => {
      const port = createPort({ name: "fixed_ip_allocation" })
      const network = createNetwork()
      renderComponent({
        items: [port],
        networks: { items: [network], isFetching: false },
      })

      expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
    })

    it("displays multiple ports", () => {
      const ports = [
        createPort({ id: "port-1", name: "fixed_ip_allocation" }),
        createPort({ id: "port-2", name: "fixed_ip_allocation" }),
        createPort({ id: "port-3", name: "fixed_ip_allocation" }),
      ]
      renderComponent({ items: ports })

      ports.forEach((port) => {
        expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
      })
    })

    it("does not display hidden ports", () => {
      const visiblePort = createPort({ id: "port-visible", name: "fixed_ip_allocation", isHidden: false })
      const hiddenPort = createPort({ id: "port-hidden", name: "fixed_ip_allocation", isHidden: true })
      const network = createNetwork()

      renderComponent({
        items: [visiblePort, hiddenPort],
        networks: { items: [network], isFetching: false },
      })

      expect(screen.getByTestId("port-item-port-visible")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-hidden")).not.toBeInTheDocument()
    })

    it("shows loading spinner when fetching and no items", () => {
      renderComponent({ items: [], isFetching: true })
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it('shows "No IPs found." when not fetching and no items', () => {
      renderComponent({ items: [], isFetching: false })
      expect(screen.getByText("No IPs found.")).toBeInTheDocument()
    })
  })

  describe("Filtering", () => {
    it("initializes with default filters", () => {
      const port = createPort()
      renderComponent({ items: [port] })

      expect(screen.getByLabelText("fixed ip ports")).toBeInTheDocument()
      expect(screen.getByLabelText("other ports")).toBeInTheDocument()
    })

    it("defaults to 'fixed ip ports' filter", () => {
      const fixedIpPort = createPort({ id: "fixed-1", name: "fixed_ip_allocation" })
      const otherPort = createPort({ id: "other-1", name: "other-port" })

      renderComponent({ items: [fixedIpPort, otherPort] })

      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      expect(fixedIpRadio).toBeChecked()
    })

    it("filters fixed ip ports correctly", () => {
      const fixedIpPort = createPort({ id: "fixed-1", name: "fixed_ip_allocation" })
      const otherPort = createPort({ id: "other-1", name: "other-port" })

      renderComponent({ items: [fixedIpPort, otherPort] })

      // Fixed IP filter should be active by default
      expect(screen.getByTestId("port-item-fixed-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-other-1")).not.toBeInTheDocument()
    })

    it("filters other ports correctly", async () => {
      const fixedIpPort = createPort({ id: "fixed-1", name: "fixed_ip_allocation" })
      const otherPort = createPort({ id: "other-1", name: "other-port" })

      renderComponent({ items: [fixedIpPort, otherPort] })

      const otherPortsRadio = screen.getByLabelText("other ports")
      await user.click(otherPortsRadio)

      await waitFor(() => {
        expect(screen.queryByTestId("port-item-fixed-1")).not.toBeInTheDocument()
        expect(screen.getByTestId("port-item-other-1")).toBeInTheDocument()
      })
    })

    it("switches between filters correctly", async () => {
      const fixedIpPort = createPort({ id: "fixed-1", name: "fixed_ip_allocation" })
      const otherPort = createPort({ id: "other-1", name: "other-port" })

      renderComponent({ items: [fixedIpPort, otherPort] })

      // Switch to other ports
      const otherPortsRadio = screen.getByLabelText("other ports")
      await user.click(otherPortsRadio)

      await waitFor(() => {
        expect(screen.getByTestId("port-item-other-1")).toBeInTheDocument()
      })

      // Switch back to fixed ip ports
      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      await user.click(fixedIpRadio)

      await waitFor(() => {
        expect(screen.getByTestId("port-item-fixed-1")).toBeInTheDocument()
      })
    })

    it("maintains active filter when receiving new props", () => {
      const fixedIpPort = createPort({ id: "fixed-1", name: "fixed_ip_allocation" })
      const { rerender } = renderComponent({ items: [fixedIpPort] })

      const fixedIpRadio = screen.getByLabelText("fixed ip ports")
      expect(fixedIpRadio).toBeChecked()

      // Simulate receiving new props
      rerender(
        <BrowserRouter>
          <List
            items={[fixedIpPort, createPort({ id: "fixed-2", name: "fixed_ip_allocation" })]}
            networks={{ items: [], isFetching: false }}
            subnets={{ items: [], isFetching: false }}
            securityGroups={{ items: [] }}
            isFetching={false}
            hasNext={false}
            searchTerm=""
            instancesPath="/instances"
            loadPortsOnce={mockLoadPortsOnce}
            loadNetworksOnce={mockLoadNetworksOnce}
            loadSubnetsOnce={mockLoadSubnetsOnce}
            loadSecurityGroupsOnce={mockLoadSecurityGroupsOnce}
            searchPorts={mockSearchPorts}
            handleDelete={mockHandleDelete}
            loadNext={mockLoadNext}
          />
        </BrowserRouter>
      )

      // Active filter should be maintained
      expect(screen.getByLabelText("fixed ip ports")).toBeChecked()
    })
  })

  describe("Search Functionality", () => {
    it("renders search field when items exist", () => {
      const port = createPort()
      renderComponent({ items: [port] })

      expect(screen.getByPlaceholderText(/ID, IP, network/i)).toBeInTheDocument()
    })

    it("does not render search field when no items", () => {
      renderComponent({ items: [] })
      expect(screen.queryByPlaceholderText(/ID, IP, network/i)).not.toBeInTheDocument()
    })

    it("filters ports by ID", () => {
      const port1 = createPort({ id: "port-123", name: "fixed_ip_allocation" })
      const port2 = createPort({ id: "port-456", name: "fixed_ip_allocation" })

      renderComponent({
        items: [port1, port2],
        searchTerm: "123",
      })

      expect(screen.getByTestId("port-item-port-123")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-456")).not.toBeInTheDocument()
    })

    it("filters ports by description", () => {
      const port1 = createPort({
        id: "port-1",
        name: "fixed_ip_allocation",
        description: "Production server",
      })
      const port2 = createPort({
        id: "port-2",
        name: "fixed_ip_allocation",
        description: "Development server",
      })

      renderComponent({
        items: [port1, port2],
        searchTerm: "Production",
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-2")).not.toBeInTheDocument()
    })

    it("filters ports by IP address", () => {
      const port1 = createPort({
        id: "port-1",
        name: "fixed_ip_allocation",
        fixed_ips: [{ subnet_id: "subnet-1", ip_address: "192.168.1.10" }],
      })
      const port2 = createPort({
        id: "port-2",
        name: "fixed_ip_allocation",
        fixed_ips: [{ subnet_id: "subnet-1", ip_address: "10.0.0.5" }],
      })

      renderComponent({
        items: [port1, port2],
        searchTerm: "192.168",
        networks: { items: [], isFetching: false },
        subnets: { items: [], isFetching: false },
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-2")).not.toBeInTheDocument()
    })

    it("filters ports by network name", () => {
      const network1 = createNetwork({ id: "net-1", name: "production-network" })
      const network2 = createNetwork({ id: "net-2", name: "dev-network" })

      const port1 = createPort({
        id: "port-1",
        name: "fixed_ip_allocation",
        network_id: "net-1",
      })
      const port2 = createPort({
        id: "port-2",
        name: "fixed_ip_allocation",
        network_id: "net-2",
      })

      renderComponent({
        items: [port1, port2],
        searchTerm: "production",
        networks: { items: [network1, network2], isFetching: false },
        subnets: { items: [], isFetching: false },
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-2")).not.toBeInTheDocument()
    })

    it("filters ports by subnet name", () => {
      const subnet1 = createSubnet({ id: "subnet-1", name: "prod-subnet" })
      const subnet2 = createSubnet({ id: "subnet-2", name: "dev-subnet" })

      const port1 = createPort({
        id: "port-1",
        name: "fixed_ip_allocation",
        fixed_ips: [{ subnet_id: "subnet-1", ip_address: "192.168.1.10" }],
      })
      const port2 = createPort({
        id: "port-2",
        name: "fixed_ip_allocation",
        fixed_ips: [{ subnet_id: "subnet-2", ip_address: "10.0.0.5" }],
      })

      renderComponent({
        items: [port1, port2],
        searchTerm: "prod",
        networks: { items: [], isFetching: false },
        subnets: { items: [subnet1, subnet2], isFetching: false },
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-2")).not.toBeInTheDocument()
    })

    it("filters ports by status", () => {
      const port1 = createPort({
        id: "port-1",
        name: "fixed_ip_allocation",
        status: "ACTIVE",
      })
      const port2 = createPort({
        id: "port-2",
        name: "fixed_ip_allocation",
        status: "DOWN",
      })

      renderComponent({
        items: [port1, port2],
        searchTerm: "ACTIVE",
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-port-2")).not.toBeInTheDocument()
    })

    it("performs case-insensitive search", () => {
      const port = createPort({
        id: "port-1",
        name: "fixed_ip_allocation",
        description: "Production Server",
      })

      renderComponent({
        items: [port],
        searchTerm: "production",
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
    })

    it("shows all items when search term is empty", () => {
      const port1 = createPort({ id: "port-1", name: "fixed_ip_allocation" })
      const port2 = createPort({ id: "port-2", name: "fixed_ip_allocation" })

      renderComponent({
        items: [port1, port2],
        searchTerm: "",
      })

      expect(screen.getByTestId("port-item-port-1")).toBeInTheDocument()
      expect(screen.getByTestId("port-item-port-2")).toBeInTheDocument()
    })

    it("combines filter and search correctly", async () => {
      const fixedIpPort = createPort({
        id: "fixed-1",
        name: "fixed_ip_allocation",
        description: "Fixed IP port",
      })
      const otherPort = createPort({
        id: "other-1",
        name: "other-port",
        description: "Other port",
      })

      const { rerender } = renderComponent({ items: [fixedIpPort, otherPort] })

      // Fixed IP filter is active by default, only fixed IP port should show
      expect(screen.getByTestId("port-item-fixed-1")).toBeInTheDocument()
      expect(screen.queryByTestId("port-item-other-1")).not.toBeInTheDocument()

      // Switch to other ports filter
      const otherPortsRadio = screen.getByLabelText("other ports")
      await user.click(otherPortsRadio)

      await waitFor(() => {
        expect(screen.getByTestId("port-item-other-1")).toBeInTheDocument()
      })

      // Now add search term
      rerender(
        <BrowserRouter>
          <List
            items={[fixedIpPort, otherPort]}
            networks={{ items: [], isFetching: false }}
            subnets={{ items: [], isFetching: false }}
            securityGroups={{ items: [] }}
            isFetching={false}
            hasNext={false}
            searchTerm="Other"
            instancesPath="/instances"
            loadPortsOnce={mockLoadPortsOnce}
            loadNetworksOnce={mockLoadNetworksOnce}
            loadSubnetsOnce={mockLoadSubnetsOnce}
            loadSecurityGroupsOnce={mockLoadSecurityGroupsOnce}
            searchPorts={mockSearchPorts}
            handleDelete={mockHandleDelete}
            loadNext={mockLoadNext}
          />
        </BrowserRouter>
      )

      // Should still show other-1 (matches both filter and search)
      expect(screen.getByTestId("port-item-other-1")).toBeInTheDocument()
    })
  })

  describe("Toolbar", () => {
    it("shows toolbar when items exist", () => {
      const port = createPort()
      renderComponent({ items: [port] })

      expect(screen.getByPlaceholderText(/ID, IP, network/i)).toBeInTheDocument()
    })

    it("does not show toolbar when no items", () => {
      renderComponent({ items: [] })
      expect(screen.queryByPlaceholderText(/ID, IP, network/i)).not.toBeInTheDocument()
    })

    it('shows "Reserve new IP" button when fixed ip filter is active', () => {
      const port = createPort({ name: "fixed_ip_allocation" })
      renderComponent({ items: [port] })

      expect(screen.getByText("Reserve new IP")).toBeInTheDocument()
    })

    it('does not show "Reserve new IP" button when other ports filter is active', async () => {
      const port = createPort({ name: "other-port" })
      renderComponent({ items: [port] })

      const otherPortsRadio = screen.getByLabelText("other ports")
      await user.click(otherPortsRadio)

      await waitFor(() => {
        expect(screen.queryByText("Reserve new IP")).not.toBeInTheDocument()
      })
    })

    it("shows filter radio buttons", () => {
      const port = createPort()
      renderComponent({ items: [port] })

      expect(screen.getByLabelText("fixed ip ports")).toBeInTheDocument()
      expect(screen.getByLabelText("other ports")).toBeInTheDocument()
    })
  })

  describe("Pagination", () => {
    it("shows AjaxPaginate component", () => {
      const port = createPort()
      renderComponent({ items: [port], hasNext: true })

      // AjaxPaginate component is rendered (we can't easily test its internals without mocking)
      // Just verify the table is present which means pagination would be below it
      expect(screen.getByRole("table")).toBeInTheDocument()
    })
  })

  describe("Network and Subnet Data", () => {
    it("converts networks array to object keyed by id", () => {
      const network1 = createNetwork({ id: "net-1", name: "Network 1" })
      const network2 = createNetwork({ id: "net-2", name: "Network 2" })
      const port = createPort({ name: "fixed_ip_allocation", network_id: "net-1" })

      renderComponent({
        items: [port],
        networks: { items: [network1, network2], isFetching: false },
      })

      // PortItem should receive network prop correctly
      expect(screen.getByText("Network 1")).toBeInTheDocument()
    })

    it("converts subnets array to object keyed by id", () => {
      const subnet1 = createSubnet({ id: "subnet-1", name: "Subnet 1" })
      const subnet2 = createSubnet({ id: "subnet-2", name: "Subnet 2" })
      const port = createPort({ name: "fixed_ip_allocation" })

      renderComponent({
        items: [port],
        subnets: { items: [subnet1, subnet2], isFetching: false },
      })

      // Subnets are passed to PortItem
      expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
    })
  })

  describe("Props Updates", () => {
    it("loads dependencies when receiving new props", () => {
      const { rerender } = renderComponent()

      // Initial mount calls
      expect(mockLoadPortsOnce).toHaveBeenCalled()

      // Clear mocks after initial render
      vi.clearAllMocks()

      // Simulate prop update with a new loadPortsOnce function
      const newMockLoadPortsOnce = vi.fn()
      rerender(
        <BrowserRouter>
          <List
            items={[createPort()]}
            networks={{ items: [], isFetching: false }}
            subnets={{ items: [], isFetching: false }}
            securityGroups={{ items: [] }}
            isFetching={false}
            hasNext={false}
            searchTerm=""
            instancesPath="/instances"
            loadPortsOnce={newMockLoadPortsOnce}
            loadNetworksOnce={mockLoadNetworksOnce}
            loadSubnetsOnce={mockLoadSubnetsOnce}
            loadSecurityGroupsOnce={mockLoadSecurityGroupsOnce}
            searchPorts={mockSearchPorts}
            handleDelete={mockHandleDelete}
            loadNext={mockLoadNext}
          />
        </BrowserRouter>
      )

      // Should be called due to prop changes triggering useEffect
      expect(newMockLoadPortsOnce).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("handles ports without fixed_ips", () => {
      const port = createPort({ fixed_ips: undefined, name: "fixed_ip_allocation" })
      renderComponent({ items: [port] })

      expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
    })

    it("handles ports with empty fixed_ips array", () => {
      const port = createPort({ fixed_ips: [], name: "fixed_ip_allocation" })
      renderComponent({ items: [port] })

      expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
    })

    it("handles missing network for a port", () => {
      const port = createPort({ name: "fixed_ip_allocation", network_id: "nonexistent-network" })
      renderComponent({
        items: [port],
        networks: { items: [], isFetching: false },
      })

      expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
    })

    it("handles missing subnet for a fixed ip", () => {
      const port = createPort({
        fixed_ips: [{ subnet_id: "nonexistent-subnet", ip_address: "192.168.1.10" }],
        name: "fixed_ip_allocation",
      })
      renderComponent({
        items: [port],
        subnets: { items: [], isFetching: false },
      })

      expect(screen.getByTestId(`port-item-${port.id}`)).toBeInTheDocument()
    })

    it("handles ports with multiple fixed IPs", () => {
      const port = createPort({
        id: "port-multi-ip",
        name: "fixed_ip_allocation",
        fixed_ips: [
          { subnet_id: "subnet-1", ip_address: "192.168.1.10" },
          { subnet_id: "subnet-2", ip_address: "10.0.0.5" },
        ],
      })

      renderComponent({
        items: [port],
        searchTerm: "192.168",
        subnets: { items: [], isFetching: false },
      })

      expect(screen.getByTestId("port-item-port-multi-ip")).toBeInTheDocument()
    })
  })
})
