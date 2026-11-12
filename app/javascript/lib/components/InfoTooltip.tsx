import React, { useState, useId } from "react"

export interface InfoTooltipProps {
  /** Tooltip text shown on hover/focus. */
  content: React.ReactNode
  /**
   * Trigger element. Defaults to a Font Awesome info-circle icon, matching the
   * "ⓘ" affordance used across the dashboard (e.g. the legacy compute list).
   */
  children?: React.ReactNode
  /** Tooltip placement relative to the trigger. */
  placement?: "top" | "bottom"
  /** Accessible label for the default icon trigger. */
  label?: string
  /**
   * When set, the tooltip wraps across multiple lines up to this width
   * (e.g. "18rem") instead of staying on a single line. Use for longer
   * explanatory text.
   */
  maxWidth?: string
}

const bubbleBaseStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1080,
  whiteSpace: "nowrap",
  background: "#333",
  color: "#fff",
  padding: "0.25rem 0.5rem",
  borderRadius: 4,
  fontSize: "0.75rem",
  fontWeight: 400,
  pointerEvents: "none",
  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
}

/**
 * A lightweight, self-contained info tooltip rendered entirely in React — no
 * Bootstrap/jQuery dependency. The tooltip appears on hover and on keyboard
 * focus (so it is accessible), and also sets a native `title` for a graceful
 * fallback. Use it for short explanatory hints next to a label or icon.
 *
 * Usage:
 *   <InfoTooltip content="Availability Zone" />            // default ⓘ icon
 *   <InfoTooltip content="More info"><span>?</span></InfoTooltip>
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children,
  placement = "top",
  label = "More information",
  maxWidth,
}) => {
  const [open, setOpen] = useState(false)
  const id = useId()

  const bubbleStyle: React.CSSProperties = {
    ...bubbleBaseStyle,
    ...(placement === "top" ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
    ...(maxWidth ? { whiteSpace: "normal", maxWidth, width: "max-content" } : {}),
  }

  const title = typeof content === "string" ? content : undefined
  const hasCustomTrigger = children != null

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        role={hasCustomTrigger ? undefined : "button"}
        aria-label={hasCustomTrigger ? undefined : label}
        aria-describedby={open ? id : undefined}
        title={title}
        // Default (icon) trigger gets the dimmed help-cursor affordance; a
        // custom trigger (e.g. a table cell value) is left visually untouched.
        style={
          hasCustomTrigger
            ? { color: "inherit", outline: "none" }
            : { cursor: "help", color: "inherit", opacity: 0.6, outline: "none" }
        }
      >
        {children ?? <i className="fa fa-info-circle" />}
      </span>
      {open && (
        <span id={id} role="tooltip" style={bubbleStyle}>
          {content}
        </span>
      )}
    </span>
  )
}

export default InfoTooltip
