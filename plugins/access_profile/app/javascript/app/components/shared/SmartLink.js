import React from "react"
import { Tooltip, OverlayTrigger, Button } from "react-bootstrap"
import uniqueId from "lodash/uniqueId"

const SmartLink = ({
  style,
  size,
  disabled,
  children,
  onClick,
  isAllowed,
  notAllowedText,
}) => {
  const isAllowedToClick = isAllowed == false ? false : true

  return (
    <React.Fragment>
      {isAllowedToClick ? (
        <Button
          bsStyle={style}
          bsSize={size}
          disabled={disabled}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault()
            } else {
              if (onClick) {
                onClick(e)
              }
            }
          }}
        >
          {children}
        </Button>
      ) : (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={uniqueId("smart-link-")}>{notAllowedText}</Tooltip>
          }
        >
          <div style={{ display: "inline-block", cursor: "not-allowed" }}>
            <Button
              style={{ pointerEvents: "none" }}
              bsSize={size}
              bsStyle={style}
              disabled={true}
              onClick={(e) => {
                e.preventDefault()
              }}
            >
              {children}
            </Button>
          </div>
        </OverlayTrigger>
      )}
    </React.Fragment>
  )
}

export default SmartLink
