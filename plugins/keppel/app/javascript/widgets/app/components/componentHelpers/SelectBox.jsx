import React from "react"

export const SelectBox = ({ testID = "", options, value, isEditable, onChange }) => {
  const current = options.find((o) => o.value == value)
  const trimEllipsis = (str) => (str.substr(-3) === "..." ? str.substr(0, str.length - 3) : str)

  if (!isEditable) {
    return current ? trimEllipsis(current.label) : ""
  }
  return (
    <select data-testid={testID} value={value} className="form-control select" onChange={onChange}>
      {!current && (
        <option key="unknown" value={value}>
          -- Please select --
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
