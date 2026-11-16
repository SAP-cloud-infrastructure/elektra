import { Flavor, Image } from "../../../types/formOptions"

export type HypervisorType = "baremetal" | "kvm" | "vmware"

const HYPERVISORS: readonly string[] = ["baremetal", "kvm", "vmware"]

export interface ImageGroup {
  label: string
  options: Image[]
}

// The normalized hypervisor type of the selected flavor, or null when no flavor
// is selected (or its type is unknown). The BFF already maps Nova's extra_specs
// to this small vocabulary, so we only narrow the string here.
export function flavorHypervisor(flavor: Flavor | undefined): HypervisorType | null {
  const hv = flavor?.hypervisor_type
  return hv != null && HYPERVISORS.includes(hv) ? (hv as HypervisorType) : null
}

// The four type-selector choices. "other" is the null/unknown bucket that must
// stay reachable (the legacy plugin dropped these flavors; we keep them).
export type FlavorTypeTab = HypervisorType | "other"
export const FLAVOR_TYPE_TABS: readonly FlavorTypeTab[] = ["kvm", "vmware", "baremetal", "other"]
export const FLAVOR_TYPE_LABELS: Record<FlavorTypeTab, string> = {
  kvm: "KVM",
  vmware: "VMware",
  baremetal: "Baremetal",
  other: "Other",
}

// A flavor belongs to tab "other" exactly when flavorHypervisor() is null.
export function flavorInTab(flavor: Flavor, tab: FlavorTypeTab): boolean {
  const hv = flavorHypervisor(flavor)
  return tab === "other" ? hv === null : hv === tab
}

// The hypervisor the image list should filter on for a given tab: the tab's own
// type, or null for "other" (→ imageMatchesHypervisor shows everything).
export function tabHypervisor(tab: FlavorTypeTab): HypervisorType | null {
  return tab === "other" ? null : tab
}

// Whether an image is bootable on the given flavor hypervisor, mirroring the
// legacy grouped_images bucketing (instances_helper.rb:110-128):
//   - no flavor selected (hv null) → all images (also the "Other" tab)
//   - image hypervisor_type null   → runs on every hypervisor (kvm/vmware/baremetal)
//   - img_hv_type "baremetal"      → baremetal only (only reached when hypervisor_type is set)
//   - otherwise                    → match hypervisor_type's own bucket
export function imageMatchesHypervisor(image: Image, hv: HypervisorType | null): boolean {
  if (hv == null) return true
  if (image.hypervisor_type == null) return true
  if (image.img_hv_type === "baremetal") return hv === "baremetal"
  return image.hypervisor_type === hv
}

// Top-level grouping order. Alphabetical like the legacy `.sort`, plus snapshot.
const VISIBILITY_ORDER = ["public", "private", "shared", "snapshot"] as const

// The group an image belongs to: image_type "snapshot" promotes it into the
// snapshot bucket, otherwise its glance visibility (unknown → "other").
export function imageBucket(image: Image): string {
  if (image.image_type === "snapshot") return "snapshot"
  return image.visibility ?? "other"
}

function byName(a: Image, b: Image): number {
  return (a.name ?? "").localeCompare(b.name ?? "")
}

// Filter by flavor hypervisor, then group into public/private/shared/snapshot
// (unknown buckets trailing), sorting each bucket by name. Empty buckets are
// omitted. Returns the flat group list SearchableSelect consumes.
export function groupImages(images: Image[], hv: HypervisorType | null): ImageGroup[] {
  const matching = images.filter((i) => imageMatchesHypervisor(i, hv))

  const buckets = new Map<string, Image[]>()
  for (const image of matching) {
    const key = imageBucket(image)
    const list = buckets.get(key) ?? []
    list.push(image)
    buckets.set(key, list)
  }

  const known = VISIBILITY_ORDER as readonly string[]
  const order = [...VISIBILITY_ORDER, ...[...buckets.keys()].filter((k) => !known.includes(k)).sort()]

  const groups: ImageGroup[] = []
  for (const label of order) {
    const options = buckets.get(label)
    if (options && options.length > 0) groups.push({ label, options: options.sort(byName) })
  }
  return groups
}

// Human-readable byte size: B/KB/MB/GB, mirroring the legacy byte_to_human.
function formatSize(size: number | null): string {
  if (size == null) return "n/a"
  const units = ["B", "KB", "MB", "GB"]
  let value = size
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  const rounded = Math.round(value * 100) / 100
  return `${rounded} ${units[unit]}`
}

// "<name> (Size: 1 GB, Format: qcow2[, Build: 42])" — mirrors the legacy
// image_label_for_select, minus the private-image project suffix (deferred to a
// later version, which needs owner/project name resolution).
export function imageLabel(image: Image): string {
  const name = image.name ?? image.id
  const parts = [`Size: ${formatSize(image.size)}`]
  if (image.disk_format != null) parts.push(`Format: ${image.disk_format}`)
  if (image.buildnumber != null && image.buildnumber !== "") parts.push(`Build: ${image.buildnumber}`)
  return `${name} (${parts.join(", ")})`
}
