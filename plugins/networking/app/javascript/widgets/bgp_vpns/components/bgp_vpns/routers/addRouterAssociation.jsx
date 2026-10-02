import React from "react"

const AddRouterAssociation = ({ routers, onSelect, disabled, routerID }) => {
  const selected = React.useMemo(
    () => routers.find((r) => r.id === routerID),
    [routerID]
  )

  return (
    <div className="btn-group btn-group-sm">
      <button
        type="button"
        className="btn btn-default btn-sm dropdown-toggle"
        data-toggle="dropdown"
        aria-expanded="false"
        disabled={disabled}
      >
        {selected?.name || "Select a router"} <span className="caret" />
      </button>
      <ul className="dropdown-menu" role="menu">
        {routers.map((router, i) => (
          <li key={i}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onSelect(router.id)
              }}
            >
              <div>{router.name}</div>
              {router.subnets && (
                <div className="info-text">
                  {(router.subnets || []).map((s, j) => (
                    <React.Fragment key={j}>
                      {s.name} {s.cidr}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AddRouterAssociation
