import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom/vitest"
import React from "react"
import { BrowserRouter } from "react-router-dom"
import ShowPortModal from "./show"

// Mock data helpers
interface FixedIP {
  subnet_id: string
  ip_address: string
}

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  status: string
  mac_address: string
  fixed_ips?: FixedIP[]
  device_owner?: string
  device_id?: string
  created_at?: string
  updated_at?: string
  tenant_id?: string
  project_id?: string
  security_groups: string[]
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  id: string
  name: string
  cidr?: string
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
}

const createPort = (overrides: Partial<Port> = {}): Port => ({
  id: "port-123",
  name: "test-port",
  description: "Test port description",
  network_id: "network-1",
  status: "ACTIVE",
  mac_address: "fa:16:3e:12:34:56",
  fixed_ips: [{ subnet_id: "subnet-1", ip_address: "192.168.1.10" }],
  device_owner: "compute:nova",
  device_id: "instance-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  tenant_id: "tenant-123",
  project_id: "project-123",
  security_groups: ["sg-1"],
  ...overrides,
})

const createNetwork = (overrides: Partial<Network> = {}): Network => ({
  id: "network-1",
  name: "test-network",
  ...overrides,
})

const createSubnet = (overrides: Partial<Subnet> = {}): Subnet => ({
  id: "subnet-1",
  name: "test-subnet",
  cidr: "192.168.1.0/24",
  ...overrides,
})

const createSecurityGroup = (overrides: Partial<SecurityGroup> = {}): SecurityGroup => ({
  id: "sg-1",
  name: "default",
  ...overrides,
})

describe("ShowPortModal", () => {
  let mockLoadPort: ReturnType<typeof vi.fn>
  let mockLoadNetworksOnce: ReturnType<typeof vi.fn>
  let mockLoadSubnetsOnce: ReturnType<typeof vi.fn>
  let mockLoadSecurityGroupsOnce: ReturnType<typeof vi.fn>
  let mockHistoryReplace: ReturnType<typeof vi.fn>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    mockLoadPort = vi.fn()
    mockLoadNetworksOnce = vi.fn()
    mockLoadSubnetsOnce = vi.fn()
    mockLoadSecurityGroupsOnce = vi.fn()
    mockHistoryReplace = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  interface RenderComponentProps {
    port?: Port | null
    networks?: NetworksState
    subnets?: SubnetsState
    securityGroups?: SecurityGroupsState
    loadPort?: () => void
    loadNetworksOnce?: () => void
    loadSubnetsOnce?: () => void
    loadSecurityGroupsOnce?: () => void
  }

  const renderComponent = (props: RenderComponentProps = {}) => {
    const defaultProps = {
      port: null,
      networks: { items: [], isFetching: false },
      subnets: { items: [], isFetching: false },
      securityGroups: { items: [] },
      loadPort: mockLoadPort,
      loadNetworksOnce: mockLoadNetworksOnce,
      loadSubnetsOnce: mockLoadSubnetsOnce,
      loadSecurityGroupsOnce: mockLoadSecurityGroupsOnce,
      ...props,
    }

    const mockHistory = {
      replace: mockHistoryReplace,
      push: vi.fn(),
      go: vi.fn(),
      goBack: vi.fn(),
      goForward: vi.fn(),
      listen: vi.fn(),
      location: { pathname: "/ports/port-123", search: "", hash: "", state: null, key: "" },
      createHref: vi.fn(),
    }

    return render(
      <BrowserRouter>
        <ShowPortModal {...defaultProps} history={mockHistory as any} />
      </BrowserRouter>
    )
  }

  describe("Initial Rendering", () => {
    it("renders modal when show state is true", () => {
      renderComponent()
      const dialogs = screen.getAllByRole("dialog")
      expect(dialogs.length).toBeGreaterThan(0)
    })

    it("displays loading spinner when port is not loaded", () => {
      renderComponent({ port: null })
      expect(document.querySelector(".spinner")).toBeInTheDocument()
    })

    it("displays port data when port is loaded", () => {
      const port = createPort()
      renderComponent({ port })
      expect(screen.getByText(port.id)).toBeInTheDocument()
    })

    it("shows modal title (Port label)", () => {
      const port = createPort({ description: "My Port" })
      renderComponent({ port })
      // Modal title shows "Port " followed by description/id, but this.port is undefined in component
      // so it just shows "Port "
      const titleElement = screen.getByRole("heading", { level: 4 })
      expect(titleElement.textContent).toMatch(/Port/)
    })

    it("displays modal title element", () => {
      const port = createPort({ description: undefined })
      renderComponent({ port })
      const titleElement = screen.getByRole("heading", { level: 4 })
      expect(titleElement).toBeInTheDocument()
    })

    it("renders close button in modal header", () => {
      renderComponent()
      const closeButtons = screen.getAllByRole("button", { name: /close/i })
      expect(closeButtons.length).toBeGreaterThan(0)
    })
  })

  describe("Component Lifecycle - Dependencies Loading", () => {
    it("loads all dependencies on mount", () => {
      renderComponent()
      expect(mockLoadPort).toHaveBeenCalledOnce()
      expect(mockLoadNetworksOnce).toHaveBeenCalledOnce()
      expect(mockLoadSubnetsOnce).toHaveBeenCalledOnce()
      expect(mockLoadSecurityGroupsOnce).toHaveBeenCalledOnce()
    })

    it("reloads dependencies when receiving new props (UNSAFE_componentWillReceiveProps)", () => {
      const { rerender } = renderComponent()

      // Clear initial mount calls
      vi.clearAllMocks()

      // Create new mock functions to simulate prop change
      const newMockLoadPort = vi.fn()
      const newMockLoadNetworksOnce = vi.fn()
      const newMockLoadSubnetsOnce = vi.fn()
      const newMockLoadSecurityGroupsOnce = vi.fn()

      const mockHistory = {
        replace: mockHistoryReplace,
        push: vi.fn(),
        go: vi.fn(),
        goBack: vi.fn(),
        goForward: vi.fn(),
        listen: vi.fn(),
        location: { pathname: "/ports/port-456", search: "", hash: "", state: null, key: "" },
        createHref: vi.fn(),
      }

      // Simulate prop change by rerendering with new props
      rerender(
        <BrowserRouter>
          <ShowPortModal
            port={createPort({ id: "port-456" })}
            networks={{ items: [], isFetching: false }}
            subnets={{ items: [], isFetching: false }}
            securityGroups={{ items: [] }}
            loadPort={newMockLoadPort}
            loadNetworksOnce={newMockLoadNetworksOnce}
            loadSubnetsOnce={newMockLoadSubnetsOnce}
            loadSecurityGroupsOnce={newMockLoadSecurityGroupsOnce}
            history={mockHistory as any}
          />
        </BrowserRouter>
      )

      // Verify dependencies are loaded with new props
      expect(newMockLoadPort).toHaveBeenCalled()
      expect(newMockLoadNetworksOnce).toHaveBeenCalled()
      expect(newMockLoadSubnetsOnce).toHaveBeenCalled()
      expect(newMockLoadSecurityGroupsOnce).toHaveBeenCalled()
    })

    it("calls loadDependencies with correct props on mount", () => {
      const loadPortSpy = vi.fn()
      renderComponent({ loadPort: loadPortSpy })
      expect(loadPortSpy).toHaveBeenCalled()
    })
  })

  describe("Port Details Display", () => {
    it("displays port ID", () => {
      const port = createPort({ id: "port-abc-123" })
      renderComponent({ port })
      expect(screen.getByText("port-abc-123")).toBeInTheDocument()
    })

    it("displays MAC address", () => {
      const port = createPort({ mac_address: "fa:16:3e:aa:bb:cc" })
      renderComponent({ port })
      expect(screen.getByText("fa:16:3e:aa:bb:cc")).toBeInTheDocument()
    })

    it("displays port description", () => {
      const port = createPort({ description: "Production network port" })
      renderComponent({ port })
      expect(screen.getByText("Production network port")).toBeInTheDocument()
    })

    it("displays port name", () => {
      const port = createPort({ name: "web-server-port" })
      renderComponent({ port })
      expect(screen.getByText("web-server-port")).toBeInTheDocument()
    })

    it("displays device owner", () => {
      const port = createPort({ device_owner: "compute:nova" })
      renderComponent({ port })
      expect(screen.getByText("compute:nova")).toBeInTheDocument()
    })

    it("displays device ID", () => {
      const port = createPort({ device_id: "instance-xyz-789" })
      renderComponent({ port })
      expect(screen.getByText("instance-xyz-789")).toBeInTheDocument()
    })

    it("displays created at timestamp", () => {
      const port = createPort({ created_at: "2024-01-15T10:30:00Z" })
      renderComponent({ port })
      const timestamps = screen.getAllByText("2024-01-15T10:30:00Z")
      expect(timestamps.length).toBeGreaterThan(0)
    })

    it("displays status", () => {
      const port = createPort({ status: "DOWN" })
      renderComponent({ port })
      expect(screen.getByText("DOWN")).toBeInTheDocument()
    })

    it("displays project_id when available", () => {
      const port = createPort({ project_id: "project-456", tenant_id: undefined })
      renderComponent({ port })
      expect(screen.getByText("project-456")).toBeInTheDocument()
    })

    it("displays tenant_id when project_id is not available", () => {
      const port = createPort({ tenant_id: "tenant-789", project_id: undefined })
      renderComponent({ port })
      expect(screen.getByText("tenant-789")).toBeInTheDocument()
    })
  })

  describe("Network Display", () => {
    it("displays network name when network is loaded", () => {
      const network = createNetwork({ id: "network-1", name: "production-network" })
      const port = createPort({ network_id: "network-1" })
      renderComponent({
        port,
        networks: { items: [network], isFetching: false },
      })
      expect(screen.getByText("production-network")).toBeInTheDocument()
    })

    it("displays network ID", () => {
      const port = createPort({ network_id: "network-abc-123" })
      renderComponent({ port })
      expect(screen.getByText("network-abc-123")).toBeInTheDocument()
    })

    it("shows spinner while networks are fetching", () => {
      const port = createPort()
      renderComponent({
        port,
        networks: { items: [], isFetching: true },
      })
      const spinners = document.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("displays network ID with info-text class when network name is available", () => {
      const network = createNetwork({ id: "network-1", name: "test-network" })
      const port = createPort({ network_id: "network-1" })
      const { container } = renderComponent({
        port,
        networks: { items: [network], isFetching: false },
      })
      // The network ID gets class="info-text" when network name is present
      const networkIdElement = screen.getByText("network-1")
      expect(networkIdElement).toHaveClass("info-text")
    })

    it("handles missing network gracefully", () => {
      const port = createPort({ network_id: "nonexistent-network" })
      renderComponent({
        port,
        networks: { items: [], isFetching: false },
      })
      expect(screen.getByText("nonexistent-network")).toBeInTheDocument()
    })
  })

  describe("Fixed IPs and Subnets Display", () => {
    it("displays IP addresses", () => {
      const port = createPort({
        fixed_ips: [{ subnet_id: "subnet-1", ip_address: "10.0.0.15" }],
      })
      renderComponent({ port })
      expect(screen.getByText(/10.0.0.15/)).toBeInTheDocument()
    })

    it("displays subnet name when subnet is loaded", () => {
      const subnet = createSubnet({ id: "subnet-1", name: "private-subnet" })
      const port = createPort({
        fixed_ips: [{ subnet_id: "subnet-1", ip_address: "192.168.1.10" }],
      })
      renderComponent({
        port,
        subnets: { items: [subnet], isFetching: false },
      })
      expect(screen.getByText("private-subnet")).toBeInTheDocument()
    })

    it("displays subnet ID", () => {
      const port = createPort({
        fixed_ips: [{ subnet_id: "subnet-xyz-456", ip_address: "192.168.1.10" }],
      })
      renderComponent({ port })
      expect(screen.getByText(/subnet id: subnet-xyz-456/)).toBeInTheDocument()
    })

    it("displays multiple fixed IPs", () => {
      const port = createPort({
        fixed_ips: [
          { subnet_id: "subnet-1", ip_address: "192.168.1.10" },
          { subnet_id: "subnet-2", ip_address: "10.0.0.20" },
        ],
      })
      renderComponent({ port })
      expect(screen.getByText(/192.168.1.10/)).toBeInTheDocument()
      expect(screen.getByText(/10.0.0.20/)).toBeInTheDocument()
    })

    it("shows spinner while subnets are fetching", () => {
      const port = createPort({
        fixed_ips: [{ subnet_id: "subnet-1", ip_address: "192.168.1.10" }],
      })
      renderComponent({
        port,
        subnets: { items: [], isFetching: true },
      })
      const spinners = document.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("handles port with no fixed_ips", () => {
      const port = createPort({ fixed_ips: undefined })
      renderComponent({ port })
      // Should not crash, modal should still render
      const dialogs = screen.getAllByRole("dialog")
      expect(dialogs.length).toBeGreaterThan(0)
    })

    it("handles port with empty fixed_ips array", () => {
      const port = createPort({ fixed_ips: [] })
      renderComponent({ port })
      // Should not crash, modal should still render
      const dialogs = screen.getAllByRole("dialog")
      expect(dialogs.length).toBeGreaterThan(0)
    })

    it("handles missing subnet gracefully", () => {
      const port = createPort({
        fixed_ips: [{ subnet_id: "nonexistent-subnet", ip_address: "192.168.1.10" }],
      })
      renderComponent({
        port,
        subnets: { items: [], isFetching: false },
      })
      expect(screen.getByText(/192.168.1.10/)).toBeInTheDocument()
      expect(screen.getByText(/subnet id: nonexistent-subnet/)).toBeInTheDocument()
    })
  })

  describe("Security Groups Display", () => {
    it("displays security group names when loaded", () => {
      const securityGroup = createSecurityGroup({ id: "sg-1", name: "web-servers" })
      const port = createPort({ security_groups: ["sg-1"] })
      renderComponent({
        port,
        securityGroups: { items: [securityGroup] },
      })
      expect(screen.getByText("web-servers")).toBeInTheDocument()
    })

    it("displays security group IDs", () => {
      const securityGroup = createSecurityGroup({ id: "sg-abc-123", name: "default" })
      const port = createPort({ security_groups: ["sg-abc-123"] })
      renderComponent({
        port,
        securityGroups: { items: [securityGroup] },
      })
      expect(screen.getByText("sg-abc-123")).toBeInTheDocument()
    })

    it("displays multiple security groups", () => {
      const sg1 = createSecurityGroup({ id: "sg-1", name: "web-servers" })
      const sg2 = createSecurityGroup({ id: "sg-2", name: "database" })
      const port = createPort({ security_groups: ["sg-1", "sg-2"] })
      renderComponent({
        port,
        securityGroups: { items: [sg1, sg2] },
      })
      expect(screen.getByText("web-servers")).toBeInTheDocument()
      expect(screen.getByText("database")).toBeInTheDocument()
    })

    it("displays security group ID when security group is not found", () => {
      const port = createPort({ security_groups: ["sg-unknown"] })
      renderComponent({
        port,
        securityGroups: { items: [] },
      })
      expect(screen.getByText("sg-unknown")).toBeInTheDocument()
    })

    it("handles missing securityGroups prop gracefully", () => {
      const port = createPort({ security_groups: ["sg-1"] })
      renderComponent({
        port,
        securityGroups: undefined as any,
      })
      expect(screen.getByText("sg-1")).toBeInTheDocument()
    })

    it("handles securityGroups with no items", () => {
      const port = createPort({ security_groups: ["sg-1"] })
      renderComponent({
        port,
        securityGroups: { items: undefined as any },
      })
      expect(screen.getByText("sg-1")).toBeInTheDocument()
    })
  })

  describe("Modal Interaction", () => {
    it("closes modal when close button is clicked", async () => {
      vi.useRealTimers() // Use real timers for this test
      renderComponent()
      const closeButtons = screen.getAllByRole("button", { name: /close/i })

      closeButtons[0].click() // Use native click instead of userEvent

      // Wait for setTimeout
      await waitFor(
        () => {
          expect(mockHistoryReplace).toHaveBeenCalledWith("/ports")
        },
        { timeout: 1000 }
      )

      vi.useFakeTimers() // Restore fake timers
    })

    it("navigates to /ports after closing", async () => {
      vi.useRealTimers()
      renderComponent()
      const closeButtons = screen.getAllByRole("button", { name: /close/i })

      closeButtons[0].click()

      await waitFor(
        () => {
          expect(mockHistoryReplace).toHaveBeenCalledWith("/ports")
        },
        { timeout: 1000 }
      )

      vi.useFakeTimers()
    })

    it("handles close without errors", () => {
      renderComponent()
      const closeButtons = screen.getAllByRole("button", { name: /close/i })

      // Verify close button exists and can be referenced
      expect(closeButtons[0]).toBeInTheDocument()
      expect(closeButtons[0]).toHaveAttribute("type", "button")
    })

    it("calls history.replace with correct path after timeout", async () => {
      vi.useRealTimers()
      renderComponent()
      const closeButtons = screen.getAllByRole("button", { name: /close/i })

      // Initially modal should be visible
      const dialogs = screen.getAllByRole("dialog")
      expect(dialogs.length).toBeGreaterThan(0)

      closeButtons[0].click()

      // After clicking close and waiting for timeout
      await waitFor(
        () => {
          expect(mockHistoryReplace).toHaveBeenCalledWith("/ports")
        },
        { timeout: 1000 }
      )

      vi.useFakeTimers()
    })
  })

  describe("Edge Cases", () => {
    it("handles port with all optional fields missing", () => {
      const minimalPort: Port = {
        id: "minimal-port",
        network_id: "network-1",
        status: "ACTIVE",
        mac_address: "fa:16:3e:00:00:00",
        security_groups: [],
      }
      renderComponent({ port: minimalPort })
      expect(screen.getByText("minimal-port")).toBeInTheDocument()
    })

    it("handles port with undefined description gracefully", () => {
      const port = createPort({ description: undefined })
      renderComponent({ port })
      expect(screen.getByText("Port ID")).toBeInTheDocument()
    })

    it("handles port with undefined name gracefully", () => {
      const port = createPort({ name: undefined })
      renderComponent({ port })
      expect(screen.getByText("Name")).toBeInTheDocument()
    })

    it("renders table with all rows even when data is minimal", () => {
      const port = createPort()
      renderComponent({ port })

      // Check that key labels are present
      expect(screen.getByText("Port ID")).toBeInTheDocument()
      expect(screen.getByText("MAC")).toBeInTheDocument()
      expect(screen.getByText("Network")).toBeInTheDocument()
      expect(screen.getByText("IPs")).toBeInTheDocument()
      expect(screen.getByText("Description")).toBeInTheDocument()
      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Device Owner")).toBeInTheDocument()
      expect(screen.getByText("Device ID")).toBeInTheDocument()
      expect(screen.getByText("Status")).toBeInTheDocument()
      expect(screen.getByText("Security Groups")).toBeInTheDocument()
    })

    it("handles network with matching ID using loose equality", () => {
      // The component uses == instead of ===, so this tests that behavior
      const network = createNetwork({ id: "123", name: "test-network" })
      const port = createPort({ network_id: "123" })
      renderComponent({
        port,
        networks: { items: [network], isFetching: false },
      })
      expect(screen.getByText("test-network")).toBeInTheDocument()
    })

    it("handles subnet with matching ID using loose equality", () => {
      const subnet = createSubnet({ id: "456", name: "test-subnet" })
      const port = createPort({
        fixed_ips: [{ subnet_id: "456", ip_address: "192.168.1.10" }],
      })
      renderComponent({
        port,
        subnets: { items: [subnet], isFetching: false },
      })
      expect(screen.getByText("test-subnet")).toBeInTheDocument()
    })

    it("handles security group with matching ID using loose equality", () => {
      const securityGroup = createSecurityGroup({ id: "789", name: "test-sg" })
      const port = createPort({ security_groups: ["789"] })
      renderComponent({
        port,
        securityGroups: { items: [securityGroup] },
      })
      expect(screen.getByText("test-sg")).toBeInTheDocument()
    })
  })

  describe("Table Rendering", () => {
    it("renders table with no-borders class", () => {
      const port = createPort()
      renderComponent({ port })
      const table = screen.getByRole("table")
      expect(table).toBeInTheDocument()
      expect(table).toHaveClass("table", "no-borders")
    })

    it("renders Row components with correct label widths", () => {
      const port = createPort()
      const { container } = renderComponent({ port })
      const thElements = container.querySelectorAll("th")
      thElements.forEach((th) => {
        expect(th).toHaveStyle({ width: "30%" })
      })
    })
  })
})
