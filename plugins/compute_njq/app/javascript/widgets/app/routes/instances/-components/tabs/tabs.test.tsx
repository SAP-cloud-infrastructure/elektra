import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { SecurityGroupsTab } from "./SecurityGroupsTab"
import { VolumesTab } from "./VolumesTab"
import { KeyPairsTab } from "./KeyPairsTab"
import { SpecsTab } from "./SpecsTab"
import { MetadataTab } from "./MetadataTab"

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
