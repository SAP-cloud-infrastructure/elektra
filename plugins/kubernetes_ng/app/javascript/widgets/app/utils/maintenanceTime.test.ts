import { describe, it, expect } from "vitest"
import {
  formatMaintenanceTime,
  calculateEndTime,
  calculateDurationFromFormattedTimes,
  validateTimezone,
  parseTimezone,
  formatTimezoneDisplay,
  parseTimeString,
} from "./maintenanceTime"

describe("formatMaintenanceTime", () => {
  it("formats time with timezone correctly", () => {
    expect(formatMaintenanceTime("22", "00", "+0100")).toBe("220000+0100")
  })

  it("pads single-digit hours and minutes", () => {
    expect(formatMaintenanceTime("9", "5", "+0100")).toBe("090500+0100")
  })

  it("removes colon from timezone", () => {
    expect(formatMaintenanceTime("22", "00", "+01:00")).toBe("220000+0100")
  })

  it("handles negative timezone", () => {
    expect(formatMaintenanceTime("17", "30", "-0500")).toBe("173000-0500")
  })
})

describe("calculateEndTime", () => {
  it("calculates end time without wraparound", () => {
    expect(calculateEndTime("220000+0100", "+0100", 60)).toBe("230000+0100")
  })

  it("handles day wraparound", () => {
    expect(calculateEndTime("230000+0100", "+0100", 120)).toBe("010000+0100")
  })

  it("handles midnight crossing", () => {
    expect(calculateEndTime("235900+0100", "+0100", 2)).toBe("000100+0100")
  })

  it("handles duration of 0 minutes", () => {
    expect(calculateEndTime("220000+0100", "+0100", 0)).toBe("220000+0100")
  })

  it("handles full day duration", () => {
    expect(calculateEndTime("220000+0100", "+0100", 1440)).toBe("220000+0100")
  })

  it("returns original time if invalid format", () => {
    expect(calculateEndTime("invalid", "+0100", 60)).toBe("invalid")
  })
})

describe("calculateDurationFromFormattedTimes", () => {
  it("calculates duration without wraparound", () => {
    expect(calculateDurationFromFormattedTimes("22:00", "23:00")).toBe(60)
  })

  it("handles day wraparound", () => {
    expect(calculateDurationFromFormattedTimes("22:00", "01:00")).toBe(180)
  })

  it("handles same start and end time", () => {
    expect(calculateDurationFromFormattedTimes("22:00", "22:00")).toBe(0)
  })

  it("handles minutes correctly", () => {
    expect(calculateDurationFromFormattedTimes("22:30", "23:45")).toBe(75)
  })

  it("handles wraparound with minutes", () => {
    expect(calculateDurationFromFormattedTimes("23:30", "01:15")).toBe(105)
  })

  it("returns 60 for invalid start time", () => {
    expect(calculateDurationFromFormattedTimes("invalid", "23:00")).toBe(60)
  })

  it("returns 60 for invalid end time", () => {
    expect(calculateDurationFromFormattedTimes("22:00", "invalid")).toBe(60)
  })

  it("returns 60 for empty strings", () => {
    expect(calculateDurationFromFormattedTimes("", "")).toBe(60)
  })
})

describe("validateTimezone", () => {
  it("validates correct positive timezone", () => {
    expect(validateTimezone("+01:00")).toBe(true)
  })

  it("validates correct negative timezone", () => {
    expect(validateTimezone("-05:00")).toBe(true)
  })

  it("validates zero timezone", () => {
    expect(validateTimezone("+00:00")).toBe(true)
  })

  it("rejects timezone without colon", () => {
    expect(validateTimezone("+0100")).toBe(false)
  })

  it("rejects timezone without sign", () => {
    expect(validateTimezone("01:00")).toBe(false)
  })

  it("rejects invalid format", () => {
    expect(validateTimezone("ABC")).toBe(false)
  })

  it("rejects timezone with wrong digit count", () => {
    expect(validateTimezone("+1:00")).toBe(false)
    expect(validateTimezone("+01:0")).toBe(false)
  })
})

describe("parseTimezone", () => {
  it("parses positive timezone", () => {
    expect(parseTimezone("+01:00")).toEqual({
      sign: "+",
      hours: "01",
      minutes: "00",
    })
  })

  it("parses negative timezone", () => {
    expect(parseTimezone("-05:30")).toEqual({
      sign: "-",
      hours: "05",
      minutes: "30",
    })
  })

  it("returns null for invalid format", () => {
    expect(parseTimezone("invalid")).toBe(null)
  })

  it("returns null for timezone without colon", () => {
    expect(parseTimezone("+0100")).toBe(null)
  })
})

describe("formatTimezoneDisplay", () => {
  it("formats timezone with colon", () => {
    expect(formatTimezoneDisplay("+0100")).toBe("+01:00")
  })

  it("formats negative timezone", () => {
    expect(formatTimezoneDisplay("-0530")).toBe("-05:30")
  })

  it("returns default for empty string", () => {
    expect(formatTimezoneDisplay("")).toBe("+00:00")
  })

  it("returns original for invalid format", () => {
    expect(formatTimezoneDisplay("invalid")).toBe("invalid")
  })

  it("handles timezone already with colon", () => {
    expect(formatTimezoneDisplay("+01:00")).toBe("+01:00")
  })
})

describe("parseTimeString", () => {
  it("parses valid time", () => {
    expect(parseTimeString("22:00")).toEqual({
      hours: "22",
      minutes: "00",
    })
  })

  it("parses time with non-zero minutes", () => {
    expect(parseTimeString("09:30")).toEqual({
      hours: "09",
      minutes: "30",
    })
  })

  it("returns null for invalid format", () => {
    expect(parseTimeString("invalid")).toBe(null)
  })

  it("returns null for time without colon", () => {
    expect(parseTimeString("2200")).toBe(null)
  })

  it("returns null for empty string", () => {
    expect(parseTimeString("")).toBe(null)
  })

  it("returns null for single digit hours", () => {
    expect(parseTimeString("9:00")).toBe(null)
  })
})
