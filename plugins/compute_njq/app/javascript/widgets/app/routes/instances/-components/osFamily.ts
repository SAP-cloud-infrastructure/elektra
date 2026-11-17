import type { Facet } from "./SearchableSelect"
import type { BootSource } from "./bootSource"

// OS families we recognise from an image/volume name, in match priority order.
// Each entry: a display label + a lowercase-name test. Kept deliberately small
// and name-based (Glance has no reliable structured OS field across clouds).
const OS_FAMILIES: { label: string; test: (name: string) => boolean }[] = [
  { label: "Ubuntu", test: (n) => n.includes("ubuntu") },
  { label: "Debian", test: (n) => n.includes("debian") },
  { label: "SUSE", test: (n) => n.includes("suse") || n.includes("sles") || n.includes("sap-compliant") },
  { label: "RHEL", test: (n) => n.includes("rhel") || n.includes("red hat") || n.includes("redhat") },
  { label: "CentOS", test: (n) => n.includes("centos") },
  { label: "Rocky", test: (n) => n.includes("rocky") },
  { label: "Flatcar", test: (n) => n.includes("flatcar") },
  { label: "Windows", test: (n) => n.includes("windows") || n.includes("win2") },
]

// The OS family of an image name, or null when none of the known patterns hit.
export function osFamily(name: string | null | undefined): string | null {
  const n = (name ?? "").toLowerCase()
  if (!n) return null
  return OS_FAMILIES.find((f) => f.test(n))?.label ?? null
}

// Builds OS-family quick-filter facets for a boot-source list. Only families
// actually present in the list are offered, in the canonical OS_FAMILIES order.
// Volumes (which may lack an OS-telling name) are matched the same way.
export function osFamilyFacets(options: BootSource[]): Facet<BootSource>[] {
  const present = new Set(options.map((o) => osFamily(o.name)).filter((x): x is string => x !== null))
  return OS_FAMILIES.filter((f) => present.has(f.label)).map((f) => ({
    key: f.label,
    label: f.label,
    matches: (o: BootSource) => osFamily(o.name) === f.label,
  }))
}
