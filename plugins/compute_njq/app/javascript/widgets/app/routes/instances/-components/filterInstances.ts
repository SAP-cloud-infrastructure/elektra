import type { Instance } from "../../../types/instance"

export interface InstanceFilters {
  term?: string
  // Empty string / undefined means "all".
  status?: string
  az?: string
}

// Client-side filter over the already-loaded instances: a free-text regex
// (name, id, status, IPs, image, flavor) plus optional exact-match facets for
// status and availability zone. An invalid regex (e.g. an unbalanced bracket
// mid-typing) falls back to ignoring the text term.
export function filterInstances(instances: Instance[], filters: InstanceFilters): Instance[] {
  const term = (filters.term ?? "").trim()
  const status = filters.status ?? ""
  const az = filters.az ?? ""

  let regex: RegExp | null = null
  if (term) {
    try {
      regex = new RegExp(term, "i")
    } catch {
      regex = null
    }
  }

  return instances.filter((i) => {
    if (status && i.status.state !== status) return false
    if (az && (i.availability_zone ?? "") !== az) return false

    if (!regex) return true

    const haystack = [
      i.name,
      i.id,
      i.status.state,
      i.status.transition,
      i.image.name,
      i.image.id,
      i.flavor.name,
      i.flavor.id,
      ...i.ips.map((ip) => ip.addr),
    ]
      .filter(Boolean)
      .join(" ")

    return regex.test(haystack)
  })
}

// Distinct, sorted facet values present in the current data, for building the
// filter chips (only offer values that actually exist).
export function facetValues(instances: Instance[]): { statuses: string[]; azs: string[] } {
  const statuses = new Set<string>()
  const azs = new Set<string>()
  for (const i of instances) {
    if (i.status.state) statuses.add(i.status.state)
    if (i.availability_zone) azs.add(i.availability_zone)
  }
  return {
    statuses: [...statuses].sort(),
    azs: [...azs].sort(),
  }
}
