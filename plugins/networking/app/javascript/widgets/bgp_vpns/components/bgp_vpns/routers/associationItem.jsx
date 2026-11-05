import React from "react"

const Item = ({ routerId, cachedData, router, onDelete, isFetching, isDeleting }) => {
  const [confirm, setConfirm] = React.useState(false)
  const timer = React.useRef(null)

  const getConfirmation = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setConfirm(true)
    timer.current = setTimeout(() => setConfirm(false), 5000)
  }, [])

  const remove = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setConfirm(false)
    onDelete()
  }, [onDelete])

  // clear a pending reset timer on unmount
  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <tr>
      <td>
        {cachedData ? (
          <div>
            {cachedData.name}
            <br />

            <span className="info-text">
              Scope: {cachedData.payload?.scope?.domain_name}/{cachedData.payload?.scope?.project_name}
              <br />
              ID: {routerId}
            </span>
          </div>
        ) : router ? (
          <div>
            {router.name}
            <br />

            <span className="info-text">
              Project: {router.project_id}
              <br />
              ID: {routerId}
            </span>
          </div>
        ) : (
          routerId
        )}
      </td>
      <td>
        {isFetching ? (
          <span>
            <span className="spinner" />
            Loading...
          </span>
        ) : router && router.subnets ? (
          router.subnets.map((subnet, i) => (
            <div key={i}>
              {subnet.name}
              <br />
              <span className="info-text">cidr: {subnet.cidr}</span>
            </div>
          ))
        ) : (
          "-"
        )}
      </td>
      <td className="snug">
        {onDelete && (
          <button
            disabled={isDeleting}
            onClick={() => (confirm ? remove() : getConfirmation())}
            className={`btn btn-danger btn-sm bgpvpn-router-delete ${isDeleting ? "loading" : ""}`}
          >
            {confirm ? "Confirm Delete" : <i className="fa fa-trash fa-fw" />}
          </button>
        )}
      </td>
    </tr>
  )
}

export default Item
