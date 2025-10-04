import React from "react"
import { Stack, Icon } from "@cloudoperators/juno-ui-components"

function normalizeError(error: unknown): { title: string; message: string } {
  // tanstack router errors from loaders are wrapped into the data attribute
  // and have a __isServerError property
  if (error && (error as any).__isServerError) {
    return {
      title: "Server Error: ",
      message: (error as any).data?.message || "Please try again later.",
    }
  }
  if (error instanceof Error) {
    return { title: error.name ? `${error.name}: ` : "Error: ", message: error.message || "Something went wrong" }
  }
  return { title: "Unknown Error", message: "Something went wrong." }
}

interface InlineErrorProps {
  error: unknown
  className?: string
  [key: string]: any
}

const InlineError = ({ error, className, ...props }: InlineErrorProps) => {
  const normalizedError = normalizeError(error)

  return (
    <Stack gap="2" alignment="center" className={`inline-error ${className}`} {...props}>
      <Icon color="tw-text-theme-danger" icon="danger" />
      <p>
        {normalizedError.title}
        {normalizedError.message}
      </p>
    </Stack>
  )
}

export default InlineError
