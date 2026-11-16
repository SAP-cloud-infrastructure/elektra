import { describe, it, expect } from "vitest"
import { groupSecurityGroupsByProject } from "./securityGroupGrouping"
import type { SecurityGroup } from "../../../types/formOptions"

const sg = (over: Partial<SecurityGroup> & { id: string; name: string }): SecurityGroup => ({
  project_id: null,
  project_label: null,
  ...over,
})

describe("groupSecurityGroupsByProject", () => {
  it("groups by project label, sorts groups and options alphabetically", () => {
    const groups = groupSecurityGroupsByProject([
      sg({ id: "1", name: "web", project_label: "monsoon3/beta" }),
      sg({ id: "2", name: "app", project_label: "monsoon3/alpha" }),
      sg({ id: "3", name: "db", project_label: "monsoon3/alpha" }),
    ])

    expect(groups.map((g) => g.label)).toEqual(["monsoon3/alpha", "monsoon3/beta"])
    // Options within the alpha group are sorted by name: app before db.
    expect(groups[0].options.map((o) => o.name)).toEqual(["app", "db"])
    expect(groups[1].options.map((o) => o.name)).toEqual(["web"])
  })

  it("falls back to the raw project id when no label is set", () => {
    const groups = groupSecurityGroupsByProject([sg({ id: "1", name: "x", project_id: "p-123", project_label: null })])
    expect(groups[0].label).toBe("p-123")
  })

  it("uses 'Unknown project' when neither label nor id is available", () => {
    const groups = groupSecurityGroupsByProject([sg({ id: "1", name: "x" })])
    expect(groups[0].label).toBe("Unknown project")
  })
})
