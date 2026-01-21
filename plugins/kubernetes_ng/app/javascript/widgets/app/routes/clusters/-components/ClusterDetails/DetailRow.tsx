import React from "react"
import { DataGridRow, DataGridHeadCell, DataGridCell } from "@cloudoperators/juno-ui-components"

function DetailRow({ label, children }: { label: string; children?: React.ReactNode }) {
  let value = children

  // Normalize booleans
  if (typeof value === "boolean") {
    value = value ? "true" : "false"
  }

  // Detect emptiness after normalization
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)

  const displayValue = isEmpty ? "-" : value

  return (
    <DataGridRow>
      <DataGridHeadCell>{label}</DataGridHeadCell>
      <DataGridCell>{displayValue}</DataGridCell>
    </DataGridRow>
  )
}

export default DetailRow
