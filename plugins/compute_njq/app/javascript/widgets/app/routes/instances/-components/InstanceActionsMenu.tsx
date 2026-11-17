import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { ComputeApi } from "../../../apiClient"
import type { Instance } from "../../../types/instance"
import { visibleActions, type InstanceAction } from "./instanceActions"
import { useInstanceActionMutation } from "../../../hooks/useInstanceActionMutation"
import { useTerminateInstanceMutation } from "../../../hooks/useTerminateInstanceMutation"

interface Props {
  instance: Instance
  scope: Record<string, unknown>
  // The BFF client, sourced from the route context by the caller (the instances
  // layout route) and threaded down — mirrors how CreateInstanceForm receives it.
  apiClient: ComputeApi
}

export default function InstanceActionsMenu({ instance, scope, apiClient }: Props) {
  const queryClient = useQueryClient()
  const actionMutation = useInstanceActionMutation(apiClient, queryClient)
  const terminateMutation = useTerminateInstanceMutation(apiClient, queryClient)
  const [pending, setPending] = useState<InstanceAction | null>(null)

  const actions = visibleActions(instance, scope)
  if (actions.length === 0) return null

  const run = (a: InstanceAction) => {
    if (a.key === "terminate") {
      terminateMutation.mutate({ id: instance.id })
    } else {
      actionMutation.mutate({ id: instance.id, actionName: a.key, optimisticTransition: a.optimisticTransition })
    }
  }

  const onClick = (a: InstanceAction) => (a.confirm ? setPending(a) : run(a))
  const error = actionMutation.error ?? terminateMutation.error

  return (
    <div className="btn-group">
      <button
        type="button"
        className="btn btn-secondary btn-sm dropdown-toggle"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <span className="fa fa-cog" />
      </button>
      <ul className="dropdown-menu dropdown-menu-end" role="menu">
        {actions.map((a) => (
          <li key={a.key}>
            <button
              type="button"
              className={`dropdown-item${a.destructive ? " text-danger" : ""}`}
              onClick={() => onClick(a)}
            >
              {a.label}
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="text-danger small mt-1">{error.message}</div>}

      <Modal show={!!pending} onHide={() => setPending(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{pending?.label}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{pending?.confirm?.message}</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-default" onClick={() => setPending(null)}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${pending?.destructive ? "btn-danger" : "btn-primary"}`}
            onClick={() => {
              if (pending) run(pending)
              setPending(null)
            }}
          >
            {pending?.confirm?.ok}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
