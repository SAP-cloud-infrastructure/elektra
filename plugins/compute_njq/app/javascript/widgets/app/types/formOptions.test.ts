import { describe, it, expect } from "vitest"
import { FlavorSchema, ImagesResponseSchema } from "./formOptions"
import { CreateInstancePayloadSchema } from "./createInstance"

describe("formOptions schemas", () => {
  it("accepts a valid flavor", () => {
    const parsed = FlavorSchema.safeParse({
      id: "f1",
      name: "m1.small",
      vcpus: 2,
      ram: 2048,
      disk: 20,
      hypervisor_type: "kvm",
      is_public: true,
    })
    expect(parsed.success).toBe(true)
  })

  it("accepts an images response", () => {
    const parsed = ImagesResponseSchema.safeParse({ images: [] })
    expect(parsed.success).toBe(true)
  })
})

describe("CreateInstancePayloadSchema", () => {
  it("rejects a name ending in dot+number", () => {
    const parsed = CreateInstancePayloadSchema.safeParse({
      name: "web.1",
      flavor_id: "f1",
      image_id: "i1",
      keypair: "k",
      network_id: "n1",
      security_groups: [],
      user_data: "",
    })
    expect(parsed.success).toBe(false)
  })

  it("requires flavor_id", () => {
    const parsed = CreateInstancePayloadSchema.safeParse({
      name: "web-01",
      flavor_id: "",
      image_id: "i1",
      keypair: "k",
      network_id: "n1",
      security_groups: [],
      user_data: "",
    })
    expect(parsed.success).toBe(false)
  })
})
