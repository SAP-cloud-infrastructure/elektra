import { describe, it, expect } from "vitest"
import {
  bootSourceOptions,
  groupBootSources,
  bootSourceLabel,
  bootSourceValue,
  volumeMatchesHypervisor,
  isVolumeId,
  fitsFlavorFacet,
  type BootSource,
} from "./bootSource"
import type { BootableVolume, Image } from "../../../types/formOptions"

function image(over: Partial<Image> & Pick<Image, "id">): Image {
  return {
    name: over.id,
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
    ...over,
  }
}

function volume(over: Partial<BootableVolume> & Pick<BootableVolume, "id">): BootableVolume {
  return {
    name: over.id,
    size: 50,
    availability_zone: "qa-de-1a",
    disk_format: "raw",
    hypervisor_type: "kvm",
    img_hv_type: null,
    ...over,
  }
}

describe("volumeMatchesHypervisor", () => {
  it("matches on either hypervisor_type or img_hv_type", () => {
    expect(volumeMatchesHypervisor(volume({ id: "a", hypervisor_type: "kvm", img_hv_type: null }), "kvm")).toBe(true)
    expect(volumeMatchesHypervisor(volume({ id: "b", hypervisor_type: null, img_hv_type: "vmware" }), "vmware")).toBe(
      true
    )
    expect(volumeMatchesHypervisor(volume({ id: "c", hypervisor_type: "kvm" }), "vmware")).toBe(false)
  })

  it("never matches for baremetal or a null flavor hypervisor", () => {
    expect(volumeMatchesHypervisor(volume({ id: "a", hypervisor_type: "kvm" }), "baremetal")).toBe(false)
    expect(volumeMatchesHypervisor(volume({ id: "a", hypervisor_type: "kvm" }), null)).toBe(false)
  })
})

describe("bootSourceOptions", () => {
  it("includes images and only hypervisor-matching volumes, volumes first", () => {
    const opts = bootSourceOptions(
      [image({ id: "img1", hypervisor_type: "kvm" })],
      [volume({ id: "vol-kvm", hypervisor_type: "kvm" }), volume({ id: "vol-vmware", hypervisor_type: "vmware" })],
      "kvm"
    )
    expect(opts.map((o) => `${o.kind}:${o.id}`)).toEqual(["volume:vol-kvm", "image:img1"])
  })

  it("drops all volumes when the flavor has no matching hypervisor", () => {
    const opts = bootSourceOptions([image({ id: "img1" })], [volume({ id: "vol", hypervisor_type: "kvm" })], "baremetal")
    expect(opts.every((o) => o.kind === "image")).toBe(true)
  })
})

describe("groupBootSources", () => {
  it("puts a 'Bootable Volumes' group first, then image visibility groups", () => {
    const opts: BootSource[] = [
      { kind: "volume", ...volume({ id: "v1", name: "vol-b" }) },
      { kind: "image", ...image({ id: "i1", name: "ubuntu", visibility: "public" }) },
    ]
    const groups = groupBootSources(opts, "kvm")
    expect(groups[0].label).toBe("Bootable Volumes")
    expect(groups.slice(1).map((g) => g.label)).toContain("public")
  })

  it("omits the volume group when there are no volumes", () => {
    const opts: BootSource[] = [{ kind: "image", ...image({ id: "i1", visibility: "public" }) }]
    const groups = groupBootSources(opts, "kvm")
    expect(groups.map((g) => g.label)).not.toContain("Bootable Volumes")
  })
})

describe("bootSourceLabel / bootSourceValue", () => {
  it("labels a volume with size, az and format", () => {
    const o: BootSource = { kind: "volume", ...volume({ id: "v1", name: "root-vol", size: 80 }) }
    expect(bootSourceLabel(o)).toBe("root-vol (Size: 80GB, Avz: qa-de-1a, Format: raw)")
  })

  it("delegates image labels to the image formatter and returns the id as value", () => {
    const o: BootSource = { kind: "image", ...image({ id: "i1", name: "ubuntu", size: 1048576 }) }
    expect(bootSourceLabel(o)).toContain("ubuntu (Size: 1MB")
    expect(bootSourceValue(o)).toBe("i1")
  })
})

describe("isVolumeId", () => {
  it("detects whether an id belongs to the bootable volumes", () => {
    const vols = [volume({ id: "v1" })]
    expect(isVolumeId("v1", vols)).toBe(true)
    expect(isVolumeId("i1", vols)).toBe(false)
    expect(isVolumeId(null, vols)).toBe(false)
  })
})

describe("fitsFlavorFacet", () => {
  const img = (id: string, min_disk: number): BootSource => ({ kind: "image", ...image({ id, min_disk }) })

  it("keeps images whose min_disk fits the available disk", () => {
    const facet = fitsFlavorFacet(20)
    expect(facet.matches(img("small", 10))).toBe(true)
    expect(facet.matches(img("exact", 20))).toBe(true)
    expect(facet.matches(img("too-big", 40))).toBe(false)
  })

  it("treats a missing min_disk as always fitting", () => {
    expect(fitsFlavorFacet(20).matches({ kind: "image", ...image({ id: "x", min_disk: null }) })).toBe(true)
  })

  it("always keeps bootable volumes (they carry their own size)", () => {
    expect(fitsFlavorFacet(20).matches({ kind: "volume", ...volume({ id: "v", size: 100 }) })).toBe(true)
  })

  it("matches everything when the disk size is unknown", () => {
    expect(fitsFlavorFacet(0).matches(img("too-big", 40))).toBe(true)
    expect(fitsFlavorFacet(null).matches(img("too-big", 40))).toBe(true)
  })
})
