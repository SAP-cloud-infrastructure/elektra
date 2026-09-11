import { useEffect, useRef } from "react"
import { EditorView, highlightWhitespace, highlightActiveLine, lineNumbers, keymap } from "@codemirror/view"
import { EditorState, Compartment } from "@codemirror/state"
import { yaml } from "@codemirror/lang-yaml"
import { json } from "@codemirror/lang-json"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { indentWithTab } from "@codemirror/commands"

// Compartments for dynamic reconfiguration
const editableCompartment = new Compartment()
const heightCompartment = new Compartment()
const ariaCompartment = new Compartment()
const languageCompartment = new Compartment()

function createEditableExtension(value: boolean) {
  return EditorView.editable.of(value)
}

function createHeightExtension(height: string) {
  return EditorView.theme({
    "&": {
      height: height,
    },
    ".cm-scroller": {
      fontFamily: "monospace",
    },
  })
}

function createAriaExtension(isEditable: boolean, format: "yaml" | "json") {
  const formatName = format.toUpperCase()
  return EditorView.contentAttributes.of({
    "aria-label": isEditable ? `${formatName} data editor` : `${formatName} data viewer (read-only)`,
    "aria-readonly": isEditable ? "false" : "true",
  })
}

function createLanguageExtension(format: "yaml" | "json") {
  return format === "json" ? json() : yaml()
}

function createEditorExtensions(
  editorHeight: string,
  format: "yaml" | "json",
  isEditable: boolean,
  onDocChange: (value: string) => void,
  isUpdatingProgrammaticallyRef: React.MutableRefObject<boolean>
) {
  return [
    languageCompartment.of(createLanguageExtension(format)),
    syntaxHighlighting(defaultHighlightStyle),
    highlightWhitespace(),
    highlightActiveLine(),
    lineNumbers(),
    keymap.of([indentWithTab]),
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
      ".cm-scroller": {
        fontFamily: "monospace",
      },
    }),
    EditorView.editorAttributes.of({ class: "yaml-editor-content" }),
    ariaCompartment.of(createAriaExtension(isEditable, format)),
    editableCompartment.of(createEditableExtension(false)),
    heightCompartment.of(createHeightExtension(editorHeight)),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdatingProgrammaticallyRef.current) {
        const newValue = update.state.doc.toString()
        onDocChange(newValue)
      }
    }),
  ]
}

function updateEditorContent(
  view: EditorView,
  newContent: string,
  isUpdatingProgrammaticallyRef: React.MutableRefObject<boolean>
) {
  const state = view.state
  const scrollPos = view.scrollDOM.scrollTop

  isUpdatingProgrammaticallyRef.current = true
  view.dispatch({
    changes: {
      from: 0,
      to: state.doc.length,
      insert: newContent,
    },
  })
  isUpdatingProgrammaticallyRef.current = false

  view.scrollDOM.scrollTop = scrollPos
}

interface UseCodeMirrorOptions {
  containerRef: React.RefObject<HTMLDivElement>
  initialContent: string
  editorHeight: string
  format: "yaml" | "json"
  isEditable: boolean
  error: string
  editedContent: string
  content: string
  onDocChange: (value: string) => void
}

export function useCodeMirror({
  containerRef,
  initialContent,
  editorHeight,
  format,
  isEditable,
  error,
  editedContent,
  content,
  onDocChange,
}: UseCodeMirrorOptions) {
  const editorViewRef = useRef<EditorView | null>(null)
  const isUpdatingProgrammaticallyRef = useRef<boolean>(false)

  // Store initial values in refs to avoid triggering effect re-runs
  const initialContentRef = useRef(initialContent)
  const initialHeightRef = useRef(editorHeight)
  const initialFormatRef = useRef(format)
  const onDocChangeRef = useRef(onDocChange)

  // Keep onDocChange ref up to date
  useEffect(() => {
    onDocChangeRef.current = onDocChange
  }, [onDocChange])

  // Create the CodeMirror editor instance once
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialContentRef.current,
      extensions: createEditorExtensions(
        initialHeightRef.current,
        initialFormatRef.current,
        false,
        (value) => onDocChangeRef.current(value),
        isUpdatingProgrammaticallyRef
      ),
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    editorViewRef.current = view

    return () => {
      view.destroy()
      editorViewRef.current = null
    }
  }, [containerRef])

  // Focus the editor when entering edit mode
  useEffect(() => {
    if (isEditable) {
      editorViewRef.current?.focus()
    }
  }, [isEditable])

  // Update editable state dynamically
  useEffect(() => {
    if (!editorViewRef.current) return
    const currentEditable = !error && isEditable
    editorViewRef.current.dispatch({
      effects: [
        editableCompartment.reconfigure(createEditableExtension(currentEditable)),
        ariaCompartment.reconfigure(createAriaExtension(currentEditable, format)),
      ],
    })
  }, [isEditable, error, format])

  // Update height dynamically
  useEffect(() => {
    if (!editorViewRef.current) return
    editorViewRef.current.dispatch({
      effects: heightCompartment.reconfigure(createHeightExtension(editorHeight)),
    })
  }, [editorHeight])

  // Update language mode when format changes
  useEffect(() => {
    if (!editorViewRef.current) return
    editorViewRef.current.dispatch({
      effects: languageCompartment.reconfigure(createLanguageExtension(format)),
    })
  }, [format])

  // Update editor content when content changes (external updates) - only in read-only mode
  useEffect(() => {
    if (!editorViewRef.current || isEditable) return

    const currentDoc = editorViewRef.current.state.doc.toString()
    if (currentDoc !== content) {
      updateEditorContent(editorViewRef.current, content, isUpdatingProgrammaticallyRef)
    }
  }, [content, isEditable])

  // Update editor content when entering edit mode
  useEffect(() => {
    if (!editorViewRef.current || !isEditable) return

    const currentDoc = editorViewRef.current.state.doc.toString()
    if (editedContent && currentDoc !== editedContent) {
      updateEditorContent(editorViewRef.current, editedContent, isUpdatingProgrammaticallyRef)
    }
  }, [isEditable, editedContent])

  return editorViewRef
}
