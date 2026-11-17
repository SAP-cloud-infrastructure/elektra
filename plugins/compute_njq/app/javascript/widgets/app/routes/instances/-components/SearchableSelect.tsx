import { useEffect, useRef, useState } from "react"
import { InlineLoading } from "./tabs/InlineLoading"

interface SearchableSelectProps<T> {
  options: T[]
  value: string | null
  onChange: (value: string) => void
  getLabel: (option: T) => string
  getValue: (option: T) => string
  // When provided, the parent owns filtering (server-side search, e.g. images).
  onSearch?: (query: string) => void
  // When provided, visible options are rendered under non-clickable group headers.
  getGroups?: (options: T[]) => { label: string; options: T[] }[]
  // By default an ungrouped list is sorted alphabetically for scannability. Set
  // this to keep the caller-provided order instead (e.g. AZs sorted descending
  // by the BFF).
  preserveOrder?: boolean
  isLoading?: boolean
  placeholder: string
  emptyMessage: string
}

export function SearchableSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  onSearch,
  getGroups,
  preserveOrder,
  isLoading,
  placeholder,
  emptyMessage,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  // Debounce server-side search so typing does not fire a request per keystroke.
  useEffect(() => {
    if (!onSearch) return
    const id = setTimeout(() => onSearch(query), 300)
    return () => clearTimeout(id)
  }, [query, onSearch])

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // Local filtering only when the parent did not take over search.
  const filtered = onSearch ? options : options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))

  // Ungrouped, client-side lists without an inherent order (Key Pair, Network)
  // are sorted alphabetically by label to make long lists scannable. Grouped
  // lists, server-side-searched lists, and callers that opt in with
  // `preserveOrder` (e.g. AZs sorted by the BFF) keep their given order.
  const visible =
    getGroups || onSearch || preserveOrder
      ? filtered
      : [...filtered].sort((a, b) => getLabel(a).localeCompare(getLabel(b)))

  const selectedLabel = value != null ? options.find((o) => getValue(o) === value) : undefined
  const buttonText = selectedLabel ? getLabel(selectedLabel) : placeholder

  // Group the already-visible options; empty groups are dropped downstream.
  const groups = getGroups ? getGroups(visible) : undefined

  const renderOption = (o: T) => (
    <li
      key={getValue(o)}
      className="list-group-item list-group-item-action"
      role="option"
      aria-selected={getValue(o) === value}
      onClick={() => {
        onChange(getValue(o))
        setOpen(false)
      }}
    >
      {getLabel(o)}
    </li>
  )

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className={`form-select w-100 text-start${selectedLabel ? "" : " text-muted"}`}
        onClick={() => setOpen((o) => !o)}
      >
        {buttonText}
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
              long list (e.g. 100+ networks) never overflows the viewport. */}
          <div className="searchable-select-options">
            {isLoading ? (
              <div className="px-2 py-1">
                <InlineLoading />
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
