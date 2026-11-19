import { useEffect, useState } from "react"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useCreateSnapshotMutation } from "../../../hooks/useCreateSnapshotMutation"
import { useImageStatusQuery, isTerminalStatus } from "../../../hooks/useImageStatusQuery"
import { InlineLoading } from "./tabs/InlineLoading"

interface SnapshotModalProps {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
}

type Phase = "form" | "creating" | "success" | "error"

// Create Snapshot: unlike the fire-and-close modals, this one stays open after
// submit. It posts createImage, then polls the new Glance image's status and
// shows progress until the image is active (success) or fails (error). The user
// closes it manually — it never auto-closes.
export function SnapshotModal({ instance, apiClient, onClose }: SnapshotModalProps) {
  const mutation = useCreateSnapshotMutation(apiClient)
  const [name, setName] = useState("")
  const [phase, setPhase] = useState<Phase>("form")
  const [imageId, setImageId] = useState<string | null>(null)

  const statusQuery = useImageStatusQuery(apiClient, imageId, { enabled: phase === "creating" })
  const status = statusQuery.data?.status

  // Drive the state machine from the polled status while creating. A terminal
  // status settles success/failure; a failed poll (transient 404 while the image
  // is not yet GET-able, network, BFF error) also ends in error rather than
  // spinning forever — the modal must never hang in "creating".
  useEffect(() => {
    if (phase !== "creating") return
    if (statusQuery.isError) {
      setPhase("error")
      return
    }
    if (isTerminalStatus(status)) setPhase(status === "active" ? "success" : "error")
  }, [phase, status, statusQuery.isError])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed || mutation.isPending) return
    mutation.mutate(
      { id: instance.id, name: trimmed },
      {
        onSuccess: ({ image_id }) => {
          // No image id means we can neither poll nor confirm — treat as error
          // rather than spin forever.
          if (!image_id) {
            setPhase("error")
            return
          }
          setImageId(image_id)
          setPhase("creating")
        },
      }
    )
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal" aria-labelledby="snapshot-title">
      <Modal.Header closeButton>
        <Modal.Title id="snapshot-title">Create Snapshot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {phase === "form" && (
          <>
            {mutation.error && (
              <div className="alert alert-danger" role="alert">
                {mutation.error.message}
              </div>
            )}
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
          </>
        )}

        {phase === "creating" && (
          <div role="status">
            <InlineLoading /> Creating snapshot “{name.trim()}”… ({status ?? "starting"})
            <p className="text-muted mt-2 mb-0">
              You can close this dialog — the snapshot continues in the background and will appear in the
              Snapshots plugin once it is finished.
            </p>
          </div>
        )}

        {phase === "success" && (
          <div className="alert alert-success" role="status">
            Snapshot ready.
          </div>
        )}

        {phase === "error" && (
          <div className="alert alert-danger" role="alert">
            {mutation.error?.message ?? statusQuery.error?.message ?? "The snapshot could not be created."}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {phase === "creating" || phase === "success" ? "Close" : "Cancel"}
        </button>
        {phase === "form" && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!name.trim() || mutation.isPending}
            onClick={submit}
          >
            {mutation.isPending ? "Creating…" : "Create Snapshot"}
          </button>
        )}
        {phase === "error" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              mutation.reset()
              setPhase("form")
            }}
          >
            Try again
          </button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
