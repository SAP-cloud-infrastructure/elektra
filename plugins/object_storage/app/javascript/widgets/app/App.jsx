/* eslint no-console:0 */
import React from "react"
import PropTypes from "prop-types"
import StateProvider from "./StateProvider"
import Router from "./Router"

const App = (props) => (
  <StateProvider>
    {props.serviceName === "ceph" && (
      <>
        <div className="bs-callout bs-callout-info">
          <h5>Note for Ceph</h5>
          <p>
            This view uses the Swift API to display bucket contents and basic object storage information. While suitable
            for standard operations, some S3-specific features, such as bucket versioning, object versions, and delete
            markers are not fully visible or manageable through the dashboard.
          </p>
          <p>
            Buckets with S3 versioning enabled cannot be deleted using the dashboard and may only be fully inspected or
            managed via S3 CLI tools. This limitation is due to fundamental differences between the Swift and S3 APIs in
            Ceph RGW. For full and accurate access to all Ceph object storage features, especially when working with
            versioned buckets, we strongly recommend using S3-compatible tools such as `aws s3api` or other S3 CLI/SDK
            tools.
          </p>
        </div>
      </>
    )}
    <Router baseName={props.baseName} resourcesPath={props.resourcesPath} projectPath={props.projectPath} />
  </StateProvider>
)

App.propTypes = {
  baseName: PropTypes.string,
  projectPath: PropTypes.string,
  resourcesPath: PropTypes.string,
}

export default App
