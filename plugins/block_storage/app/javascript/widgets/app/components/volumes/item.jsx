import React from "react"
import { Link } from "react-router-dom"
import { scope } from "lib/ajax_helper"
import { Highlighter } from "react-bootstrap-typeahead"
import { Tooltip } from "lib/components/Overlay"
import { policy } from "lib/policy"
import StatusPill from "../status_pill"
import * as constants from "../../constants"

const MyHighlighter = ({ search, children }) => {
  if (!search || !children) return children
  return <Highlighter search={search}>{children + ""}</Highlighter>
}

const VolumeItem = ({ reloadVolume, deleteVolume, forceDeleteVolume, detachVolume, volume, searchTerm }) => {
  const pending = React.useMemo(() => constants.VOLUME_PENDING_STATUS.indexOf(volume.status) >= 0, [volume.status])
  React.useEffect(() => {
    let polling
    if (pending) {
      polling = setInterval(() => reloadVolume(volume.id), 5000)
    }
    return () => clearInterval(polling)
  }, [pending, volume.id])

  const handleDelete = React.useCallback(
    (e) => {
      e.preventDefault()
      deleteVolume(volume.id)
    },
    [deleteVolume, volume.id]
  )

  const handleForceDelete = React.useCallback(
    (e) => {
      e.preventDefault()
      forceDeleteVolume(volume.id)
    },
    [forceDeleteVolume, volume.id]
  )

  const handleDetach = React.useCallback(
    (e) => {
      e.preventDefault()
      if (!volume.attachments || volume.attachments.length == 0) {
        return
      }

      detachVolume(volume.id, volume.attachments[0].attachment_id)
    },
    [volume.id, volume.attachments]
  )

  return (
    <tr className={`state-${volume.status}`}>
      <td>
        {policy.isAllowed("block_storage:volume_get", {}) ? (
          <Link to={`/volumes/${volume.id}/show`}>
            <MyHighlighter search={searchTerm || ""}>{volume.name || volume.id}</MyHighlighter>
          </Link>
        ) : (
          <MyHighlighter search={searchTerm}>{volume.name}</MyHighlighter>
        )}
        {(volume.bootable === true || volume.bootable === "true") && (
          <Tooltip placement="top" content="This volume can be used to boot an instance">
            <span className="badge rounded-pill bg-info-subtle text-info-emphasis fw-normal ms-2 text-nowrap">bootable</span>
          </Tooltip>
        )}
        {volume.name && (
          <>
            <br />
            <span className="info-text">
              <MyHighlighter search={searchTerm}>{volume.id}</MyHighlighter>
            </span>
          </>
        )}
      </td>
      <td>
        {pending && <span className="spinner" />}
        <StatusPill status={volume.status} />
      </td>
      <td>{volume.size}</td>
      <td>
        {volume && volume.attachments && volume.attachments.length > 0 ? (
          volume.attachments.map((attachment, index) => (
            <div key={index}>
              <a href={`/${scope.domain}/${scope.project}/compute/instances/${attachment.server_id}`} data-modal={true}>
                {attachment.server_name || attachment.server_id}
              </a>
              &nbsp;on {attachment.device}
              {attachment.server_name && (
                <>
                  <br />
                  <span className="info-text">{attachment.server_id}</span>
                </>
              )}
            </div>
          ))
        ) : (
          <span className="info-text">&mdash;</span>
        )}
      </td>
      <td>{volume.availability_zone && <span className="az-badge">{volume.availability_zone}</span>}</td>
      <td style={{ whiteSpace: "nowrap" }}>
        {new Date(volume.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="snug">
        {(policy.isAllowed("block_storage:volume_delete", {
          target: { scoped_domain_name: scope.domain },
        }) ||
          policy.isAllowed("block_storage:volume_update", {
            target: { scoped_domain_name: scope.domain },
          })) && (
          <div className="btn-group">
            <button
              className="btn btn-secondary btn-sm dropdown-toggle"
              disabled={pending}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded={true}
            >
              <span className="fa fa-cog"></span>
            </button>

            <ul className="dropdown-menu dropdown-menu-end" role="menu">
              {policy.isAllowed("block_storage:volume_update", {
                target: { scoped_domain_name: scope.domain },
              }) && (
                <li>
                  <Link to={`/volumes/${volume.id}/edit`}>Edit</Link>
                </li>
              )}
              {volume.status == "available" && (
                <li>
                  <Link to={`/volumes/${volume.id}/snapshots/new`}>Create Snapshot</Link>
                </li>
              )}
              {policy.isAllowed("block_storage:volume_create", {
                target: { scoped_domain_name: scope.domain },
              }) && (
                <li>
                  <Link to={`/volumes/${volume.id}/new`}>Clone Volume</Link>
                </li>
              )}
              {volume.attachments &&
              volume.attachments.length == 0 &&
              policy.isAllowed("compute:attach_volume", {
                target: { scoped_domain_name: scope.domain },
              }) ? (
                <>
                  <li className="divider"></li>
                  <li>
                    <Link to={`/volumes/${volume.id}/attachments/new`}>Attach</Link>
                  </li>
                </>
              ) : (
                policy.isAllowed("compute:detach_volume", {
                  target: { scoped_domain_name: scope.domain },
                }) && (
                  <>
                    <li className="divider"></li>
                    <li>
                      <a href="#" onClick={handleDetach}>
                        Detach
                      </a>
                    </li>
                  </>
                )
              )}
              {policy.isAllowed("block_storage:volume_delete", {
                target: { scoped_domain_name: scope.domain },
              }) &&
                volume.status != "in-use" && (
                  <>
                    <li className="divider"></li>
                    <li>
                      <a href="#" onClick={handleDelete}>
                        Delete
                      </a>
                    </li>
                  </>
                )}
              {(policy.isAllowed("block_storage:volume_reset_status") ||
                policy.isAllowed("block_storage:volume_extend_size")) && (
                <>
                  <li className="divider"></li>
                  {policy.isAllowed("block_storage:volume_reset_status") && (
                    <li>
                      <Link to={`/volumes/${volume.id}/reset-status`}>Reset Status</Link>
                    </li>
                  )}
                  {policy.isAllowed("block_storage:volume_extend_size") && (
                    <li>
                      <Link to={`/volumes/${volume.id}/extend-size`}>Extend Size</Link>
                    </li>
                  )}
                </>
              )}
              {policy.isAllowed("image:image_create") && (
                <li>
                  <Link to={`/volumes/${volume.id}/images/new`}>Upload To Image</Link>
                </li>
              )}
              {policy.isAllowed("block_storage:volume_force_delete") && (
                <li>
                  <a href="#" onClick={handleForceDelete}>
                    Force Delete
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </td>
    </tr>
  )
}

export default VolumeItem
