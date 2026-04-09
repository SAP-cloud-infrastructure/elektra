import { useMemo, useEffect } from "react"
import yamlParser from "js-yaml"

// Filter out managedFields from metadata (server-managed, not user-editable)
function filterManagedFields(resource: Record<string, unknown>): Record<string, unknown> {
  const metadata = resource.metadata as Record<string, unknown> | undefined
  if (!metadata?.managedFields) {
    return resource
  }

  const { managedFields, ...restMetadata } = metadata
  return {
    ...resource,
    metadata: restMetadata,
  }
}

export function useYamlSerialization(
  resource: Record<string, unknown>,
  onError?: (error: Error) => void
) {
  const { yamlContent, error } = useMemo(() => {
    try {
      const filteredResource = filterManagedFields(resource)
      const yamlString = yamlParser.dump(filteredResource, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
        schema: yamlParser.JSON_SCHEMA, // Use JSON schema for pure JSON compatibility
      })
      return { yamlContent: yamlString, error: "" }
    } catch (err) {
      return { yamlContent: "", error: `Failed to serialize object to YAML: ${(err as Error).message}` }
    }
  }, [resource])

  // Notify parent when YAML serialization fails
  useEffect(() => {
    if (error) {
      onError?.(new Error(error))
    }
  }, [error, onError])

  return { yamlContent, error }
}
