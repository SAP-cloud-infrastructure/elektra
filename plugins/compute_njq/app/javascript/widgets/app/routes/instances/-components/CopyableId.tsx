import { useState } from "react"

interface CopyableIdProps {
  id: string
}

// Shows a server's ID in muted (help-text) grey beneath its name, with a copy
// button that appears on row/cell hover. After copying, the icon briefly swaps
// to a checkmark for feedback.
export function CopyableId({ id }: CopyableIdProps) {
  const [copied, setCopied] = useState(false)

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <span className="instance-id info-text">
      {id}
      <button
        type="button"
        className="instance-id-copy btn btn-link btn-sm p-0 ms-1 align-baseline"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy ID"}
        title={copied ? "Copied" : "Copy ID"}
      >
        <i className={`fa ${copied ? "fa-check text-success" : "fa-copy"}`} />
      </button>
    </span>
  )
}
