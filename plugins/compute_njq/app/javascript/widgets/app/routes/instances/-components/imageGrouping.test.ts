import { describe, it, expect } from "vitest"
import {
  flavorHypervisor,
  imageMatchesHypervisor,
  groupImages,
  imageLabel,
  flavorInTab,
  tabHypervisor,
} from "./imageGrouping"
import { Flavor, Image } from "../../../types/formOptions"

function image(overrides: Partial<Image> & Pick<Image, "id">): Image {
  return {
    name: overrides.id,
    visibility: "public",
    hypervisor_type: null,
    img_hv_type: null,
    image_type: null,
    disk_format: "qcow2",
    buildnumber: null,
    min_disk: 0,
    size: 1024,
    ...overrides,
  }
}

function flavor(hypervisor_type: string | null): Flavor {
  return { id: "f", name: "f", vcpus: 1, ram: 1024, disk: 10, hypervisor_type, is_public: true }
}

describe("flavorHypervisor", () => {
  it("narrows a known hypervisor type", () => {
    expect(flavorHypervisor(flavor("kvm"))).toBe("kvm")
  })
  it("returns null for unknown/absent type or no flavor", () => {
    expect(flavorHypervisor(flavor("xen"))).toBeNull()
    expect(flavorHypervisor(flavor(null))).toBeNull()
    expect(flavorHypervisor(undefined)).toBeNull()
  })
})

describe("flavorInTab", () => {
  it("matches a known hypervisor flavor to its own tab only", () => {
    expect(flavorInTab(flavor("kvm"), "kvm")).toBe(true)
    expect(flavorInTab(flavor("kvm"), "vmware")).toBe(false)
    expect(flavorInTab(flavor("kvm"), "other")).toBe(false)
  })

  it("routes null/unknown-type flavors to the 'other' tab", () => {
    expect(flavorInTab(flavor(null), "other")).toBe(true)
    expect(flavorInTab(flavor("xen"), "other")).toBe(true)
    expect(flavorInTab(flavor(null), "kvm")).toBe(false)
  })
})

describe("tabHypervisor", () => {
  it("maps 'other' to null and known tabs to themselves", () => {
    expect(tabHypervisor("other")).toBeNull()
    expect(tabHypervisor("kvm")).toBe("kvm")
    expect(tabHypervisor("vmware")).toBe("vmware")
    expect(tabHypervisor("baremetal")).toBe("baremetal")
  })
})

describe("imageMatchesHypervisor", () => {
  it("accepts every image when no flavor is selected", () => {
    expect(imageMatchesHypervisor(image({ id: "i", hypervisor_type: "vmware" }), null)).toBe(true)
  })

  it("treats images with no hypervisor info as running everywhere", () => {
    const i = image({ id: "i", hypervisor_type: null, img_hv_type: null })
    expect(imageMatchesHypervisor(i, "kvm")).toBe(true)
    expect(imageMatchesHypervisor(i, "vmware")).toBe(true)
    expect(imageMatchesHypervisor(i, "baremetal")).toBe(true)
  })

  it("restricts img_hv_type baremetal images (with a set hypervisor_type) to baremetal flavors", () => {
    const i = image({ id: "i", hypervisor_type: "kvm", img_hv_type: "baremetal" })
    expect(imageMatchesHypervisor(i, "baremetal")).toBe(true)
    expect(imageMatchesHypervisor(i, "kvm")).toBe(false)
    expect(imageMatchesHypervisor(i, "vmware")).toBe(false)
  })

  it("treats a null hypervisor_type as running everywhere even when img_hv_type is set", () => {
    const i = image({ id: "i", hypervisor_type: null, img_hv_type: "vmware" })
    expect(imageMatchesHypervisor(i, "kvm")).toBe(true)
    expect(imageMatchesHypervisor(i, "vmware")).toBe(true)
    expect(imageMatchesHypervisor(i, "baremetal")).toBe(true)
  })

  it("matches on hypervisor_type when it is set", () => {
    expect(imageMatchesHypervisor(image({ id: "i", hypervisor_type: "kvm" }), "kvm")).toBe(true)
    expect(imageMatchesHypervisor(image({ id: "i", hypervisor_type: "kvm" }), "vmware")).toBe(false)
  })
})

describe("groupImages", () => {
  it("orders groups public → private → shared → snapshot and sorts by name", () => {
    const images = [
      image({ id: "b-pub", name: "b", visibility: "public" }),
      image({ id: "a-pub", name: "a", visibility: "public" }),
      image({ id: "priv", name: "p", visibility: "private" }),
      image({ id: "shared", name: "s", visibility: "shared" }),
      image({ id: "snap", name: "z", visibility: "private", image_type: "snapshot" }),
    ]
    const groups = groupImages(images, null)
    expect(groups.map((g) => g.label)).toEqual(["public", "private", "shared", "snapshot"])
    expect(groups[0].options.map((i) => i.id)).toEqual(["a-pub", "b-pub"])
    // snapshot override wins over the image's own visibility
    expect(groups[3].options.map((i) => i.id)).toEqual(["snap"])
  })

  it("filters by flavor hypervisor before grouping and omits empty buckets", () => {
    const images = [
      image({ id: "kvm", visibility: "public", hypervisor_type: "kvm" }),
      image({ id: "vmware", visibility: "private", hypervisor_type: "vmware" }),
    ]
    const groups = groupImages(images, "kvm")
    expect(groups.map((g) => g.label)).toEqual(["public"])
    expect(groups[0].options.map((i) => i.id)).toEqual(["kvm"])
  })

  it("puts images with unknown visibility in a trailing bucket", () => {
    const groups = groupImages([image({ id: "weird", visibility: "community" })], null)
    expect(groups.map((g) => g.label)).toEqual(["community"])
  })
})

describe("imageLabel", () => {
  it("formats name with human size and disk format", () => {
    expect(imageLabel(image({ id: "x", name: "ubuntu", size: 1073741824, disk_format: "qcow2" }))).toBe(
      "ubuntu (Size: 1 GB, Format: qcow2)"
    )
  })

  it("appends the build number when present", () => {
    expect(imageLabel(image({ id: "x", name: "img", size: 1048576, disk_format: "vmdk", buildnumber: "42" }))).toBe(
      "img (Size: 1 MB, Format: vmdk, Build: 42)"
    )
  })

  it("shows n/a for null size and omits an absent format", () => {
    expect(imageLabel(image({ id: "x", name: "img", size: null, disk_format: null }))).toBe("img (Size: n/a)")
  })
})
