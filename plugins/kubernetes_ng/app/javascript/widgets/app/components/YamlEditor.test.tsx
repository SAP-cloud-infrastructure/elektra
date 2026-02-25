import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom"
import YamlEditor from "./YamlEditor"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act } from "react-dom/test-utils"

// Helper to render YamlEditor with QueryClientProvider
const renderYamlEditor = ({
  resource = {},
  onSave = () => Promise.resolve(),
  ...props
}: { resource?: any; onSave?: () => Promise<any>; [key: string]: any } = {}) => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <YamlEditor resource={resource} onSave={onSave} {...props} />
    </QueryClientProvider>
  )
}

describe("<YamlEditor />", () => {
  const mockResource = {
    name: "test-cluster",
    version: "1.0.0",
    metadata: {
      id: "123",
    },
  }

  let mockOnSave: ReturnType<typeof vi.fn>
  let mockOnError: ReturnType<typeof vi.fn>
  let mockOnEdit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create fresh mock functions for each test
    mockOnSave = vi.fn(() => Promise.resolve({}))
    mockOnError = vi.fn()
    mockOnEdit = vi.fn()

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders in read-only mode by default", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    const editButton = screen.getByRole("button", { name: /edit/i })
    expect(editButton).toBeInTheDocument()

    const editor = screen.getByTestId("yaml-editor")
    expect(editor).toBeInTheDocument()

    // Verify editor is in read-only mode by checking aria attributes
    expect(editor).toHaveAttribute("aria-label", "YAML data viewer (read-only)")
    expect(editor).toHaveAttribute("aria-readonly", "true")
  })

  it("converts object to YAML and displays it", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Wait for CodeMirror to render content
    await waitFor(() => {
      const editor = screen.getByTestId("yaml-editor")
      const content = editor.textContent
      expect(content).toContain("test-cluster")
    })
  })

  it("calls onError when resource cannot be serialized to YAML", async () => {
    const invalidData = {
      name: "test",
      invalidFunction: () => {},
    }

    await act(async () =>
      renderYamlEditor({
        resource: invalidData,
        onSave: mockOnSave,
        onError: mockOnError,
        "data-testid": "yaml-editor",
      })
    )

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Failed to serialize object to YAML"),
        })
      )
    })
  })

  it("enters edit mode when Edit button is clicked", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Button label changes to Cancel
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()

    // Save button appears but is disabled (no changes yet)
    const saveButton = screen.getByRole("button", { name: /save/i })
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toBeDisabled()

    // Verify editor is now editable by checking aria attributes
    const editor = screen.getByTestId("yaml-editor")
    expect(editor).toHaveAttribute("aria-label", "YAML data editor")
    expect(editor).toHaveAttribute("aria-readonly", "false")
  })

  it("calls onEdit callback when Edit button is clicked", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, onEdit: mockOnEdit, "data-testid": "yaml-editor" })
    )

    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })

  it("exits edit mode when Cancel button is clicked", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Click Cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    act(() => {
      cancelButton.click()
    })

    // Back to read-only mode
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()

    const editor = screen.getByTestId("yaml-editor")
    expect(editor).toBeInTheDocument()
    // Verify editor is in read-only mode by checking aria attributes
    expect(editor).toHaveAttribute("aria-label", "YAML data viewer (read-only)")
    expect(editor).toHaveAttribute("aria-readonly", "true")
  })

  it("disables Save button when there are no changes", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Save button should be disabled (no changes yet)
    const saveButton = screen.getByRole("button", { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it("enables Save button when changes are made", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")

    // Find the contenteditable element within CodeMirror
    const editorContent = editor.querySelector(".cm-content")
    expect(editorContent).toBeInTheDocument()

    // Simulate typing in the editor - wrap in act
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "name: modified-cluster\nversion: 2.0.0" } })
      })
    }

    // Wait for the Save button to be enabled
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  it("calculates editor height on mount", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Verify ResizeObserver was instantiated
    expect(global.ResizeObserver).toHaveBeenCalled()
  })

  it("cleans up ResizeObserver and event listeners on unmount", async () => {
    const disconnectSpy = vi.fn()
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: disconnectSpy,
    }))

    const { unmount } = await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    unmount()

    expect(disconnectSpy).toHaveBeenCalled()
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
  })

  it("initializes with correct YAML content from resource prop", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    await waitFor(() => {
      const editor = screen.getByTestId("yaml-editor")
      expect(editor).toBeInTheDocument()

      // Check that the YAML content is present in the DOM
      const content = editor.textContent || ""
      expect(content).toContain("name")
      expect(content).toContain("version")
      expect(content).toContain("metadata")
    })
  })

  it("calls onError for invalid YAML when saving", async () => {
    await act(async () =>
      renderYamlEditor({
        resource: mockResource,
        onSave: mockOnSave,
        onError: mockOnError,
        "data-testid": "yaml-editor",
      })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")

    // Enter invalid YAML
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "invalid: [yaml: syntax" } })
      })
    }

    // Wait for Save button to be enabled and click it
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Verify onError was called with validation error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid YAML"),
        })
      )
    })

    // Verify onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it("calls onError for empty YAML when saving", async () => {
    await act(async () =>
      renderYamlEditor({
        resource: mockResource,
        onSave: mockOnSave,
        onError: mockOnError,
        "data-testid": "yaml-editor",
      })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")

    // Enter empty content
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "" } })
      })
    }

    // Wait for Save button to be enabled and click it
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Verify onError was called with empty document error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("must be a valid object"),
        })
      )
    })

    // Verify onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it("calls onError when YAML contains an array", async () => {
    await act(async () =>
      renderYamlEditor({
        resource: mockResource,
        onSave: mockOnSave,
        onError: mockOnError,
        "data-testid": "yaml-editor",
      })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")

    // Enter YAML array
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "- item1\n- item2\n- item3" } })
      })
    }

    // Wait for Save button to be enabled and click it
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Verify onError was called with array error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("must be a valid object, not an array"),
        })
      )
    })

    // Verify onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it("calls onError when YAML contains multiple documents", async () => {
    await act(async () =>
      renderYamlEditor({
        resource: mockResource,
        onSave: mockOnSave,
        onError: mockOnError,
        "data-testid": "yaml-editor",
      })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")

    // Enter multi-document YAML
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, {
          target: { textContent: "name: doc1\nversion: 1.0.0\n---\nname: doc2\nversion: 2.0.0" }
        })
      })
    }

    // Wait for Save button to be enabled and click it
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Verify onError was called with multi-document error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("multi-document YAML is not supported"),
        })
      )
    })

    // Verify onSave was not called
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it("calls onSave with parsed object when Save button is clicked", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")

    // Enter valid YAML with changes
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "name: modified-cluster\nversion: 2.0.0" } })
      })
    }

    // Wait for Save button to be enabled and click it
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Verify onSave was called with parsed object
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: "modified-cluster",
        version: "2.0.0",
      })
    })
  })

  it("exits edit mode on successful save", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Make changes
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "name: modified-cluster\nversion: 2.0.0" } })
      })
    }

    // Click Save
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Wait for mutation to complete and verify we exited edit mode
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    })
  })

  it("disables buttons when save is pending", async () => {
    // Create onSave that never resolves to keep mutation pending
    const pendingOnSave = vi.fn(() => new Promise(() => {}))
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: pendingOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Make changes
    const editor = screen.getByTestId("yaml-editor")
    const editorContent = editor.querySelector(".cm-content")
    if (editorContent) {
      await act(async () => {
        fireEvent.input(editorContent, { target: { textContent: "name: modified-cluster" } })
      })
    }

    // Click Save
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })

    const saveButton = screen.getByRole("button", { name: /save/i })
    act(() => {
      saveButton.click()
    })

    // Verify buttons are disabled while pending
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled()
      expect(screen.getByRole("button", { name: /save/i })).toBeDisabled()
    })
  })

  it("disables Edit button when serialization error occurs", async () => {
    const invalidData = {
      name: "test",
      invalidFunction: () => {},
    }

    await act(async () =>
      renderYamlEditor({
        resource: invalidData,
        onSave: mockOnSave,
        onError: mockOnError,
        "data-testid": "yaml-editor",
      })
    )

    await waitFor(() => {
      const editButton = screen.getByRole("button", { name: /edit/i })
      expect(editButton).toBeDisabled()
    })
  })

  it("disables Edit button when disabled prop is true", async () => {
    await act(async () =>
      renderYamlEditor({
        resource: mockResource,
        onSave: mockOnSave,
        disabled: true,
        "data-testid": "yaml-editor",
      })
    )

    const editButton = screen.getByRole("button", { name: /edit/i })
    expect(editButton).toBeDisabled()
  })

  it("sets title attribute on buttons when disabled with message", async () => {
    const disabledMessage = "Editing is not allowed"
    await act(async () =>
      renderYamlEditor({
        resource: mockResource,
        onSave: mockOnSave,
        disabled: true,
        disabledMessage,
        "data-testid": "yaml-editor",
      })
    )

    const editButton = screen.getByRole("button", { name: /edit/i })
    expect(editButton).toHaveAttribute("title", disabledMessage)
  })
})
