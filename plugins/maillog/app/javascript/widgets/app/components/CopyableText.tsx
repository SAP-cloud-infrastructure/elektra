import { Icon, Tooltip, TooltipContent, TooltipTrigger } from "@cloudoperators/juno-ui-components"
import React, { useState } from "react"

const COPY_ICON = <Icon size="15" icon="contentCopy" />

interface CopyableTextProps {
  text: string
  children: React.ReactNode
}

// CopyableText component
const CopyableText: React.FC<CopyableTextProps> = ({ text, children }) => {
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(COPY_ICON)

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setTooltipContent("Copied!")
      setTimeout(() => setTooltipContent(COPY_ICON), 3000) // hide toast after 3 seconds
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
