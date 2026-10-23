import React from "react"

const Item = ({
  routerId,
  cachedData,
  router,
  onDelete,
  isFetching,
  isDeleting,
}) => {
  const [confirm, setConfirm] = React.useState(false)
  let timer

  const getConfirmation = React.useCallback(() => {
    if (timer) clearTimeout(timer)
    setConfirm(true)
    timer = setTimeout(() => setConfirm(false), 5000)
  }, [])

  const remove = React.useCallback(() => {
    setConfirm(false)
    onDelete()
  }, [onDelete])

  return (
    <tr>
      <td>
        {cachedData ? (
          <div>
            {cachedData.name}
            <br />

            <span className="info-text">
              Scope: {cachedData.payload?.scope?.domain_name}/
              {cachedData.payload?.scope?.project_name}
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
            className={`btn btn-${confirm ? "danger" : "secondary"} ${
              isDeleting ? "loading" : ""
            } btn-sm`}
          >
            {confirm && "Confirm"}
            <i className="fa fa-trash fa-fw" />
          </button>
        )}
      </td>
    </tr>
  )
}

export default Item
