import React, { useEffect } from "react"
import SnapshotItem from "./item"

interface Snapshot {
  id: string
  name: string
  share_id: string
  status: string
}

interface Share {
  id: string
  name: string
}

interface SharesState {
  isFetching: boolean
  items: Share[]
}

interface SnapshotListProps {
  active: boolean
  isFetching: boolean
  snapshots: Snapshot[]
  shares: SharesState
  handleDelete: (id: string) => void
  reloadSnapshot: (id: string) => void
  loadSnapshotsOnce: () => void
}

const SnapshotList: React.FC<SnapshotListProps> = ({
  active,
  isFetching,
  snapshots,
  shares,
  handleDelete,
  reloadSnapshot,
  loadSnapshotsOnce,
}) => {
  useEffect(() => {
    if (active) loadSnapshotsOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const share = (snapshot: Snapshot): Share | string | undefined => {
    if (shares.isFetching) return "loading"
    return shares.items.find((i) => i.id === snapshot.share_id)
  }

  if (isFetching) {
    return (
      <div>
        <span className="spinner"></span>Loading...
      </div>
    )
  }

  return (
    <table className="table snapshots">
      <thead>
        <tr>
          <th>Name</th>
          <th>Source</th>
          <th>Size</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {snapshots.length === 0 && (
          <tr>
            <td colSpan={5}>No Snapshots found.</td>
          </tr>
        )}
        {snapshots.map((snapshot) => (
          <SnapshotItem
            key={snapshot.id}
            snapshot={snapshot}
            share={share(snapshot)}
            handleDelete={handleDelete}
            reloadSnapshot={reloadSnapshot}
          />
        ))}
      </tbody>
    </table>
  )
}

export default SnapshotList
