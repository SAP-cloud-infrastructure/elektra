import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import "@testing-library/jest-dom"
import YamlEditor from "./YamlEditor"

describe("<YamlEditor />", () => {
  const mockValue = {
    name: "test-cluster",
    version: "1.0.0",
    metadata: {
      id: "123",
    },
  }

  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
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

  it("renders in read-only mode by default", () => {
    render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

    const editButton = screen.getByRole("button", { name: /edit/i })
    expect(editButton).toBeInTheDocument()

    const editor = screen.getByTestId("yaml-editor")
    expect(editor).toBeInTheDocument()

    // Verify editor is in read-only mode by checking aria attributes
    expect(editor).toHaveAttribute("aria-label", "YAML data viewer (read-only)")
    expect(editor).toHaveAttribute("aria-readonly", "true")
  })

  it("converts object to YAML and displays it", async () => {
    render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

    // Wait for CodeMirror to render content
    await waitFor(() => {
      const editor = screen.getByTestId("yaml-editor")
      const content = editor.textContent
      expect(content).toContain("test-cluster")
    })
  })

  it("shows error when value cannot be serialized to YAML", async () => {
    const invalidData = {
      name: "test",
      invalidFunction: () => {},
    }

    render(<YamlEditor value={invalidData} data-testid="yaml-editor" />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to serialize object to YAML/i)).toBeInTheDocument()
      expect(screen.queryByTestId("yaml-editor")).not.toBeInTheDocument()
    })
  })

  it("enters edit mode when Edit button is clicked", async () => {
    render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

    const editButton = screen.getByRole("button", { name: /edit/i })
    fireEvent.click(editButton)

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

  it("exits edit mode when Cancel button is clicked", () => {
    render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    fireEvent.click(editButton)

    // Click Cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    fireEvent.click(cancelButton)

    // Back to read-only mode
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()

    const editor = screen.getByTestId("yaml-editor")
    expect(editor).toBeInTheDocument()
    // Verify editor is in read-only mode by checking aria attributes
    expect(editor).toHaveAttribute("aria-label", "YAML data viewer (read-only)")
    expect(editor).toHaveAttribute("aria-readonly", "true")
  })

  it("disables Save button when there are no changes", () => {
    render(<YamlEditor value={mockValue} onSave={mockOnSave} data-testid="yaml-editor" />)

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    fireEvent.click(editButton)

    // Save button should be disabled (no changes yet)
    const saveButton = screen.getByRole("button", { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it("enables Save button when changes are made", async () => {
    const user = userEvent.setup()
    render(<YamlEditor value={mockValue} onSave={mockOnSave} data-testid="yaml-editor" />)

    // Enter edit mode
    const editButton = screen.getByRole("button", { name: /edit/i })
    await user.click(editButton)

    // Get the CodeMirror editor element
    const editor = screen.getByTestId("yaml-editor")

    // Find the contenteditable element within CodeMirror
    const editorContent = editor.querySelector(".cm-content")
    expect(editorContent).toBeInTheDocument()

    // Simulate typing in the editor
    if (editorContent) {
      // Trigger a change by dispatching an input event
      fireEvent.input(editorContent, { target: { textContent: "name: modified-cluster\nversion: 2.0.0" } })
    }

    // Wait for the Save button to be enabled
    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save/i })
      expect(saveButton).not.toBeDisabled()
    })
  })

  it("calculates editor height on mount", () => {
    render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

    // Verify ResizeObserver was instantiated
    expect(global.ResizeObserver).toHaveBeenCalled()
  })

  it("cleans up ResizeObserver and event listeners on unmount", () => {
    const disconnectSpy = vi.fn()
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: disconnectSpy,
    }))

    const { unmount } = render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

    unmount()

    expect(disconnectSpy).toHaveBeenCalled()
    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
  })

  it("initializes with correct YAML content from value prop", async () => {
    render(<YamlEditor value={mockValue} data-testid="yaml-editor" />)

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
})
