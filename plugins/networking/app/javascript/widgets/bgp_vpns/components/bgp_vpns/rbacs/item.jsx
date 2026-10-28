import React from "react"

const Item = ({ item, onDelete, canDelete, cachedProject }) => {
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
    onDelete(item.id)
  }, [item])

  // clear a pending reset timer on unmount
  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <tr>
      <td>
        {(item.action || "").replace(/_/g, " ")}
        <br />
        <span className="info-text">ID: {item.id}</span>
      </td>
      <td>
        {cachedProject ? (
          <>
            {cachedProject.name}
            <br />
            <span className="info-text">ID: {item.target_tenant}</span>
          </>
        ) : (
          item.target_tenant
        )}
      </td>
      <td className="snug">
        {canDelete && (
          <button
            className={`btn btn-danger btn-sm bgpvpn-router-delete ${item.isDeleting ? "loading" : ""}`}
            disabled={item.isDeleting}
            onClick={() => (confirm ? remove() : getConfirmation())}
          >
            {confirm ? "Confirm Delete" : <i className="fa fa-trash fa-fw" />}
          </button>
        )}
      </td>
    </tr>
  )
}

export default Item
