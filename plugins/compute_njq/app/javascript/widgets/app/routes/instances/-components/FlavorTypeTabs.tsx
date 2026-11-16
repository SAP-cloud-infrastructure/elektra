import { Fragment } from "react"
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
//
// Rendered as Bootstrap 5 radio toggle buttons (btn-check + label.btn): the
// choices are mutually exclusive, so a radiogroup is the semantically correct
// control (keyboard arrow navigation, proper a11y) rather than a tablist.
export function FlavorTypeTabs({ value, onChange, availableTabs }: Props) {
  return (
    <>
      {availableTabs.map((tab) => {
        const id = `flavor-type-${tab}`
        return (
          <Fragment key={tab}>
            <input
              type="radio"
              className="btn-check"
              name="flavor-type"
              id={id}
              autoComplete="off"
              checked={value === tab}
              onChange={() => onChange(tab)}
            />
            <label className="btn btn-secondary" htmlFor={id}>
              {FLAVOR_TYPE_LABELS[tab]}
            </label>
          </Fragment>
        )
      })}
    </>
  )
}
