import React from "react"
import { useMemo } from "react"
import { Badge as Label } from "react-bootstrap"

import { Tooltip } from "lib/components/Overlay"
import { renderToString } from "react-dom/server"

// label for the operating_status
const StateLabel = ({ label, labelClassName, tooltipContent }) => {
  return useMemo(() => {
    return (
      <Tooltip placement="top" content={`<b>Operating Status</b><br />${renderToString(tooltipContent)}`} html>
        <span>
          <Label className={labelClassName}>{label}</Label>
        </span>
      </Tooltip>
    )
  }, [label])
}

export default StateLabel
