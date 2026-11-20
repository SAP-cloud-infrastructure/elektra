import { describe, it, expect } from "vitest"
import { InterfaceOptionsSchema, AttachedInterfacesSchema } from "./interface"

describe("interface schemas", () => {
  it("parses interface options", () => {
    const parsed = InterfaceOptionsSchema.parse({
      networks: [{ id: "n1", name: "net" }],
      subnets: [{ id: "s1", name: "sub", cidr: "10.0.0.0/24", network_id: "n1" }],
      security_groups: [{ id: "sg1", name: "default", project_id: "p1", project_label: "d/p" }],
    })
    expect(parsed.networks[0].id).toBe("n1")
  })

  it("parses attached interfaces", () => {
    const parsed = AttachedInterfacesSchema.parse({
      attached_interfaces: [{ port_id: "p1", fixed_ip_address: "10.0.0.9", mac_addr: "aa:bb" }],
    })
    expect(parsed.attached_interfaces[0].fixed_ip_address).toBe("10.0.0.9")
  })

  it("rejects a missing network id", () => {
    expect(() => InterfaceOptionsSchema.parse({ networks: [{ name: "x" }], subnets: [], security_groups: [] })).toThrow()
  })
})
