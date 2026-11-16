import { Flavor } from "../../../types/formOptions"
import { flavorHypervisor } from "./imageGrouping"

// Disk-less flavors (Nova disk == 0, kvm/vmware only) force a custom root disk,
// prefilled with this size; the size must be strictly greater than the minimum.
export const DEFAULT_ROOT_DISK_SIZE = 64
export const MIN_ROOT_DISK_SIZE = 10

export type RootDiskMode = "hidden" | "optional" | "forced"

// How the custom-root-disk control behaves for the selected flavor, mirroring
// the legacy renderImages/forceCustomRootDisk logic:
//   - baremetal (or no/unknown flavor) → hidden (no custom root disk)
//   - kvm/vmware with disk > 0         → optional (checkbox shown)
//   - kvm/vmware with disk == 0        → forced (checkbox hidden, always on)
export function rootDiskMode(flavor: Flavor | undefined): RootDiskMode {
  const hv = flavorHypervisor(flavor)
  if (hv !== "kvm" && hv !== "vmware") return "hidden"
  return flavor?.disk === 0 ? "forced" : "optional"
}

// Validation error for the custom root disk size, mirroring handleDiskSizeChange
// and the legacy model's numericality rule: empty, non-numeric, or <= 10 is
// invalid. Returns undefined when the value is acceptable.
export function rootDiskSizeError(size: string): string | undefined {
  const value = Number(size)
  if (size.trim() === "" || Number.isNaN(value) || value <= MIN_ROOT_DISK_SIZE) {
    return `Root disk size must be a number greater than ${MIN_ROOT_DISK_SIZE} GB`
  }
  return undefined
}
