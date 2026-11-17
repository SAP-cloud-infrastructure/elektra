import { describe, it, expect } from "vitest"
import { osFamily, osFamilyFacets } from "./osFamily"
import type { BootSource } from "./bootSource"

function imageSource(name: string): BootSource {
  return {
    kind: "image",
    id: name,
    name,
    visibility: "public",
    hypervisor_type: null,
    img_hv_type: null,
    image_type: null,
    disk_format: "qcow2",
    buildnumber: null,
    min_disk: 0,
    size: 1024,
    created: null,
    owner: null,
    owner_label: null,
  }
}

describe("osFamily", () => {
  it("recognises common families by name", () => {
    expect(osFamily("ubuntu-24.04")).toBe("Ubuntu")
    expect(osFamily("SAP-compliant-SLES-15")).toBe("SUSE")
    expect(osFamily("debian-12")).toBe("Debian")
    expect(osFamily("Windows Server 2022")).toBe("Windows")
    expect(osFamily("flatcar-stable")).toBe("Flatcar")
  })

  it("returns null for unknown or empty names", () => {
    expect(osFamily("some-custom-appliance")).toBeNull()
    expect(osFamily("")).toBeNull()
    expect(osFamily(null)).toBeNull()
  })
})

describe("osFamilyFacets", () => {
  it("offers only families present in the list, in canonical order", () => {
    const facets = osFamilyFacets([
      imageSource("debian-12"),
      imageSource("ubuntu-24.04"),
      imageSource("mystery-box"),
    ])
    // Ubuntu is listed before Debian in the canonical order.
    expect(facets.map((f) => f.label)).toEqual(["Ubuntu", "Debian"])
  })

  it("produces facets whose matcher filters by family", () => {
    const facets = osFamilyFacets([imageSource("ubuntu-24.04"), imageSource("debian-12")])
    const ubuntu = facets.find((f) => f.label === "Ubuntu")!
    expect(ubuntu.matches(imageSource("ubuntu-22.04"))).toBe(true)
    expect(ubuntu.matches(imageSource("debian-12"))).toBe(false)
  })

  it("returns no facets when nothing matches", () => {
    expect(osFamilyFacets([imageSource("custom-a"), imageSource("custom-b")])).toEqual([])
  })
})
