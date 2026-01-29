import React, { useMemo, useEffect } from "react"
import {
  Stack,
  Button,
  Select,
  SelectOption,
} from "@cloudoperators/juno-ui-components";

const Pagination = ({
  hits,
  onChanged,
  isFetching,
  pageOptions,
  disabled,
}) => {
  // const [page, setpage] = useState(1)
  // const [pageSize, setpageSize] = useState(pageSize || 10)
  const { page, pageSize } = pageOptions
  useEffect(() => {
    if (onChanged) onChanged({ page: page, pageSize: pageSize })
  }, [page, pageSize])

  hits = useMemo(() => {
    return hits || 0
  }, [hits])

  const totalPages = useMemo(() => {
    return Math.ceil(hits / pageSize)
  }, [hits, pageSize])

  const onPrevChanged = () => {
    if (page > 1) {
      onChanged({ ...pageOptions, page: page - 1 })
    }
  }

  const onNextChanged = () => {
    if (page < totalPages) {
      onChanged({ ...pageOptions, page: page + 1 })
    }
  }

  const pageSizeOptions = ["15", "30", "50", "100"]

  return (
    <>
      <Stack
        alignment="center"
        className="mt-4"
        distribution="end"
        style={{ marginBottom: "15px" }}
      >
        <Button
          className="ml-4"
          disabled={page === 1 || disabled}
          label="<"
          onClick={onPrevChanged}
          size="small"
        />
        <p className="ml-4">
          {page} / {totalPages}
        </p>
        <Button
          disabled={page === totalPages || disabled}
          className="ml-4"
          label=">"
          onClick={onNextChanged}
          size="small"
        />

        <Select
          style={{ marginLeft: "15px" }}
          width="auto"
          placeholder={String(pageSize)}
          value={String(pageSize)}
          onChange={(value) =>
            onChanged({ page: 1, pageSize: Number(value) })
          }
        >
          {pageSizeOptions.map((value) => (
            <SelectOption value={value} key={value} />
          ))}
        </Select>
      </Stack>
    </>
  )
}

export default Pagination
