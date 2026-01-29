import { TextInput, Tooltip, TooltipContent, TooltipTrigger } from "@cloudoperators/juno-ui-components"
import React from "react"

interface TooltipedInputProps {
  id: string
  label: string
  value: string
  tooltipContent: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placement?: "top-start" | "bottom-start" | "top" | "bottom" | "left" | "right"
}

const TooltipedInput: React.FC<TooltipedInputProps> = ({ id, label, value, tooltipContent, onChange, placement }) => {
  return (
    <Tooltip triggerEvent="hover" placement={placement ? placement : "top-start"}>
      <TooltipTrigger asChild>
        <div>
          <TextInput id={id} label={label} width="auto" value={value} onChange={onChange} />
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}

export default TooltipedInput
