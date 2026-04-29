import React from "react"
import { describe, it, expect } from "vitest"
import { normalizeDisplayValue } from "./valueHelpers"

describe("normalizeDisplayValue", () => {
  it("converts true to string 'true'", () => {
    expect(normalizeDisplayValue(true)).toBe("true")
  })

  it("converts false to string 'false'", () => {
    expect(normalizeDisplayValue(false)).toBe("false")
  })

  it("converts null to dash", () => {
    expect(normalizeDisplayValue(null)).toBe("-")
  })

  it("converts undefined to dash", () => {
    expect(normalizeDisplayValue(undefined)).toBe("-")
  })

  it("converts empty string to dash", () => {
    expect(normalizeDisplayValue("")).toBe("-")
  })

  it("converts whitespace-only string to dash", () => {
    expect(normalizeDisplayValue("   ")).toBe("-")
  })

  it("converts empty array to dash", () => {
    expect(normalizeDisplayValue([])).toBe("-")
  })

  it("returns non-empty string as-is", () => {
    expect(normalizeDisplayValue("hello")).toBe("hello")
  })

  it("returns number as-is", () => {
    expect(normalizeDisplayValue(42)).toBe(42)
  })

  it("returns React element as-is", () => {
    const element = React.createElement("div", null, "test")
    expect(normalizeDisplayValue(element)).toBe(element)
  })

  it("returns non-empty array as-is", () => {
    const arr = [1, 2, 3]
    expect(normalizeDisplayValue(arr)).toBe(arr)
  })

  it("returns object as-is", () => {
    const obj = { key: "value" }
    expect(normalizeDisplayValue(obj)).toBe(obj)
  })
})
