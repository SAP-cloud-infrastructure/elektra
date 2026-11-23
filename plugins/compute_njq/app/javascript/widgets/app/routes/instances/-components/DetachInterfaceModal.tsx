import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { AttachedInterface } from "../../../types/interface"
import type { ComputeApi } from "../../../apiClient"
import { useAttachedInterfacesQuery } from "../../../hooks/useAttachedInterfacesQuery"
import { useDetachInterfaceMutation } from "../../../hooks/useDetachInterfaceMutation"
import { SearchableSelect } from "./SearchableSelect"
import { FormHorizontal, FormRow } from "./FormRow"

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
    <Modal show onHide={onClose} dialogClassName="modal-xl" bsClass="compute-njq modal">
      <Modal.Header closeButton>
        <Modal.Title>Detach Interface</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <FormHorizontal>
          <FormRow label="Interface" htmlFor="detach-iface-select">
            <SearchableSelect<AttachedInterface>
              options={interfaces}
              value={effectiveSelected || null}
              onChange={setSelected}
              getLabel={(iface) => `${iface.fixed_ip_address}${iface.mac_addr ? ` (${iface.mac_addr})` : ""}`}
              getValue={(iface) => iface.fixed_ip_address}
              // While the live interface list loads, show the dropdown with the
              // shared spinner/disabled pattern (like every other picker) instead
              // of a bare "Loading…" line on an otherwise empty modal.
              isLoading={query.isLoading}
              disabled={query.isLoading}
              placeholder="Choose an interface"
              emptyMessage="No detachable interfaces"
            />
          </FormRow>
        </FormHorizontal>
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
