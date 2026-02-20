import React, { useMemo, useRef, useState, useEffect } from "react"
import CodeMirror, { EditorView, highlightWhitespace, ReactCodeMirrorProps } from "@uiw/react-codemirror"
import { DataGridToolbar, Stack, Button, Message } from "@cloudoperators/juno-ui-components"
import { yaml } from "@codemirror/lang-yaml"
import yamlParser from "js-yaml"
import InlineError from "./InlineError"

interface YamlEditorProps extends Omit<ReactCodeMirrorProps, "value" | "height" | "extensions" | "editable"> {
  value: object
  onSave?: (newValue: object) => void
}

export default function YamlEditor({ value, onSave, ...props }: YamlEditorProps) {
  const [editorHeight, setEditorHeight] = useState<string>("100%")
  const [isEditable, setIsEditable] = useState<boolean>(false)
  const [editedYaml, setEditedYaml] = useState<string>("")
  const [saveError, setSaveError] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeoutId: number | undefined

    const calculateHeight = () => {
      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const bottomMargin = 6
      const availableHeight = viewportHeight - rect.top - bottomMargin
      setEditorHeight(`${Math.max(availableHeight, 100)}px`)
    }

    const debouncedCalculateHeight = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(calculateHeight, 100)
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
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener("resize", debouncedCalculateHeight)
    }
  }, [])

  const { yamlContent, error } = useMemo(() => {
    try {
      const yamlString = yamlParser.dump(value, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      })
      return { yamlContent: yamlString, error: "" }
    } catch (err) {
      return {
        yamlContent: "",
        error: `Failed to serialize object to YAML: ${(err as Error).message}`,
      }
    }
  }, [value])

  const handleEditClick = () => {
    if (!isEditable) {
      // Entering edit mode
      setEditedYaml(yamlContent)
      setSaveError("")
      setIsEditable(true)
    } else {
      // Exiting edit mode (Cancel)
      setIsEditable(false)
      setEditedYaml("")
      setSaveError("")
    }
  }

  const handleYamlChange = (newValue: string) => {
    setEditedYaml(newValue)
    setSaveError("")
  }

  const handleSaveClick = () => {
    try {
      // Parse the edited YAML to validate it and convert to object
      const parsedObject = yamlParser.load(editedYaml)

      // Call the onSave callback if provided
      if (onSave && parsedObject) {
        onSave(parsedObject)
      }

      // Exit edit mode on successful save
      setIsEditable(false)
      setEditedYaml("")
      setSaveError("")
    } catch (err) {
      // Show error if YAML is invalid
      setSaveError(`Invalid YAML: ${(err as Error).message}`)
    }
  }

  // Check if there are any changes
  const hasChanges = isEditable && editedYaml !== yamlContent

  return (
    <div ref={containerRef}>
      {error ? (
        <InlineError error={new Error(error)} />
      ) : (
        <>
          <DataGridToolbar>
            <Stack>
              <Stack alignment="center" gap="2">
                <Button
                  size="small"
                  label={isEditable ? "Cancel" : "Edit"}
                  onClick={handleEditClick}
                  variant="subdued"
                />
                {isEditable && (
                  <Button
                    size="small"
                    label="Save"
                    onClick={handleSaveClick}
                    variant="primary"
                    disabled={!hasChanges}
                  />
                )}
              </Stack>
            </Stack>
          </DataGridToolbar>
          {saveError && (
            <Message variant="danger" title="Failed to save changes." text={saveError} className="tw-mb-0" />
          )}
          <CodeMirror
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
            editable={isEditable}
            aria-label={isEditable ? "YAML data editor" : "YAML data viewer (read-only)"}
            aria-readonly={!isEditable}
            {...props}
          />
        </>
      )}
    </div>
  )
}
