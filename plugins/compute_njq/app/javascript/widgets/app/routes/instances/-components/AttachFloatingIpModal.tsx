import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useFloatingIpOptionsQuery } from "../../../hooks/useFloatingIpOptionsQuery"
import { useAttachFloatingIpMutation } from "../../../hooks/useAttachFloatingIpMutation"
import { SearchableSelect } from "./SearchableSelect"
import { FormHorizontal, FormRow } from "./FormRow"

interface AttachFloatingIpModalProps {
  instance: Pick<Instance, "id" | "ips">
  apiClient: ComputeApi
  onClose: () => void
}

type Mode = "existing" | "allocate"

// Attach associates a floating IP with one of the instance's fixed IPs. Two
// modes: use an existing free FIP, or allocate a new one on an external network.
// The target fixed IP is auto-selected when the instance has exactly one;
// multi-NIC instances get a chooser. Submit builds the body the BFF expects
// (floating_ip_id XOR floating_network_id, plus fixed_ip_address) and closes on
// success; a failed submit keeps the modal open with the error.
export function AttachFloatingIpModal({ instance, apiClient, onClose }: AttachFloatingIpModalProps) {
  const queryClient = useQueryClient()
  const options = useFloatingIpOptionsQuery(apiClient)
  const mutation = useAttachFloatingIpMutation(apiClient, queryClient)

  const fixedIps = (instance.ips ?? []).filter((ip) => ip.type === "fixed")
  const [mode, setMode] = useState<Mode>("existing")
  const [floatingIpId, setFloatingIpId] = useState("")
  const [floatingNetworkId, setFloatingNetworkId] = useState("")
  const [fixedIp, setFixedIp] = useState(fixedIps.length === 1 ? fixedIps[0].addr : "")

  const availableFips = options.data?.available_floating_ips ?? []
  const externalNetworks = options.data?.external_networks ?? []

  const sourceReady = mode === "existing" ? !!floatingIpId : !!floatingNetworkId
  const disabled = !sourceReady || !fixedIp || mutation.isPending

  const submit = () => {
    if (disabled) return
    mutation.mutate(
      {
        id: instance.id,
        floating_ip_id: mode === "existing" ? floatingIpId : undefined,
        floating_network_id: mode === "allocate" ? floatingNetworkId : undefined,
        fixed_ip_address: fixedIp,
      },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <Modal show onHide={onClose} dialogClassName="modal-xl" bsClass="compute-njq modal">
      <Modal.Header closeButton>
        <Modal.Title>Attach Floating IP</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <FormHorizontal>
          <FormRow label="Source">
            <div className="form-check">
              <input
                id="attach-fip-mode-existing"
                type="radio"
                className="form-check-input"
                name="attach-fip-mode"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
              />
              <label className="form-check-label" htmlFor="attach-fip-mode-existing">
                Use an existing address
              </label>
            </div>
            <div className="form-check">
              <input
                id="attach-fip-mode-allocate"
                type="radio"
                className="form-check-input"
                name="attach-fip-mode"
                checked={mode === "allocate"}
                onChange={() => setMode("allocate")}
              />
              <label className="form-check-label" htmlFor="attach-fip-mode-allocate">
                Allocate a new address
              </label>
            </div>
          </FormRow>

          {mode === "existing" ? (
            <FormRow label="Floating IP" htmlFor="attach-fip-existing">
              <SearchableSelect
                options={availableFips}
                value={floatingIpId || null}
                onChange={setFloatingIpId}
                getLabel={(fip) => fip.floating_ip_address}
                getValue={(fip) => fip.id}
                isLoading={options.isLoading}
                disabled={options.isLoading}
                placeholder="Choose a floating IP"
                emptyMessage="No free floating IPs available"
              />
            </FormRow>
          ) : (
            <FormRow label="External network" htmlFor="attach-fip-network">
              <SearchableSelect
                options={externalNetworks}
                value={floatingNetworkId || null}
                onChange={setFloatingNetworkId}
                getLabel={(net) => net.name ?? net.id}
                getValue={(net) => net.id}
                isLoading={options.isLoading}
                disabled={options.isLoading}
                placeholder="Choose an external network"
                emptyMessage="No external networks available"
              />
            </FormRow>
          )}

          {fixedIps.length > 1 && (
            <FormRow label="Fixed IP" htmlFor="attach-fip-fixed">
              <select
                id="attach-fip-fixed"
                className="form-select"
                value={fixedIp}
                onChange={(e) => setFixedIp(e.target.value)}
              >
                <option value="">Choose a fixed IP</option>
                {fixedIps.map((ip) => (
                  <option key={ip.addr} value={ip.addr}>
                    {ip.addr}
                  </option>
                ))}
              </select>
            </FormRow>
          )}
        </FormHorizontal>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={submit}>
          {mutation.isPending ? "Attaching…" : "Attach"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
