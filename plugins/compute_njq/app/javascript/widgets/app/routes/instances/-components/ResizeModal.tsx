import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { Instance } from "../../../types/instance"
import type { Flavor } from "../../../types/formOptions"
import type { ComputeApi } from "../../../apiClient"
import { useFlavorsQuery } from "../../../hooks/useFormOptionQueries"
import { useInstanceDetailQuery } from "../../../hooks/useInstanceQueries"
import { useResizeInstanceMutation } from "../../../hooks/useResizeInstanceMutation"
import { SearchableSelect } from "./SearchableSelect"
import { InlineLoading } from "./tabs/InlineLoading"
import { flavorLabel } from "./flavorGrouping"

interface ResizeModalProps {
  instance: Pick<Instance, "id" | "name" | "flavor">
  apiClient: ComputeApi
  onClose: () => void
}

// Resize: pick a new flavor for the server. The current flavor is shown read-only
// and removed from the choices; Resize stays disabled until a different flavor is
// chosen. Mirrors the legacy new_size.html.haml (info callout + "New Flavor").
export function ResizeModal({ instance, apiClient, onClose }: ResizeModalProps) {
  const queryClient = useQueryClient()
  const flavors = useFlavorsQuery(apiClient, { enabled: true })
  const mutation = useResizeInstanceMutation(apiClient, queryClient)
  const [flavorId, setFlavorId] = useState<string | null>(null)

  // Seed the current flavor from the list row the menu passes (Instance.flavor is
  // a { id, name } ref with a real catalog id); the server detail view has no
  // top-level flavor, so relying on it would read undefined. Mirrors how
  // EditNameModal seeds the current name from the passed-in instance.
  const currentId = instance.flavor?.id ?? null
  const currentName = instance.flavor?.name ?? "unknown"
  // Display the current hypervisor type from the instance DETAIL (the server's
  // embedded flavor extra_specs), which carries it reliably. The flavor catalog
  // may omit extra_specs by policy, so a catalog lookup can read "unknown" even
  // when the server clearly runs on a known hypervisor.
  const detail = useInstanceDetailQuery(apiClient, instance.id)
  const currentType = detail.data?.specs?.hypervisor_type ?? null
  // The detail query serves placeholder data (from the list row) until the real
  // aggregated detail arrives; the placeholder has no hypervisor type, so show a
  // loading indicator rather than "unknown" while isPlaceholderData is true —
  // mirrors the detail Specs tab.
  const typeLoading = detail.isPlaceholderData && currentType === null
  // Filter resize targets by the hypervisor type: a resize cannot move a server
  // across hypervisor types, so only same-type flavors are valid targets. Use
  // the DETAIL's type (currentType) — the reliable source — not a catalog lookup
  // of the current flavor, which can fail to resolve and silently fall back to
  // "show all". Until the type is known (loading, or genuinely absent) we cannot
  // safely offer any target, so the list is empty and the dropdown is disabled
  // (see typeKnown below) rather than showing an unfiltered, cross-hypervisor
  // list.
  const all = flavors.data ?? []
  const typeKnown = currentType !== null
  const choices = typeKnown ? all.filter((f) => f.id !== currentId && f.hypervisor_type === currentType) : []
  const disabled = !flavorId || flavorId === currentId || mutation.isPending

  const submit = () => {
    if (disabled || !flavorId) return
    mutation.mutate({ id: instance.id, flavorId }, { onSuccess: onClose })
  }

  return (
    <Modal show onHide={onClose} bsClass="compute-njq modal" aria-labelledby="resize-title">
      <Modal.Header closeButton>
        <Modal.Title id="resize-title">Resize Instance</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-info" role="note">
          Resizing a server is a technically complex operation and might fail for a variety of reasons. In many cases
          a better course of action is to create a new server in the new size and delete the old.
        </div>
        {mutation.error && (
          <div className="alert alert-danger" role="alert">
            {mutation.error.message}
          </div>
        )}
        <div className="form-group mb-3">
          <label className="form-label" htmlFor="resize-current-flavor">
            Current Flavor
          </label>
          <p id="resize-current-flavor" className="form-control-static">
            {currentName} ({typeLoading ? <InlineLoading /> : (currentType ?? "unknown")})
          </p>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="resize-flavor">
            New Flavor
          </label>
          <SearchableSelect<Flavor>
            options={choices}
            value={flavorId}
            onChange={(v) => setFlavorId(v)}
            getValue={(f) => f.id}
            getLabel={(f) => flavorLabel(f)}
            placeholder="Choose flavor"
            isLoading={flavors.isLoading}
            disabled={!typeKnown}
            emptyMessage="No flavors available"
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={submit}>
          {mutation.isPending ? "Resizing…" : "Resize"}
        </button>
      </Modal.Footer>
    </Modal>
  )
}
