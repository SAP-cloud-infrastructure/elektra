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
import { Link } from "react-router-dom"
import CopyableText from "./CopyableText"
import { MailLogEntry } from "../actions"

interface ItemProps {
  data: MailLogEntry
}

const Item: React.FC<ItemProps> = ({ data }) => {
  const downloadJsonFile = () => {
    const jsonString = JSON.stringify(data, null, 2) // The third parameter (2) adds indentation for better readability
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = data.id || "data.json"
    link.click()
  }

  const rcpts = data.rcpts?.map((item) => item.rcpt).join(", ") || ""

  const handleJobClick = (id: string) => {
    console.log("Row clicked with id:", id)
    // render details view
  }

  return (
    <DataGridRow onClick={() => handleJobClick(data.id)} style={{ cursor: "pointer" }}>
      <DataGridCell>
        <Tooltip triggerEvent="hover">
          <TooltipTrigger asChild>
            <Link to={`/${data.id}/show`}>
              <Icon icon="openInNew"></Icon>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Show details</TooltipContent>
        </Tooltip>
      </DataGridCell>
      <DataGridCell>
        {moment(data.date).format("YYYY-MM-DD, HH:mm:ss")}
        <p style={{ fontSize: "0.8rem" }}>UTC: {moment(data.date).utc().format("YYYY-MM-DD, HH:mm:ss")}</p>
      </DataGridCell>
      <DataGridCell>
        <CopyableText text={data.from}>{data.from}</CopyableText>
      </DataGridCell>

      <DataGridCell>
        <CopyableText text={rcpts}>{rcpts}</CopyableText>
      </DataGridCell>

      <DataGridCell>
        <CopyableText text={data.subject || ""}>{data.subject || ""}</CopyableText>
      </DataGridCell>

      <DataGridCell>
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
