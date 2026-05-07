/**
 * Maintenance Window Validation
 *
 * Form validation logic for maintenance window editing.
 * Follows Elektra's validation pattern used in ClusterWizard.
 */

import { validateTimezone } from "../../../../utils/maintenanceTime"

export type MaintenanceFormErrors = Record<string, string[]>

export type MaintenanceFormData = {
  startTime: string // HH:MM format
  timezone: string // +HH:MM or -HH:MM
  duration: number // minutes (30-360)
  autoUpdateKubernetes: boolean
  autoUpdateOS: boolean
}

/**
 * Validate maintenance form data
 * @param data - Form data to validate
 * @returns Object with field names as keys and error messages as values
 */
export const validateMaintenance = (data: MaintenanceFormData): MaintenanceFormErrors => {
  const errors: MaintenanceFormErrors = {}

  // Validate start time (HH:MM format)
  if (!data.startTime) {
    errors.startTime = ["Start time is required"]
  } else if (!isValidTime(data.startTime)) {
    errors.startTime = ["Invalid time format. Use HH:MM (e.g., 22:00)"]
  }

  // Validate timezone ([+|-]HH:MM format)
  if (!data.timezone) {
    errors.timezone = ["Timezone is required"]
  } else if (!validateTimezone(data.timezone)) {
    errors.timezone = ["Invalid timezone format. Use +HH:MM or -HH:MM (e.g., +01:00, -05:00)"]
  }

  // Validate duration (30-360 minutes)
  if (!data.duration && data.duration !== 0) {
    errors.duration = ["Duration is required"]
  } else if (isNaN(data.duration)) {
    errors.duration = ["Duration must be a number"]
  } else if (data.duration < 30) {
    errors.duration = ["Duration must be at least 30 minutes"]
  } else if (data.duration > 360) {
    errors.duration = ["Duration cannot exceed 360 minutes (6 hours)"]
  }

  return errors
}

/**
 * Helper: Validate time format HH:MM
 * Ensures hours are 00-23 and minutes are 00-59
 */
function isValidTime(time: string): boolean {
  const match = time.match(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/)
  return match !== null
}

/**
 * Validate a single field
 * @param fieldName - Name of the field to validate
 * @param data - Complete form data
 * @returns Array of error messages for the field
 */
export const validateSingleMaintenanceField = (
  fieldName: keyof MaintenanceFormData,
  data: MaintenanceFormData
): string[] => {
  const allErrors = validateMaintenance(data)
  return allErrors[fieldName] || []
}

/**
 * Check if form has any validation errors
 * @param errors - Validation errors object
 * @returns true if there are any errors, false otherwise
 */
export const hasValidationErrors = (errors: MaintenanceFormErrors): boolean => {
  return Object.values(errors).some((arr) => Array.isArray(arr) && arr.length > 0)
}
