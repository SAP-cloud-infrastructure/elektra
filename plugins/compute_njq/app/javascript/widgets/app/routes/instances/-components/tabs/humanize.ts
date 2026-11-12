// Mirrors Rails' String#humanize for the small set of status / task_state
// strings the Information tab renders (e.g. "shutoff" -> "Shutoff",
// "powering-on" -> "Powering on"). Underscores/dashes become spaces and the
// first letter is capitalised.
export function humanize(value: string): string {
  const spaced = value.replace(/[_-]+/g, " ").trim().toLowerCase()
  if (!spaced) return ""
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
