import { JsonViewer } from "@cloudoperators/juno-ui-components"
import { syncRouter } from "../actions"
import React from "react"

const Router = ({ routerId, isFetching, data, error }) => {
  if (isFetching) return <span className="spinner" />
  if (error) return <div className="alert alert-danger">{error}</div>
  if (data) {
    return (
      <div className="row">
        <div className="col-sm-10">
          <JsonViewer data={data} expanded={3} />
        </div>
        <div className="col-sm-2">
          {data.diffs && Object.keys(data.diffs).length > 0 && (
            <button className="btn btn-success pull-right" onClick={() => syncRouter(routerId)}>
              Sync
            </button>
          )}
        </div>
      </div>
    )
  }
  return null
}

export default Router
