import React from "react"

export const TextInput = ({ testid = "", value, isEditable, onChange }) => {
  value = value || ""
  if (!isEditable) {
    if (value === "") {
      return <em>Any</em>
    }
    return <code>{value || ""}</code>
  }
  return <input data-testid={testid} type="text" className="form-control" onChange={(e) => onChange(e)} />
}
