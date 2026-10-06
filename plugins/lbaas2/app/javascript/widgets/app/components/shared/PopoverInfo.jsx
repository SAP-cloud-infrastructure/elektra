import React, { useState } from "react"
import { Overlay, Button, Popover } from "react-bootstrap"
import Log from "./logger"

const PopoverInfo = ({ popoverId, buttonName, title, content, footer }) => {
  Log.debug("--> RENDER LbPopover")

  const [show, setShow] = useState(false)
  const [target, setTarget] = useState(null)

  const handleClick = (event) => {
    setShow(!show)
    setTarget(event.target)
  }

  return (
    <div>
      <Button variant="link" className="cached-info-button" onClick={handleClick}>
        {buttonName}
      </Button>
      <Overlay
        rootClose
        onHide={() => setShow(false)}
        show={show}
        target={target}
        placement="bottom"
        // container={this}
        containerPadding={20}
      >
        <Popover className="lbaas2 cached-info-popover" id={popoverId}>
          {title && <Popover.Header as="h3">{title}</Popover.Header>}
          <Popover.Body>
            <div className="cached-info-content">{content}</div>

            {footer && <div className="cached-info-footer">{footer}</div>}
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  )
}

export default PopoverInfo
