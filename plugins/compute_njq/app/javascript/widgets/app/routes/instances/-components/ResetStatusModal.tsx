import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useResetInstanceStatusMutation } from "../../../hooks/useResetInstanceStatusMutation"

interface ResetStatusModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

// The vm_states an admin may force. Mirrors the backend RESET_STATES whitelist.
const RESET_STATES = ["active", "error"] as const

// Reset Status: admin-only recovery. A <select> picks the target vm_state
// (default "active"); a warning explains this forces the state without touching
// the real instance.
export function ResetStatusModal({ instance, apiClient, onClose }: ResetStatusModalProps) {
  const queryClient = useQueryClient()
  const mutation = useResetInstanceStatusMutation(apiClient, queryClient)
  const [state, setState] = useState<(typeof RESET_STATES)[number]>("active")

  const reset = () => {
    if (mutation.isPending) return
    mutation.mutate({ id: instance.id, state }, { onSuccess: onClose })
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal" aria-labelledby="reset-status-title">
      <Modal.Header closeButton>
        <Modal.Title id="reset-status-title">Reset Status</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="alert alert-warning" role="alert">
          This forces the instance&rsquo;s status in Nova without changing the actual guest. Use it only to recover a
          server stuck in a transient or error state.
        </div>
        <div className="form-group">
          <label htmlFor="reset-status-select">State</label>
          <select
            id="reset-status-select"
            className="form-control"
            value={state}
            onChange={(e) => setState(e.target.value as (typeof RESET_STATES)[number])}
          >
            {RESET_STATES.map((s) => (
              <option value={s} key={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" disabled={mutation.isPending} onClick={reset}>
          {mutation.isPending ? "Resetting…" : "Reset Status"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
