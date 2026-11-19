import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { SecurityGroupsTab } from "./SecurityGroupsTab"
import { VolumesTab } from "./VolumesTab"
import { KeyPairsTab } from "./KeyPairsTab"
import { SpecsTab } from "./SpecsTab"
import { MetadataTab } from "./MetadataTab"
import { InformationTab } from "./InformationTab"
import type { InstanceDetail, InstanceMetrics } from "../../../../types/instance"
import type { UseQueryResult } from "@tanstack/react-query"

// Minimal metrics query stub — InformationTab only forwards it to GuestToolsRow
// and SizingRows, which render their own empty states for undefined data.
const metricsQuery = { data: undefined, isLoading: false, isError: false } as unknown as UseQueryResult<
  InstanceMetrics,
  Error
>

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
      <SpecsTab specs={{ flavor: "m1.small", ram: 2048, vcpus: 2, root_disk_size: 50, root_disk_device: "/dev/vda" }} />
    )
    expect(screen.getByText("m1.small")).toBeInTheDocument()
    expect(screen.getByText("2048MB")).toBeInTheDocument()
    expect(screen.getByText("2 VCPU")).toBeInTheDocument()
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
