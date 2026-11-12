import { describe, it, expect } from "vitest"
import { filterInstances, facetValues } from "./filterInstances"
import type { Instance } from "../../../types/instance"

const make = (overrides: Partial<Instance>): Instance => ({
  id: "s1",
  name: "web-01",
  status: { state: "active", transition: null },
  availability_zone: "qa-de-1a",
  flavor: { id: "f1", name: "m1.small" },
  image: { id: "i1", name: "ubuntu-24.04" },
  ips: [
    { addr: "10.0.0.5", type: "fixed" },
    { addr: "203.0.113.9", type: "floating" },
  ],
  created: "2026-01-01T00:00:00Z",
  ...overrides,
})

const web = make({ id: "s1", name: "web-01" })
const db = make({ id: "s2", name: "db-primary", ips: [{ addr: "10.0.0.9", type: "fixed" }] })

describe("filterInstances", () => {
  it("returns all instances for an empty or whitespace term", () => {
    expect(filterInstances([web, db], { term: "" })).toEqual([web, db])
    expect(filterInstances([web, db], { term: "   " })).toEqual([web, db])
  })

  it("matches by name (case-insensitive)", () => {
    expect(filterInstances([web, db], { term: "WEB" })).toEqual([web])
  })

  it("matches by id", () => {
    expect(filterInstances([web, db], { term: "s2" })).toEqual([db])
  })

  it("matches by status", () => {
    const stopped = make({ id: "s3", name: "old", status: { state: "stopped", transition: null } })
    expect(filterInstances([web, stopped], { term: "stopped" })).toEqual([stopped])
  })

  it("matches by IP address", () => {
    expect(filterInstances([web, db], { term: "10.0.0.9" })).toEqual([db])
  })

  it("matches by image and flavor", () => {
    expect(filterInstances([web, db], { term: "ubuntu" })).toEqual([web, db])
    const big = make({ id: "s4", name: "big", flavor: { id: "f2", name: "m1.large" } })
    expect(filterInstances([web, big], { term: "large" })).toEqual([big])
  })

  it("falls back to ignoring an invalid regex term", () => {
    expect(filterInstances([web, db], { term: "[" })).toEqual([web, db])
  })

  it("filters by exact status facet", () => {
    const stopped = make({ id: "s3", status: { state: "stopped", transition: null } })
    expect(filterInstances([web, stopped], { status: "stopped" })).toEqual([stopped])
  })

  it("filters by exact availability-zone facet", () => {
    const other = make({ id: "s3", availability_zone: "qa-de-1b" })
    expect(filterInstances([web, other], { az: "qa-de-1b" })).toEqual([other])
  })

  it("combines text, status and az filters", () => {
    const match = make({
      id: "s9",
      name: "db-1",
      status: { state: "stopped", transition: null },
      availability_zone: "qa-de-1b",
    })
    const wrongAz = make({
      id: "s8",
      name: "db-2",
      status: { state: "stopped", transition: null },
      availability_zone: "qa-de-1a",
    })
    expect(filterInstances([web, match, wrongAz], { term: "db", status: "stopped", az: "qa-de-1b" })).toEqual([match])
  })
})

describe("facetValues", () => {
  it("returns distinct, sorted statuses and AZs present in the data", () => {
    const a = make({ id: "a", status: { state: "active", transition: null }, availability_zone: "qa-de-1b" })
    const b = make({ id: "b", status: { state: "error", transition: null }, availability_zone: "qa-de-1a" })
    const c = make({ id: "c", status: { state: "active", transition: null }, availability_zone: "qa-de-1a" })
    expect(facetValues([a, b, c])).toEqual({
      statuses: ["active", "error"],
      azs: ["qa-de-1a", "qa-de-1b"],
    })
  })
})
