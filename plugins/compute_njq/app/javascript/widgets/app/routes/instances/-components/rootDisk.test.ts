import { describe, it, expect } from "vitest"
import { rootDiskMode, rootDiskSizeError, volumeTypeRequired } from "./rootDisk"
import { Flavor } from "../../../types/formOptions"

function flavor(hypervisor_type: string | null, disk: number | null): Flavor {
  return { id: "f", name: "f", vcpus: 1, ram: 1024, disk, hypervisor_type, is_public: true }
}

describe("rootDiskMode", () => {
  it("hides custom root disk for baremetal, unknown, or no flavor", () => {
    expect(rootDiskMode(flavor("baremetal", 0))).toBe("hidden")
    expect(rootDiskMode(flavor(null, 20))).toBe("hidden")
    expect(rootDiskMode(undefined)).toBe("hidden")
  })

  it("makes it optional for kvm/vmware flavors with a disk", () => {
    expect(rootDiskMode(flavor("kvm", 20))).toBe("optional")
    expect(rootDiskMode(flavor("vmware", 40))).toBe("optional")
  })

  it("forces it for disk-less kvm/vmware flavors", () => {
    expect(rootDiskMode(flavor("kvm", 0))).toBe("forced")
    expect(rootDiskMode(flavor("vmware", 0))).toBe("forced")
  })
})

describe("rootDiskSizeError", () => {
  it("rejects empty, non-numeric, and values not greater than 10", () => {
    expect(rootDiskSizeError("")).toBeDefined()
    expect(rootDiskSizeError("abc")).toBeDefined()
    expect(rootDiskSizeError("10")).toBeDefined()
  })

  it("accepts a numeric value greater than 10", () => {
    expect(rootDiskSizeError("11")).toBeUndefined()
    expect(rootDiskSizeError("64")).toBeUndefined()
  })
})

describe("volumeTypeRequired", () => {
  it("requires a volume type only for disk-less kvm flavors", () => {
    expect(volumeTypeRequired(flavor("kvm", 0))).toBe(true)
  })

  it("does not require one for kvm flavors with a disk", () => {
    expect(volumeTypeRequired(flavor("kvm", 20))).toBe(false)
  })

  it("does not require one for disk-less vmware or baremetal flavors", () => {
    expect(volumeTypeRequired(flavor("vmware", 0))).toBe(false)
    expect(volumeTypeRequired(flavor("baremetal", 0))).toBe(false)
    expect(volumeTypeRequired(undefined)).toBe(false)
  })
})
