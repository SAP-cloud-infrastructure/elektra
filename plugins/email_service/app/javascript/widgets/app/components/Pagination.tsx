import React, { useMemo, useEffect } from "react"
import { Spinner } from "@cloudoperators/juno-ui-components"

interface PageOptions {
  page: number
  pageSize: number
}

interface PaginationProps {
  hits: number
  onChanged: (options: PageOptions) => void
  isFetching: boolean
  pageOptions: PageOptions
  disabled?: boolean
}

const pageSizeOptions = ["15", "30", "50", "100"]

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "4px 12px",
  borderRadius: 4,
  border: "1px solid var(--color-border, #e0e0e0)",
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.4 : 1,
  background: "none",
  fontSize: 13,
})

const Pagination: React.FC<PaginationProps> = ({ hits, onChanged, isFetching, pageOptions, disabled }) => {
  const { page, pageSize } = pageOptions

  useEffect(() => {
    if (onChanged) onChanged({ page, pageSize })
  }, [page, pageSize])

  const validHits = useMemo(() => hits || 0, [hits])
  const totalPages = useMemo(() => Math.ceil(validHits / pageSize), [validHits, pageSize])

  const onPrevChanged = () => {
    if (page > 1) onChanged({ ...pageOptions, page: page - 1 })
  }

  const onNextChanged = () => {
    if (page < totalPages) onChanged({ ...pageOptions, page: page + 1 })
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderTop: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <span style={{ color: "var(--color-text-lighter, #666)" }}>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onChanged({ page: 1, pageSize: Number(e.target.value) })}
          disabled={disabled}
          style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--color-border, #e0e0e0)", fontSize: 13, cursor: disabled ? "default" : "pointer" }}
        >
          {pageSizeOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
        <span style={{ color: "var(--color-text-lighter, #666)" }}>{validHits} total</span>
        {isFetching && <Spinner size="small" />}
        <button onClick={onPrevChanged} disabled={page === 1 || disabled} style={btnStyle(page === 1 || !!disabled)}>‹ Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={onNextChanged} disabled={page === totalPages || disabled} style={btnStyle(page === totalPages || !!disabled)}>Next ›</button>
      </div>
    </div>
  )
}

export default Pagination
