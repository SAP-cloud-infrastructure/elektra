import { useEffect, useState } from "react"
import type { Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import { ConsoleView } from "./ConsoleView"

interface WebConsolePanelProps {
  // The instance whose console is open, or null when the panel is closed.
  instance: Pick<Instance, "id" | "name"> | null
  apiClient: ComputeApi
  onClose: () => void
  // Href of the same-origin full-page console route, for the "New tab" link
  // (e.g. "<basepath>/console/<id>"). Opening the raw Nova URL in a tab fails
  // the wss handshake; the dashboard page does not.
  consoleHref: (id: string) => string
}

// A web-console panel that slides in from the left over a dimmed backdrop. It
// is mounted once at the instances route; setting `instance` opens it for that
// server. The console body (iframe + toolbar) is the shared ConsoleView; the
// panel only owns the slide/backdrop chrome. Renders nothing when closed.
export function WebConsolePanel({ instance, apiClient, onClose, consoleHref }: WebConsolePanelProps) {
  if (!instance) return null
  return <ConsolePanel instance={instance} apiClient={apiClient} onClose={onClose} consoleHref={consoleHref} />
}

function ConsolePanel({
  instance,
  apiClient,
  onClose,
  consoleHref,
}: {
  instance: Pick<Instance, "id" | "name">
  apiClient: ComputeApi
  onClose: () => void
  consoleHref: (id: string) => string
}) {
  const name = instance.name ?? instance.id

  // Slide in from the left on mount; closing clears `open` to slide back out and
  // calls onClose once the transition ends (a timeout backs up transitionend).
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const requestClose = () => {
    setOpen(false)
    setTimeout(onClose, 350)
  }

  return (
    <div
      className={`compute-njq-console-panel${open ? " is-open" : ""}`}
      role="dialog"
      aria-label={`Web console for ${name}`}
      onTransitionEnd={() => {
        if (!open) onClose()
      }}
    >
      <ConsoleView
        instanceId={instance.id}
        name={name}
        apiClient={apiClient}
        onClose={requestClose}
        newTabHref={consoleHref(instance.id)}
        // The console session is single-use: once it is handed to a new tab,
        // close this panel so the two don't fight over the same connection.
        onNewTab={requestClose}
      />
    </div>
  )
}
