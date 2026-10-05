import { Button } from "react-bootstrap" // SPIKE: rb2 removed the lib/ deep-import path
import { PrettyDate } from "lib/components/pretty_date"
import React from "react"

const ErrorRow = (props) => {
  const { label="None", fn=() => {} } = props.action ||{} 
  const {
    project_id: projectID,
    asset_type: assetType,
    asset_id: assetID,
    old_size: oldSize,
    new_size: newSize,
    checked,
    finished,
  } = props.error

  const result = checked || finished || {}
  const hasAssetID = assetID && assetID != projectID ? true : false
  const hasSizeColumn = oldSize || newSize ? true : false

  return (
    <>
      <tr>
        <td className={hasSizeColumn ? "col-md-3" : "col-md-4"}>
          <a
            href={`/_/${projectID}/home`}
            target="_blank"
            title="Jump to project"
            rel="noreferrer"
          >
            {projectID}
          </a>
        </td>
        <td className="col-md-4">
          {hasAssetID ? `${assetType} ${assetID}` : assetType}
        </td>
        {hasSizeColumn && (
          <td className="col-md-2">
            {oldSize} {"->"} {newSize}
          </td>
        )}
        <td className={hasSizeColumn ? "col-md-2" : "col-md-3"}>
          {result.at ? <PrettyDate date={result.at} /> : "None"}
        </td>
        {hasSizeColumn && <td className="col-md-1">
          <Button onClick={() => {fn(props.error)}}>{label}</Button>
        </td>}
      </tr>
      <tr className="explains-previous-line">
        <td colSpan={hasSizeColumn ? 4 : 3} className="text-danger">
          {result.error}
        </td>
      </tr>
    </>
  )
}

export default ErrorRow
