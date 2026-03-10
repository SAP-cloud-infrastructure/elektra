import yamlParser from "js-yaml"

export function parseYamlToObject(yamlContent: string): Record<string, unknown> {
  try {
    // Check for multi-document YAML (multiple documents separated by ---)
    // Use JSON_SCHEMA to only parse JSON-compatible YAML (no custom types, dates, etc.)
    const docs: unknown[] = []
    yamlParser.loadAll(
      yamlContent,
      (doc: unknown) => {
        docs.push(doc)
      },
      { schema: yamlParser.JSON_SCHEMA }
    )

    if (docs.length > 1) {
      throw new Error("Invalid YAML: multi-document YAML is not supported. Please provide a single document.")
    }

    // Parse the edited YAML to validate it and convert to object
    const parsedObject = docs[0]

    // Reject null, undefined, non-objects, or arrays
    if (!parsedObject || typeof parsedObject !== "object" || Array.isArray(parsedObject)) {
      throw new Error("Invalid YAML: document must be a valid object, not an array or primitive")
    }

    // Validate it's a plain object (not Date, Map, Set, etc.)
    const isPlainObject = Object.prototype.toString.call(parsedObject) === "[object Object]"
    if (!isPlainObject) {
      throw new Error(
        "Invalid YAML: document must be a plain object compatible with JSON (no custom types like Date, Map, etc.)"
      )
    }

    return parsedObject as Record<string, unknown>
  } catch (err) {
    // Wrap any YAML parsing error with "Invalid YAML:" prefix
    const errorMessage = (err as Error).message
    if (errorMessage.startsWith("Invalid YAML:")) {
      throw err
    }
    throw new Error(`Invalid YAML: ${errorMessage}`)
  }
}
