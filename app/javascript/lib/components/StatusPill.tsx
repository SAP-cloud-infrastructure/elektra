import React from "react"

/**
 * Semantic category that drives a status pill's colour tint. The coloured dot
 * itself is rendered via the shared `state-<status>-icon` classes (see
 * `_monsoon_theme.scss`); the category only tints the capsule background.
 */
export type StatusCategory = "ok" | "active" | "error" | "busy" | "idle"

/**
 * Default status → category mapping covering the common OpenStack resource
 * statuses across block storage, compute, images, shared file storage, etc.
 * Plugins can extend/override this via the `categoryMap` prop.
 */
export const DEFAULT_STATUS_CATEGORY: Record<string, StatusCategory> = {
  // ready / healthy
  available: "ok",
  active: "ok",
  // in use / attached (occupied, not an alarm)
  "in-use": "active",
  attached: "active",
  // idle / offline / disabled
  detached: "idle",
  maintenance: "idle",
  deactivated: "idle",
  shutoff: "idle",
  suspended: "idle",
  paused: "idle",
  down: "idle",
  // error / gone
  error: "error",
  error_deleting: "error",
  "error_backing-up": "error",
  error_restoring: "error",
  error_extending: "error",
  killed: "error",
  deleted: "error",
  pending_delete: "error",
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
  queued: "busy",
  saving: "busy",
  importing: "busy",
  build: "busy",
}

/**
 * Turn a raw status like "error_deleting" / "in-use" / "ACTIVE" into a human
 * label: "Error deleting" / "In use" / "Active". Lower-cases first so that
 * already-upper-case statuses (e.g. networking "ACTIVE"/"DOWN") read nicely.
 */
export const humanizeStatus = (status: string): string => {
  const words = `${status}`.replace(/[_-]+/g, " ").trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

interface StatusPillProps {
  /** Raw resource status (e.g. "available", "in-use", "error_deleting"). */
  status: string
  /**
   * Per-plugin overrides/extensions of the status → category colour mapping.
   * Merged on top of DEFAULT_STATUS_CATEGORY.
   */
  categoryMap?: Record<string, StatusCategory>
  /** Override the displayed label (defaults to the humanised status). */
  label?: string
}

/**
 * A compact status pill: a humanised label in a tinted capsule, coloured by
 * the status' semantic category. Shared across plugins; reuses the
 * `.status-pill` styles from `_monsoon_theme.scss`.
 *
 * Usage:
 *   <StatusPill status={volume.status} />
 *   <StatusPill status={image.status} categoryMap={{ queued: "busy" }} />
 */
const StatusPill: React.FC<StatusPillProps> = ({ status, categoryMap, label }) => {
  if (!status) return null
  const map = categoryMap ? { ...DEFAULT_STATUS_CATEGORY, ...categoryMap } : DEFAULT_STATUS_CATEGORY
  // Status values can arrive in any case (e.g. networking "ACTIVE"/"DOWN"),
  // so look up the category case-insensitively.
  const key = `${status}`.toLowerCase()
  const category = map[key] || "idle"
  return <span className={`status-pill status-pill-${category}`}>{label || humanizeStatus(status)}</span>
}

export default StatusPill
