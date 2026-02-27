import { useState, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { parseYamlToObject } from "./yamlParser"

interface UseYamlEditorStateOptions {
  resource: Record<string, unknown>
  yamlContent: string
  onSave: (resource: Record<string, unknown>) => Promise<void>
  onError?: (error: Error) => void
  onEdit?: () => void
  onRefresh: () => Promise<Record<string, unknown>>
}

export function useYamlEditorState({
  resource,
  yamlContent,
  onSave,
  onError,
  onEdit,
  onRefresh,
}: UseYamlEditorStateOptions) {
  const [isEditable, setIsEditable] = useState<boolean>(false)
  const [editedYaml, setEditedYaml] = useState<string>("")
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false)
  const [showVersionConflictDialog, setShowVersionConflictDialog] = useState<boolean>(false)
  const [pendingSaveData, setPendingSaveData] = useState<Record<string, unknown> | null>(null)
  const initialResourceVersionRef = useRef<string | undefined>(undefined)

  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setIsEditable(false)
      setEditedYaml("")
    },
  })

  const exitEditMode = () => {
    setIsEditable(false)
    setEditedYaml("")
    mutation.reset()
  }

  const handleEditClick = () => {
    onEdit?.()
    if (!isEditable) {
      setEditedYaml(yamlContent)
      mutation.reset()
      setIsEditable(true)
      // Capture initial resourceVersion when entering edit mode
      const metadata = resource.metadata as Record<string, unknown> | undefined
      initialResourceVersionRef.current = metadata?.resourceVersion as string | undefined
    } else {
      // Check if there are unsaved changes
      const hasChanges = editedYaml !== yamlContent
      if (hasChanges) {
        setShowCancelDialog(true)
      } else {
        exitEditMode()
      }
    }
  }

  const handleCancelConfirm = () => {
    setShowCancelDialog(false)
    exitEditMode()
  }

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false)
  }

  const handleVersionConflictConfirm = async () => {
    setShowVersionConflictDialog(false)

    if (!pendingSaveData) return

    try {
      // Fetch the latest resource again to ensure we have the most up-to-date resourceVersion
      const latestResource = await onRefresh()

      // Get the latest resourceVersion from the fetched resource
      const metadata = latestResource.metadata as Record<string, unknown> | undefined
      const latestResourceVersion = metadata?.resourceVersion

      if (latestResourceVersion) {
        // Merge user's changes with the latest resourceVersion
        const updatedData = {
          ...pendingSaveData,
          metadata: {
            ...(pendingSaveData.metadata as Record<string, unknown>),
            resourceVersion: latestResourceVersion,
          },
        }
        mutation.mutate(updatedData)
      } else {
        mutation.mutate(pendingSaveData)
      }
      setPendingSaveData(null)
    } catch (error) {
      onError?.(new Error(`Failed to fetch latest resource: ${(error as Error).message}`))
      setPendingSaveData(null)
    }
  }

  const handleVersionConflictCancel = () => {
    setShowVersionConflictDialog(false)
    setPendingSaveData(null)
  }

  const handleSaveClick = async () => {
    try {
      const validatedObject = parseYamlToObject(editedYaml)

      // Refresh the resource to get the latest resourceVersion before saving
      if (onRefresh) {
        try {
          const latestResource = await onRefresh()

          // Check if resourceVersion has changed since we entered edit mode
          const latestMetadata = latestResource.metadata as Record<string, unknown> | undefined
          const latestResourceVersion = latestMetadata?.resourceVersion as string | undefined

          const hasResourceVersionChanged =
            initialResourceVersionRef.current &&
            latestResourceVersion &&
            initialResourceVersionRef.current !== latestResourceVersion

          if (hasResourceVersionChanged) {
            // Show conflict dialog and store the pending save data
            setPendingSaveData(validatedObject)
            setShowVersionConflictDialog(true)
            return
          }
        } catch (error) {
          onError?.(new Error(`Failed to fetch latest resource: ${(error as Error).message}`))
          return
        }
      }

      // No conflict - proceed with save
      mutation.mutate(validatedObject)
    } catch (err) {
      // Show error if YAML is invalid (error already has "Invalid YAML:" prefix from parser)
      onError?.(err as Error)
    }
  }

  const hasChanges = isEditable && editedYaml !== yamlContent
  const isLoading = mutation.isPending || false

  return {
    isEditable,
    editedYaml,
    setEditedYaml,
    showCancelDialog,
    showVersionConflictDialog,
    hasChanges,
    isLoading,
    handleEditClick,
    handleCancelConfirm,
    handleCancelDialogClose,
    handleVersionConflictConfirm,
    handleVersionConflictCancel,
    handleSaveClick,
  }
}
