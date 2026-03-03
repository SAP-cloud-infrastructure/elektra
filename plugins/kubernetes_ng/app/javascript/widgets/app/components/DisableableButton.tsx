import React from "react"
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@cloudoperators/juno-ui-components"
import type { ButtonProps } from "@cloudoperators/juno-ui-components"

interface DisableableButtonProps extends Omit<ButtonProps, "disabled" | "ref"> {
  disabled?: boolean
  disabledMessage?: string
}

/**
 * A button that shows a tooltip with an explanation when disabled.
 * When the button is disabled and disabledMessage is provided,
 * hovering over it will show the reason why it's disabled.
 */
export default function DisableableButton({ disabledMessage, disabled, ...buttonProps }: DisableableButtonProps) {
  const button = <Button disabled={disabled} {...buttonProps} />

  // If not disabled or no message, just render the button
  if (!disabled || !disabledMessage) {
    return button
  }

  // When disabled with a message, wrap in tooltip
  // Use a div wrapper to ensure the tooltip can be triggered even when the button is disabled
  return (
    <Tooltip triggerEvent="hover">
      <TooltipTrigger asChild>{<div>{button}</div>}</TooltipTrigger>
      <TooltipContent>{disabledMessage}</TooltipContent>
    </Tooltip>
  )
}
