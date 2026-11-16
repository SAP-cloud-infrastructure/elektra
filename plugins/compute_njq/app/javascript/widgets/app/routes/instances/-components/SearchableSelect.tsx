import { useEffect, useRef, useState } from "react"

interface SearchableSelectProps<T> {
  options: T[]
  value: string | null
  onChange: (value: string) => void
  getLabel: (option: T) => string
  getValue: (option: T) => string
  // When provided, the parent owns filtering (server-side search, e.g. images).
  onSearch?: (query: string) => void
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
  const visible = onSearch ? options : options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))

  const selectedLabel = value != null ? options.find((o) => getValue(o) === value) : undefined
  const buttonText = selectedLabel ? getLabel(selectedLabel) : placeholder

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
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
          {isLoading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="text-muted px-2 py-1">{emptyMessage}</div>
          ) : (
            <ul className="list-group list-group-flush">
              {visible.map((o) => (
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
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
