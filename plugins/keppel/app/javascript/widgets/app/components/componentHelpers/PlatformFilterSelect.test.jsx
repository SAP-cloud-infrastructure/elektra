import { getPlatformFilterDisplayText, getPlatformFilterKeyForForm } from "./PlatformFilterSelect"
import { PLATFORM_FILTER_OPTIONS } from "../../constants"

describe("getPlatformFilterDisplayText", () => {
  it("returns empty string for no filter (all platforms)", () => {
    expect(getPlatformFilterDisplayText([])).toBe("")
    expect(getPlatformFilterDisplayText(null)).toBe("")
    expect(getPlatformFilterDisplayText(undefined)).toBe("")
  })

  it("returns correct display text for linux_amd64 filter", () => {
    const filter = [{ os: "linux", architecture: "amd64" }]
    expect(getPlatformFilterDisplayText(filter)).toBe(PLATFORM_FILTER_OPTIONS.linux_amd64.displayText)
  })

  it("returns correct display text for linux_amd64_extended filter", () => {
    const filter = [
      { os: "linux", architecture: "amd64" },
      { os: "unknown", architecture: "unknown" },
    ]
    expect(getPlatformFilterDisplayText(filter)).toBe(PLATFORM_FILTER_OPTIONS.linux_amd64_extended.displayText)
  })

  it("returns correct display text for linux_amd64_extended filter with swapped order", () => {
    const filter = [
      { os: "unknown", architecture: "unknown" },
      { os: "linux", architecture: "amd64" },
    ]
    expect(getPlatformFilterDisplayText(filter)).toBe(PLATFORM_FILTER_OPTIONS.linux_amd64_extended.displayText)
  })

  it("returns generic text for unknown custom filter", () => {
    const filter = [{ os: "windows", architecture: "arm64" }]
    expect(getPlatformFilterDisplayText(filter)).toBe(", with custom platform filter for multi-arch images")
  })
})

describe("getPlatformFilterKeyForForm", () => {
  it("returns default key for empty/null filter", () => {
    expect(getPlatformFilterKeyForForm([])).toBe("all")
    expect(getPlatformFilterKeyForForm(null)).toBe("all")
    expect(getPlatformFilterKeyForForm(undefined)).toBe("all")
  })

  it("returns matching key for known filter", () => {
    const filter = [{ os: "linux", architecture: "amd64" }]
    expect(getPlatformFilterKeyForForm(filter)).toBe("linux_amd64")
  })

  it("returns default key for unknown custom filter", () => {
    const filter = [{ os: "windows", architecture: "arm64" }]
    // Ensures that filter can be succesfully changed if the API provided filter is not known to the UI.
    expect(getPlatformFilterKeyForForm(filter)).toBe("all")
  })
})
