import { useMemo } from "react"
import { semverGt, semverDiff, parseSemver } from "../utils/versionHelpers"

export interface AvailableUpdates {
  patch?: string[]
  minor?: string[]
  major?: string[]
}

/**
 * Sort versions in ascending order (oldest to newest)
 */
function sortVersions(versions: string[]): string[] {
  return versions.sort((a, b) => {
    const aParts = parseSemver(a)
    const bParts = parseSemver(b)

    if (aParts.major !== bParts.major) return aParts.major - bParts.major
    if (aParts.minor !== bParts.minor) return aParts.minor - bParts.minor
    return aParts.patch - bParts.patch
  })
}

/**
 * Groups available Kubernetes updates by semantic version type (patch, minor, major)
 *
 * @param currentVersion - The current cluster Kubernetes version
 * @param availableVersions - All available versions from cloud profile
 * @returns Grouped updates by type (sorted in ascending order), or null if no updates available
 */
export function useAvailableKubernetesUpdates(
  currentVersion: string | undefined,
  availableVersions: string[]
): AvailableUpdates | null {
  return useMemo(() => {
    if (!currentVersion) {
      return null
    }

    // Find all versions greater than current
    const newerVersions = availableVersions.filter((v) => semverGt(v, currentVersion))

    if (newerVersions.length === 0) {
      return null
    }

    // Group by semantic version diff type
    const grouped: AvailableUpdates = {}

    for (const version of newerVersions) {
      const diff = semverDiff(version, currentVersion)
      if (!diff) continue

      if (!grouped[diff]) {
        grouped[diff] = []
      }
      grouped[diff]!.push(version)
    }

    // Sort each group in ascending order
    if (grouped.patch) grouped.patch = sortVersions(grouped.patch)
    if (grouped.minor) grouped.minor = sortVersions(grouped.minor)
    if (grouped.major) grouped.major = sortVersions(grouped.major)

    return Object.keys(grouped).length > 0 ? grouped : null
  }, [currentVersion, availableVersions])
}

/**
 * Check if any patch version is available
 */
export function useIsPatchAvailable(updates: AvailableUpdates | null): boolean {
  return useMemo(() => {
    return updates?.patch !== undefined && updates.patch.length > 0
  }, [updates])
}

/**
 * Check if any minor upgrade is available
 */
export function useIsUpgradeAvailable(updates: AvailableUpdates | null): boolean {
  return useMemo(() => {
    return updates?.minor !== undefined && updates.minor.length > 0
  }, [updates])
}
