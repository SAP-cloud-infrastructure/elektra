import React, { useRef } from "react"
import { Stack } from "@cloudoperators/juno-ui-components"
import DisableableButton from "../DisableableButton"
import { useCodeMirror } from "./useCodeMirror"
import { useEditorHeight } from "./useEditorHeight"
import { useSerialization } from "./useSerialization"
import { useYamlEditorState } from "./useYamlEditorState"
import { useNavigationBlock } from "./useNavigationBlock"
import { CancelConfirmDialog, ResourceVersionConflictDialog, NavigationBlockDialog } from "./dialogs"

const TOOLBAR_HEIGHT = 50

export interface YamlEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError" | "resource"> {
  resource: Record<string, unknown>
  onSave: (resource: Record<string, unknown>) => Promise<void>
  onError?: (error: Error) => void
  onEdit?: () => void
  onRefresh: () => Promise<Record<string, unknown>>
  disabled?: boolean
  disabledMessage?: string
  className?: string
  format?: "yaml" | "json"
}

export default function YamlEditor({
  resource,
  onSave,
  onError,
  onEdit,
  onRefresh,
  disabled = false,
  disabledMessage,
  className = "",
  format = "yaml",
  ...props
}: YamlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  // Serialize resource to YAML or JSON
  const { content, error } = useSerialization(resource, format, onError)

  // Calculate dynamic editor height
  const editorHeight = useEditorHeight(containerRef)

  // Manage editor state and actions
  const editorState = useYamlEditorState({
    resource,
    content,
    format,
    onSave,
    onError,
    onEdit,
    onRefresh,
  })

  // Initialize and manage CodeMirror editor
  useCodeMirror({
    containerRef: editorContainerRef,
    initialContent: content,
    editorHeight,
    format,
    isEditable: editorState.isEditable,
    error,
    editedContent: editorState.editedContent,
    content,
    onDocChange: editorState.setEditedContent,
  })

  // Block navigation when there are unsaved changes
  const navigationBlock = useNavigationBlock({
    hasUnsavedChanges: editorState.hasChanges,
  })

  return (
    <div ref={containerRef} className={`yaml-editor-wrapper ${className}`} {...props}>
      <div
        className="yaml-editor-toolbar tw-flex tw-items-center tw-bg-theme-background-lvl-1 tw-py-3 tw-px-6 tw-mb-px"
        style={{ height: `${TOOLBAR_HEIGHT}px` }}
      >
        <div className="tw-text-sm tw-text-theme-text-secondary">
          {editorState.isEditable ? `Edit Mode (${format.toUpperCase()})` : `Read Mode (${format.toUpperCase()})`}
        </div>
        <div className="tw-ml-auto">
          <Stack alignment="center" gap="2">
            <DisableableButton
              size="small"
              label={editorState.isEditable ? "Cancel" : "Edit"}
              onClick={editorState.handleEditClick}
              variant="subdued"
              disabled={disabled || editorState.isLoading || !!error}
              disabledMessage={disabledMessage}
            />
            {editorState.isEditable && (
              <DisableableButton
                size="small"
                label="Save"
                onClick={editorState.handleSaveClick}
                variant="primary"
                disabled={disabled || !editorState.hasChanges || editorState.isLoading || !!error}
                progress={editorState.isLoading}
                disabledMessage={disabledMessage}
              />
            )}
          </Stack>
        </div>
      </div>
      <div className="tw-border tw-border-theme-box-default">
        <div ref={editorContainerRef} />
      </div>
      <CancelConfirmDialog
        isOpen={editorState.showCancelDialog}
        onCancel={editorState.handleCancelDialogClose}
        onConfirm={editorState.handleCancelConfirm}
      />
      <ResourceVersionConflictDialog
        isOpen={editorState.showVersionConflictDialog}
        onCancel={editorState.handleVersionConflictCancel}
        onConfirm={editorState.handleVersionConflictConfirm}
      />
      <NavigationBlockDialog
        isOpen={navigationBlock.isBlocked}
        onCancel={navigationBlock.reset}
        onConfirm={navigationBlock.proceed}
      />
    </div>
  )
}
