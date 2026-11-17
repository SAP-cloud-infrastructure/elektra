import { Fragment, useEffect, useRef, useState } from "react"
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
  // Open state is controlled in React rather than Bootstrap's data-API, so the
  // menu behaves identically in tests and in the browser without depending on a
  // global dropdown side-effect (mirrors SearchableSelect).
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const actions = visibleActions(instance, scope)
  if (actions.length === 0) return null

  const run = (a: InstanceAction) => {
    if (a.key === "terminate") {
      terminateMutation.mutate({ id: instance.id })
    } else {
      actionMutation.mutate({ id: instance.id, actionName: a.key, optimisticTransition: a.optimisticTransition })
    }
  }

  const onClick = (a: InstanceAction) => {
    setOpen(false)
    if (a.confirm) setPending(a)
    else run(a)
  }
  const error = actionMutation.error ?? terminateMutation.error

  return (
    <div className="btn-group" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary btn-sm dropdown-toggle"
        aria-label="Actions"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="fa fa-cog" />
      </button>
      {open && (
        // React-controlled, so Bootstrap's Popper never runs and its
        // [data-bs-popper] position rules don't apply. Position the panel
        // ourselves: drop below the toggle and align its right edge to the
        // button's right edge (end alignment) so it opens leftwards and never
        // overflows the table's right edge. The toggle stays visible above it.
        <ul
          className="dropdown-menu dropdown-menu-end show"
          role="menu"
          style={{ position: "absolute", top: "100%", right: 0, left: "auto", marginTop: "0.125rem" }}
        >
          {actions.map((a, i) => (
            <Fragment key={a.key}>
              {/* Divider between legacy groups — never before the first item. */}
              {i > 0 && actions[i - 1].group !== a.group && <li className="dropdown-divider" role="separator" />}
              <li>
                <button
                  type="button"
                  className={`dropdown-item${a.destructive ? " text-danger" : ""}`}
                  onClick={() => onClick(a)}
                >
                  {a.label}
                </button>
              </li>
            </Fragment>
          ))}
        </ul>
      )}

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
