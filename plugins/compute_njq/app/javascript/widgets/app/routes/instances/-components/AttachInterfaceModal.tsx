import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import { MultiSelect } from "lib/components/MultiSelect"
import type { Instance } from "../../../types/instance"
import type { InterfaceSubnet } from "../../../types/interface"
import type { ComputeApi } from "../../../apiClient"
import { useInterfaceOptionsQuery } from "../../../hooks/useInterfaceOptionsQuery"
import { useAttachInterfaceMutation } from "../../../hooks/useAttachInterfaceMutation"
import { SearchableSelect } from "./SearchableSelect"
import { groupSecurityGroupsByProject } from "./securityGroupGrouping"
import { FormHorizontal, FormRow } from "./FormRow"

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
    <Modal show onHide={onClose} dialogClassName="modal-xl" bsClass="compute-njq modal">
      <Modal.Header closeButton>
        <Modal.Title>Attach Interface</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <FormHorizontal>
          <FormRow label="Network">
            <SearchableSelect
              options={networks}
              value={networkId || null}
              onChange={(value) => {
                setNetworkId(value)
                // Switching networks invalidates the chosen subnet (and any IP in it).
                setSubnetId("")
                setIpAddress("")
              }}
              getLabel={(n) => n.name ?? n.id}
              getValue={(n) => n.id}
              isLoading={options.isLoading}
              placeholder="Select a network…"
              emptyMessage="No networks available"
            />
          </FormRow>

          <FormRow
            label="Subnet"
            hint="You can specify a subnet from which the fixed IP is chosen. Leave empty to let any subnet be used."
          >
            <SearchableSelect
              options={subnets}
              value={subnetId || null}
              onChange={(value) => {
                setSubnetId(value)
                // A fixed IP is only valid within its subnet's CIDR, so drop any
                // typed IP whenever the subnet changes — not only when cleared.
                setIpAddress("")
              }}
              getLabel={(s) => `${s.name ?? s.id}${s.cidr ? ` (${s.cidr})` : ""}`}
              getValue={(s) => s.id}
              clearable
              disabled={!networkId}
              placeholder={networkId ? "Choose a subnet…" : "Choose a network first"}
              emptyMessage="No subnets for this network"
            />
          </FormRow>

          <FormRow
            label="Fixed IP"
            htmlFor="attach-iface-ip"
            hint="Type a fixed IP within the subnet, or leave empty to let DHCP assign one for you."
          >
            <input
              id="attach-iface-ip"
              type="text"
              className="form-control"
              value={ipAddress}
              disabled={!subnetId}
              placeholder="optional, within the subnet"
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </FormRow>

          <FormRow
            label="Security groups"
            htmlFor="attach-iface-sg"
            hint="By default no security groups are selected. You can create the interface without one — then no security rules are enforced for this interface."
          >
            <MultiSelect
              id="attach-iface-sg"
              options={groups}
              value={securityGroups}
              onChange={setSecurityGroups}
              getLabel={(sg) => sg.name}
              // Neutron ports reference security groups by UUID, so submit the id.
              getValue={(sg) => sg.id}
              getGroups={groupSecurityGroupsByProject}
              isLoading={options.isLoading}
              placeholder="Select security groups…"
              emptyMessage="No security groups available"
            />
          </FormRow>
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
