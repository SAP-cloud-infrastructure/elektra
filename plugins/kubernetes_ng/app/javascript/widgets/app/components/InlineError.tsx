import React from "react"
import { Stack, Icon } from "@cloudoperators/juno-ui-components"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
// Handle deferred errors from tankstack router loader awaited promises
// If the promise is rejected, the Await component will throw the serialized error
// wrapped into the data attribute and have a __isServerError property
export function isSerializedServerError(error: unknown): error is { data: { message: string } } {
  if (!isRecord(error)) return false
  const data = error["data"]
  if (!isRecord(data)) return false
  return typeof data["message"] === "string"
}

export function normalizeError(error: unknown): { title: string; message: string } {
  if (isSerializedServerError(error)) {
    const msg = (error?.data?.message ?? "").replace(/^,\s*,\s*/, "") || "Please try again later."
    return {
      title: "API Error: ",
      message: msg,
    }
  }

  if (error instanceof Error) {
    return {
      title: error.name ? `${error.name}: ` : "Error: ",
      message: error.message || "An unknown error occurred. Try again.",
    }
  }

  return { title: "Unknown Error", message: "An unknown error occurred. Try again." }
}

interface InlineErrorProps {
  error?: unknown
  className?: string
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
