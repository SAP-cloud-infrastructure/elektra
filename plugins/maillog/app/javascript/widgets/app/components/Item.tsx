import moment from "moment"
import React from "react"
import {
  DataGridCell,
  DataGridRow,
  Icon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cloudoperators/juno-ui-components"
import { useHistory, useLocation } from "react-router-dom"
import { MailLogEntry } from "../actions"

interface ItemProps {
  data: MailLogEntry
}

const Item: React.FC<ItemProps> = ({ data }) => {
  const history = useHistory()
  const location = useLocation()

  const downloadJsonFile = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click when downloading
    const jsonString = JSON.stringify(data, null, 2) // The third parameter (2) adds indentation for better readability
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = data.id || "data.json"
    link.click()
  }

  const rcpts = data.rcpts?.map((item) => item.rcpt).join(", ") || ""

  const handleJobClick = (id: string) => {
    // Check if we're already viewing this item's details
    const currentPath = location.pathname
    const detailsPath = `/${id}/show`

    if (currentPath.endsWith(detailsPath)) {
      // If clicking the same item, close the panel by navigating back to list
      history.push("/")
    } else {
      // Navigate to the details view panel
      history.push(detailsPath)
    }
  }

  return (
    <DataGridRow onClick={() => handleJobClick(data.id)} style={{ cursor: "pointer" }}>
      <DataGridCell>
        {moment(data.date).format("YYYY-MM-DD, HH:mm:ss")}
        <p>UTC: {moment(data.date).utc().format("YYYY-MM-DD, HH:mm:ss") || "-"}</p>
      </DataGridCell>
      <DataGridCell>{data.from || "-"}</DataGridCell>
      <DataGridCell>{rcpts || "-"}</DataGridCell>
      <DataGridCell>{data.subject || "-"}</DataGridCell>
      <DataGridCell onClick={(e) => e.stopPropagation()}>
        <Tooltip triggerEvent="hover">
          <TooltipTrigger asChild>
            <Icon color="jn-text-theme-info" onClick={downloadJsonFile} icon="download"></Icon>
          </TooltipTrigger>
          <TooltipContent>Download JSON File</TooltipContent>
        </Tooltip>
      </DataGridCell>
    </DataGridRow>
  )
}

export default Item
