import React, { useMemo, useRef, useState, useEffect } from "react"
import CodeMirror, { EditorView, highlightWhitespace } from "@uiw/react-codemirror"
import { yaml } from "@codemirror/lang-yaml"
import yamlParser from "js-yaml"
import InlineError from "./InlineError"

interface YamlEditorProps {
  value: object
}

export default function YamlEditor({ value, ...props }: YamlEditorProps) {
  const [editorHeight, setEditorHeight] = useState<string>("100%")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const bottomMargin = 6
        const availableHeight = viewportHeight - rect.top - bottomMargin
        setEditorHeight(`${availableHeight}px`)
      }
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)

    return () => window.removeEventListener("resize", updateHeight)
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

  return (
    <div ref={containerRef} data-height={editorHeight}>
      {error ? (
        <InlineError error={new Error(error)} />
      ) : (
        <CodeMirror
          value={yamlContent}
          theme="light"
          height={editorHeight}
          extensions={[
            yaml(),
            highlightWhitespace(),
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
          editable={false}
          aria-label="YAML data viewer (read-only)"
          aria-readonly="true"
          {...props}
        />
      )}
    </div>
  )
}
