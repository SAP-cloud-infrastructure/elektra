import { FlavorTypeTab, FLAVOR_TYPE_LABELS } from "./imageGrouping"

interface Props {
  value: FlavorTypeTab | null
  onChange: (tab: FlavorTypeTab) => void
  // Only tabs that actually have flavors in the current data are offered, so an
  // empty type (e.g. "Other" without untyped flavors) is never rendered.
  availableTabs: FlavorTypeTab[]
}

// First-stage hypervisor-type selector. Picking a type narrows both the flavor
// and the image list, making the flavor<->image coupling visible to the user.
export function FlavorTypeTabs({ value, onChange, availableTabs }: Props) {
  return (
    <ul className="nav nav-pills mb-3" role="tablist">
      {availableTabs.map((tab) => (
        <li className="nav-item" key={tab} role="presentation">
          <button
            type="button"
            role="tab"
            aria-selected={value === tab}
            className={`nav-link ${value === tab ? "active" : ""}`}
            onClick={() => onChange(tab)}
          >
            {FLAVOR_TYPE_LABELS[tab]}
          </button>
        </li>
      ))}
    </ul>
  )
}
