/**
 * Simple semver parsing and comparison utilities for Kubernetes versions
 */

export interface SemverParts {
  major: number
  minor: number
  patch: number
}

/**
 * Parse a semantic version string into its components
 * @param version - Version string (e.g., "1.27.0")
 * @returns Object with major, minor, patch numbers
 */
export function parseSemver(version: string): SemverParts {
  const parts = version.split(".").map(Number)
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  }
}

/**
 * Check if version v1 is greater than v2
 * @param v1 - First version string
 * @param v2 - Second version string
 * @returns true if v1 > v2
 */
export function semverGt(v1: string, v2: string): boolean {
  const a = parseSemver(v1)
  const b = parseSemver(v2)
  if (a.major !== b.major) return a.major > b.major
  if (a.minor !== b.minor) return a.minor > b.minor
  return a.patch > b.patch
}

/**
 * Get the semantic version difference type between two versions
 * @param v1 - First version string
 * @param v2 - Second version string
 * @returns 'major', 'minor', 'patch', or null if equal
 */
export function semverDiff(v1: string, v2: string): "patch" | "minor" | "major" | null {
  const a = parseSemver(v1)
  const b = parseSemver(v2)
  if (a.major !== b.major) return "major"
  if (a.minor !== b.minor) return "minor"
  if (a.patch !== b.patch) return "patch"
  return null
}

/**
 * Validate if a minor version upgrade is to the next minor version only
 * Gardener constraint: Can only upgrade one minor version at a time
 * @param currentVersion - Current version string
 * @param targetVersion - Target version string
 * @returns true if target is exactly the next minor version
 */
export function isNextMinorVersion(currentVersion: string, targetVersion: string): boolean {
  const current = parseSemver(currentVersion)
  const target = parseSemver(targetVersion)

  // For minor upgrades, must be exactly +1 and same major version
  return target.minor - current.minor === 1 && target.major === current.major
}

