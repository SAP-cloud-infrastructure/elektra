import React from "react"
import { Modal } from "@cloudoperators/juno-ui-components"

interface CancelConfirmDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function CancelConfirmDialog({ isOpen, onCancel, onConfirm }: CancelConfirmDialogProps) {
  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Discard Unsaved Changes?"
      cancelButtonLabel="Keep Editing"
      confirmButtonLabel="Discard Changes"
    >
      <p>You have unsaved changes in the YAML editor. Are you sure you want to discard them?</p>
    </Modal>
  )
}

interface ResourceVersionConflictDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ResourceVersionConflictDialog({ isOpen, onCancel, onConfirm }: ResourceVersionConflictDialogProps) {
  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Resource Has Been Modified"
      cancelButtonLabel="Cancel"
      confirmButtonLabel="Update and Continue"
    >
      <p className="tw-mb-4">
        <strong>The resource has been modified by someone else while you were editing.</strong>
      </p>
      <p className="tw-mb-4">
        If you save your changes you will overwrite their changes. <strong>Are you sure you want to proceed?</strong>
      </p>
    </Modal>
  )
}

interface NavigationBlockDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function NavigationBlockDialog({ isOpen, onCancel, onConfirm }: NavigationBlockDialogProps) {
  return (
    <Modal
      open={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Leave Page?"
      cancelButtonLabel="Stay"
      confirmButtonLabel="Leave"
    >
      <p>You have unsaved changes in the YAML editor. Are you sure you want to leave this page?</p>
    </Modal>
  )
}
