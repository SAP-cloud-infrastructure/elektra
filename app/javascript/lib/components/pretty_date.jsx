import React from "react"
import moment from "moment"
import { Tooltip } from "lib/components/Overlay"

export const PrettyDate = ({ date }) => {
  const m = typeof date == "number" ? moment.unix(date) : moment.utc(date)

  return (
    <Tooltip content={m.format("LLLL")} placement="top">
      <span data-testid="pretty-date">{m.fromNow()}</span>
    </Tooltip>
  )
}
