import React from "react"

const NoSwiftAccountBecauseNoQuota = ({ projectPath, resourcesPath }) => (
  <>
    <div className="bs-callout bs-callout-warning">
      Object storage is not enabled for this project, yet. To enable it, request
      an Object Storage quota in the Resource Management tool.
    </div>
    <a className="btn btn-secondary" href={projectPath}>
      Got to Project Start Page
    </a>{" "}
    <a className="btn btn-primary" href={resourcesPath}>
      Go to Resources Management
    </a>
  </>
)

export default NoSwiftAccountBecauseNoQuota
