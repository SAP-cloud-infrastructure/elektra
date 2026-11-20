import { useState } from "react"

interface CopyableValueProps {
  // The value shown and copied to the clipboard.
  value: string
  // What the value is, used in the button's accessible label/title
  // (e.g. "IP address", "MAC address").
  label?: string
}

// A value with a copy-to-clipboard button that appears on hover and briefly
// swaps to a checkmark after copying. Generic counterpart to CopyableId — use
// for any short, copy-worthy value (IPs, MACs, …) in the detail view.
export function CopyableValue({ value, label = "value" }: CopyableValueProps) {
  const [copied, setCopied] = useState(false)

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <span className="copyable-value">
      {value}
      <button
        type="button"
        className="copyable-value-copy btn btn-link btn-sm p-0 ms-1 align-baseline"
        onClick={copy}
        aria-label={copied ? "Copied" : `Copy ${label}`}
        title={copied ? "Copied" : `Copy ${label}`}
      >
        <i className={`fa ${copied ? "fa-check text-success" : "fa-copy"}`} />
      </button>
    </span>
  )
}
