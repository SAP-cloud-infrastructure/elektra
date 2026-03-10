import React from "react"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom"
import YamlEditor from "./YamlEditor/index"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act } from "react-dom/test-utils"
import { PortalProvider } from "@cloudoperators/juno-ui-components"

// Mock useBlocker from TanStack Router
vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({
    status: "idle",
    proceed: vi.fn(),
    reset: vi.fn(),
  }),
}))

// Helper to render YamlEditor with QueryClientProvider
const renderYamlEditor = ({
  resource = {},
  onSave = () => Promise.resolve(),
  onRefresh = () => Promise.resolve({}),
  ...props
}: { resource?: any; onSave?: () => Promise<any>; onRefresh?: () => Promise<any>; [key: string]: any } = {}) => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <PortalProvider>
        <YamlEditor resource={resource} onSave={onSave} onRefresh={onRefresh} {...props} />
      </PortalProvider>
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

    const editorWrapper = screen.getByTestId("yaml-editor")
    expect(editorWrapper).toBeInTheDocument()

    // Verify editor is in read-only mode by checking aria attributes on the content element
    const editorContent = within(editorWrapper).getByLabelText("YAML data viewer (read-only)")
    expect(editorContent).toHaveAttribute("aria-readonly", "true")
  })

  it("displays Read Mode indicator by default", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    expect(screen.getByText("Read Mode")).toBeInTheDocument()
  })

  it("displays Edit Mode indicator when in edit mode", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    expect(screen.getByText("Edit Mode")).toBeInTheDocument()
    expect(screen.queryByText("Read Mode")).not.toBeInTheDocument()
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
    const editorWrapper = screen.getByTestId("yaml-editor")
    const editorContent = within(editorWrapper).getByLabelText("YAML data editor")
    expect(editorContent).toHaveAttribute("aria-readonly", "false")
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

    const editorWrapper = screen.getByTestId("yaml-editor")
    const editorContent = within(editorWrapper).getByLabelText("YAML data viewer (read-only)")
    expect(editorContent).toHaveAttribute("aria-readonly", "true")
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

  it("supports Tab key for indentation in edit mode", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Wait for editor to be ready
    await waitFor(() => {
      const editorWrapper = screen.getByTestId("yaml-editor")
      const editableContent = within(editorWrapper).getByLabelText("YAML data editor")
      expect(editableContent).toHaveAttribute("aria-readonly", "false")
    })

    // Get the CodeMirror editor content using role
    const editorWrapper = screen.getByTestId("yaml-editor")
    const editorContent = within(editorWrapper).getByRole("textbox")
    expect(editorContent).toBeInTheDocument()

    // Simulate Tab key press on the contenteditable element
    await act(async () => {
      // Create and dispatch a proper keyboard event with Tab
      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        code: "Tab",
        keyCode: 9,
        which: 9,
        bubbles: true,
        cancelable: true,
      })
      editorContent.dispatchEvent(tabEvent)
    })

    // Verify that changes were registered (Save button should be enabled)
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
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
          target: { textContent: "name: doc1\nversion: 1.0.0\n---\nname: doc2\nversion: 2.0.0" },
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

  it("does not show cancel confirmation dialog when canceling without changes", async () => {
    await act(async () =>
      renderYamlEditor({ resource: mockResource, onSave: mockOnSave, "data-testid": "yaml-editor" })
    )

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    act(() => {
      editButton.click()
    })

    // Click Cancel without making changes
    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    act(() => {
      cancelButton.click()
    })

    // Dialog should not appear
    expect(screen.queryByText(/discard unsaved changes/i)).not.toBeInTheDocument()

    // Should exit edit mode directly
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
  })

  it("shows cancel confirmation dialog when canceling with unsaved changes", async () => {
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
        fireEvent.input(editorContent, { target: { textContent: "name: modified\nversion: 2.0.0" } })
      })
    }

    // Click Cancel with changes
    const cancelButton = await screen.findByRole("button", { name: /cancel/i })
    act(() => {
      cancelButton.click()
    })

    // Dialog should appear
    expect(await screen.findByText(/discard unsaved changes/i)).toBeInTheDocument()
  })

  it("discards changes when confirming in cancel dialog", async () => {
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
        fireEvent.input(editorContent, { target: { textContent: "name: modified\nversion: 2.0.0" } })
      })
    }

    // Click Cancel
    const cancelButton = await screen.findByRole("button", { name: /cancel/i })
    act(() => {
      cancelButton.click()
    })

    // Click "Discard Changes" in dialog
    const discardButton = await screen.findByRole("button", { name: /discard changes/i })
    act(() => {
      discardButton.click()
    })

    // Should exit edit mode and close dialog
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
      expect(screen.queryByText(/discard unsaved changes/i)).not.toBeInTheDocument()
    })
  })

  it("keeps editing when clicking Keep Editing in cancel dialog", async () => {
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
        fireEvent.input(editorContent, { target: { textContent: "name: modified\nversion: 2.0.0" } })
      })
    }

    // Click Cancel
    const cancelButton = await screen.findByRole("button", { name: /cancel/i })
    act(() => {
      cancelButton.click()
    })

    // Click "Keep Editing" in dialog
    const keepEditingButton = await screen.findByRole("button", { name: /keep editing/i })
    act(() => {
      keepEditingButton.click()
    })

    // Should stay in edit mode and close dialog
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
      expect(screen.queryByText(/discard unsaved changes/i)).not.toBeInTheDocument()
    })
  })

  describe("resourceVersion conflict detection", () => {
    it("saves successfully when resourceVersion hasn't changed", async () => {
      const mockResourceWithVersion = {
        name: "test-cluster",
        metadata: {
          resourceVersion: "12345",
        },
      }

      const mockOnRefresh = vi.fn(() =>
        Promise.resolve({
          name: "test-cluster",
          metadata: {
            resourceVersion: "12345", // Same version
          },
        })
      )

      await act(async () =>
        renderYamlEditor({
          resource: mockResourceWithVersion,
          onSave: mockOnSave,
          onRefresh: mockOnRefresh,
          "data-testid": "yaml-editor",
        })
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
          fireEvent.input(editorContent, {
            target: { textContent: 'name: modified-cluster\nmetadata:\n  resourceVersion: "12345"' },
          })
        })
      }

      // Click Save
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i })
        expect(saveButton).not.toBeDisabled()
      })

      const saveButton = screen.getByRole("button", { name: /save/i })
      await act(async () => {
        saveButton.click()
      })

      // Verify onRefresh was called to check for conflicts
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled()
      })

      // Verify onSave was called (no conflict)
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })

      // Verify no conflict dialog appeared
      expect(screen.queryByText(/resource has been modified/i)).not.toBeInTheDocument()
    })

    it("shows conflict dialog when resourceVersion has changed", async () => {
      const mockResourceWithVersion = {
        name: "test-cluster",
        metadata: {
          resourceVersion: "12345",
        },
      }

      const mockOnRefresh = vi.fn(() =>
        Promise.resolve({
          name: "test-cluster",
          metadata: {
            resourceVersion: "67890", // Different version - conflict!
          },
        })
      )

      await act(async () =>
        renderYamlEditor({
          resource: mockResourceWithVersion,
          onSave: mockOnSave,
          onRefresh: mockOnRefresh,
          "data-testid": "yaml-editor",
        })
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
          fireEvent.input(editorContent, {
            target: { textContent: 'name: modified-cluster\nmetadata:\n  resourceVersion: "12345"' },
          })
        })
      }

      // Click Save
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i })
        expect(saveButton).not.toBeDisabled()
      })

      const saveButton = screen.getByRole("button", { name: /save/i })
      await act(async () => {
        saveButton.click()
      })

      // Verify conflict dialog appeared
      await waitFor(() => {
        expect(screen.getByText(/ resource has been modified by someone else/i)).toBeInTheDocument()
      })

      // Verify onSave was NOT called yet (waiting for user confirmation)
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it("merges latest resourceVersion when conflict is confirmed", async () => {
      const mockResourceWithVersion = {
        name: "test-cluster",
        metadata: {
          resourceVersion: "12345",
        },
      }

      let refreshCallCount = 0
      const mockOnRefresh = vi.fn(() => {
        refreshCallCount++
        // First call: return different version (conflict detected)
        // Second call (on confirm): return even newer version
        return Promise.resolve({
          name: "test-cluster",
          metadata: {
            resourceVersion: refreshCallCount === 1 ? "67890" : "99999",
          },
        })
      })

      await act(async () =>
        renderYamlEditor({
          resource: mockResourceWithVersion,
          onSave: mockOnSave,
          onRefresh: mockOnRefresh,
          "data-testid": "yaml-editor",
        })
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
          fireEvent.input(editorContent, {
            target: { textContent: 'name: modified-cluster\nmetadata:\n  resourceVersion: "12345"' },
          })
        })
      }

      // Click Save
      const saveButton = await screen.findByRole("button", { name: /save/i })
      await act(async () => {
        saveButton.click()
      })

      // Wait for conflict dialog to appear
      const conflictDialog = await screen.findByRole("dialog", { name: /resource has been modified/i })
      expect(conflictDialog).toBeInTheDocument()

      // Confirm the conflict dialog - find button within the dialog
      const confirmButton = await screen.findByRole("button", { name: /update and continue/i })
      await act(async () => {
        confirmButton.click()
      })

      // Verify onRefresh was called twice (once on save, once on confirm)
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledTimes(2)
      })

      // Verify onSave was called with the merged resourceVersion
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "modified-cluster",
            metadata: expect.objectContaining({
              resourceVersion: "99999", // Latest version from second refresh
            }),
          })
        )
      })
    })

    it("closes conflict dialog when cancel is clicked", async () => {
      const mockResourceWithVersion = {
        name: "test-cluster",
        metadata: {
          resourceVersion: "12345",
        },
      }

      const mockOnRefresh = vi.fn(() =>
        Promise.resolve({
          name: "test-cluster",
          metadata: {
            resourceVersion: "67890", // Different version
          },
        })
      )

      await act(async () =>
        renderYamlEditor({
          resource: mockResourceWithVersion,
          onSave: mockOnSave,
          onRefresh: mockOnRefresh,
          "data-testid": "yaml-editor",
        })
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
          fireEvent.input(editorContent, {
            target: { textContent: 'name: modified-cluster\nmetadata:\n  resourceVersion: "12345"' },
          })
        })
      }

      // Click Save
      const saveButton = await screen.findByRole("button", { name: /save/i })
      await act(async () => {
        saveButton.click()
      })

      // Wait for conflict dialog to appear
      const conflictDialog = await screen.findByRole("dialog", { name: /resource has been modified/i })
      expect(conflictDialog).toBeInTheDocument()

      // Click Cancel in conflict dialog - find button within the dialog
      const cancelButton = within(conflictDialog).getByRole("button", { name: /cancel/i })
      await act(async () => {
        cancelButton.click()
      })

      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByText(/resource has been modified by someone else/i)).not.toBeInTheDocument()
      })

      // Verify onSave was NOT called
      expect(mockOnSave).not.toHaveBeenCalled()

      // Verify we're still in edit mode (look for the editor's Cancel button)
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    })
  })
})
