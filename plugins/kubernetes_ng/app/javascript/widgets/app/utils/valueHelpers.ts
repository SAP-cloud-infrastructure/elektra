/**
 * Normalize a value for display in UI
 * - Converts booleans to strings
 * - Returns "-" for empty/null/undefined values
 */
export function normalizeDisplayValue(value: unknown): React.ReactNode {
  // Normalize booleans
  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  // Detect emptiness
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)

  return isEmpty ? "-" : value
}
