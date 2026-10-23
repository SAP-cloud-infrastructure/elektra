import React, { useState } from "react"
import uniqueId from "lodash/uniqueId"
import { Overlay, Popover } from "react-bootstrap"

const HelpPopover = ({ text }) => {
  const [show, setShow] = useState(false)
  const [target, setTarget] = useState(null)
  const id = React.useRef(uniqueId("help-popover-"))

  const handleClick = (e) => {
    e.preventDefault()
    setShow(!show)
    setTarget(e.target)
  }

  return (
    <span className="has-feedback-help">
      <a className="help-link" href="#" onClick={handleClick}>
        <i className="fa fa-question-circle"></i>
      </a>
      <Overlay rootClose onHide={() => setShow(false)} show={show} target={target} placement="top">
        <Popover id={id.current}>
          <Popover.Body>{text}</Popover.Body>
        </Popover>
      </Overlay>
    </span>
  )
}

export default HelpPopover
