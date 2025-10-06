import React from "react"
import { Stack, Icon } from "@cloudoperators/juno-ui-components"

// Handle deferred errors from tankstack router loader awaited promises
// If the promise is rejected, the Await component will throw the serialized error
// wrapped into the data attribute and have a __isServerError property
function isSerializedServerError(error: unknown): error is { data: { message: string } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: any }).data?.message === "string"
  )
}

function normalizeError(error: unknown): { title: string; message: string } {
  if (isSerializedServerError(error)) {
    return {
      title: "Server Error: ",
      message: error.data?.message.length > 0 ? error.data?.message : "Please try again later.",
    }
  }

  if (error instanceof Error) {
    return {
      title: error.name ? `${error.name}: ` : "Error: ",
      message: error.message || "Something went wrong",
    }
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
