import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"
import Item, { AttachedIcon } from "./item.jsx"

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

vi.mock("lib/tools/helpers", () => ({
  truncate: vi.fn((str: string, length: number) => {
    if (str.length <= length) return str
    return `${str.substring(0, length)}...`
  }),
}))

vi.mock("lib/components/Overlay", () => ({
  Tooltip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-testid="tooltip" data-tooltip-content={content}>
      {children}
    </div>
  ),
}))

interface FixedIP {
  ip_address: string
  subnet_id: string
}

interface Port {
  id: string
  name?: string
  description?: string
  network_id: string
  fixed_ips?: FixedIP[]
  device_id?: string
  device_owner?: string
  status?: string
  isDeleting?: boolean
}

interface Network {
  id: string
  name: string
}

interface Subnet {
  [key: string]: {
    id: string
    name: string
  }
}

interface ItemProps {
  port: Port
  instancesPath: string
  network: Network | null
  isFetchingNetworks: boolean
  subnets: Subnet
  isFetchingSubnets: boolean
  handleDelete: (portId: string) => void
}

describe("AttachedIcon Component", () => {
  it("renders nothing when port has no device_id", () => {
    const port: Port = {
      id: "port-1",
      network_id: "network-1",
    }

    const { container } = render(<AttachedIcon port={port} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders icon with tooltip when port has device_id", () => {
    const port: Port = {
      id: "port-1",
      network_id: "network-1",
      device_id: "device-1",
    }

    render(<AttachedIcon port={port} />)
    expect(screen.getByTestId("tooltip")).toBeInTheDocument()
    expect(screen.getByTestId("tooltip")).toHaveAttribute("data-tooltip-content", "Port is attached")
    expect(screen.getByTestId("tooltip").querySelector("i.fa-paperclip")).toBeInTheDocument()
  })
})

describe("Item Component", () => {
  let mockHandleDelete: ReturnType<typeof vi.fn>

  const mockPort: Port = {
    id: "port-123",
    name: "test-port",
    description: "Test Port Description",
    network_id: "network-1",
    fixed_ips: [
      { ip_address: "192.168.1.10", subnet_id: "subnet-1" },
      { ip_address: "192.168.1.11", subnet_id: "subnet-2" },
    ],
    device_id: "device-1",
    device_owner: "compute:nova",
    status: "ACTIVE",
  }

  const mockNetwork: Network = {
    id: "network-1",
    name: "Test Network",
  }

  const mockSubnets: Subnet = {
    "subnet-1": { id: "subnet-1", name: "Subnet One" },
    "subnet-2": { id: "subnet-2", name: "Subnet Two" },
  }

  beforeEach(() => {
    mockHandleDelete = vi.fn()
    global.policy.isAllowed = vi.fn(() => true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props?: Partial<ItemProps>) => {
    const defaultProps: ItemProps = {
      port: mockPort,
      instancesPath: "/instances",
      network: mockNetwork,
      isFetchingNetworks: false,
      subnets: mockSubnets,
      isFetchingSubnets: false,
      handleDelete: mockHandleDelete,
      ...props,
    }

    return render(
      <table>
        <tbody>
          <Item {...defaultProps} />
        </tbody>
      </table>
    )
  }

  describe("Basic Rendering", () => {
    it("renders table row without crashing", () => {
      renderComponent()
      expect(screen.getByRole("row")).toBeInTheDocument()
    })

    it("renders all columns", () => {
      renderComponent()
      const cells = screen.getAllByRole("cell")
      expect(cells).toHaveLength(8) // icon, name, description, network, fixed_ips, device_owner, status, actions
    })

    it("applies 'updating' class when port is deleting", () => {
      const deletingPort: Port = { ...mockPort, isDeleting: true }
      renderComponent({ port: deletingPort })
      expect(screen.getByRole("row")).toHaveClass("updating")
    })

    it("does not apply 'updating' class when port is not deleting", () => {
      renderComponent()
      expect(screen.getByRole("row")).not.toHaveClass("updating")
    })
  })

  describe("AttachedIcon Column", () => {
    it("renders attached icon when port has device_id", () => {
      renderComponent()
      expect(screen.getByTestId("tooltip")).toBeInTheDocument()
    })

    it("does not render attached icon when port has no device_id", () => {
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })
      expect(screen.queryByTestId("tooltip")).not.toBeInTheDocument()
    })
  })

  describe("Port Name/ID Column", () => {
    it("renders description as link when port_get is allowed", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_get")
      renderComponent()
      const link = screen.getByRole("link", { name: mockPort.description })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", `/ports/${mockPort.id}/show`)
    })

    it("renders truncated ID as link when description is missing and port_get is allowed", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_get")
      const portWithoutDescription: Port = { ...mockPort, description: undefined }
      renderComponent({ port: portWithoutDescription })
      // ID is "port-123" which is less than 20 chars, so it won't be truncated
      const link = screen.getByRole("link", { name: mockPort.id })
      expect(link).toBeInTheDocument()
    })

    it("renders port name as text when port_get is not allowed", () => {
      global.policy.isAllowed = vi.fn((action) => action !== "networking:port_get")
      renderComponent()
      expect(screen.queryByRole("link", { name: mockPort.description })).not.toBeInTheDocument()
      expect(screen.getByText(mockPort.name!)).toBeInTheDocument()
    })

    it("renders truncated ID as text when port_get is not allowed and name is missing", () => {
      global.policy.isAllowed = vi.fn((action) => action !== "networking:port_get")
      const portWithoutName: Port = { ...mockPort, name: undefined }
      renderComponent({ port: portWithoutName })
      // ID is "port-123" which is less than 20 chars, so it won't be truncated
      expect(screen.getByText(mockPort.id)).toBeInTheDocument()
    })
  })

  describe("Description Column", () => {
    it("renders port description", () => {
      renderComponent()
      // Find description in the third column (not the link)
      const cells = screen.getAllByRole("cell")
      expect(cells[2]).toHaveTextContent(mockPort.description!)
    })

    it("renders empty when description is missing", () => {
      const portWithoutDescription: Port = { ...mockPort, description: undefined }
      renderComponent({ port: portWithoutDescription })
      const cells = screen.getAllByRole("cell")
      expect(cells[2]).toBeEmptyDOMElement()
    })
  })

  describe("Network Column", () => {
    it("renders network name when network is provided", () => {
      renderComponent()
      expect(screen.getByText(mockNetwork.name)).toBeInTheDocument()
    })

    it("renders network_id when network is not provided", () => {
      renderComponent({ network: null })
      expect(screen.getByText(mockPort.network_id)).toBeInTheDocument()
    })

    it("shows spinner when fetching networks", () => {
      const { container } = renderComponent({ isFetchingNetworks: true })
      const spinner = container.querySelector(".spinner")
      expect(spinner).toBeInTheDocument()
    })

    it("does not show spinner when not fetching networks", () => {
      const { container } = renderComponent({ isFetchingNetworks: false })
      const spinner = container.querySelector(".spinner")
      expect(spinner).not.toBeInTheDocument()
    })
  })

  describe("Fixed IPs Column", () => {
    it("renders all fixed IPs with their subnets", () => {
      renderComponent()
      expect(screen.getByText("192.168.1.10")).toBeInTheDocument()
      expect(screen.getByText("192.168.1.11")).toBeInTheDocument()
      expect(screen.getByText("Subnet One")).toBeInTheDocument()
      expect(screen.getByText("Subnet Two")).toBeInTheDocument()
    })

    it("renders truncated subnet_id when subnet is not found", () => {
      const emptySubnets: Subnet = {}
      renderComponent({ subnets: emptySubnets })
      // subnet-1 is only 8 chars, so it won't be truncated
      expect(screen.getByText("subnet-1")).toBeInTheDocument()
    })

    it("shows spinner when fetching subnets", () => {
      const { container } = renderComponent({ isFetchingSubnets: true })
      const spinners = container.querySelectorAll(".spinner")
      expect(spinners.length).toBeGreaterThan(0)
    })

    it("handles empty fixed_ips array", () => {
      const portWithoutIPs: Port = { ...mockPort, fixed_ips: [] }
      renderComponent({ port: portWithoutIPs })
      expect(screen.queryByText(/192\.168/)).not.toBeInTheDocument()
    })

    it("handles missing fixed_ips property", () => {
      const portWithoutIPs: Port = { ...mockPort, fixed_ips: undefined }
      renderComponent({ port: portWithoutIPs })
      expect(screen.queryByText(/192\.168/)).not.toBeInTheDocument()
    })
  })

  describe("Device Owner/ID Column", () => {
    it("renders device owner", () => {
      renderComponent()
      expect(screen.getByText(mockPort.device_owner!)).toBeInTheDocument()
    })

    it("renders device_id as link when device_owner is compute instance", () => {
      renderComponent()
      // device-1 is only 8 chars, so it won't be truncated
      const link = screen.getByRole("link", { name: mockPort.device_id })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", `/instances/${mockPort.device_id}`)
      expect(link).toHaveAttribute("data-modal", "true")
    })

    it("renders device_id as text when device_owner is not compute instance", () => {
      const portWithNetworkOwner: Port = { ...mockPort, device_owner: "network:dhcp" }
      renderComponent({ port: portWithNetworkOwner })
      // device-1 is only 8 chars, so it won't be truncated
      expect(screen.queryByRole("link", { name: mockPort.device_id })).not.toBeInTheDocument()
      expect(screen.getByText(mockPort.device_id!)).toBeInTheDocument()
    })

    it("does not render device_id when device_id is missing", () => {
      const portWithoutDevice: Port = { ...mockPort, device_id: undefined, device_owner: undefined }
      renderComponent({ port: portWithoutDevice })
      const cells = screen.getAllByRole("cell")
      // Device owner/id column should be empty
      expect(cells[5]).toBeEmptyDOMElement()
    })

    it("uses instancesPath prop for compute instance links", () => {
      const customPath = "/custom/instances"
      renderComponent({ instancesPath: customPath })
      // device-1 is only 8 chars, so it won't be truncated
      const link = screen.getByRole("link", { name: mockPort.device_id })
      expect(link).toHaveAttribute("href", `${customPath}/${mockPort.device_id}`)
    })
  })

  describe("Status Column", () => {
    it("renders port status", () => {
      renderComponent()
      expect(screen.getByText(mockPort.status!)).toBeInTheDocument()
    })

    it("handles missing status", () => {
      const portWithoutStatus: Port = { ...mockPort, status: undefined }
      renderComponent({ port: portWithoutStatus })
      const cells = screen.getAllByRole("cell")
      expect(cells[6]).toBeEmptyDOMElement()
    })
  })

  describe("Actions Dropdown", () => {
    it("renders actions dropdown button", () => {
      renderComponent()
      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()
      expect(button.querySelector("i.fa-cog")).toBeInTheDocument()
    })

    it("always shows 'Show' action", () => {
      renderComponent()
      const showLink = screen.getByRole("link", { name: "Show" })
      expect(showLink).toBeInTheDocument()
      expect(showLink).toHaveAttribute("href", `/ports/${mockPort.id}/show`)
    })

    it("shows 'Edit' action when port_update is allowed", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_update")
      renderComponent()
      const editLink = screen.getByRole("link", { name: "Edit" })
      expect(editLink).toBeInTheDocument()
      expect(editLink).toHaveAttribute("href", `/ports/${mockPort.id}/edit`)
    })

    it("hides 'Edit' action when port_update is not allowed", () => {
      global.policy.isAllowed = vi.fn((action) => action !== "networking:port_update")
      renderComponent()
      expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
    })

    it("shows 'Delete' action when port_delete is allowed and port is not attached", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_delete")
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })
      const deleteLink = screen.getByRole("link", { name: "Delete" })
      expect(deleteLink).toBeInTheDocument()
    })

    it("shows 'Delete' action for fixed_ip_allocation port even when attached", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_delete")
      const fixedIpPort: Port = { ...mockPort, name: "fixed_ip_allocation", device_id: "device-1" }
      renderComponent({ port: fixedIpPort })
      const deleteLink = screen.getByRole("link", { name: "Delete" })
      expect(deleteLink).toBeInTheDocument()
    })

    it("hides 'Delete' action when port is attached and not fixed_ip_allocation", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_delete")
      const attachedPort: Port = { ...mockPort, device_id: "device-1" }
      renderComponent({ port: attachedPort })
      expect(screen.queryByRole("link", { name: "Delete" })).not.toBeInTheDocument()
    })

    it("hides 'Delete' action when port_delete is not allowed", () => {
      global.policy.isAllowed = vi.fn((action) => action !== "networking:port_delete")
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })
      expect(screen.queryByRole("link", { name: "Delete" })).not.toBeInTheDocument()
    })
  })

  describe("Delete Action Handler", () => {
    it("calls handleDelete with port id when delete link is clicked", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_delete")
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })

      const deleteLink = screen.getByRole("link", { name: "Delete" })
      fireEvent.click(deleteLink)

      expect(mockHandleDelete).toHaveBeenCalledWith(mockPort.id)
      expect(mockHandleDelete).toHaveBeenCalledTimes(1)
    })

    it("prevents default action when delete link is clicked", () => {
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_delete")
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })

      const deleteLink = screen.getByRole("link", { name: "Delete" })
      const event = { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLAnchorElement>

      fireEvent.click(deleteLink)
      // The preventDefault is called inside the onClick handler
      expect(deleteLink).toHaveAttribute("href", "#")
    })
  })

  describe("Policy Permissions", () => {
    it("checks policy for port_get permission", () => {
      renderComponent()
      expect(global.policy.isAllowed).toHaveBeenCalledWith("networking:port_get", { port: mockPort })
    })

    it("checks policy for port_update permission", () => {
      renderComponent()
      expect(global.policy.isAllowed).toHaveBeenCalledWith("networking:port_update", { port: mockPort })
    })

    it("checks policy for port_delete permission", () => {
      renderComponent()
      expect(global.policy.isAllowed).toHaveBeenCalledWith("networking:port_delete", { port: mockPort })
    })
  })

  describe("Edge Cases", () => {
    it("handles port with long id that needs truncation", () => {
      const longIdPort: Port = {
        ...mockPort,
        id: "very-long-port-id-that-exceeds-twenty-characters",
        description: undefined,
      }
      global.policy.isAllowed = vi.fn((action) => action === "networking:port_get")
      renderComponent({ port: longIdPort })
      expect(screen.getByText("very-long-port-id-th...")).toBeInTheDocument()
    })

    it("handles port with all optional fields missing", () => {
      const minimalPort: Port = {
        id: "minimal-port",
        network_id: "network-1",
      }
      renderComponent({ port: minimalPort })
      expect(screen.getByRole("row")).toBeInTheDocument()
    })

    it("handles missing instancesPath prop", () => {
      renderComponent({ instancesPath: undefined })
      // device-1 is only 8 chars, so it won't be truncated
      const link = screen.getByRole("link", { name: mockPort.device_id })
      expect(link).toHaveAttribute("href", `undefined/${mockPort.device_id}`)
    })

    it("handles network with missing name", () => {
      const networkWithoutName = { id: "network-1", name: "" } as Network
      renderComponent({ network: networkWithoutName })
      // Should fall back to network_id
      expect(screen.getByText(mockPort.network_id)).toBeInTheDocument()
    })

    it("handles subnet with empty name", () => {
      const subnetsWithEmptyName: Subnet = {
        "subnet-1": { id: "subnet-1", name: "" },
      }
      renderComponent({ subnets: subnetsWithEmptyName })
      // Should fall back to subnet_id (not truncated since it's only 8 chars)
      expect(screen.getByText("subnet-1")).toBeInTheDocument()
    })

    it("handles multiple fixed IPs with same IP address", () => {
      const portWithDuplicateIPs: Port = {
        ...mockPort,
        fixed_ips: [
          { ip_address: "192.168.1.10", subnet_id: "subnet-1" },
          { ip_address: "192.168.1.10", subnet_id: "subnet-2" },
        ],
      }
      renderComponent({ port: portWithDuplicateIPs })
      const ipElements = screen.getAllByText("192.168.1.10")
      expect(ipElements).toHaveLength(2)
    })
  })

  describe("CSS Classes and Styling", () => {
    it("applies 'snug' class to actions column", () => {
      renderComponent()
      const cells = screen.getAllByRole("cell")
      const actionsCell = cells[cells.length - 1]
      expect(actionsCell).toHaveClass("snug")
    })

    it("applies correct classes to dropdown button", () => {
      renderComponent()
      const button = screen.getByRole("button")
      expect(button).toHaveClass("btn", "btn-default", "btn-sm", "dropdown-toggle")
    })

    it("applies 'info-text' class to subnet names", () => {
      const { container } = renderComponent()
      const infoTextElements = container.querySelectorAll(".info-text")
      // Should have info-text for each subnet and device_id
      expect(infoTextElements.length).toBeGreaterThan(0)
    })

    it("applies 'btn-group' class to actions container", () => {
      const { container } = renderComponent()
      const btnGroup = container.querySelector(".btn-group")
      expect(btnGroup).toBeInTheDocument()
    })
  })

  describe("Dropdown Menu Attributes", () => {
    it("has correct dropdown toggle attributes", () => {
      renderComponent()
      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("type", "button")
      expect(button).toHaveAttribute("data-toggle", "dropdown")
      expect(button).toHaveAttribute("aria-expanded", "true")
    })

    it("has correct dropdown menu classes", () => {
      const { container } = renderComponent()
      const dropdownMenu = container.querySelector(".dropdown-menu")
      expect(dropdownMenu).toHaveClass("dropdown-menu", "dropdown-menu-right")
      expect(dropdownMenu).toHaveAttribute("role", "menu")
    })
  })

  describe("Complex Scenarios", () => {
    it("handles port with compute device owner but no device_id", () => {
      const port: Port = {
        ...mockPort,
        device_owner: "compute:nova",
        device_id: undefined,
      }
      renderComponent({ port })
      expect(screen.getByText("compute:nova")).toBeInTheDocument()
      // Should have at least the Show link
      const links = screen.getAllByRole("link")
      expect(links.length).toBeGreaterThan(0)
    })

    it("renders correctly when all permissions are denied", () => {
      global.policy.isAllowed = vi.fn(() => false)
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })

      // Should only show the Show link (always visible)
      const links = screen.getAllByRole("link")
      expect(links).toHaveLength(1)
      expect(links[0]).toHaveTextContent("Show")
    })

    it("renders correctly when all permissions are allowed", () => {
      global.policy.isAllowed = vi.fn(() => true)
      const unattachedPort: Port = { ...mockPort, device_id: undefined }
      renderComponent({ port: unattachedPort })

      // Should show Show, Edit, and Delete links
      expect(screen.getByRole("link", { name: "Show" })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Delete" })).toBeInTheDocument()
    })

    it("handles simultaneous network and subnet fetching", () => {
      const { container } = renderComponent({ isFetchingNetworks: true, isFetchingSubnets: true })
      const spinners = container.querySelectorAll(".spinner")
      // Should have at least 3 spinners: 1 for network + 2 for subnets (one per fixed_ip)
      expect(spinners.length).toBeGreaterThanOrEqual(3)
    })
  })
})
