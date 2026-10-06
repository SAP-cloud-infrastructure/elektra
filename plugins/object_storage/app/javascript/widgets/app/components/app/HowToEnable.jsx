import React from "react"

const HowToEnable = ({ projectPath }) => (
  <>
    <div className="bs-callout bs-callout-warning">
      Object Storage can only be used when your user account has the{" "}
      <strong>admin</strong> or <strong>objectstore_admin</strong> or{" "}
      <strong>objectstore_viewer</strong> role for this project.{" "}
    </div>
    <a className="btn btn-secondary" href={projectPath}>
      Go to Project Start Page
    </a>
  </>
)

export default HowToEnable
