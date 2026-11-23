import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useDetachFloatingIpMutation } from "../../../hooks/useDetachFloatingIpMutation"
import { SearchableSelect } from "./SearchableSelect"
import { FormHorizontal, FormRow } from "./FormRow"

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
      dialogClassName="modal-xl"
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
        <div className="alert alert-info" role="note">
          Detaching a floating IP disassociates it from this instance. The IP stays allocated to your project and can be
          attached again later.
        </div>
        <FormHorizontal>
          <FormRow label="Floating IP" htmlFor="detach-fip-select">
            <SearchableSelect
              options={floatingIps}
              value={selected || null}
              onChange={setSelected}
              getLabel={(ip) => ip.addr}
              getValue={(ip) => ip.addr}
              placeholder="Choose a floating IP"
              emptyMessage="No floating IPs attached"
            />
          </FormRow>
        </FormHorizontal>
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
