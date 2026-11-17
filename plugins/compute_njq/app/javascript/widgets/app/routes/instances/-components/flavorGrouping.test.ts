import { describe, it, expect } from "vitest"
import { groupFlavorsByAccess, flavorLabel, flavorSize, flavorSizeFacets } from "./flavorGrouping"
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

describe("groupFlavorsByAccess", () => {
  it("orders public before private", () => {
    const flavors = [flavor({ id: "priv", is_public: false }), flavor({ id: "pub", is_public: true })]
    const groups = groupFlavorsByAccess(flavors)
    expect(groups.map((g) => g.label)).toEqual(["public", "private"])
    expect(groups[0].options.map((f) => f.id)).toEqual(["pub"])
    expect(groups[1].options.map((f) => f.id)).toEqual(["priv"])
  })

  it("sorts within a level ascending by [ram, vcpus]", () => {
    const flavors = [
      flavor({ id: "big", ram: 4096, vcpus: 4 }),
      flavor({ id: "small", ram: 1024, vcpus: 1 }),
      flavor({ id: "same-ram-more-cpu", ram: 1024, vcpus: 2 }),
    ]
    const pub = groupFlavorsByAccess(flavors).find((g) => g.label === "public")!
    expect(pub.options.map((f) => f.id)).toEqual(["small", "same-ram-more-cpu", "big"])
  })

  it("omits empty levels", () => {
    const flavors = [flavor({ id: "only", is_public: true })]
    expect(groupFlavorsByAccess(flavors).map((g) => g.label)).toEqual(["public"])
  })
})

describe("flavorLabel", () => {
  it("formats name with auto-scaled IEC RAM, VCPUs and disk", () => {
    expect(flavorLabel(flavor({ id: "m1.small", name: "m1.small", ram: 2048, vcpus: 1, disk: 20 }))).toBe(
      "m1.small (RAM: 2 GiB, VCPUs: 1, Disk: 20 GiB)"
    )
  })

  it("auto-scales fractional RAM (1536 MiB → 1.5 GiB)", () => {
    expect(flavorLabel(flavor({ id: "x", name: "x", ram: 1536, vcpus: 2, disk: 5 }))).toBe(
      "x (RAM: 1.5 GiB, VCPUs: 2, Disk: 5 GiB)"
    )
  })

  it("keeps sub-GiB RAM in MiB", () => {
    expect(flavorLabel(flavor({ id: "z", name: "z", ram: 512, vcpus: 1, disk: 0 }))).toBe(
      "z (RAM: 512 MiB, VCPUs: 1, Disk: 0 Bytes)"
    )
  })

  it("renders n/a for null numeric fields", () => {
    expect(flavorLabel(flavor({ id: "y", name: "y", ram: null, vcpus: null, disk: null }))).toBe(
      "y (RAM: n/a, VCPUs: n/a, Disk: n/a)"
    )
  })
})

describe("flavorSize", () => {
  it("buckets by RAM (MiB) into XS/S/M/L/XL", () => {
    expect(flavorSize(flavor({ id: "a", ram: 2048 }))).toBe("XS") // 2 GiB
    expect(flavorSize(flavor({ id: "b", ram: 4096 }))).toBe("S") // 4 GiB
    expect(flavorSize(flavor({ id: "c", ram: 16384 }))).toBe("M") // 16 GiB
    expect(flavorSize(flavor({ id: "d", ram: 32768 }))).toBe("L") // 32 GiB
    expect(flavorSize(flavor({ id: "e", ram: 65536 }))).toBe("XL") // 64 GiB
  })

  it("returns null when RAM is unknown", () => {
    expect(flavorSize(flavor({ id: "x", ram: null }))).toBeNull()
  })
})

describe("flavorSizeFacets", () => {
  it("offers only sizes present, in ascending order", () => {
    const facets = flavorSizeFacets([
      flavor({ id: "big", ram: 65536 }), // XL
      flavor({ id: "tiny", ram: 2048 }), // XS
      flavor({ id: "med", ram: 16384 }), // M
    ])
    expect(facets.map((f) => f.label)).toEqual(["XS", "M", "XL"])
  })

  it("builds matchers that filter by size", () => {
    const facets = flavorSizeFacets([flavor({ id: "tiny", ram: 2048 }), flavor({ id: "big", ram: 65536 })])
    const xs = facets.find((f) => f.label === "XS")!
    expect(xs.matches(flavor({ id: "y", ram: 1024 }))).toBe(true)
    expect(xs.matches(flavor({ id: "z", ram: 65536 }))).toBe(false)
  })
})
