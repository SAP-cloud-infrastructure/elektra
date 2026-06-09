import React, { useEffect } from "react"
import ReplicaItem from "./item"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Replica {
  id: string
  name?: string
  share_id: string
  replica_state?: string
  status?: string
  isFetching?: boolean
  isDeleting?: boolean
}

interface Share {
  id: string
  name: string
}

interface SharesState {
  isFetching: boolean
  items: Share[]
}

interface ReplicaListProps {
  active: boolean
  isFetching: boolean
  replicas: Replica[]
  shares: SharesState
  loadReplicasOnce: () => void
  loadSharesOnce: () => void
  handleDelete: (id: string) => void
  reloadReplica: (id: string) => void
  promoteReplica: (id: string) => void
  resyncReplica: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const ReplicaList: React.FC<ReplicaListProps> = ({
  active,
  isFetching,
  replicas,
  shares,
  loadReplicasOnce,
  loadSharesOnce,
  handleDelete,
  reloadReplica,
  promoteReplica,
  resyncReplica,
}) => {
  useEffect(() => {
    if (active) {
      loadReplicasOnce()
      loadSharesOnce()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const share = (replica: Replica): Share | string | undefined => {
    if (shares.isFetching) return "loading"
    return shares.items.find((i) => i.id === replica.share_id)
  }

  if (isFetching) {
    return (
      <div>
        <span className="spinner"></span>Loading...
      </div>
    )
  }

  return (
    <table className="table replicas">
      <thead>
        <tr>
          <th>ID</th>
          <th>Source Share</th>
          <th>Replica State</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {replicas.length === 0 ? (
          <tr>
            <td colSpan={5}>No Replicas found.</td>
          </tr>
        ) : (
          replicas.map((replica) => (
            <ReplicaItem
              key={replica.id}
              replica={replica}
              share={share(replica)}
              handleDelete={handleDelete}
              reloadReplica={reloadReplica}
              promoteReplica={() => promoteReplica(replica.id)}
              resyncReplica={() => resyncReplica(replica.id)}
            />
          ))
        )}
      </tbody>
    </table>
  )
}

export default ReplicaList
