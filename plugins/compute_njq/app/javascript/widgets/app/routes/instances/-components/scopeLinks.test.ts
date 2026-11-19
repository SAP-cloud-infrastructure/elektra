import { describe, it, expect } from "vitest"
import { scopePrefix } from "./scopeLinks"

describe("scopePrefix", () => {
  it("strips the compute-njq mount segment to yield the domain/project prefix", () => {
    expect(scopePrefix("/monsoon3/cc-demo/compute-njq")).toBe("/monsoon3/cc-demo")
  })

  it("tolerates a trailing slash", () => {
    expect(scopePrefix("/monsoon3/cc-demo/compute-njq/")).toBe("/monsoon3/cc-demo")
  })

  it("leaves a basepath without the expected suffix unchanged", () => {
    expect(scopePrefix("/monsoon3/cc-demo")).toBe("/monsoon3/cc-demo")
  })
})
