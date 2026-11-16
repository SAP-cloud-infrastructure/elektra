import { createFileRoute, useRouteContext, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import { CreateInstanceForm } from "./-components/CreateInstanceForm"

export const Route = createFileRoute("/instances/new")({
  component: NewInstance,
})

function NewInstance() {
  const { apiClient } = useRouteContext({ from: Route.id })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const close = () => navigate({ to: "/instances" })

  return (
    <Modal
      show
      onHide={close}
      size="lg"
      backdrop="static"
      keyboard={false}
      dialogClassName="modal-dialog-centered"
      aria-labelledby="new-instance-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="new-instance-title">Create New Instance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreateInstanceForm api={apiClient} queryClient={queryClient} onSuccess={close} onCancel={close} />
      </Modal.Body>
    </Modal>
  )
}
