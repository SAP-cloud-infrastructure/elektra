import React from "react"
import { initTooltips, disposeTooltip, initPopovers, disposePopover } from "core/bootstrap_engine"

// Uses the Bootstrap 5 native JS API (via the central engine) to attach a
// tooltip to the wrapped child element.
export const Tooltip = ({
  container,
  content,
  children,
  placement = "top",
  html = false,
  delay,
  trigger = "hover",
}) => {
  const ref = React.useRef()
  React.useEffect(() => {
    if (!ref.current) return
    initTooltips(ref.current, { html, placement, title: content, delay, trigger, container })
    return () => disposeTooltip(ref.current)
  }, [])

  return React.cloneElement(children, { ref })
}

// Uses the Bootstrap 5 native JS API (via the central engine) to attach a
// popover to the wrapped child element.
export const Popover = ({ trigger, title, content, children, placement = "top", html = false }) => {
  const ref = React.useRef()
  React.useEffect(() => {
    if (!ref.current) return
    initPopovers(ref.current, { html, placement, title, content, trigger })
    return () => disposePopover(ref.current)
  }, [])

  return React.cloneElement(children, { ref })
}

