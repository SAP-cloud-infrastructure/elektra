import React from "react"

const AddRouterAssociation = ({ routers, onSelect, disabled, routerID }) => {
  return (
    <select
      className="form-select"
      disabled={disabled}
      value={routerID || ""}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">Select a router</option>
      {routers.map((router, i) => (
        <option key={i} value={router.id}>
          {router.name}
        </option>
      ))}
    </select>
  )
}

export default AddRouterAssociation
