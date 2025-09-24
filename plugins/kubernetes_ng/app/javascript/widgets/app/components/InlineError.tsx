import React from "react"
import { Stack, Icon } from "@cloudoperators/juno-ui-components"

interface InlineErrorProps {
  error: Error
  className?: string
  [key: string]: any
}

const InlineError = ({ error, className, ...props }: InlineErrorProps) => {
  const errorName = error.name ? `${error.name}: ` : "Error: "
  const errorMessage = error.message || "Something went wrong"
  return (
    <Stack gap="2" alignment="center" className={`inline-error ${className}`} {...props}>
      <Icon color="jn-text-theme-danger" icon="danger" />
      <p>
        {errorName}
        {errorMessage}
      </p>
    </Stack>
  )
}

export default InlineError
