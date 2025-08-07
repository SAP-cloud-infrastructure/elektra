import React from "react"
import { JsonViewer } from "@cloudoperators/juno-ui-components"

const Config = ({ isFetching, data, error }) => {
  if (isFetching) return <span className="spinner" />
  if (error) return <div className="alert alert-danger">{error}</div>
  if (data) {
    return <JsonViewer data={data} expanded={3} />
  }
  return null
}

export default Config
