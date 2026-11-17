import { describe, it, expect } from "vitest"
import { InstanceSchema } from "./instance"

describe("InstanceSchema locked", () => {
  const base = {
    id: "s1",
    name: "x",
    status: { state: "active" },
    flavor: { id: "f", name: "F" },
    image: { id: "i", name: "I" },
    ips: [],
    created: null,
  }

  it("parses locked true/false", () => {
    expect(InstanceSchema.parse({ ...base, locked: true }).locked).toBe(true)
    expect(InstanceSchema.parse({ ...base, locked: false }).locked).toBe(false)
  })

  it("defaults locked to false when omitted", () => {
    expect(InstanceSchema.parse(base).locked).toBe(false)
  })
})
