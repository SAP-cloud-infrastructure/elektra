import { Link } from "react-router-dom"
import { policy } from "lib/policy"
import React from "react"

export default class ShareActions extends React.Component {
  render() {
    if (
      !policy.isAllowed("shared_filesystem_storage:share_delete") &&
      !policy.isAllowed("shared_filesystem_storage:share_update")
    ) {
      return null
    }

    const { share, parentView, isPending, handleDelete, handleForceDelete } =
      this.props

    return (
      <div className="btn-group">
        <button
          className="btn btn-secondary btn-sm dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="true"
        >
          <i className="fa fa-cog"></i>
        </button>
        <ul className="dropdown-menu dropdown-menu-right" role="menu">
          {policy.isAllowed("shared_filesystem_storage:replica_create") &&
            share.status == "available" && (
              <li>
                <Link to={`/${parentView}/${share.id}/snapshots/new`}>
                  Create Snapshot
                </Link>
              </li>
            )}

          {policy.isAllowed("shared_filesystem_storage:replica_create") &&
            share.status == "available" && (
              <li>
                <Link to={`/shares/${share.id}/replicas/new`}>
                  Create Replica
                </Link>
              </li>
            )}

          {policy.isAllowed("shared_filesystem_storage:share_update") &&
            !isPending && (
              <li>
                <Link to={`/${parentView}/${share.id}/edit`}>Edit</Link>
              </li>
            )}

          {policy.isAllowed("shared_filesystem_storage:share_delete") && (
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete(share.id)
                }}
              >
                Delete
              </a>
            </li>
          )}

          <li className="divider"></li>

          {policy.isAllowed("shared_filesystem_storage:share_extend") &&
            !isPending && (
              <li>
                <Link to={`/${parentView}/${share.id}/edit-size`}>
                  Extend / Shrink
                </Link>
              </li>
            )}

          {policy.isAllowed("shared_filesystem_storage:share_access_control") &&
            share.status == "available" && (
              <li>
                <Link to={`/${parentView}/${share.id}/access-control`}>
                  Access Control
                </Link>
              </li>
            )}

          {policy.isAllowed("shared_filesystem_storage:share_force_delete") && (
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handleForceDelete(share.id)
                }}
              >
                Force Delete
              </a>
            </li>
          )}

          {policy.isAllowed("shared_filesystem_storage:share_reset_status") && (
            <li>
              <Link to={`/${parentView}/${share.id}/reset-status`}>
                Reset Status
              </Link>
            </li>
          )}
          {policy.isAllowed(
            "shared_filesystem_storage:share_revert_to_snapshot"
          ) && (
            <li>
              <Link to={`/${parentView}/${share.id}/revert-to-snapshot`}>
                Revert To Snapshot
              </Link>
            </li>
          )}
          <li className="divider"></li>
          <li>
            <Link to={`/${parentView}/${share.id}/error-log`}>Error Log</Link>
          </li>
        </ul>
      </div>
    )
  }
}
