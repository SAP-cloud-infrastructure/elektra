import React, { useMemo, useRef, useState, useEffect } from "react"
import CodeMirror, { EditorView, highlightWhitespace, ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { Stack, Button } from "@cloudoperators/juno-ui-components"
import { yaml } from "@codemirror/lang-yaml"
import yamlParser from "js-yaml"
import { useMutation } from "@tanstack/react-query"

const TOOLBAR_HEIGHT = 50

interface YamlEditorProps {
  resource: Record<string, unknown>
  onSave: (resource: Record<string, unknown>) => Promise<void>
  onError?: (error: Error) => void
  onEdit?: () => void
  disabled?: boolean
  disabledMessage?: string
}

export default function YamlEditor({
  resource,
  onSave,
  onError,
  onEdit,
  disabled = false,
  disabledMessage,
  ...props
}: YamlEditorProps) {
  const [editorHeight, setEditorHeight] = useState<string>("100%")
  const [isEditable, setIsEditable] = useState<boolean>(false)
  const [editedYaml, setEditedYaml] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)
  const timeoutIdRef = useRef<number | undefined>(undefined)

  const { yamlContent, error } = useMemo(() => {
    try {
      const yamlString = yamlParser.dump(resource, {
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

  // Notify parent when YAML serialization fails.
  useEffect(() => {
    if (error) {
      onError?.(new Error(error))
    }
  }, [error, onError])

  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setIsEditable(false)
      setEditedYaml("")
    },
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const calculateHeight = () => {
      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const bottomMargin = 12
      const availableHeight = viewportHeight - rect.top - TOOLBAR_HEIGHT - bottomMargin
      setEditorHeight(`${Math.max(availableHeight, 100)}px`)
    }

    const debouncedCalculateHeight = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      timeoutIdRef.current = window.setTimeout(calculateHeight, 100)
    }

    // Initial calculation without debounce
    calculateHeight()

    // Use ResizeObserver to detect when the layout changes
    const resizeObserver = new ResizeObserver(() => {
      debouncedCalculateHeight()
    })

    // Observe the container itself
    resizeObserver.observe(container)

    // Fallback for window resize (for viewport changes)
    window.addEventListener("resize", debouncedCalculateHeight)

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener("resize", debouncedCalculateHeight)
    }
  }, [])

  // Focus the CodeMirror editor when entering edit mode.
  // This must be done in a useEffect because setting isEditable triggers a re-render,
  // and the editor ref is only available after the component updates.
  useEffect(() => {
    if (isEditable) {
      codeMirrorRef.current?.view?.focus()
    }
  }, [isEditable])

  const handleEditClick = () => {
    onEdit?.()
    if (!isEditable) {
      setEditedYaml(yamlContent)
      mutation.reset()
      setIsEditable(true)
    } else {
      setIsEditable(false)
      setEditedYaml("")
      mutation.reset()
    }
  }

  const handleYamlChange = (newValue: string) => {
    setEditedYaml(newValue)
  }

  const handleSaveClick = () => {
    try {
      // Check for multi-document YAML (multiple documents separated by ---)
      // Use JSON_SCHEMA to only parse JSON-compatible YAML (no custom types, dates, etc.)
      const docs: unknown[] = []
      yamlParser.loadAll(
        editedYaml,
        (doc: unknown) => {
          docs.push(doc)
        },
        { schema: yamlParser.JSON_SCHEMA }
      )

      if (docs.length > 1) {
        onError?.(new Error("Invalid YAML: multi-document YAML is not supported. Please provide a single document."))
        return
      }

      // Parse the edited YAML to validate it and convert to object
      const parsedObject = docs[0]

      // Reject null, undefined, non-objects, or arrays
      if (!parsedObject || typeof parsedObject !== "object" || Array.isArray(parsedObject)) {
        onError?.(new Error("Invalid YAML: document must be a valid object, not an array or primitive"))
        return
      }

      // Validate it's a plain object (not Date, Map, Set, etc.)
      const isPlainObject = Object.prototype.toString.call(parsedObject) === "[object Object]"
      if (!isPlainObject) {
        onError?.(
          new Error(
            "Invalid YAML: document must be a plain object compatible with JSON (no custom types like Date, Map, etc.)"
          )
        )
        return
      }

      // Call the mutation with the validated object
      mutation.mutate(parsedObject as Record<string, unknown>)
    } catch (err) {
      // Show error if YAML is invalid
      onError?.(new Error(`Invalid YAML: ${(err as Error).message}`))
    }
  }

  const hasChanges = isEditable && editedYaml !== yamlContent
  const isLoading = mutation.isPending || false

  return (
    <div ref={containerRef}>
      <div
        className="tw-flex tw-items-center tw-bg-theme-background-lvl-1 tw-py-3 tw-px-6 tw-mb-px"
        style={{ height: `${TOOLBAR_HEIGHT}px` }}
      >
        <div className="tw-ml-auto">
          <Stack alignment="center" gap="2">
            <Button
              size="small"
              label={isEditable ? "Cancel" : "Edit"}
              onClick={handleEditClick}
              variant="subdued"
              disabled={disabled || isLoading || !!error}
              title={disabled && disabledMessage ? disabledMessage : undefined}
            />
            {isEditable && (
              <Button
                size="small"
                label="Save"
                onClick={handleSaveClick}
                variant="primary"
                disabled={disabled || !hasChanges || isLoading || !!error}
                progress={isLoading}
                title={disabled && disabledMessage ? disabledMessage : undefined}
              />
            )}
          </Stack>
        </div>
      </div>
      <div className="tw-border tw-border-theme-box-default">
        <CodeMirror
          ref={codeMirrorRef}
          value={isEditable ? editedYaml : yamlContent}
          onChange={isEditable ? handleYamlChange : undefined}
          theme="light"
          height={editorHeight}
          extensions={[
            yaml(),
            highlightWhitespace(),
            EditorView.lineWrapping,
            EditorView.theme({
              ".cm-highlightSpace": {
                backgroundImage:
                  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='6'><circle cx='3' cy='3' r='1' fill='%23cccccc' /></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "contain",
                opacity: 0.1,
              },
            }),
          ]}
          editable={!error && isEditable}
          aria-label={isEditable ? "YAML data editor" : "YAML data viewer (read-only)"}
          aria-readonly={!isEditable}
          {...props}
        />
      </div>
    </div>
  )
}
