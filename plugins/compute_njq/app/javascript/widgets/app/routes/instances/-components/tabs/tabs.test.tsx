import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { SecurityGroupsTab } from "./SecurityGroupsTab"
import { VolumesTab } from "./VolumesTab"
import { KeyPairsTab } from "./KeyPairsTab"
import { SpecsTab } from "./SpecsTab"
import { MetadataTab } from "./MetadataTab"
import { InformationTab } from "./InformationTab"
import { IpAddressesTab } from "./IpAddressesTab"
import type { InstanceDetail, InstanceMetrics } from "../../../../types/instance"
import type { UseQueryResult } from "@tanstack/react-query"

// Minimal metrics query stub — InformationTab only forwards it to GuestToolsRow
// and SizingRows, which render their own empty states for undefined data.
const metricsQuery = { data: undefined, isLoading: false, isError: false } as unknown as UseQueryResult<
  InstanceMetrics,
  Error
>

function specs(hypervisor_type: string | null): InstanceDetail["specs"] {
  return {
    flavor: "m1.small",
    ram: 2048,
    vcpus: 2,
    root_disk_size: 50,
    root_disk_device: "/dev/vda",
    hypervisor_type,
  }
}

function detail(over: Partial<InstanceDetail> = {}): InstanceDetail {
  return {
    id: "s1",
    name: "web-01",
    locked: false,
    status: { state: "active", transition: null, power_state: "Running" },
    fault_message: null,
    availability_zone: "qa-de-1a",
    created: null,
    updated: null,
    host: null,
    project: { id: "p1", name: "demo", same_scope: true },
    tags: [],
    ...over,
  } as InstanceDetail
}

describe("InformationTab", () => {
  it("shows the lock state as a Locked row", () => {
    const { rerender } = render(<InformationTab instance={detail({ locked: true })} metricsQuery={metricsQuery} />)
    const lockedRow = screen.getByText("Locked").closest("tr")!
    expect(lockedRow).toHaveTextContent("Yes")

    rerender(<InformationTab instance={detail({ locked: false })} metricsQuery={metricsQuery} />)
    expect(screen.getByText("Locked").closest("tr")!).toHaveTextContent("No")
  })

  it("shows the power state in its own row under the status", () => {
    render(<InformationTab instance={detail()} metricsQuery={metricsQuery} />)
    const powerRow = screen.getByText("Power State").closest("tr")!
    expect(powerRow).toHaveTextContent("Running")
    // The Power State row sits directly after the Status row.
    const statusRow = screen.getByText("Status").closest("tr")!
    expect(statusRow.nextElementSibling).toBe(powerRow)
  })

  it("omits the power state row when Nova reports none", () => {
    render(
      <InformationTab
        instance={detail({ status: { state: "active", transition: null, power_state: null } })}
        metricsQuery={metricsQuery}
      />
    )
    expect(screen.queryByText("Power State")).toBeNull()
  })

  it("shows the VMware Guest Tools row only on a VMware instance", () => {
    render(<InformationTab instance={detail({ specs: specs("vmware") })} metricsQuery={metricsQuery} />)
    expect(screen.getByText("VMware Guest Tools")).toBeInTheDocument()
  })

  it("hides the VMware Guest Tools row on a non-VMware flavor", () => {
    render(<InformationTab instance={detail({ specs: specs("kvm") })} metricsQuery={metricsQuery} />)
    expect(screen.queryByText("VMware Guest Tools")).not.toBeInTheDocument()
  })

  it("hides the VMware Guest Tools row when the hypervisor type is unknown", () => {
    // Unknown (null) covers both an unmappable flavor and placeholder detail
    // still loading — neither is known to be VMware, so the row stays hidden.
    render(<InformationTab instance={detail({ specs: specs(null) })} metricsQuery={metricsQuery} />)
    expect(screen.queryByText("VMware Guest Tools")).not.toBeInTheDocument()
  })
})

describe("SecurityGroupsTab", () => {
  it("renders the BFF-assembled rule strings", () => {
    render(
      <SecurityGroupsTab
        securityGroups={[
          { id: "sg1", name: "default", project_name: "Demo", rules: ["ALLOW IPv4 tcp 22 from 0.0.0.0/0"] },
        ]}
      />
    )
    expect(screen.getByText("ALLOW IPv4 tcp 22 from 0.0.0.0/0")).toBeInTheDocument()
    expect(screen.getByText(/Project: Demo/)).toBeInTheDocument()
  })

  it("shows 'No rules defined.' for an empty rule set", () => {
    render(<SecurityGroupsTab securityGroups={[{ id: "sg1", name: "empty", project_name: null, rules: [] }]} />)
    expect(screen.getByText("No rules defined.")).toBeInTheDocument()
  })
})

describe("VolumesTab", () => {
  it("shows the empty state when no volumes are attached", () => {
    render(<VolumesTab volumes={[]} />)
    expect(screen.getByText("No volumes attached.")).toBeInTheDocument()
  })

  it("renders attached volumes", () => {
    render(<VolumesTab volumes={[{ id: "v1", name: "root-vol", device: "/dev/vda", size: 50 }]} />)
    expect(screen.getByText("root-vol")).toBeInTheDocument()
    expect(screen.getByText("/dev/vda")).toBeInTheDocument()
    expect(screen.getByText("50 GB")).toBeInTheDocument()
  })
})

describe("KeyPairsTab", () => {
  it("falls back to 'No keypair' when none is set", () => {
    render(<KeyPairsTab keyName={null} />)
    expect(screen.getByText("No keypair")).toBeInTheDocument()
  })
})

describe("SpecsTab", () => {
  it("renders 'No instance specifications' when specs are null", () => {
    render(<SpecsTab specs={null} />)
    expect(screen.getByText("No instance specifications")).toBeInTheDocument()
  })

  it("renders flavor, ram, vcpus and root disk", () => {
    render(
      <SpecsTab
        specs={{
          flavor: "m1.small",
          ram: 2048,
          vcpus: 2,
          root_disk_size: 50,
          root_disk_device: "/dev/vda",
          hypervisor_type: "kvm",
        }}
      />
    )
    expect(screen.getByText("m1.small")).toBeInTheDocument()
    expect(screen.getByText("2048MB")).toBeInTheDocument()
    expect(screen.getByText("2 VCPU")).toBeInTheDocument()
    expect(screen.getByText("kvm")).toBeInTheDocument()
  })

  it("shows 'unknown' when the hypervisor type is not known", () => {
    render(
      <SpecsTab
        specs={{
          flavor: "m1.small",
          ram: 2048,
          vcpus: 2,
          root_disk_size: 50,
          root_disk_device: "/dev/vda",
          hypervisor_type: null,
        }}
      />
    )
    expect(screen.getByText("unknown")).toBeInTheDocument()
  })

  it("shows a loading spinner (not 'unknown') while the detail is still loading", () => {
    // Placeholder detail (from the list row) has no hypervisor type yet; showing
    // "unknown" would be misleading — it must read as loading until the real
    // value arrives, like RAM/VCPUs/Root Disk.
    const { container } = render(
      <SpecsTab
        specs={{
          flavor: "m1.small",
          ram: null,
          vcpus: null,
          root_disk_size: null,
          root_disk_device: null,
          hypervisor_type: null,
        }}
        loading
      />
    )
    expect(screen.queryByText("unknown")).not.toBeInTheDocument()
    // The Hypervisor row shows the shared loading indicator instead.
    expect(container.querySelectorAll(".spinner").length).toBeGreaterThan(0)
  })
})

describe("MetadataTab", () => {
  it("humanizes extra metadata keys and dashes a missing image name", () => {
    render(
      <MetadataTab metadata={{ image_name: null, image_id: null, extra: [{ key: "owner_team", value: "team-a" }] }} />
    )
    expect(screen.getByText("-")).toBeInTheDocument()
    expect(screen.getByText("Owner team")).toBeInTheDocument()
    expect(screen.getByText("team-a")).toBeInTheDocument()
  })
})

describe("IpAddressesTab", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it("labels the fixed IP, its MAC and the paired floating IP", () => {
    render(
      <IpAddressesTab
        networks={[
          {
            network_name: "private",
            ips: [{ fixed: { addr: "10.0.0.1", mac: "fa:16:3e:aa:bb:cc" }, floating: { addr: "1.2.3.4" } }],
          },
        ]}
      />
    )
    expect(screen.getByText("private")).toBeInTheDocument()
    expect(screen.getByText("Fixed")).toBeInTheDocument()
    expect(screen.getByText("Floating")).toBeInTheDocument()
    expect(screen.getByText("10.0.0.1")).toBeInTheDocument()
    expect(screen.getByText("1.2.3.4")).toBeInTheDocument()
    expect(screen.getByText("fa:16:3e:aa:bb:cc")).toBeInTheDocument()
  })

  it("omits the floating line and MAC when absent", () => {
    render(
      <IpAddressesTab
        networks={[{ network_name: "private", ips: [{ fixed: { addr: "10.0.0.2", mac: null }, floating: null }] }]}
      />
    )
    expect(screen.getByText("Fixed")).toBeInTheDocument()
    expect(screen.queryByText("Floating")).not.toBeInTheDocument()
    expect(screen.queryByText(/MAC/)).not.toBeInTheDocument()
  })

  it("copies an IP address to the clipboard", () => {
    render(
      <IpAddressesTab
        networks={[{ network_name: "private", ips: [{ fixed: { addr: "10.0.0.3", mac: null }, floating: null }] }]}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Copy IP address" }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("10.0.0.3")
  })
})
