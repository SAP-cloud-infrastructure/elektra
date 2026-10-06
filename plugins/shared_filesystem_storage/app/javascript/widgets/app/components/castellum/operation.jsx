import { Link } from "react-router-dom"
import { PrettyDate } from "lib/components/pretty_date"
import React from "react"

import * as constants from "../../constants"
import ShareActions from "../shares/actions"

//TODO: many of these constants and predicates are duplicated in
//plugins/resources/app/components/autoscaling/ops_report.jsx

const isOrWas = {
  created: "is",
  confirmed: "is",
  greenlit: "is",
  cancelled: "was",
  succeeded: "was",
  failed: "was",
}

const sortOrderForStates = {
  created: 1,
  confirmed: 2,
  greenlit: 3,
  cancelled: 4,
  succeeded: 5,
  failed: 6,
}
const sortOrderForReasons = {
  low: 1,
  high: 2,
  critical: 3,
}

const sortKeyForNameOrID = (props) => {
  const name = (props.share || {}).name || ""
  const id = props.operation.asset_id
  return name + id
}
const sortKeyForStateAndReason = (props) => {
  const { state, reason } = props.operation
  return sortOrderForStates[state] * 10 + sortOrderForReasons[reason]
}
const sortKeyForSizeChange = (props) => {
  const { old_size, new_size } = props.operation
  return old_size * 100000 + new_size
}

export const columns = [
  {
    key: "id",
    label: "Share name/ID",
    sortStrategy: "text",
    sortKey: sortKeyForNameOrID,
  },
  {
    key: "state",
    label: "State/Reason",
    sortStrategy: "numeric",
    sortKey: sortKeyForStateAndReason,
  },
  {
    key: "size",
    label: "Size",
    sortStrategy: "numeric",
    sortKey: sortKeyForSizeChange,
  },
  {
    key: "timeline",
    label: "Timeline",
    sortStrategy: "numeric",
    sortKey: (props) => -props.operation.created.at,
  },
  { key: "actions", label: "" },
]

const titleCase = (str) =>
  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase()

export const CastellumOperation = ({
  operation,
  share,
  handleDelete,
  handleForceDelete,
}) => {
  const {
    asset_id: shareID,
    state,
    reason,
    old_size: oldSize,
    new_size: newSize,
    created,
    confirmed,
    greenlit,
    finished,
  } = operation

  return (
    <>
      <tr>
        <td className="col-md-4">
          {share ? (
            <Link to={`/autoscaling/${share.id}/show`}>
              {share.name || shareID}
            </Link>
          ) : (
            <div>
              <span className="spinner" /> Loading share data...
            </div>
          )}
          <div className="small text-muted">{shareID}</div>
        </td>
        <td className="col-md-2">
          {titleCase(state)}
          <div className="small text-muted">
            Usage {isOrWas[state]} {reason}
          </div>
        </td>
        <td className="col-md-2">
          {oldSize} {"->"} {newSize} GiB
        </td>
        <td className="col-md-3">
          <div>
            Created: <PrettyDate date={created.at} />
          </div>
          {confirmed && confirmed.at != created.at && (
            <div>
              Confirmed: <PrettyDate date={confirmed.at} />
            </div>
          )}
          {greenlit && greenlit.at != confirmed.at && (
            <div>
              Greenlit: <PrettyDate date={greenlit.at} />
            </div>
          )}
          {finished && (
            <div>
              {titleCase(state)}: <PrettyDate date={finished.at} />
            </div>
          )}
        </td>
        <td className="col-md-1 text-end">
          {share && (
            <ShareActions
              share={share}
              isPending={constants.isShareStatusPending(share.status)}
              parentView="autoscaling"
              handleDelete={handleDelete}
              handleForceDelete={handleForceDelete}
            />
          )}
        </td>
      </tr>
      {finished && finished.error && (
        <tr className="explains-previous-line">
          <td colSpan="5" className="text-danger">
            {finished.error}
          </td>
        </tr>
      )}
    </>
  )
}
