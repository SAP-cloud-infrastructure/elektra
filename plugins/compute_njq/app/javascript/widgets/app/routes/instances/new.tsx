import { useState } from "react"
import { createFileRoute, useRouteContext, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import { CreateInstanceForm } from "./-components/CreateInstanceForm"

export const Route = createFileRoute("/instances/new")({
  component: NewInstance,
})

const FORM_ID = "create-instance-form"

function NewInstance() {
  const { apiClient } = useRouteContext({ from: Route.id })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const close = () => navigate({ to: "/instances" })

  // The form lives in the modal body but its submit/cancel controls live in the
  // footer; the form reports its state up so the footer can drive it.
  const [status, setStatus] = useState({ canSubmit: false, isPending: false })

  return (
    <Modal
      show
      onHide={close}
      dialogClassName="modal-xl"
      bsClass="compute-njq modal"
      backdrop="static"
      keyboard={false}
      aria-labelledby="new-instance-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="new-instance-title">New Instance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreateInstanceForm
          api={apiClient}
          queryClient={queryClient}
          onSuccess={close}
          onCancel={close}
          formId={FORM_ID}
          onStatusChange={setStatus}
        />
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={close} disabled={status.isPending}>
          Cancel
        </button>
        <button
          type="submit"
          form={FORM_ID}
          className="btn btn-primary"
          disabled={!status.canSubmit || status.isPending}
        >
          {status.isPending ? "Creating…" : "Create"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
