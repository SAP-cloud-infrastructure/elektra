/**
 * Maintenance Time Utilities
 *
 * Utilities for converting between maintenance time formats:
 * - Display format: HH:MM (e.g., "22:00")
 * - API format: HHMMSS+HHMM (e.g., "220000+0100")
 */

/**
 * Format time to HHMMSS+HHMM format for API
 * @param hours - Hours (00-23)
 * @param minutes - Minutes (00-59)
 * @param timezone - Timezone in format +HHMM or -HHMM (e.g., "+0100")
 * @returns Formatted time string
 * @example formatMaintenanceTime("22", "00", "+0100") → "220000+0100"
 */
export function formatMaintenanceTime(hours: string, minutes: string, timezone: string): string {
  // Ensure hours and minutes are zero-padded
  const paddedHours = hours.padStart(2, "0")
  const paddedMinutes = minutes.padStart(2, "0")
  // Remove colon from timezone if present (convert +01:00 to +0100)
  const normalizedTimezone = timezone.replace(":", "")
  return `${paddedHours}${paddedMinutes}00${normalizedTimezone}`
}

/**
 * Calculate end time based on start time and duration
 * Handles day wraparound (e.g., 23:00 + 2 hours = 01:00 next day)
 * @param startTime - Start time in format HHMMSS+HHMM
 * @param timezone - Timezone in format +HHMM or -HHMM
 * @param durationMinutes - Duration in minutes
 * @returns End time in format HHMMSS+HHMM
 * @example calculateEndTime("220000+0100", "+0100", 120) → "000000+0100"
 */
export function calculateEndTime(startTime: string, timezone: string, durationMinutes: number): string {
  // Parse HHMMSS format
  const match = startTime.match(/^(\d{2})(\d{2})/)
  if (!match) return startTime

  const startHours = parseInt(match[1], 10)
  const startMinutes = parseInt(match[2], 10)

  // Calculate total minutes from midnight
  const totalStartMinutes = startHours * 60 + startMinutes
  const totalEndMinutes = totalStartMinutes + durationMinutes

  // Handle day wraparound with modulo
  const endMinutesInDay = totalEndMinutes % (24 * 60)

  const endHours = Math.floor(endMinutesInDay / 60)
  const endMinutes = endMinutesInDay % 60

  return formatMaintenanceTime(endHours.toString(), endMinutes.toString(), timezone)
}

/**
 * Calculate duration in minutes between two times in HH:MM format
 * Handles day wraparound (e.g., 23:00 to 01:00 = 120 minutes)
 * @param startTime - Start time in format HH:MM
 * @param endTime - End time in format HH:MM
 * @returns Duration in minutes
 * @example calculateDurationFromFormattedTimes("22:00", "01:00") → 180
 */
export function calculateDurationFromFormattedTimes(startTime: string, endTime: string): number {
  const startParts = parseTimeString(startTime)
  const endParts = parseTimeString(endTime)

  if (!startParts || !endParts) return 60

  const startHours = parseInt(startParts.hours, 10)
  const startMinutes = parseInt(startParts.minutes, 10)
  const endHours = parseInt(endParts.hours, 10)
  const endMinutes = parseInt(endParts.minutes, 10)

  const totalStartMinutes = startHours * 60 + startMinutes
  const totalEndMinutes = endHours * 60 + endMinutes

  // Handle day wraparound
  if (totalEndMinutes >= totalStartMinutes) {
    return totalEndMinutes - totalStartMinutes
  } else {
    // End time is next day
    return 24 * 60 - totalStartMinutes + totalEndMinutes
  }
}

/**
 * Validate timezone format [+|-]HH:MM
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 * @example validateTimezone("+01:00") → true
 * @example validateTimezone("ABC") → false
 */
export function validateTimezone(timezone: string): boolean {
  const pattern = /^([+-])(\d{2}):(\d{2})$/
  return pattern.test(timezone)
}

/**
 * Parse timezone into components
 * @param timezone - Timezone string in format +HH:MM or -HH:MM
 * @returns Object with sign, hours, and minutes components, or null if invalid
 * @example parseTimezone("+01:00") → { sign: "+", hours: "01", minutes: "00" }
 */
export function parseTimezone(timezone: string): { sign: string; hours: string; minutes: string } | null {
  const pattern = /^([+-])(\d{2}):(\d{2})$/
  const match = timezone.match(pattern)
  if (!match) return null
  return {
    sign: match[1],
    hours: match[2],
    minutes: match[3],
  }
}

/**
 * Format timezone from +HHMM to +HH:MM display format
 * @param timezone - Timezone in format +HHMM or -HHMM (no colon)
 * @returns Timezone in format +HH:MM or -HH:MM (with colon)
 * @example formatTimezoneDisplay("+0100") → "+01:00"
 */
export function formatTimezoneDisplay(timezone: string): string {
  if (!timezone) return "+00:00"
  const pattern = /^([+-])(\d{2})(\d{2})$/
  const match = timezone.match(pattern)
  if (!match) return timezone
  return `${match[1]}${match[2]}:${match[3]}`
}

/**
 * Parse time string from HH:MM format to components
 * @param timeString - Time string in HH:MM format
 * @returns Object with hours and minutes, or null if invalid
 * @example parseTimeString("22:00") → { hours: "22", minutes: "00" }
 */
export function parseTimeString(timeString: string): { hours: string; minutes: string } | null {
  if (!timeString) return null
  const match = timeString.match(/^(\d{2}):(\d{2})$/)
  if (!match) return null
  return {
    hours: match[1],
    minutes: match[2],
  }
}
