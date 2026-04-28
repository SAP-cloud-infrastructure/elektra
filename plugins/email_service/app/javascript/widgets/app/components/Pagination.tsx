import React, { useMemo, useEffect } from "react"
import { Button, Select, SelectOption, Spinner } from "@cloudoperators/juno-ui-components"

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

const Pagination: React.FC<PaginationProps> = ({ hits, onChanged, isFetching, pageOptions, disabled }) => {
  const { page, pageSize } = pageOptions

  useEffect(() => {
    if (onChanged) onChanged({ page: page, pageSize: pageSize })
  }, [page, pageSize])

  const validHits = useMemo(() => hits || 0, [hits])
  const totalPages = useMemo(() => Math.ceil(validHits / pageSize), [validHits, pageSize])

  const onPrevChanged = () => {
    if (page > 1) onChanged({ ...pageOptions, page: page - 1 })
  }

  const onNextChanged = () => {
    if (page < totalPages) onChanged({ ...pageOptions, page: page + 1 })
  }

  const pageSizeOptions = ["15", "30", "50", "100"]

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {isFetching && <Spinner size="small" />}
      <Button disabled={page === 1 || disabled} label="<" onClick={onPrevChanged} size="small" />
      <span style={{ minWidth: 72, textAlign: "center", fontSize: 14 }}>
        {page} / {totalPages}
      </span>
      <Button disabled={page === totalPages || disabled} label=">" onClick={onNextChanged} size="small" />
      <Select
        style={{ marginLeft: 8 }}
        width="auto"
        placeholder={String(pageSize)}
        value={String(pageSize)}
        onChange={(value) => onChanged({ page: 1, pageSize: Number(value) })}
      >
        {pageSizeOptions.map((value) => (
          <SelectOption value={value} key={value} />
        ))}
      </Select>
    </div>
  )
}

export default Pagination
