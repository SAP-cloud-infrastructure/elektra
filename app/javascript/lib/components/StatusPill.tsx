import React from "react"
import { renderToString } from "react-dom/server"
import { Tooltip } from "lib/components/Overlay"

/**
 * Semantic category that drives a status pill's colour tint.
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
  creating_from_snapshot: "busy",
  migrating: "busy",
  migrating_to: "busy",
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
  /**
   * Explicit semantic category; when given it wins over the status→category
   * mapping (useful when a derived state drives the colour).
   */
  category?: StatusCategory
  /** Override the displayed label (defaults to the humanised status). */
  label?: string
  /** Optional tooltip shown on hover. Pass a string or rich React content. */
  tooltip?: React.ReactNode
  /**
   * Visual variant: "solid" (default) is a tinted capsule; "outline" is a
   * low-key bordered capsule (no background), for secondary status values.
   */
  variant?: "solid" | "outline"
}

/**
 * A compact status pill: a humanised label in a tinted capsule, coloured by
 * the status' semantic category. Shared across plugins; reuses the
 * `.status-pill` styles from `_monsoon_theme.scss`.
 *
 * Usage:
 *   <StatusPill status={volume.status} />
 *   <StatusPill status={image.status} categoryMap={{ queued: "busy" }} />
 *   <StatusPill status={lb.operating_status} category="busy" tooltip={<...>} />
 *   <StatusPill status={replica.status} variant="outline" />
 */
const StatusPill: React.FC<StatusPillProps> = ({ status, categoryMap, category, label, tooltip, variant }) => {
  if (!status) return null
  const map = categoryMap ? { ...DEFAULT_STATUS_CATEGORY, ...categoryMap } : DEFAULT_STATUS_CATEGORY
  // Status values can arrive in any case (e.g. networking "ACTIVE"/"DOWN"),
  // so look up the category case-insensitively.
  const key = `${status}`.toLowerCase()
  const resolvedCategory = category || map[key] || "idle"
  const variantClass = variant === "outline" ? " status-pill-outline" : ""
  const pill = (
    <span className={`status-pill status-pill-${resolvedCategory}${variantClass}`}>{label || humanizeStatus(status)}</span>
  )

  if (!tooltip) return pill

  // Bootstrap's tooltip `title` must be a string (or element/function), not a
  // React node. Render rich React content to an HTML string and enable `html`;
  // plain strings are passed through as-is. Rich content is wrapped in a
  // left-aligned container (Bootstrap tooltips are centre-aligned by default,
  // and the tooltip renders in a body portal outside any plugin CSS scope).
  const isString = typeof tooltip === "string"
  const tooltipContent = isString
    ? tooltip
    : renderToString(<div style={{ textAlign: "left" }}>{tooltip}</div>)
  return (
    // @ts-expect-error lib/components/Overlay is untyped; container/delay are optional at runtime
    <Tooltip placement="top" content={tooltipContent} html={!isString}>
      <span>{pill}</span>
    </Tooltip>
  )
}

export default StatusPill
