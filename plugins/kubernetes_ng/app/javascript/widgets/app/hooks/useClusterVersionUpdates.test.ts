import { renderHook } from "@testing-library/react"
import { useAvailableKubernetesUpdates, useIsPatchAvailable, useIsUpgradeAvailable } from "./useClusterVersionUpdates"

describe("useClusterVersionUpdates", () => {
  const availableVersions = [
    "1.31.5",
    "1.31.0",
    "1.30.5",
    "1.30.0",
    "1.29.8",
    "1.29.0",
    "1.28.5",
    "1.28.2",
    "1.28.0",
    "1.27.5",
    "1.27.0",
  ]

  describe("useAvailableKubernetesUpdates", () => {
    it("should return null when current version is undefined", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates(undefined, availableVersions))
      expect(result.current).toBe(null)
    })

    it("should return null when no newer versions available", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.31.5", availableVersions))
      expect(result.current).toBe(null)
    })

    it("should group patch versions correctly", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.28.0", availableVersions))

      expect(result.current).not.toBe(null)
      expect(result.current?.patch).toEqual(["1.28.2", "1.28.5"])
    })

    it("should group minor versions correctly", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.28.5", availableVersions))

      expect(result.current).not.toBe(null)
      expect(result.current?.minor).toEqual(["1.29.0", "1.29.8", "1.30.0", "1.30.5", "1.31.0", "1.31.5"])
    })

    it("should group both patch and minor versions", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.28.0", availableVersions))

      expect(result.current).not.toBe(null)
      expect(result.current?.patch).toEqual(["1.28.2", "1.28.5"])
      expect(result.current?.minor).toEqual(["1.29.0", "1.29.8", "1.30.0", "1.30.5", "1.31.0", "1.31.5"])
    })

    it("should handle major version upgrades", () => {
      const versionsWithMajor = [...availableVersions, "2.0.0", "2.1.0"]
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.31.5", versionsWithMajor))

      expect(result.current).not.toBe(null)
      expect(result.current?.major).toEqual(["2.0.0", "2.1.0"])
    })

    it("should handle version at the beginning of list", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.27.0", availableVersions))

      expect(result.current).not.toBe(null)
      expect(result.current?.patch).toEqual(["1.27.5"])
      expect(result.current?.minor).toContain("1.28.0")
      expect(result.current?.minor).toContain("1.31.5")
    })

    it("should only include versions greater than current", () => {
      const { result } = renderHook(() => useAvailableKubernetesUpdates("1.29.5", availableVersions))

      expect(result.current).not.toBe(null)
      expect(result.current?.patch).toEqual(["1.29.8"])
      expect(result.current?.minor).toEqual(["1.30.0", "1.30.5", "1.31.0", "1.31.5"])

      // Should not include 1.27.x, 1.28.x, or 1.29.0 as they are less than or equal to current
      expect(result.current?.patch).not.toContain("1.29.0")
      expect(result.current?.minor).not.toContain("1.27.5")
      expect(result.current?.minor).not.toContain("1.28.5")
    })
  })

  describe("useIsPatchAvailable", () => {
    it("should return true when patch versions exist", () => {
      const updates = {
        patch: ["1.28.2", "1.28.5"],
        minor: ["1.29.0"],
      }
      const { result } = renderHook(() => useIsPatchAvailable(updates))
      expect(result.current).toBe(true)
    })

    it("should return false when no patch versions exist", () => {
      const updates = {
        minor: ["1.29.0", "1.30.0"],
      }
      const { result } = renderHook(() => useIsPatchAvailable(updates))
      expect(result.current).toBe(false)
    })

    it("should return false when updates is null", () => {
      const { result } = renderHook(() => useIsPatchAvailable(null))
      expect(result.current).toBe(false)
    })

    it("should return false when patch array is empty", () => {
      const updates = {
        patch: [],
        minor: ["1.29.0"],
      }
      const { result } = renderHook(() => useIsPatchAvailable(updates))
      expect(result.current).toBe(false)
    })
  })

  describe("useIsUpgradeAvailable", () => {
    it("should return true when minor versions exist", () => {
      const updates = {
        patch: ["1.28.2"],
        minor: ["1.29.0", "1.30.0"],
      }
      const { result } = renderHook(() => useIsUpgradeAvailable(updates))
      expect(result.current).toBe(true)
    })

    it("should return false when no minor versions exist", () => {
      const updates = {
        patch: ["1.28.2", "1.28.5"],
      }
      const { result } = renderHook(() => useIsUpgradeAvailable(updates))
      expect(result.current).toBe(false)
    })

    it("should return false when updates is null", () => {
      const { result } = renderHook(() => useIsUpgradeAvailable(null))
      expect(result.current).toBe(false)
    })

    it("should return false when minor array is empty", () => {
      const updates = {
        patch: ["1.28.2"],
        minor: [],
      }
      const { result } = renderHook(() => useIsUpgradeAvailable(updates))
      expect(result.current).toBe(false)
    })
  })
})
