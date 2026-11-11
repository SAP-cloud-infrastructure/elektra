import React, { useState, useEffect } from "react"
import uniqueId from "lodash/uniqueId"
import { Popover, Tooltip, Overlay } from "react-bootstrap"
import { Highlighter } from "react-bootstrap-typeahead"

const MyHighlighter = ({ search, children }) => {
  if (!search || !children) return children
  return <Highlighter search={search}>{children + ""}</Highlighter>
}

/**
 *
 * text --> text to show
 * size --> chars numbers to display
 * sliceType --> text sliced from END OR MIDDLE (default: END)
 * shouldClose --> Popover if displayed will be closed
 * bsClass --> overwrite base class
 * shouldCopy --> copy the given text. Default true
 * shouldPopover --> if text cut should show a popover with the original text. Default true
 * searchTerm --> if search text given will Highlight the diplayed text
 */
const CopyPastePopover = ({
  text,
  size,
  sliceType,
  shouldClose,
  bsClass,
  shouldCopy,
  shouldPopover,
  searchTerm,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [popoverTarget, setPopoverTarget] = useState(null)
  const copyButtonRef = React.useRef(null)
  let ref = React.useRef(null)
  const baseClass = bsClass || "cp"
  const shouldCopyText = shouldCopy == false ? false : true
  const shouldPopoverText = shouldPopover == false ? false : true

  useEffect(() => {
    if (shouldClose && showPopover) setShowPopover(false)
  }, [shouldClose])

  const onCopySuccess = () => {
    setShowTooltip(true)
    setTimeout(() => setShowTooltip(false), 500)
  }

  const handleCopyClick = (e) => {
    if (e) e.preventDefault()
    if (e) e.stopPropagation()
    const value = `${text}`

    const legacyCopy = () => {
      const textarea = document.createElement("textarea")
      textarea.value = value
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand("copy")
        onCopySuccess()
      } catch (err) {
        /* ignore */
      }
      document.body.removeChild(textarea)
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(onCopySuccess, legacyCopy)
    } else {
      legacyCopy()
    }
  }

  const clipboard = (
    <button
      type="button"
      ref={copyButtonRef}
      className="btn btn-link"
      onClick={handleCopyClick}
    >
      <i className="fa fa-copy fa-fw"></i>
    </button>
  )

  const tooltip = (
    <Overlay
      show={showTooltip}
      placement="top"
      target={() => copyButtonRef.current}
    >
      <Tooltip id={uniqueId("copy-paste-tooltip-")}>Copied!</Tooltip>
    </Overlay>
  )

  const popOver = (
    <Popover id={uniqueId("copy-paste-popover-")}>
      <Popover.Body>
        <div className="lbaas2">
          <span className="cp-popover-text">{text}</span>
          {/* not show copy icon again in the popover */}
          {/* {shouldCopyText &&
          <div className="text-end">
            {clipboard}
            {tooltip}
          </div>
        } */}
        </div>
      </Popover.Body>
    </Popover>
  )

  const onMouseEnter = (event) => {
    if (showIcon) return
    setShowIcon(true)
  }

  const onMouseLeave = (event) => {
    setShowIcon(false)
  }

  const handlePopoverClick = (e) => {
    if (e) e.preventDefault()
    if (e) e.stopPropagation()
    setShowPopover(!showPopover)
    setPopoverTarget(e.target)
  }

  const textSliced = () => {
    if (sliceType && sliceType == "MIDDLE") {
      const first = size / 2
      const second = size - first
      const firstPeace = text.slice(0, first)
      const secondPeace = text.slice(text.length - second, text.length)
      return [firstPeace, secondPeace]
    }
    return [text.slice(0, size), ""]
  }

  const popoverOverlay = (
    <>
      <a className="cp-help-link" onClick={handlePopoverClick}>
        <b>...</b>
      </a>
      <Overlay
        ref={(r) => (ref = r)}
        onHide={() => setShowPopover(false)}
        show={showPopover}
        target={popoverTarget}
        placement="top"
        // container={this}
        containerPadding={20}
        rootClose
      >
        {popOver}
      </Overlay>
    </>
  )

  return (
    <>
      {text && text.length > size ? (
        <span
          className={baseClass}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {shouldPopoverText ? (
            <>
              <span>
                <span className="cp-substring">
                  <MyHighlighter search={searchTerm}>
                    {textSliced()[0]}
                  </MyHighlighter>
                </span>
                <span className="cp-dots-help">{popoverOverlay}</span>
              </span>
              <span className="cp-substring">
                <MyHighlighter search={searchTerm}>
                  {textSliced()[1]}
                </MyHighlighter>
              </span>
            </>
          ) : (
            <span className="cp-string">
              <MyHighlighter search={searchTerm}>
                {textSliced()[0]}
              </MyHighlighter>
              ...
              <MyHighlighter search={searchTerm}>
                {textSliced()[1]}
              </MyHighlighter>
            </span>
          )}
          {shouldCopyText && (
            <span
              className={
                showIcon ? "copy-paste-icon" : "copy-paste-icon transparent"
              }
            >
              {clipboard}
              {tooltip}
            </span>
          )}
        </span>
      ) : (
        <>
          {text && text.toString().length > 0 && (
            <span
              className={baseClass}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <span>
                <span className="cp-string">
                  <MyHighlighter search={searchTerm}>{text}</MyHighlighter>
                </span>
                {shouldCopyText && (
                  <span
                    className={
                      showIcon
                        ? "copy-paste-icon"
                        : "copy-paste-icon transparent"
                    }
                  >
                    {clipboard}
                    {tooltip}
                  </span>
                )}
              </span>
            </span>
          )}
        </>
      )}
    </>
  )
}

export default CopyPastePopover
