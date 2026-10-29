import React from "react"
import { useMemo } from "react"
import { Badge } from "react-bootstrap"

import { Tooltip } from "lib/components/Overlay"
import { renderToString } from "react-dom/server"

// Map BS3 label-* class names to react-bootstrap v2 Badge bg= variants
const labelClassToBg = (labelClassName) => {
  switch (labelClassName) {
    case "label-success":
      return "success"
    case "label-danger":
      return "danger"
    case "label-warning":
      return "warning"
    case "label-info":
      return "info"
    case "label-warning-greyscale":
    default:
      return "secondary"
  }
}

// label for the operating_status
const StateLabel = ({ label, labelClassName, tooltipContent }) => {
  return useMemo(() => {
    return (
      <Tooltip placement="top" content={`<b>Operating Status</b><br />${renderToString(tooltipContent)}`} html>
        <span>
          <Badge bg={labelClassToBg(labelClassName)}>{label}</Badge>
        </span>
      </Tooltip>
    )
  }, [label])
}

export default StateLabel
