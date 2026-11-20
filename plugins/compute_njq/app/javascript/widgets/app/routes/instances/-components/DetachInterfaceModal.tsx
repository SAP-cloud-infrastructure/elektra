import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { AttachedInterface } from "../../../types/interface"
import type { ComputeApi } from "../../../apiClient"
import { useAttachedInterfacesQuery } from "../../../hooks/useAttachedInterfacesQuery"
import { useDetachInterfaceMutation } from "../../../hooks/useDetachInterfaceMutation"

interface DetachInterfaceModalProps {
  instance: Pick<Instance, "id">
  apiClient: ComputeApi
  onClose: () => void
}

// Detach a network interface: fetches the instance's live, detachable interfaces
// and lets the user pick one by its fixed IP. The server resolves the port_id
// from that address and deletes the interface. Closes on success.
export function DetachInterfaceModal({ instance, apiClient, onClose }: DetachInterfaceModalProps) {
  const queryClient = useQueryClient()
  const query = useAttachedInterfacesQuery(apiClient, instance.id, true)
  const mutation = useDetachInterfaceMutation(apiClient, queryClient)

  const interfaces = query.data?.attached_interfaces ?? []
  const [selected, setSelected] = useState("")
  // Auto-select when exactly one is available (derived, no effect needed).
  const effectiveSelected = selected || (interfaces.length === 1 ? interfaces[0].fixed_ip_address : "")

  const disabled = !effectiveSelected || mutation.isPending

  const submit = () => {
    if (disabled) return
    mutation.mutate({ id: instance.id, fixed_ip_address: effectiveSelected }, { onSuccess: () => onClose() })
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal">
      <Modal.Header closeButton>
        <Modal.Title>Detach Interface</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        {query.isLoading ? (
          <div className="text-muted">Loading interfaces…</div>
        ) : interfaces.length === 0 ? (
          <div className="text-muted">No detachable interfaces.</div>
        ) : (
          <div className="form-group">
            {interfaces.map((iface: AttachedInterface) => (
              <div className="form-check" key={iface.port_id}>
                <input
                  id={`detach-iface-${iface.port_id}`}
                  type="radio"
                  className="form-check-input"
                  name="detach-iface"
                  value={iface.fixed_ip_address}
                  checked={effectiveSelected === iface.fixed_ip_address}
                  onChange={() => setSelected(iface.fixed_ip_address)}
                />
                <label className="form-check-label" htmlFor={`detach-iface-${iface.port_id}`}>
                  {iface.fixed_ip_address}
                  {iface.mac_addr ? ` (${iface.mac_addr})` : ""}
                </label>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={submit}>
          {mutation.isPending ? "Detaching…" : "Detach"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
