import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useTerminateInstanceMutation } from "../../../hooks/useTerminateInstanceMutation"

interface TerminateModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

// Terminate is the one irreversible action, so it gets a type-to-confirm gate
// instead of a plain confirm dialog: the user must type the exact instance name
// (falling back to the id when the server has no name) before the destructive
// button enables. This guards against terminating the wrong VM after opening
// the actions menu on the wrong row. On a failed submit the modal stays open
// and shows the error instead of closing.
export function TerminateModal({ instance, apiClient, onClose }: TerminateModalProps) {
  const queryClient = useQueryClient()
  const mutation = useTerminateInstanceMutation(apiClient, queryClient)
  const [value, setValue] = useState("")

  const target = instance.name ?? instance.id
  const match = value.trim() === target

  const submit = () => {
    if (!match || mutation.isPending) return
    mutation.mutate({ id: instance.id }, { onSuccess: onClose })
  }

  return (
    <Modal
      show
      onHide={onClose}
      dialogClassName="modal-xl"
      bsClass="compute-njq modal"
      aria-labelledby="terminate-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="terminate-title">Terminate Instance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="alert alert-danger" role="note">
          This permanently deletes the instance. Attached non-persistent disks are destroyed. This cannot be undone.
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="terminate-name">
            Type the instance name <strong>{target}</strong> to confirm
          </label>
          <input
            id="terminate-name"
            type="text"
            className="form-control"
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit()
              }
            }}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" disabled={!match || mutation.isPending} onClick={submit}>
          {mutation.isPending ? "Terminating…" : "Terminate instance"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
