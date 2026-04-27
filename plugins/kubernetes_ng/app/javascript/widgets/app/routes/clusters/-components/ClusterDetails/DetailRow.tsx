import React from "react"
import { DataGridRow, DataGridHeadCell, DataGridCell } from "@cloudoperators/juno-ui-components"
import { normalizeDisplayValue } from "../../../../utils/valueHelpers"

function DetailRow({ label, children }: { label: string; children?: React.ReactNode }) {
  const displayValue = normalizeDisplayValue(children)

  return (
    <DataGridRow>
      <DataGridHeadCell>{label}</DataGridHeadCell>
      <DataGridCell>{displayValue}</DataGridCell>
    </DataGridRow>
  )
}

export default DetailRow
