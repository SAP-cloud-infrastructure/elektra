import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useUpdateInstanceNameMutation } from "../../../hooks/useUpdateInstanceNameMutation"

interface EditNameModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

// Edit Name: a single text field seeded from the current name. Save is disabled
// for a blank/whitespace-only or unchanged value so we never make a pointless
// Nova call; the backend rejects a blank name too (defense in depth).
export function EditNameModal({ instance, apiClient, onClose }: EditNameModalProps) {
  const queryClient = useQueryClient()
  const mutation = useUpdateInstanceNameMutation(apiClient, queryClient)
  const [value, setValue] = useState(instance.name ?? "")
  const trimmed = value.trim()
  const disabled = !trimmed || trimmed === instance.name || mutation.isPending

  const save = () => {
    if (disabled) return
    mutation.mutate({ id: instance.id, name: trimmed }, { onSuccess: onClose })
  }

  return (
    <Modal
      show
      onHide={onClose}
      dialogClassName="modal-lg"
      bsClass="compute-njq modal"
      aria-labelledby="edit-name-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="edit-name-title">Edit Name</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="form-group">
          <label htmlFor="edit-name-input">Name</label>
          <input
            id="edit-name-input"
            type="text"
            className="form-control"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save()
            }}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={save}>
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
