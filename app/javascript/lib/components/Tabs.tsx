import React, { useEffect, useMemo, useState } from "react"

// React-19-compatible drop-in replacement for react-bootstrap@0.33 Tabs/Tab.
// Emits Bootstrap 3 `.nav-tabs` markup with correct ARIA roles and manages the
// active key in state so tab switching actually works under React 19 (the 0.33
// version never updates aria-selected/active class). Inactive panes stay mounted
// but hidden via CSS (`.tab-pane` without `.active`), matching Bootstrap 3 — they
// are NOT aria-hidden, so their content remains queryable.

// react-bootstrap@0.33 allowed numeric event keys, so accept both and
// normalize to string internally.
type EventKey = string | number

interface TabProps {
  eventKey: EventKey
  title: React.ReactNode
  disabled?: boolean
  children?: React.ReactNode
}

// Tab is a marker component; Tabs reads its props and renders the actual markup.
export const Tab: React.FC<TabProps> = () => null

interface TabsProps {
  id?: string
  defaultActiveKey?: EventKey
  activeKey?: EventKey
  onSelect?: (key: string) => void
  className?: string
  children?: React.ReactNode
}

const isTabElement = (child: React.ReactNode): child is React.ReactElement<TabProps> =>
  React.isValidElement(child) && child.type === Tab

export const Tabs: React.FC<TabsProps> = ({
  id,
  defaultActiveKey,
  activeKey,
  onSelect,
  className,
  children,
}) => {
  // Only real <Tab> children count; conditionally-rendered falsy children are filtered.
  const tabs = useMemo(
    () => React.Children.toArray(children).filter(isTabElement) as React.ReactElement<TabProps>[],
    [children]
  )

  const isControlled = activeKey !== undefined
  const norm = (k: EventKey | undefined): string | undefined => (k === undefined ? undefined : String(k))
  const firstKey = norm(tabs[0]?.props.eventKey)
  const [internalKey, setInternalKey] = useState<string | undefined>(norm(defaultActiveKey) ?? firstKey)

  const currentKey = isControlled ? norm(activeKey) : internalKey

  // If the active tab disappears (e.g. its condition became false), fall back to the first tab.
  useEffect(() => {
    if (isControlled) return
    if (!tabs.some((t) => norm(t.props.eventKey) === internalKey)) {
      setInternalKey(firstKey)
    }
  }, [tabs, internalKey, firstKey, isControlled])

  const baseId = id || "tabs"

  const selectKey = (key: string, disabled?: boolean) => {
    if (disabled) return
    if (!isControlled) setInternalKey(key)
    onSelect?.(key)
  }

  return (
    <div className={className}>
      <ul className="nav nav-tabs" role="tablist">
        {tabs.map((tab) => {
          const { eventKey: rawKey, title, disabled } = tab.props
          const eventKey = String(rawKey)
          const active = eventKey === currentKey
          const tabId = `${baseId}-tab-${eventKey}`
          const panelId = `${baseId}-pane-${eventKey}`
          return (
            <li
              key={eventKey}
              role="presentation"
              className={[active ? "active" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ")}
            >
              <a
                role="tab"
                id={tabId}
                href="#"
                aria-controls={panelId}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={(e) => {
                  e.preventDefault()
                  selectKey(eventKey, disabled)
                }}
              >
                {title}
              </a>
            </li>
          )
        })}
      </ul>
      <div className="tab-content">
        {tabs.map((tab) => {
          const { eventKey: rawKey, children: tabChildren } = tab.props
          const eventKey = String(rawKey)
          const active = eventKey === currentKey
          const tabId = `${baseId}-tab-${eventKey}`
          const panelId = `${baseId}-pane-${eventKey}`
          return (
            <div
              key={eventKey}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
              className={`tab-pane${active ? " active" : ""}`}
              style={active ? undefined : { display: "none" }}
            >
              {tabChildren}
            </div>
          )
        })}
      </div>
    </div>
  )
}
