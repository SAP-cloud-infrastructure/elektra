import { useMemo, useEffect } from "react"
import yamlParser from "js-yaml"

// Filter out managedFields from metadata (server-managed, not user-editable)
function filterManagedFields(resource: Record<string, unknown>): Record<string, unknown> {
  const metadata = resource.metadata as Record<string, unknown> | undefined
  if (!metadata?.managedFields) {
    return resource
  }

  const filteredMetadata = { ...metadata }
  delete filteredMetadata.managedFields
  return {
    ...resource,
    metadata: filteredMetadata,
  }
}

export function useSerialization(
  resource: Record<string, unknown>,
  format: "yaml" | "json",
  onError?: (error: Error) => void
) {
  const { content, error } = useMemo(() => {
    try {
      const filteredResource = filterManagedFields(resource)

      if (format === "json") {
        const jsonString = JSON.stringify(filteredResource, null, 2)
        return { content: jsonString, error: "" }
      } else {
        const yamlString = yamlParser.dump(filteredResource, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false,
          schema: yamlParser.JSON_SCHEMA,
        })
        return { content: yamlString, error: "" }
      }
    } catch (err) {
      const formatName = format.toUpperCase()
      return { content: "", error: `Failed to serialize object to ${formatName}: ${(err as Error).message}` }
    }
  }, [resource, format])

  // Notify parent when serialization fails
  useEffect(() => {
    if (error) {
      onError?.(new Error(error))
    }
  }, [error, onError])

  return { content, error }
}
