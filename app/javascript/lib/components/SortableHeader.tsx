import React from "react"
import { InfoTooltip } from "lib/components/InfoTooltip"

/**
 * Sort direction for a sortable table column.
 */
export type SortDirection = "asc" | "desc"

/**
 * The current sort state of a table: which column drives the sort and in which
 * direction. `column` is null when the table is in its original (unsorted)
 * order.
 */
export interface SortState {
  column: string | null
  direction: SortDirection
}

export interface SortableHeaderProps {
  /** Visible column label. */
  label: string
  /** Stable column key compared against `sort.column`. */
  column: string
  /** Current table sort state. */
  sort: SortState
  /** Invoked with this column's key when the header is clicked. */
  onSort: (column: string) => void
  /** Optional extra class on the <th>. */
  className?: string
  /**
   * Optional extra element rendered between the label and the sort arrow
   * (e.g. an info tooltip explaining an abbreviated column name). It is wrapped
   * so that interacting with it (hover/click) does not trigger a sort.
   */
  icon?: React.ReactNode
  /**
   * Optional explanatory tooltip shown (as a native title) when hovering the
   * column label — useful for abbreviated or ambiguous headers.
   */
  tooltip?: string
}

/**
 * A sortable `<th>` with a sort affordance icon, matching the look used across
 * the dashboard (e.g. the networking ports list): a neutral `fa-sort` icon when
 * the column is inactive (dimmed) and `fa-sort-asc` / `fa-sort-desc` when it
 * drives the current sort.
 *
 * This component is purely presentational: it renders the header and reports
 * clicks via `onSort`. The owning table keeps the `SortState` and performs the
 * actual sorting, so it stays agnostic to data shape and sort strategy. A
 * common click cycle is asc → desc → unsorted.
 */
export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  column,
  sort,
  onSort,
  className,
  icon,
  tooltip,
}) => {
  const active = sort.column === column
  const iconClass = !active ? "fa-sort" : sort.direction === "asc" ? "fa-sort-asc" : "fa-sort-desc"

  return (
    <th className={className}>
      <span style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
        {tooltip ? (
          <InfoTooltip content={tooltip} maxWidth="18rem">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onSort(column)
              }}
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            >
              {label}
            </a>
          </InfoTooltip>
        ) : (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onSort(column)
            }}
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            {label}
          </a>
        )}
        {/* Info icon sits between the label and the sort arrow; clicks on it
            must not trigger a sort. */}
        {icon && <span onClick={(e) => e.stopPropagation()}>{icon}</span>}
        <a
          href="#"
          aria-label={`Sort by ${label}`}
          onClick={(e) => {
            e.preventDefault()
            onSort(column)
          }}
          style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
        >
          <i className={`fa ${iconClass}`} style={{ opacity: active ? 1 : 0.4 }} />
        </a>
      </span>
    </th>
  )
}

export default SortableHeader
