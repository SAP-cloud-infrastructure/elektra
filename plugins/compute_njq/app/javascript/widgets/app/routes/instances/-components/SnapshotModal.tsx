import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useCreateSnapshotMutation } from "../../../hooks/useCreateSnapshotMutation"

interface SnapshotModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

// Create Snapshot behaves like the other lifecycle actions: it just prompts for
// a name, fires, and closes. Progress is shown in the instance row's status pill
// — during a Nova snapshot the server stays active but its task_state cycles
// through image_snapshot → image_pending_upload → image_uploading, which the BFF
// surfaces as status.transition (see useCreateSnapshotMutation). On a failed
// submit the modal stays open and shows the error instead of closing.
export function SnapshotModal({ instance, apiClient, onClose }: SnapshotModalProps) {
  const queryClient = useQueryClient()
  const mutation = useCreateSnapshotMutation(apiClient, queryClient)
  const [name, setName] = useState("")

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed || mutation.isPending) return
    mutation.mutate({ id: instance.id, name: trimmed }, { onSuccess: () => onClose() })
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal" aria-labelledby="snapshot-title">
      <Modal.Header closeButton>
        <Modal.Title id="snapshot-title">Create Snapshot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <p className="text-muted">
          A snapshot is an image which preserves the disk state of a running instance.
        </p>
        <div className="form-group">
          <label className="form-label" htmlFor="snapshot-name">
            Name
          </label>
          <input
            id="snapshot-name"
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!name.trim() || mutation.isPending}
          onClick={submit}
        >
          {mutation.isPending ? "Creating…" : "Create Snapshot"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
