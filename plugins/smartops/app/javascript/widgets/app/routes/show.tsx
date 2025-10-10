import { createFileRoute } from "@tanstack/react-router"
import React from "react"
import {
  Panel,
  PanelBody,
  Stack,
  Message,
  DataGrid,
  DataGridRow,
  DataGridHeadCell,
  DataGridCell,
} from "@cloudoperators/juno-ui-components"

export const Route = createFileRoute("/show")({
  component: JobDetails,
})

function JobDetails() {
  return (
    <div>
      <Panel opened={true} onClose={close} heading="Show Job Details">
        <PanelBody></PanelBody>
      </Panel>
    </div>
  )
}
