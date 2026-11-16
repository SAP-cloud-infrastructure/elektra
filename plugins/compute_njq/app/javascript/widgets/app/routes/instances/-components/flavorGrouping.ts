import { Flavor } from "../../../types/formOptions"

export interface FlavorGroup {
  label: string
  options: Flavor[]
}

// Ascending by RAM, then vCPUs — matches the legacy `sort_by { [ram, vcpus] }`.
function bySize(a: Flavor, b: Flavor): number {
  return (a.ram ?? 0) - (b.ram ?? 0) || (a.vcpus ?? 0) - (b.vcpus ?? 0)
}

// Groups an already-type-filtered flavor list by access level only (public,
// then private). Hypervisor subgroups are unnecessary here because the type tab
// already fixed the hypervisor. Sorted by ram then vcpus; empty levels omitted.
export function groupFlavorsByAccess(flavors: Flavor[]): FlavorGroup[] {
  const result: FlavorGroup[] = []
  for (const level of [
    { label: "public", isPublic: true },
    { label: "private", isPublic: false },
  ]) {
    const options = flavors.filter((f) => f.is_public === level.isPublic).sort(bySize)
    if (options.length > 0) result.push({ label: level.label, options })
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
