import { Flavor } from "../../../types/formOptions"

// Hypervisor subgroups are rendered in this order within each public/private
// level, mirroring the legacy compute plugin's grouped_flavors helper.
const HYPERVISOR_ORDER = ["baremetal", "kvm", "vmware"] as const

const HYPERVISOR_LABEL: Record<(typeof HYPERVISOR_ORDER)[number], string> = {
  baremetal: "--bare metal",
  kvm: "--kvm",
  vmware: "--vmware",
}

export interface FlavorGroup {
  label: string
  options: Flavor[]
}

// Ascending by RAM, then vCPUs — matches the legacy `sort_by { [ram, vcpus] }`.
function bySize(a: Flavor, b: Flavor): number {
  return (a.ram ?? 0) - (b.ram ?? 0) || (a.vcpus ?? 0) - (b.vcpus ?? 0)
}

// Build the subgroups for one access level (public or private): one group per
// known hypervisor type in HYPERVISOR_ORDER, plus a trailing unlabeled group
// for flavors with an unknown/absent hypervisor type (legacy dropped these; we
// keep them so no flavor silently disappears). Empty groups are omitted.
function subgroups(flavors: Flavor[]): FlavorGroup[] {
  const groups: FlavorGroup[] = []

  for (const hv of HYPERVISOR_ORDER) {
    const options = flavors.filter((f) => f.hypervisor_type === hv).sort(bySize)
    if (options.length > 0) groups.push({ label: HYPERVISOR_LABEL[hv], options })
  }

  const known = HYPERVISOR_ORDER as readonly string[]
  const other = flavors.filter((f) => f.hypervisor_type == null || !known.includes(f.hypervisor_type)).sort(bySize)
  if (other.length > 0) groups.push({ label: "--other", options: other })

  return groups
}

// Flatten the two-level structure (public/private → hypervisor subgroups) into
// the flat group list SearchableSelect consumes: a level header followed by its
// subgroups, public before private. Empty levels/subgroups are omitted.
export function groupFlavors(flavors: Flavor[]): FlavorGroup[] {
  const result: FlavorGroup[] = []

  for (const level of [
    { label: "public", isPublic: true },
    { label: "private", isPublic: false },
  ]) {
    const inLevel = flavors.filter((f) => f.is_public === level.isPublic)
    const subs = subgroups(inLevel)
    if (subs.length === 0) continue
    result.push({ label: level.label, options: [] })
    result.push(...subs)
  }

  return result
}

// Format RAM (MB from Nova) as GB when it is a whole number of GB, else MB.
function formatRam(ram: number | null): string {
  if (ram == null) return "n/a"
  return ram >= 1024 && ram % 1024 === 0 ? `${ram / 1024} GB` : `${ram} MB`
}

// "<name> (RAM: 2 GB, VCPUs: 1, Disk: 20 GB)" — Nova disk is already in GB.
export function flavorLabel(f: Flavor): string {
  const ram = formatRam(f.ram)
  const vcpus = f.vcpus ?? "n/a"
  const disk = f.disk == null ? "n/a" : `${f.disk} GB`
  return `${f.name} (RAM: ${ram}, VCPUs: ${vcpus}, Disk: ${disk})`
}
