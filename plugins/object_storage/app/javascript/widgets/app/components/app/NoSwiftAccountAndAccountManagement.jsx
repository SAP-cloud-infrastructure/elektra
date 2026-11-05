import React from "react"

const NoSwiftAccountAndAccountManagement = ({ projectPath }) => (
  <>
    <div className="bs-callout bs-callout-danger">
      Object storage cannot be enabled for this project.{" "}
    </div>
    <a href={projectPath} className="btn btn-secondary">
      Go to Project Start Page
    </a>
  </>
)
export default NoSwiftAccountAndAccountManagement
