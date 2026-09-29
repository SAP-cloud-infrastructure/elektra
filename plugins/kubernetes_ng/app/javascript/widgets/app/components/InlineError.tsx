import React from "react"
import { Status } from "./Status"

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

// Normalize different error types into a consistent structure
// exported for use in other components like Message component
export function normalizeError(error: unknown): { title: string; message: string } {
  if (isSerializedServerError(error)) {
    // remove one or more leading commas plus any whitespace after them
    // ex: ', , shoots.core.gardener.cloud "shoot" already exists' or ', Invalid value: []core.ShootAdvertisedAddress(nil)'
    const msg = (error?.data?.message ?? "").replace(/^[,\s]+/, "") || "Please try again later."
    return {
      title: "API Error: ",
      message: msg,
    }
  }

  if (error instanceof Error) {
    return {
      title: error.name ? `${error.name}` : "",
      message: error.message.replace(/^[,\s]+/, "") || "An unknown error occurred. Try again.",
    }
  }

  return { title: "Unknown Error", message: "An unknown error occurred. Try again." }
}

interface InlineErrorProps {
  error?: unknown
  className?: string
}

const InlineError = ({ error, className }: InlineErrorProps) => {
  const normalizedError = normalizeError(error)

  // Check if error has details
  let details: string | undefined
  if (error && typeof error === "object" && "details" in error) {
    const errorDetails = (error as { details: unknown }).details
    if (errorDetails) {
      try {
        details = typeof errorDetails === "string" ? errorDetails : JSON.stringify(errorDetails, null, 2)
      } catch {
        // Ignore if serialization fails
      }
    }
  }

  return (
    <Status
      status="error"
      title={normalizedError.title}
      body={normalizedError.message}
      details={details}
      className={className}
    />
  )
}

export default InlineError
