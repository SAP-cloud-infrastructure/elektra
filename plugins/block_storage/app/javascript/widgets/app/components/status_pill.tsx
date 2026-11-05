import React from "react"

// Maps a raw OpenStack block-storage status to a semantic category that drives
// the pill's colour. The dot itself still uses the shared `state-<status>-icon`
// classes (see _monsoon_theme.scss); the category only tints the pill.
type Category = "ok" | "error" | "busy" | "idle" | "active"

const CATEGORY_BY_STATUS: Record<string, Category> = {
  // ready / healthy
  available: "ok",
  // attached / in use (active, occupied — not an alarm)
  "in-use": "active",
  attached: "active",
  // idle / offline
  detached: "idle",
  maintenance: "idle",
  // error states
  error: "error",
  error_deleting: "error",
  "error_backing-up": "error",
  error_restoring: "error",
  error_extending: "error",
  // transient / in progress
  creating: "busy",
  deleting: "busy",
  attaching: "busy",
  detaching: "busy",
  extending: "busy",
  retyping: "busy",
  uploading: "busy",
  downloading: "busy",
  "backing-up": "busy",
  "restoring-backup": "busy",
  restoring: "busy",
  unmanaging: "busy",
  "awaiting-transfer": "busy",
  reserved: "busy",
}

// Turn "error_deleting" / "in-use" / "backing-up" into "Error deleting" /
// "In use" / "Backing up" for display.
const humanize = (status: string): string => {
  const words = status.replace(/[_-]+/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

interface StatusPillProps {
  status: string
}

/**
 * A compact status pill: a coloured dot + humanised label in a tinted capsule.
 * Reuses the shared `state-<status>-icon` dot colours from _monsoon_theme.scss.
 */
const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  if (!status) return null
  const category = CATEGORY_BY_STATUS[status] || "idle"
  return (
    <span className={`status-pill status-pill-${category}`}>
      <span className={`state-${status}-icon status-pill-dot`} />
      {humanize(status)}
    </span>
  )
}

export default StatusPill
