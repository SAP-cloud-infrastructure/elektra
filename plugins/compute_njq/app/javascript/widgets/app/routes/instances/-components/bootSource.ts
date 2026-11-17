import { BootableVolume, Image } from "../../../types/formOptions"
import { HypervisorType, groupImages, imageLabel } from "./imageGrouping"

// A unified boot-source option: either a Glance image or a bootable Cinder
// volume, shown together in the image picker. The `kind` discriminator lets the
// list render both and lets the create payload stay a single id (the server
// resolves whether an id is a volume or an image).
export type BootSource =
  | ({ kind: "image" } & Image)
  | ({ kind: "volume" } & BootableVolume)

export interface BootSourceGroup {
  label: string
  options: BootSource[]
}

export function bootSourceValue(o: BootSource): string {
  return o.id
}

export function bootSourceLabel(o: BootSource): string {
  if (o.kind === "volume") {
    const parts: string[] = []
    if (o.size != null) parts.push(`Size: ${o.size}GB`)
    if (o.availability_zone) parts.push(`Avz: ${o.availability_zone}`)
    if (o.disk_format) parts.push(`Format: ${o.disk_format}`)
    const suffix = parts.length > 0 ? ` (${parts.join(", ")})` : ""
    return `${o.name}${suffix}`
  }
  return imageLabel(o)
}

// Whether a bootable volume matches the selected flavor hypervisor, mirroring
// the legacy volume selection: include it only when either metadata hypervisor
// field equals the flavor's hypervisor. Baremetal never gets volumes, and when
// no flavor hypervisor is known (the "Other" tab) volumes are not offered.
export function volumeMatchesHypervisor(volume: BootableVolume, hv: HypervisorType | null): boolean {
  if (hv !== "kvm" && hv !== "vmware") return false
  return volume.hypervisor_type === hv || volume.img_hv_type === hv
}

// The flat combined option list for the picker: images plus the bootable
// volumes that match the selected flavor hypervisor, each tagged with its kind.
export function bootSourceOptions(images: Image[], volumes: BootableVolume[], hv: HypervisorType | null): BootSource[] {
  const imageOptions: BootSource[] = images.map((i) => ({ kind: "image", ...i }))
  const volumeOptions: BootSource[] = volumes
    .filter((v) => volumeMatchesHypervisor(v, hv))
    .map((v) => ({ kind: "volume", ...v }))
  return [...volumeOptions, ...imageOptions]
}

// Groups an already-filtered boot-source list for the picker: the bootable
// volumes first (under a "Bootable Volumes" group, mirroring the legacy
// "--bootable volumes" optgroup on top), then the image visibility groups.
export function groupBootSources(options: BootSource[], hv: HypervisorType | null): BootSourceGroup[] {
  const volumeOptions = options
    .filter((o): o is { kind: "volume" } & BootableVolume => o.kind === "volume")
    .sort((a, b) => a.name.localeCompare(b.name))
  const images = options.filter((o): o is { kind: "image" } & Image => o.kind === "image")

  const groups: BootSourceGroup[] = []
  if (volumeOptions.length > 0) groups.push({ label: "Bootable Volumes", options: volumeOptions })

  for (const g of groupImages(images, hv)) {
    groups.push({ label: g.label, options: g.options.map((i) => ({ kind: "image", ...i })) })
  }
  return groups
}

// True when the given id refers to one of the bootable volumes — used to
// enforce the mutual exclusion with the custom root disk (a volume boots from
// itself, so no new root volume is created).
export function isVolumeId(id: string | null, volumes: BootableVolume[]): boolean {
  return id != null && volumes.some((v) => v.id === id)
}
