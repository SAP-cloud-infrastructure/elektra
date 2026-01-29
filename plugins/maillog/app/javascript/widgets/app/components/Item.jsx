import moment from "moment"
import React, { useEffect, useState } from "react"
import {
  DataGridCell,
  DataGridRow,
  Icon,
  JsonViewer,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cloudoperators/juno-ui-components";
import ItemDetails from "./ItemDetails"
import CopyableText from "./CopyableText"

const Item = ({ data, children, className, ...props }) => {
  const [showDetails, setShowDetails] = useState(false)

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }
  
  const downloadJsonFile = () => {
    const jsonString = JSON.stringify(data, null, 2) // The third parameter (2) adds indentation for better readability
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = data.id || "data.json"
    link.click()
  }
  const rcpts = data?.rcpts && data.rcpts.map((item) => item.rcpt).join(", ") 
  return (
    <>
      <DataGridRow>
        <DataGridCell>
          <Tooltip triggerEvent="hover">
            <TooltipTrigger asChild>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  toggleDetails(data)
                }}
              >
                <Icon icon={showDetails ? "expandLess" : "expandMore"}></Icon>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              {showDetails ? "Hide details" : "Show details"}
            </TooltipContent>
          </Tooltip>
        </DataGridCell>
        <DataGridCell>
          {moment(data.date).format("YYYY-MM-DD, HH:mm:ss")}
          <p style={{ fontSize: "0.8rem" }}>
            UTC: {moment(data.date).utc().format("YYYY-MM-DD, HH:mm:ss")}
          </p>
        </DataGridCell>
        <DataGridCell>
           <CopyableText text={data.from}>
              {data.from}
            </CopyableText>
        </DataGridCell>
        
        <DataGridCell>
          <CopyableText text={rcpts}>
              {rcpts}
            </CopyableText>
        </DataGridCell>
        
        
        <DataGridCell>
          <CopyableText text={data.subject}>
            {data.subject}            
            </CopyableText>
        </DataGridCell>

       <DataGridCell>
          <Tooltip triggerEvent="hover">
            <TooltipTrigger asChild>          <Icon
            color="jn-text-theme-info"
            onClick={downloadJsonFile}
            icon="download"
          ></Icon>
             </TooltipTrigger>
            <TooltipContent>
             Download JSON File
            </TooltipContent>
          </Tooltip>
        </DataGridCell>
      </DataGridRow>

      {showDetails && <ItemDetails data={data} />}
    </>
  )
}

export default Item
