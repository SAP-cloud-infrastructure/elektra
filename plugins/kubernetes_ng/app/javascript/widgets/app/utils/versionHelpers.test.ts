import { parseSemver, semverGt, semverDiff, isNextMinorVersion } from "./versionHelpers"

describe("versionHelpers", () => {
  describe("parseSemver", () => {
    it("should parse a standard semver string", () => {
      expect(parseSemver("1.27.5")).toEqual({ major: 1, minor: 27, patch: 5 })
    })

    it("should parse version with leading zeros", () => {
      expect(parseSemver("1.02.03")).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it("should handle missing patch version", () => {
      expect(parseSemver("1.27")).toEqual({ major: 1, minor: 27, patch: 0 })
    })

    it("should handle missing minor and patch", () => {
      expect(parseSemver("2")).toEqual({ major: 2, minor: 0, patch: 0 })
    })
  })

  describe("semverGt", () => {
    it("should return true when major version is greater", () => {
      expect(semverGt("2.0.0", "1.99.99")).toBe(true)
    })

    it("should return true when minor version is greater", () => {
      expect(semverGt("1.28.0", "1.27.5")).toBe(true)
    })

    it("should return true when patch version is greater", () => {
      expect(semverGt("1.27.5", "1.27.4")).toBe(true)
    })

    it("should return false when versions are equal", () => {
      expect(semverGt("1.27.5", "1.27.5")).toBe(false)
    })

    it("should return false when first version is less", () => {
      expect(semverGt("1.27.4", "1.27.5")).toBe(false)
      expect(semverGt("1.26.5", "1.27.0")).toBe(false)
      expect(semverGt("1.27.5", "2.0.0")).toBe(false)
    })

    it("should handle versions with different lengths", () => {
      expect(semverGt("1.28.0", "1.27")).toBe(true)
      expect(semverGt("2.0", "1.27.5")).toBe(true)
    })
  })

  describe("semverDiff", () => {
    it("should return 'major' when major versions differ", () => {
      expect(semverDiff("2.0.0", "1.27.5")).toBe("major")
      expect(semverDiff("1.0.0", "2.5.3")).toBe("major")
    })

    it("should return 'minor' when only minor versions differ", () => {
      expect(semverDiff("1.28.0", "1.27.5")).toBe("minor")
      expect(semverDiff("1.27.0", "1.28.5")).toBe("minor")
    })

    it("should return 'patch' when only patch versions differ", () => {
      expect(semverDiff("1.27.5", "1.27.4")).toBe("patch")
      expect(semverDiff("1.27.1", "1.27.0")).toBe("patch")
    })

    it("should return null when versions are equal", () => {
      expect(semverDiff("1.27.5", "1.27.5")).toBe(null)
    })

    it("should handle versions with different lengths", () => {
      expect(semverDiff("1.28.0", "1.27")).toBe("minor")
      expect(semverDiff("1.27.1", "1.27")).toBe("patch")
    })
  })

  describe("isNextMinorVersion", () => {
    it("should return true for next minor version", () => {
      expect(isNextMinorVersion("1.27.5", "1.28.0")).toBe(true)
      expect(isNextMinorVersion("1.27.5", "1.28.3")).toBe(true)
    })

    it("should return false when skipping minor versions", () => {
      expect(isNextMinorVersion("1.27.5", "1.29.0")).toBe(false)
      expect(isNextMinorVersion("1.25.0", "1.27.0")).toBe(false)
    })

    it("should return false for same minor version", () => {
      expect(isNextMinorVersion("1.27.5", "1.27.6")).toBe(false)
    })

    it("should return false for major version change", () => {
      expect(isNextMinorVersion("1.27.5", "2.0.0")).toBe(false)
      expect(isNextMinorVersion("1.27.5", "2.28.0")).toBe(false)
    })

    it("should return false for downgrade", () => {
      expect(isNextMinorVersion("1.27.5", "1.26.0")).toBe(false)
    })

    it("should handle versions with different patch numbers", () => {
      expect(isNextMinorVersion("1.27.0", "1.28.5")).toBe(true)
      expect(isNextMinorVersion("1.27.3", "1.28.0")).toBe(true)
    })
  })
})
