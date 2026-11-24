import { useQueryClient } from "@tanstack/react-query"
import { confirm } from "lib/dialogs"
import { policy } from "lib/policy"
import type { ComputeApi } from "../../../apiClient"
import { useInstanceConsoleQuery } from "../../../hooks/useInstanceConsoleQuery"
import { useInstanceActionMutation } from "../../../hooks/useInstanceActionMutation"

interface ConsoleViewProps {
  instanceId: string
  // Display name (falls back to the id at the call site).
  name: string
  apiClient: ComputeApi
  // Close affordance — the panel slides out, the full-page tab calls window.close.
  onClose: () => void
  // When set, a "New tab" link opens this (same-origin) dashboard console page.
  // The panel passes it; the full-page view omits it (it IS the new tab).
  newTabHref?: string
  // Extra onClick for the New tab link (the panel closes itself after handing
  // off the session).
  onNewTab?: () => void
}

// Whether hard reset is permitted from the console toolbar. A missing/typo'd
// rule makes policy.isAllowed throw; treat that as "not allowed" so one bad
// rule just hides the button.
function hardResetAllowed(): boolean {
  try {
    return policy.isAllowed("compute_njq:instance_hard_reset", { target: {} })
  } catch {
    return false
  }
}

// The shared console body: fetches a fresh Nova console URL for the instance and
// renders it in an iframe, with a toolbar (Hard Reset, Reconnect, optional New
// tab, Close). Used both by the slide-in panel and the full-page console tab.
// The iframe must stay same-origin to the dashboard (no sandbox/referrerpolicy)
// so the console's wss:// handshake carries the dashboard Origin the proxy
// expects — opening the raw Nova URL as a top-level tab fails ("connection is
// closed"), which is why the new tab points at this dashboard page instead.
export function ConsoleView({ instanceId, name, apiClient, onClose, newTabHref, onNewTab }: ConsoleViewProps) {
  const queryClient = useQueryClient()
  const query = useInstanceConsoleQuery(apiClient, instanceId, true)
  const actionMutation = useInstanceActionMutation(apiClient, queryClient)

  const hardReset = () => {
    confirm(`This forcibly power-cycles “${name}” without a clean shutdown. Unsaved data may be lost.`, {
      title: "Hard reset instance?",
      confirmLabel: "Hard reset instance",
      abortLabel: "Cancel",
    })
      .then(() => {
        actionMutation.mutate({ id: instanceId, actionName: "hard_reset", optimisticTransition: "rebooting" })
      })
      .catch(() => {
        // user cancelled — nothing to do
      })
  }

  return (
    <>
      <div className="compute-njq-console-toolbar">
        <span className="compute-njq-console-title">
          <i className="fa fa-terminal me-2" />
          Web Console — {name}
        </span>
        <span className="compute-njq-console-hint">
          The session may expire — click Reconnect if the connection is lost.
        </span>
        <span className="compute-njq-console-buttons">
          {hardResetAllowed() && (
            <button
              type="button"
              className="btn btn-sm btn-danger me-2"
              onClick={hardReset}
              disabled={actionMutation.isPending}
            >
              <i className="fa fa-bolt me-1" /> Hard Reset
            </button>
          )}
          <button type="button" className="btn btn-sm btn-secondary me-2" onClick={() => query.refetch()}>
            <i className="fa fa-rotate-right me-1" /> Reconnect
          </button>
          {newTabHref && (
            <a
              className="btn btn-sm btn-secondary me-2"
              href={newTabHref}
              target="_blank"
              rel="noreferrer"
              title="Open in a new tab"
              onClick={onNewTab}
            >
              <i className="fa fa-up-right-from-square me-1" /> New tab
            </a>
          )}
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            <i className="fa fa-xmark me-1" /> Close
          </button>
        </span>
      </div>
      <div className="compute-njq-console-body">
        {query.isLoading && (
          <div className="compute-njq-console-state" role="status">
            <span className="spinner me-2" aria-hidden="true" />
            Connecting…
          </div>
        )}
        {query.isError && (
          <div className="compute-njq-console-state">
            <div className="alert alert-danger" role="alert">
              {query.error?.message || "The console is not available."}
            </div>
          </div>
        )}
        {query.data && (
          <iframe className="compute-njq-console-frame" src={query.data.url} title={`Web console for ${name}`} />
        )}
      </div>
    </>
  )
}
