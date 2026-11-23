import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import { MultiSelect } from "lib/components/MultiSelect"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { useInstanceDetailQuery } from "../../../hooks/useInstanceQueries"
import { useSecurityGroupOptionsQuery } from "../../../hooks/useSecurityGroupOptionsQuery"
import { useEditSecurityGroupsMutation } from "../../../hooks/useEditSecurityGroupsMutation"
import { groupSecurityGroupsByProject } from "./securityGroupGrouping"

interface EditSecurityGroupsModalProps {
  instance: Pick<Instance, "id">
  apiClient: ComputeApi
  onClose: () => void
}

// Edit the instance's security groups. The current set is read from the
// instance detail and preselected; the user adjusts the set and saves, which
// writes the full desired set to every Neutron port of the instance (matching
// the aggregated server-wide set the detail Security Groups tab shows). Closes
// on success; stays open and shows the error on failure.
export function EditSecurityGroupsModal({ instance, apiClient, onClose }: EditSecurityGroupsModalProps) {
  const queryClient = useQueryClient()
  const detail = useInstanceDetailQuery(apiClient, instance.id)
  const options = useSecurityGroupOptionsQuery(apiClient)
  const mutation = useEditSecurityGroupsMutation(apiClient, queryClient)

  const [selected, setSelected] = useState<string[]>([])
  // Seed the selection from the instance's current security groups once the
  // REAL detail resolves. The detail query first serves a placeholder built
  // from the list row, which carries no security groups — seeding from that
  // would leave the picker empty even after the aggregated detail arrives. Null
  // ids (unresolvable groups) can't be real selections, so they are skipped.
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    if (seeded || !detail.data || detail.isPlaceholderData) return
    const ids = (detail.data.security_groups ?? [])
      .map((sg) => sg.id)
      .filter((id): id is string => typeof id === "string")
    setSelected(ids)
    setSeeded(true)
  }, [seeded, detail.data, detail.isPlaceholderData])

  const groups = options.data ?? []
  // Ready only when BOTH sources have fully loaded: the options list (to render
  // the picker) and the REAL instance detail (not the list-row placeholder, so
  // the current set is seeded). Until then the modal shows a spinner and the
  // picker/Save stay inert — the user can't change anything before it has all
  // loaded.
  const ready = !options.isLoading && !!detail.data && !detail.isPlaceholderData
  const disabled = !ready || selected.length === 0 || mutation.isPending

  const submit = () => {
    if (disabled) return
    mutation.mutate({ id: instance.id, security_groups: selected }, { onSuccess: () => onClose() })
  }

  return (
    <Modal show onHide={onClose} dialogClassName="modal-lg" bsClass="compute-njq modal" aria-labelledby="edit-sg-title">
      <Modal.Header closeButton>
        <Modal.Title id="edit-sg-title">Edit Security Groups</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="alert alert-info" role="note">
          Please note that changing the security groups here affects all assigned interfaces (ports). This means that
          the security groups of each attached port are adapted accordingly. If you have individual port security group
          settings we recommend making security group changes only via the ports UI in the networking section.
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="edit-sg-select">
            Security groups
          </label>
          <MultiSelect
            id="edit-sg-select"
            options={groups}
            value={selected}
            onChange={setSelected}
            getLabel={(sg) => sg.name}
            // Neutron ports reference security groups by UUID, so submit the id.
            getValue={(sg) => sg.id}
            getGroups={groupSecurityGroupsByProject}
            // Show the in-picker spinner and lock the control until BOTH the
            // options and the real detail have loaded, so nothing can be changed
            // before the current set is known.
            isLoading={!ready}
            disabled={!ready}
            placeholder="Select security groups…"
            emptyMessage="No security groups available"
          />
          <p className="form-text">
            <i className="fa fa-info-circle" />
            At least one security group must remain assigned.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={submit}>
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
