import { useEffect, useRef, useState } from "react"
import { InlineLoading } from "./tabs/InlineLoading"

// An optional quick-filter chip shown above the option list. `matches` decides
// whether an option belongs to this facet. Multiple active facets combine with
// OR (an option shows if it matches any active facet); facets then combine with
// AND against the text query.
export interface Facet<T> {
  key: string
  label: string
  matches: (option: T) => boolean
}

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
  // Optional quick-filter chips shown under the search box. Empty facets (no
  // matching option) are dropped so only useful filters are offered.
  facets?: Facet<T>[]
  // By default an ungrouped list is sorted alphabetically for scannability. Set
  // this to keep the caller-provided order instead (e.g. AZs sorted descending
  // by the BFF).
  preserveOrder?: boolean
  // When set, the user may also type a free value: the search box doubles as the
  // input, the typed text is offered as a "Use …" option, and a value that is
  // not among the options is still shown on the trigger. `allowCustomLabel`
  // customises the "Use …" wording.
  allowCustom?: boolean
  allowCustomLabel?: (query: string) => string
  // When set, a "None" entry at the top of the list clears the current value
  // (only shown when a value is set). Use for optional fields.
  clearable?: boolean
  isLoading?: boolean
  // When set, the trigger is disabled (greyed out) and the list cannot open.
  // Used while a prerequisite is still unknown (e.g. the instance's hypervisor
  // type the resize targets are filtered by).
  disabled?: boolean
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
  facets,
  preserveOrder,
  allowCustom,
  allowCustomLabel,
  clearable,
  isLoading,
  disabled,
  placeholder,
  emptyMessage,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeFacets, setActiveFacets] = useState<Set<string>>(new Set())
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

  const toggleFacet = (key: string) =>
    setActiveFacets((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  // Only offer a facet when it actually splits the list — at least one option
  // matches AND at least one does not. A facet that matches everything (or
  // nothing) would be a no-op pill, so it is hidden. Keep an active facet shown
  // so toggling it off is always possible.
  const usableFacets = (facets ?? []).filter((f) => {
    if (activeFacets.has(f.key)) return true
    const matched = options.filter((o) => f.matches(o)).length
    return matched > 0 && matched < options.length
  })
  const active = (facets ?? []).filter((f) => activeFacets.has(f.key))

  // Local filtering only when the parent did not take over search.
  const byText = onSearch ? options : options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))
  // Active facets narrow further (OR among the active facets).
  const filtered = active.length === 0 ? byText : byText.filter((o) => active.some((f) => f.matches(o)))

  // Ungrouped, client-side lists without an inherent order (Key Pair, Network)
  // are sorted alphabetically by label to make long lists scannable. Grouped
  // lists, server-side-searched lists, and callers that opt in with
  // `preserveOrder` (e.g. AZs sorted by the BFF) keep their given order.
  const visible =
    getGroups || onSearch || preserveOrder
      ? filtered
      : [...filtered].sort((a, b) => getLabel(a).localeCompare(getLabel(b)))

  const selectedLabel = value != null ? options.find((o) => getValue(o) === value) : undefined
  // In allowCustom mode a value that is not among the options is a free entry;
  // show it verbatim on the trigger. Otherwise fall back to the placeholder.
  const hasValue = selectedLabel != null || (allowCustom && !!value)
  const buttonText = selectedLabel ? getLabel(selectedLabel) : allowCustom && value ? value : placeholder

  // Group the already-visible options; empty groups are dropped downstream.
  const groups = getGroups ? getGroups(visible) : undefined

  // In allowCustom mode, a typed query that is not already an exact option value
  // is offered as a "Use …" entry so it can be committed as a free value.
  const trimmedQuery = query.trim()
  const customOption =
    allowCustom && trimmedQuery !== "" && !options.some((o) => getValue(o) === trimmedQuery) ? trimmedQuery : null

  const commit = (v: string) => {
    onChange(v)
    setQuery("")
    setOpen(false)
  }

  const renderOption = (o: T) => (
    <li
      key={getValue(o)}
      className="list-group-item list-group-item-action"
      role="option"
      aria-selected={getValue(o) === value}
      onClick={() => commit(getValue(o))}
    >
      {getLabel(o)}
    </li>
  )

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className={`form-select w-100 text-start${hasValue ? "" : " text-muted"}`}
        disabled={disabled}
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
            placeholder={allowCustom ? "Type or search…" : "Search…"}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customOption) {
                e.preventDefault()
                commit(customOption)
              }
            }}
          />
          {usableFacets.length > 0 && (
            <div className="searchable-select-facets mb-2">
              {usableFacets.map((f) => {
                const on = activeFacets.has(f.key)
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={`badge rounded-pill searchable-select-facet${on ? " active" : ""}`}
                    aria-pressed={on}
                    onClick={() => toggleFacet(f.key)}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          )}
          {/* Keep the search box fixed and let only the option list scroll, so a
              long list (e.g. 100+ networks) never overflows the viewport. */}
          <div className="searchable-select-options">
            {/* Top entries: the typed free value (allowCustom) and a clear/none
                entry (allowCustom or clearable) when a value is set. */}
            {(customOption || ((allowCustom || clearable) && value)) && (
              <ul className="list-group list-group-flush">
                {customOption && (
                  <li
                    className="list-group-item list-group-item-action"
                    role="option"
                    aria-selected={value === customOption}
                    onClick={() => commit(customOption)}
                  >
                    {allowCustomLabel ? allowCustomLabel(customOption) : `Use “${customOption}”`}
                  </li>
                )}
                {(allowCustom || clearable) && value && (
                  <li
                    className="list-group-item list-group-item-action text-muted"
                    role="option"
                    aria-selected={false}
                    onClick={() => commit("")}
                  >
                    None
                  </li>
                )}
              </ul>
            )}
            {isLoading ? (
              <div className="px-2 py-1">
                <InlineLoading />
              </div>
            ) : visible.length === 0 ? (
              !allowCustom || !customOption ? <div className="text-muted px-2 py-1">{emptyMessage}</div> : null
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
