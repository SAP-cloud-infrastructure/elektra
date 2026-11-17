import { Fragment, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
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

  // Closing the panel discards any half-finished confirm, so a reopened menu
  // always starts on the action list rather than mid-confirm.
  useEffect(() => {
    if (!open) setPending(null)
  }, [open])

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
    // Confirm actions step to an inline confirm in the still-open panel; others
    // fire immediately and close. Keeping the panel open avoids a nested Modal
    // (whose backdrop breaks when this menu lives inside the detail modal).
    if (a.confirm) setPending(a)
    else {
      setOpen(false)
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
          {pending ? (
            // Inline confirm — rendered in place of the action list so it works
            // in the table and inside the detail modal without a second
            // backdrop (no nested lib/components/Modal).
            <li className="px-3 py-2" style={{ minWidth: "16rem" }}>
              <p className="mb-2">{pending.confirm?.message}</p>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm btn-default" onClick={() => setPending(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${pending.destructive ? "btn-danger" : "btn-primary"}`}
                  onClick={() => {
                    run(pending)
                    setPending(null)
                    setOpen(false)
                  }}
                >
                  {pending.confirm?.ok}
                </button>
              </div>
            </li>
          ) : (
            actions.map((a, i) => (
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
            ))
          )}
        </ul>
      )}

      {error && <div className="text-danger small mt-1">{error.message}</div>}
    </div>
  )
}
