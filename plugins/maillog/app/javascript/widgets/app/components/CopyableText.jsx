import {
  Icon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cloudoperators/juno-ui-components";
import React, { useState } from "react"

const COPY_ICON = <Icon size="15" icon="contentCopy" />
// CopyableText component
const CopyableText = ({ text, children }) => {
  const [tooltipContent, setTooltipContent] = useState(COPY_ICON)

  const copyToClipboard = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setTooltipContent("Copied!")
      setTimeout(() => setTooltipContent(COPY_ICON  ), 3000) // hide toast after 3 seconds
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <Tooltip triggerEvent="hover" placement={"bottom-end"}>
      <TooltipTrigger>
        <span onClick={() => copyToClipboard(text)} className="copyableText">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}

export default CopyableText
