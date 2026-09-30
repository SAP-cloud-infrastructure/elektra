import React from "react"
import { FlashMessages } from "lib/flashes"
import { Overlay, Popover, Alert } from "react-bootstrap"
import uniqueId from "lodash/uniqueId"
import { namespace } from "d3-selection"

class FloatingFlashMessages extends React.Component {
  render() {
    const popOver = (
      <Popover id={uniqueId("flash-popover-")}>
        <div className="lbaas2">
          <FlashMessages />
        </div>
      </Popover>
    )

    return (
      <div className="sticky-flash">
        <div className="container">
          <FlashMessages />
          {/* <Alert bsStyle="warning">
            <strong>Holy guacamole!</strong> Best check yo self, you're not looking too
            good.
          </Alert> */}
        </div>
      </div>
    )
  }
}

export default FloatingFlashMessages
