import React, { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { policy } from "lib/policy"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Snapshot {
  id: string
  name?: string
  share_id: string
  size?: number
  status: string
  isFetching?: boolean
  isDeleting?: boolean
}

interface Share {
  id: string
  name?: string
}

interface SnapshotItemProps {
  snapshot: Snapshot
  share?: Share | null
  handleDelete: (id: string) => void
  reloadSnapshot: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const SnapshotItem: React.FC<SnapshotItemProps> = ({
  snapshot,
  share,
  handleDelete,
  reloadSnapshot,
}) => {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (snapshot.status === "creating") {
      pollingRef.current = setInterval(() => reloadSnapshot(snapshot.id), 10000)
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.status])

  return (
    <tr className={snapshot.isFetching || snapshot.isDeleting ? "updating" : ""}>
      <td>
        <Link to={`/snapshots/${snapshot.id}/show`}>
          {snapshot.name || snapshot.id}
        </Link>
        {snapshot.name && (
          <>
            <br />
            <span className="info-text">{snapshot.id}</span>
          </>
        )}
      </td>
      <td>
        {share ? (
          <div>
            {share.name}
            <br />
            <span className="info-text">{snapshot.share_id}</span>
          </div>
        ) : (
          snapshot.share_id
        )}
      </td>
      <td>{(snapshot.size || 0) + " GB"}</td>
      <td>
        {snapshot.status === "creating" && <span className="spinner" />}{" "}
        {snapshot.status}
      </td>
      <td className="snug">
        {(policy.isAllowed("shared_filesystem_storage:snapshot_delete") ||
          policy.isAllowed("shared_filesystem_storage:snapshot_update")) && (
          <div className="btn-group">
            <button
              className="btn btn-default btn-sm dropdown-toggle"
              type="button"
              data-toggle="dropdown"
              aria-expanded="true"
            >
              <i className="fa fa-cog"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-right" role="menu">
              {policy.isAllowed("shared_filesystem_storage:snapshot_delete") &&
                snapshot.status !== "creating" && (
                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(snapshot.id)
                      }}
                    >
                      Delete
                    </a>
                  </li>
                )}
              {policy.isAllowed("shared_filesystem_storage:snapshot_update") && (
                <li>
                  <Link to={`/snapshots/${snapshot.id}/edit`}>Edit</Link>
                </li>
              )}
              <li>
                <Link to={`/snapshots/${snapshot.id}/error-log`}>Error Log</Link>
              </li>
            </ul>
          </div>
        )}
      </td>
    </tr>
  )
}

export default SnapshotItem
