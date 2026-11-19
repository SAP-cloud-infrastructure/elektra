import { describe, it, expect } from "vitest"
import { ImageStatusResponseSchema } from "./image"

describe("ImageStatusResponseSchema", () => {
  it("parses a shaped image status", () => {
    const parsed = ImageStatusResponseSchema.safeParse({ image: { id: "img-7", name: "snap-1", status: "saving" } })
    expect(parsed.success).toBe(true)
  })

  it("accepts a null name", () => {
    const parsed = ImageStatusResponseSchema.safeParse({ image: { id: "img-7", name: null, status: "active" } })
    expect(parsed.success).toBe(true)
  })

  it("rejects a missing status", () => {
    const parsed = ImageStatusResponseSchema.safeParse({ image: { id: "img-7", name: "snap-1" } })
    expect(parsed.success).toBe(false)
  })
})
