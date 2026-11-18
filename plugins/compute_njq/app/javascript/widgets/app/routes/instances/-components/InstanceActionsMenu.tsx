import { Fragment, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { confirm } from "lib/dialogs"
import { InfoTooltip } from "lib/components/InfoTooltip"
import type { ComputeApi } from "../../../apiClient"
import { isTransitioning, type Instance } from "../../../types/instance"
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
  const transitioning = isTransitioning(instance.status)
  // Hide the menu entirely only when the user can do nothing at all AND nothing
  // is in progress (e.g. no policy permission) — a permanently dead control is
  // just noise. While transitioning we keep the toggle (disabled) so the row
  // layout stays stable and the user sees actions are only temporarily blocked.
  if (actions.length === 0 && !transitioning) return null

  const run = (a: InstanceAction) => {
    if (a.key === "terminate") {
      terminateMutation.mutate({ id: instance.id })
    } else {
      actionMutation.mutate({ id: instance.id, actionName: a.key, optimisticTransition: a.optimisticTransition })
    }
  }

  const onClick = (a: InstanceAction) => {
    // Close the panel first; confirm actions open the shared Elektra confirm
    // dialog (lib/dialogs) — a portal modal that layers above the detail modal
    // when the menu lives there, so there is no nested-backdrop problem. Others
    // fire immediately.
    setOpen(false)
    if (a.confirm) {
      confirm(a.confirm.message, { title: a.confirm.title, confirmLabel: a.confirm.ok, abortLabel: "Cancel" })
        .then(() => run(a))
        .catch(() => {
          /* cancelled */
        })
    } else {
      run(a)
    }
  }
  const error = actionMutation.error ?? terminateMutation.error
  // While a mutation is in flight (until onSettled's reconciling refetch lands)
  // the whole menu is locked: the optimistic patch (esp. unlock widening the
  // menu) already reflects the new state, so a second action fired in this
  // window would race the backend and be rejected. Disabling the toggle keeps
  // the panel closed and un-reopenable until the real state is back.
  const busy = actionMutation.isPending || terminateMutation.isPending

  // Transitioning (and not driven by our own in-flight mutation): show the
  // toggle disabled with an explaining tooltip instead of opening the menu, so
  // the user sees actions are temporarily blocked and the row doesn't reflow.
  if (transitioning && !busy) {
    const what = instance.status.transition || instance.status.state
    return (
      <div className="btn-group">
        <InfoTooltip content={`Actions are unavailable while the instance is ${what}.`}>
          <button type="button" className="btn btn-secondary btn-sm dropdown-toggle" aria-label="Actions" disabled>
            <span className="fa fa-cog" />
          </button>
        </InfoTooltip>
      </div>
    )
  }

  return (
    <div className="btn-group" ref={ref}>
      <button
        type="button"
        className="btn btn-secondary btn-sm dropdown-toggle"
        aria-label="Actions"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
      >
        {busy ? <span className="spinner" role="status" aria-label="in progress" /> : <span className="fa fa-cog" />}
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
                  className={`dropdown-item${a.dangerLabel ? " text-danger" : ""}`}
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
    </div>
  )
}
