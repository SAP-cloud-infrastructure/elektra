import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useDetachFloatingIpMutation } from "../../../hooks/useDetachFloatingIpMutation"

interface DetachFloatingIpModalProps {
  instance: Pick<Instance, "id" | "ips">
  apiClient: ComputeApi
  onClose: () => void
}

// Detach disassociates one of the instance's floating IPs. The server resolves
// the FIP id from its address (the BFF only needs the address), so the form just
// picks which floating IP to release. A single FIP is preselected; with several,
// a choice is required before Detach enables. On a failed submit the modal stays
// open and shows the error instead of closing.
export function DetachFloatingIpModal({ instance, apiClient, onClose }: DetachFloatingIpModalProps) {
  const queryClient = useQueryClient()
  const mutation = useDetachFloatingIpMutation(apiClient, queryClient)

  const floatingIps = (instance.ips ?? []).filter((ip) => ip.type === "floating")
  const [selected, setSelected] = useState(floatingIps.length === 1 ? floatingIps[0].addr : "")

  const submit = () => {
    if (!selected || mutation.isPending) return
    mutation.mutate({ id: instance.id, floating_ip_address: selected }, { onSuccess: () => onClose() })
  }

  return (
    <Modal
      show
      onHide={onClose}
      dialogClassName="modal-lg"
      bsClass="compute-njq modal"
      aria-labelledby="detach-floating-ip-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="detach-floating-ip-title">Detach Floating IP</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <p className="text-muted">
          Detaching a floating IP disassociates it from this instance. The IP stays allocated to your project and can be
          attached again later.
        </p>
        <div className="form-group">
          {floatingIps.map((ip) => (
            <div className="form-check" key={ip.addr}>
              <input
                id={`detach-fip-${ip.addr}`}
                type="radio"
                className="form-check-input"
                name="detach-floating-ip"
                value={ip.addr}
                checked={selected === ip.addr}
                onChange={() => setSelected(ip.addr)}
              />
              <label className="form-check-label" htmlFor={`detach-fip-${ip.addr}`}>
                {ip.addr}
              </label>
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={!selected || mutation.isPending} onClick={submit}>
          {mutation.isPending ? "Detaching…" : "Detach"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
