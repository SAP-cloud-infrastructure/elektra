import React from "react"
import PropTypes from "prop-types"
import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
  missingCapability: {
    opacity: 0.25,
  },
})

const Capabilities = ({ data }) => {
  const classes = useStyles()
  const additionalCaps = React.useMemo(() => {
    const parsedCaps = [
      "id",
      "swift",
      "account_quotas",
      "bulk_delete",
      "bulk_upload",
      "container_quotas",
      "slo",
      "container_sync",
      "ratelimit",
      "staticweb",
      "tempurl",
    ]
    return Object.keys(data).filter((k) => parsedCaps.indexOf(k) < 0)
  }, [data])

  if (!data) return <span>No Capabilities available!</span>

  return (
    <div style={{ color: "#666" }}>
      <h5>Limits</h5>
      <ul className="fa-ul" id="limits">
        {data.swift && (
          <>
            <li>
              <span className="fa-li fa fa-check" />
              <strong>Max file size: </strong>
              {Math.floor(data.swift["max_file_size"] / 1024 / 1024 / 1024)} GB
            </li>
            <li>
              <span className="fa-li fa fa-check" />
              <strong>Max container name length: </strong>
              {data.swift["max_container_name_length"]}
            </li>
            <li>
              <span className="fa-li fa fa-check" />
              <strong>Max object name length: </strong>
              {data.swift["max_object_name_length"]}
            </li>
            <li>
              <span className="fa-li fa fa-check" />
              <strong>Container listing limit: </strong>
              {data.swift["container_listing_limit"]}
            </li>
          </>
        )}

        {data.bulk_upload && (
          <li>
            <span className="fa-li fa fa-check" />
            <strong>Max containers per extraction: </strong>
            {data.bulk_upload["max_containers_per_extraction"]}{" "}
            <small>(bulk upload)</small>
          </li>
        )}
        {data.bulk_delete && (
          <li>
            <span className="fa-li fa fa-check" />
            <strong>Max deletes per request: </strong>
            {data.bulk_delete["max_deletes_per_request"]}{" "}
            <small>(bulk delete)</small>
          </li>
        )}
        {data.slo && (
          <li>
            <span className="fa-li fa fa-check" />
            <strong>Max segments: </strong>
            {data.slo["max_manifest_segments"]}{" "}
            <small>(static large object)</small>
          </li>
        )}
      </ul>
      <h5>Capabilities</h5>
      <ul className="fa-ul" id="capabilities_list">
        <li className={data.account_quotas ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-area-chart" />
          <strong>Account quotas </strong>
        </li>
        <li className={data.container_quotas ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-area-chart" />
          <strong>Container quotas </strong>
        </li>
        <li className={data.ratelimit ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-hand-stop-o" />
          API
          <strong> rate limiting </strong>
        </li>
        <li className={data.bulk_upload ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-file-archive-o" />
          <strong>Bulk upload </strong>
          of archive files
        </li>
        <li className={data.bulk_delete ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-eraser" />
          Efficient
          <strong> bulk deletion </strong>
        </li>
        <li className={data.container_sync ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-refresh" />
          <strong>Container syncing </strong>
        </li>
        <li className={data.slo ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-object-group" />
          Handling of large objects using
          <strong> static large object </strong>
          manifests
        </li>
        <li className={data.staticweb ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-globe" />
          Distribution of container contents as
          <strong> static websites </strong>
        </li>
        <li className={data.tempurl ? "" : classes.missingCapability}>
          <span className="fa-li fa fa-clock-o" />
          Sharing of objects using
          <strong> temporary URLs </strong>
        </li>

        {additionalCaps.length > 0 && (
          <li>
            <span className="fa-li fa fa-ellipsis-v" />
            Additional capabilities:{" "}
            <strong>{additionalCaps.join(", ")}</strong>
          </li>
        )}
      </ul>

      <p className="form-text">
        For a more detailed report, use the
        <code>swift info</code>
        command on the
        <a href="#">Web Shell</a>.
      </p>
    </div>
  )
}

Capabilities.propTypes = {
  data: PropTypes.object.isRequired,
}

export default Capabilities
