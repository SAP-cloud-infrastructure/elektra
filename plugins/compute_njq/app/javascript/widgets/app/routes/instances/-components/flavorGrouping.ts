import { Flavor } from "../../../types/formOptions"
import type { Facet } from "./SearchableSelect"

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

// Auto-scaling IEC formatter mirroring the legacy Core::DataType output:
// scales up through the unit table, strips trailing zeros (2.0 → "2"), and uses
// IEC unit names. `startUnit` is the index of the incoming value's unit.
const IEC_UNITS = ["Bytes", "KiB", "MiB", "GiB", "TiB"] as const
function formatIec(value: number, startUnit: number): string {
  // Zero collapses to the base unit ("0 Bytes"), matching the legacy
  // Core::DataType formatter rather than staying at the incoming unit.
  if (value === 0) return "0 Bytes"
  let v = value
  let u = startUnit
  while (v >= 1024 && u < IEC_UNITS.length - 1) {
    v /= 1024
    u++
  }
  // Round to two decimals, then drop any trailing zeros (and the dot).
  const rounded = Math.round(v * 100) / 100
  return `${rounded} ${IEC_UNITS[u]}`
}

// RAM comes from Nova in MiB; format auto-scaled like the legacy
// Core::DataType(:bytes, :mega): 2048 → "2 GiB", 1536 → "1.5 GiB", 512 → "512 MiB".
function formatRam(ram: number | null): string {
  if (ram == null) return "n/a"
  return formatIec(ram, 2) // 2 = MiB
}

// Disk comes from Nova already in GiB; format auto-scaled like the legacy
// Core::DataType(:bytes, :giga): 20 → "20 GiB", 0 → "0 Bytes".
function formatDisk(disk: number | null): string {
  if (disk == null) return "n/a"
  return formatIec(disk, 3) // 3 = GiB
}

// "<name> (RAM: 2 GiB, VCPUs: 1, Disk: 20 GiB)" — mirrors the legacy
// flavor_label_for_select size string (hypervisor word omitted; it is implied by
// the selected type).
export function flavorLabel(f: Flavor): string {
  const ram = formatRam(f.ram)
  const vcpus = f.vcpus ?? "n/a"
  const disk = formatDisk(f.disk)
  return `${f.name} (RAM: ${ram}, VCPUs: ${vcpus}, Disk: ${disk})`
}

// Coarse T-shirt size derived from RAM (Nova reports RAM in MiB). The thresholds
// are in GiB and ascending; a flavor falls into the first bucket whose ceiling
// it does not exceed, else the largest. Flavors with unknown RAM get no size.
const SIZE_BUCKETS: { label: string; maxGib: number }[] = [
  { label: "XS", maxGib: 2 },
  { label: "S", maxGib: 8 },
  { label: "M", maxGib: 16 },
  { label: "L", maxGib: 32 },
]
const SIZE_XL = "XL"
// All size labels in display order, for building facets in a stable order.
const SIZE_ORDER = [...SIZE_BUCKETS.map((b) => b.label), SIZE_XL]

export function flavorSize(f: Flavor): string | null {
  if (f.ram == null) return null
  const gib = f.ram / 1024
  return SIZE_BUCKETS.find((b) => gib <= b.maxGib)?.label ?? SIZE_XL
}

// Quick-filter facets by T-shirt size (XS/S/M/L/XL), built from the sizes that
// actually occur in the given flavor list, in ascending order. SearchableSelect
// hides any facet that would not split the list.
export function flavorSizeFacets(flavors: Flavor[]): Facet<Flavor>[] {
  const present = new Set(flavors.map(flavorSize).filter((x): x is string => x !== null))
  return SIZE_ORDER.filter((label) => present.has(label)).map((label) => ({
    key: `size-${label}`,
    label,
    matches: (f: Flavor) => flavorSize(f) === label,
  }))
}
