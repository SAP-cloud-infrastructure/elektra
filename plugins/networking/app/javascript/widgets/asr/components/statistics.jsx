import { JsonViewer } from "@cloudoperators/juno-ui-components"
import React from "react"

const Statistics = ({ isFetching, data, error }) => {
  if (isFetching) return <span className="spinner" />
  if (error) return <div className="alert alert-danger">{error}</div>
  if (data) {
    return <JsonViewer data={data} expanded={3} />
  }
  return null
}

export default Statistics
