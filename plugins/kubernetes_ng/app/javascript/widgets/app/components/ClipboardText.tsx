import React, { useState } from "react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@cloudoperators/juno-ui-components"

export interface ClipboardTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Tooltip content text.
   */
  tooltipContent?: string
  /**
   * Text to be displayed and copied to clipboard.
   */
  text: string
  /**
   * Additional CSS styles.
   */
  className?: string
}

const ClipboardText: React.FC<ClipboardTextProps> = ({
  text,
  tooltipContent = "Copied to clipboard!",
  className,
  ...props
}) => {
  const [open, setOpen] = useState(false)
  const combinedClassName = `copyableTooltip ${className}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setOpen(true)
    setTimeout(() => setOpen(false), 1000)
  }

  return (
    <div data-testid="clipboard-text" {...props} className={combinedClassName}>
      <Tooltip open={open}>
        <TooltipTrigger onClick={handleCopy} className="cursor-pointer">
          {text}
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default ClipboardText
