import React, { useEffect } from "react"
import SnapshotItem from "./item"

interface Share {
  id: string
  name?: string
}

interface Snapshot {
  id: string
  name?: string
  share_id: string
  size?: number
  status: string
}

interface SharesData {
  isFetching: boolean
  items: Share[]
}

interface SnapshotListProps {
  active: boolean
  isFetching: boolean
  snapshots: Snapshot[]
  shares: SharesData
  loadSnapshotsOnce: () => void
  handleDelete: (id: string) => void
  reloadSnapshot: (id: string) => void
}

const SnapshotList: React.FC<SnapshotListProps> = ({
  active,
  isFetching,
  snapshots,
  shares,
  loadSnapshotsOnce,
  handleDelete,
  reloadSnapshot,
}) => {
  useEffect(() => {
    if (active) {
      loadSnapshotsOnce()
    }
  }, [active, loadSnapshotsOnce])

  const getShare = (snapshot: Snapshot): Share | "loading" | undefined => {
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
            share={getShare(snapshot)}
            handleDelete={handleDelete}
            reloadSnapshot={reloadSnapshot}
          />
        ))}
      </tbody>
    </table>
  )
}

export default SnapshotList
