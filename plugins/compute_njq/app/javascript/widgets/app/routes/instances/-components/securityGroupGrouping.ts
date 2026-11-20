// The minimal shape this grouping needs: a name plus the owning project's id
// and resolved label. Both the create form's `SecurityGroup` and the attach
// modal's `InterfaceSecurityGroup` satisfy it, so both reuse this helper.
export interface GroupableSecurityGroup {
  name: string
  project_id: string | null
  project_label: string | null
}

export interface SecurityGroupProjectGroup<T extends GroupableSecurityGroup = GroupableSecurityGroup> {
  label: string
  options: T[]
}

// Groups security groups by their owning project, mirroring the legacy compute
// create form (which grouped SGs by "<domain>/<project>"). The list can include
// shared SGs from other projects, so grouping makes the origin obvious. Groups
// are sorted alphabetically by label; SGs within a group by name. A missing
// project label falls back to "Unknown project" so nothing is dropped.
export function groupSecurityGroupsByProject<T extends GroupableSecurityGroup>(
  securityGroups: T[]
): SecurityGroupProjectGroup<T>[] {
  const byLabel = new Map<string, T[]>()
  for (const sg of securityGroups) {
    const label = sg.project_label ?? sg.project_id ?? "Unknown project"
    const bucket = byLabel.get(label)
    if (bucket) bucket.push(sg)
    else byLabel.set(label, [sg])
  }

  return [...byLabel.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, options]) => ({
      label,
      options: [...options].sort((a, b) => a.name.localeCompare(b.name)),
    }))
}
