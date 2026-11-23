import React, { useEffect, useRef, useState } from "react"

interface MultiSelectProps<T> {
  options: T[]
  // The currently selected option values.
  value: string[]
  onChange: (value: string[]) => void
  getLabel: (option: T) => string
  getValue: (option: T) => string
  // When provided, visible options are rendered under non-clickable group
  // headers (e.g. security groups grouped by project). Empty groups are dropped.
  getGroups?: (options: T[]) => { label: string; options: T[] }[]
  // Fires the first time the dropdown is opened, so the parent can lazy-load the
  // options on demand (mirrors the single SearchableSelect open-to-load pattern).
  onOpen?: () => void
  isLoading?: boolean
  // When true the trigger is disabled and the panel cannot be opened (e.g. while
  // the parent is still loading the options or the current selection).
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
  // How many selected names to list in the trigger before collapsing to a
  // "N selected" summary. Defaults to 3.
  selectedLabelLength?: number
  // Optional id, forwarded to the trigger button (e.g. for an external label).
  id?: string
}

// Generic, prop-driven checkbox multi-select. Mirrors the look of the single
// SearchableSelect (a `form-select` trigger + a dropdown panel with a search
// box and a scrollable `list-group`), but each option carries a checkbox and
// selection is an array of values. Standalone: no form-context coupling.
export function MultiSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  getGroups,
  onOpen,
  isLoading,
  disabled,
  placeholder = "Select…",
  emptyMessage = "No options",
  selectedLabelLength = 3,
  id,
}: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const openedOnce = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // Toggle the panel; fire onOpen only on the first open (lazy-load trigger).
  const toggleOpen = () => {
    if (disabled) return
    setOpen((o) => {
      const next = !o
      if (next && !openedOnce.current) {
        openedOnce.current = true
        onOpen?.()
      }
      return next
    })
  }

  const selected = new Set(value)

  const toggle = (optionValue: string) => {
    const next = new Set(selected)
    if (next.has(optionValue)) next.delete(optionValue)
    else next.add(optionValue)
    onChange([...next])
  }

  const matchesQuery = (o: T) => getLabel(o).toLowerCase().includes(query.toLowerCase())

  // Ungrouped lists are alphabetical so long lists stay scannable (matches
  // SearchableSelect); grouped lists keep the order the grouping fn returns.
  const filtered = options.filter(matchesQuery)
  const visible = getGroups ? filtered : [...filtered].sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
  const groups = getGroups ? getGroups(visible) : undefined

  // Trigger summary: list the selected names (alphabetically, matching the
  // option list), collapsing to "N selected" once there are more than
  // `selectedLabelLength`.
  const selectedNames = options
    .filter((o) => selected.has(getValue(o)))
    .map(getLabel)
    .sort((a, b) => a.localeCompare(b))
  const triggerText =
    selectedNames.length === 0
      ? placeholder
      : selectedNames.length > selectedLabelLength
        ? `${selectedNames.length} selected`
        : selectedNames.join(", ")

  const renderOption = (o: T) => {
    const optionValue = getValue(o)
    const checked = selected.has(optionValue)
    return (
      <li
        key={optionValue}
        className="list-group-item list-group-item-action"
        role="option"
        aria-selected={checked}
        onClick={() => toggle(optionValue)}
      >
        <span className="form-check mb-0">
          {/* The whole row toggles the value; the checkbox is a read-only visual
              indicator (pointer-events disabled so it never swallows the row
              click). */}
          <input
            type="checkbox"
            className="form-check-input me-2"
            style={{ pointerEvents: "none" }}
            checked={checked}
            readOnly
            tabIndex={-1}
          />
          {getLabel(o)}
        </span>
      </li>
    )
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        id={id}
        type="button"
        className={`form-select w-100 text-start${selectedNames.length === 0 && !isLoading ? " text-muted" : ""}`}
        onClick={toggleOpen}
        disabled={disabled}
      >
        {isLoading ? (
          <span className="text-muted">
            <span className="spinner spinner-sm me-2" aria-hidden="true" />
            Loading…
          </span>
        ) : (
          triggerText
        )}
      </button>
      {open && (
        <div className="dropdown-menu show w-100 p-2">
          <input
            type="text"
            className="form-control mb-2"
            value={query}
            placeholder="Search…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {/* Keep the search box fixed and let only the option list scroll, so a
              long list never overflows the viewport. */}
          <div className="multi-select-options">
            {isLoading ? (
              <div className="px-2 py-1">
                <span className="spinner" role="status" aria-hidden="true" />
              </div>
            ) : visible.length === 0 ? (
              <div className="text-muted px-2 py-1">{emptyMessage}</div>
            ) : groups ? (
              <ul className="list-group list-group-flush">
                {groups.flatMap((g) => [
                  <li key={`group-${g.label}`} className="list-group-item disabled fw-bold text-muted" aria-disabled>
                    {g.label}
                  </li>,
                  ...g.options.map(renderOption),
                ])}
              </ul>
            ) : (
              <ul className="list-group list-group-flush">{visible.map(renderOption)}</ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
