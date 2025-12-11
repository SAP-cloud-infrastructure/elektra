import React, { useState } from "react"
import { Tooltip, TooltipTrigger, TooltipContent, Icon, Stack } from "@cloudoperators/juno-ui-components"

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
  const combinedClassName = `copyableTooltip tw-group tw-relative tw-inline-flex tw-items-center ${className}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setOpen(true)
    setTimeout(() => setOpen(false), 1000)
  }

  return (
    <div {...props} className={combinedClassName}>
      <Tooltip open={open}>
        <TooltipTrigger onClick={handleCopy} aria-label={`Copy ${text} to clipboard`}>
          <Stack direction="horizontal" gap="1" className="tw-items-center">
            {text}
            <Icon
              icon="contentCopy"
              size="18"
              className="tw-opacity-0 group-hover:tw-opacity-100 tw-transition-opacity tw-duration-200 tw-cursor-pointer"
            />
          </Stack>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default ClipboardText
