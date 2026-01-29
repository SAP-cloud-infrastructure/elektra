import {
    TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cloudoperators/juno-ui-components"
import React, { useState } from "react"


const TooltipedInput = ({ id, label, value, tooltipContent,onChange,placement }) => {
  return (
    <Tooltip triggerEvent="hover" placement={placement ? placement : "top-start"}>
      <TooltipTrigger asChild>
        <div>
        <TextInput
          id={id}
          label={label}
          width="auto"
          value={value}
          onChange={onChange}
        />
        </div>
      </TooltipTrigger>
       <TooltipContent>{tooltipContent}</TooltipContent> 
     </Tooltip>
  )
}

export default TooltipedInput
