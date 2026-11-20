import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { InterfaceSubnet, InterfaceSecurityGroup } from "../../../types/interface"
import type { ComputeApi } from "../../../apiClient"
import { useInterfaceOptionsQuery } from "../../../hooks/useInterfaceOptionsQuery"
import { useAttachInterfaceMutation } from "../../../hooks/useAttachInterfaceMutation"

interface AttachInterfaceModalProps {
  instance: Pick<Instance, "id">
  apiClient: ComputeApi
  onClose: () => void
}

// Attach a new network interface: the user picks a network (required), an
// optional subnet, an optional fixed IP (only meaningful with a subnet), and
// optional security groups. The server creates a Neutron port from these and
// attaches it to the instance by port_id. Closes on success; stays open on error.
export function AttachInterfaceModal({ instance, apiClient, onClose }: AttachInterfaceModalProps) {
  const queryClient = useQueryClient()
  const options = useInterfaceOptionsQuery(apiClient)
  const mutation = useAttachInterfaceMutation(apiClient, queryClient)

  const [networkId, setNetworkId] = useState("")
  const [subnetId, setSubnetId] = useState("")
  const [ipAddress, setIpAddress] = useState("")
  const [securityGroups, setSecurityGroups] = useState<string[]>([])

  const networks = options.data?.networks ?? []
  const subnets = (options.data?.subnets ?? []).filter((s: InterfaceSubnet) => s.network_id === networkId)
  const groups = options.data?.security_groups ?? []

  const disabled = !networkId || mutation.isPending

  const toggleGroup = (id: string) =>
    setSecurityGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))

  const submit = () => {
    if (disabled) return
    mutation.mutate(
      {
        id: instance.id,
        network_id: networkId,
        subnet_id: subnetId || undefined,
        ip_address: ipAddress || undefined,
        security_groups: securityGroups,
      },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal">
      <Modal.Header closeButton>
        <Modal.Title>Attach Interface</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="form-group mb-3">
          <label className="form-label" htmlFor="attach-iface-network">
            Network
          </label>
          <select
            id="attach-iface-network"
            className="form-select"
            value={networkId}
            disabled={options.isLoading}
            onChange={(e) => {
              setNetworkId(e.target.value)
              setSubnetId("")
              setIpAddress("")
            }}
          >
            <option value="">Choose a network</option>
            {networks.map((net) => (
              <option key={net.id} value={net.id}>
                {net.name ?? net.id}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group mb-3">
          <label className="form-label" htmlFor="attach-iface-subnet">
            Subnet
          </label>
          <select
            id="attach-iface-subnet"
            className="form-select"
            value={subnetId}
            disabled={!networkId}
            onChange={(e) => {
              setSubnetId(e.target.value)
              // A fixed IP is only valid within its subnet's CIDR, so drop any
              // typed IP whenever the subnet changes — not only when cleared.
              setIpAddress("")
            }}
          >
            <option value="">Auto</option>
            {subnets.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {(sub.name ?? sub.id) + (sub.cidr ? ` (${sub.cidr})` : "")}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group mb-3">
          <label className="form-label" htmlFor="attach-iface-ip">
            Fixed IP
          </label>
          <input
            id="attach-iface-ip"
            type="text"
            className="form-control"
            value={ipAddress}
            disabled={!subnetId}
            placeholder="optional, within the subnet"
            onChange={(e) => setIpAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <span className="form-label">Security groups</span>
          {groups.map((sg: InterfaceSecurityGroup) => (
            <div className="form-check" key={sg.id}>
              <input
                id={`attach-iface-sg-${sg.id}`}
                type="checkbox"
                className="form-check-input"
                checked={securityGroups.includes(sg.id)}
                onChange={() => toggleGroup(sg.id)}
              />
              <label className="form-check-label" htmlFor={`attach-iface-sg-${sg.id}`}>
                {sg.name ?? sg.id}
              </label>
            </div>
          ))}
        </div>
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
