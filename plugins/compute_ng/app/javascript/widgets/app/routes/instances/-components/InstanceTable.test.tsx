import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { InstanceTable } from "./InstanceTable"
import type { Instance } from "../../../types/instance"

const instance: Instance = {
  id: "s1",
  name: "web-01",
  status: { state: "active", transition: null },
  flavor: { id: "f1", name: "m1.small" },
  image: { id: "i1", name: "ubuntu-24.04" },
  ips: { fixed: ["10.0.0.5"], floating: ["203.0.113.9"] },
  created: "2026-01-01T00:00:00Z",
}

describe("InstanceTable", () => {
  it("renders an empty-state message when there are no instances", () => {
    render(<InstanceTable instances={[]} />)
    expect(screen.getByText("No instances found.")).toBeInTheDocument()
  })

  it("renders instance name, resolved flavor and image, and status", () => {
    render(<InstanceTable instances={[instance]} />)
    expect(screen.getByText("web-01")).toBeInTheDocument()
    expect(screen.getByText("m1.small")).toBeInTheDocument()
    expect(screen.getByText("ubuntu-24.04")).toBeInTheDocument()
    expect(screen.getByText("active")).toBeInTheDocument()
  })

  it("falls back to the id when the name is null", () => {
    render(<InstanceTable instances={[{ ...instance, name: null }]} />)
    expect(screen.getByText("s1")).toBeInTheDocument()
  })

  it("falls back to a dash when flavor/image names are unresolved", () => {
    render(
      <InstanceTable
        instances={[{ ...instance, flavor: { id: null, name: null }, image: { id: null, name: null } }]}
      />
    )
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2)
  })
})
