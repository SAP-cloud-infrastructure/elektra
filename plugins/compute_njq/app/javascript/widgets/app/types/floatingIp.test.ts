import { describe, it, expect } from "vitest"
import { FloatingIpOptionsSchema } from "./floatingIp"

describe("FloatingIpOptionsSchema", () => {
  it("parses available FIPs and external networks", () => {
    const parsed = FloatingIpOptionsSchema.parse({
      available_floating_ips: [{ id: "f1", floating_ip_address: "1.1.1.1" }],
      external_networks: [{ id: "n1", name: "ext" }],
    })
    expect(parsed.available_floating_ips[0].floating_ip_address).toBe("1.1.1.1")
    expect(parsed.external_networks[0].name).toBe("ext")
  })

  it("allows a null external-network name", () => {
    const parsed = FloatingIpOptionsSchema.parse({
      available_floating_ips: [],
      external_networks: [{ id: "n1", name: null }],
    })
    expect(parsed.external_networks[0].name).toBeNull()
  })
})
