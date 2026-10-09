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

/*
// This approach uses the markup from bootstrap 3 but it uses React to
// place the Tooltip (Portal + Position calculation)
let tooltipsContainer = document.querySelector("[data-tooltips-container]")
if (!tooltipsContainer) {
  tooltipsContainer = document.createElement("div")
  tooltipsContainer.setAttribute("data-tooltips-container", "true")
  document.body.append(tooltipsContainer)
}

const TooltipContent2 = ({ content, hostRef, position }) => {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    if (!hostRef.current) return

    hostRef.current.onmouseover = () => setShow(true)
    hostRef.current.onmouseleave = () => setShow(false)
  }, [])

  if (!show) return null
  return createPortal(
    <div
      ref={(el) => {
        if (!el || !hostRef.current || el.classList.contains("in")) return
        const host = hostRef.current.getBoundingClientRect()
        const tooltip = el.getBoundingClientRect()
        switch (position) {
          case "top":
            el.style.left = `${host.x + host.width / 2 - tooltip.width / 2}px`
            el.style.top = `${host.y - tooltip.height}px`
            break
          case "bottom":
            el.style.left = `${host.x + host.width / 2 - tooltip.width / 2}px`
            el.style.top = `${host.y + host.height}px`
            break
          case "left":
            el.style.left = `${host.x - tooltip.width}px`
            el.style.top = `${host.y + host.height / 2 - tooltip.height / 2}px`
            break
          case "right":
            el.style.left = `${host.x + host.width}px`
            el.style.top = `${host.y + host.height / 2 - tooltip.height / 2}px`
            break
        }

        el.classList.add("in")

        console.log(el)
      }}
      className={`tooltip fade ${position}`}
      role="tooltip"
    >
      <div className="tooltip-arrow"></div>
      <div className="tooltip-inner">{content}</div>
    </div>,
    tooltipsContainer
  )
}

export const Tooltip2 = ({ children, content, position = "top" }) => {
  const ref = React.useRef()

  return (
    <>
      {React.cloneElement(children, { ref })}
      <TooltipContent2 content={content} hostRef={ref} position={position} />
    </>
  )
}
*/
