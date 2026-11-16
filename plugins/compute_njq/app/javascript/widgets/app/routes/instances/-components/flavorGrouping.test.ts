import { describe, it, expect } from "vitest"
import { groupFlavors, flavorLabel } from "./flavorGrouping"
import { Flavor } from "../../../types/formOptions"

function flavor(overrides: Partial<Flavor> & Pick<Flavor, "id">): Flavor {
  return {
    name: overrides.id,
    vcpus: 1,
    ram: 1024,
    disk: 10,
    hypervisor_type: "kvm",
    is_public: true,
    ...overrides,
  }
}

describe("groupFlavors", () => {
  it("orders public before private and subgroups baremetal → kvm → vmware", () => {
    const flavors = [
      flavor({ id: "priv-kvm", is_public: false, hypervisor_type: "kvm" }),
      flavor({ id: "pub-vmware", is_public: true, hypervisor_type: "vmware" }),
      flavor({ id: "pub-baremetal", is_public: true, hypervisor_type: "baremetal" }),
      flavor({ id: "pub-kvm", is_public: true, hypervisor_type: "kvm" }),
    ]
    const labels = groupFlavors(flavors).map((g) => g.label)
    expect(labels).toEqual(["public", "--bare metal", "--kvm", "--vmware", "private", "--kvm"])
  })

  it("sorts within a subgroup ascending by [ram, vcpus]", () => {
    const flavors = [
      flavor({ id: "big", ram: 4096, vcpus: 4 }),
      flavor({ id: "small", ram: 1024, vcpus: 1 }),
      flavor({ id: "same-ram-more-cpu", ram: 1024, vcpus: 2 }),
    ]
    const kvm = groupFlavors(flavors).find((g) => g.label === "--kvm")!
    expect(kvm.options.map((f) => f.id)).toEqual(["small", "same-ram-more-cpu", "big"])
  })

  it("omits empty levels and subgroups", () => {
    const flavors = [flavor({ id: "only", is_public: true, hypervisor_type: "kvm" })]
    expect(groupFlavors(flavors).map((g) => g.label)).toEqual(["public", "--kvm"])
  })

  it("keeps flavors with unknown/absent hypervisor_type in a trailing --other group", () => {
    const flavors = [
      flavor({ id: "known", hypervisor_type: "kvm" }),
      flavor({ id: "null-hv", hypervisor_type: null }),
      flavor({ id: "weird", hypervisor_type: "xen" }),
    ]
    const groups = groupFlavors(flavors)
    const other = groups.find((g) => g.label === "--other")!
    expect(other.options.map((f) => f.id).sort()).toEqual(["null-hv", "weird"])
    // --other comes after the known subgroups within the level
    expect(groups.map((g) => g.label)).toEqual(["public", "--kvm", "--other"])
  })
})

describe("flavorLabel", () => {
  it("formats name with RAM (GB when whole), VCPUs and disk", () => {
    expect(flavorLabel(flavor({ id: "m1.small", name: "m1.small", ram: 2048, vcpus: 1, disk: 20 }))).toBe(
      "m1.small (RAM: 2 GB, VCPUs: 1, Disk: 20 GB)"
    )
  })

  it("keeps RAM in MB when not a whole number of GB", () => {
    expect(flavorLabel(flavor({ id: "x", name: "x", ram: 1536, vcpus: 2, disk: 5 }))).toBe(
      "x (RAM: 1536 MB, VCPUs: 2, Disk: 5 GB)"
    )
  })

  it("renders n/a for null numeric fields", () => {
    expect(flavorLabel(flavor({ id: "y", name: "y", ram: null, vcpus: null, disk: null }))).toBe(
      "y (RAM: n/a, VCPUs: n/a, Disk: n/a)"
    )
  })
})
