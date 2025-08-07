import React from "react"

export const TextInput = ({ testid = "", value, isEditable, onChange }) => {
  const inputValue = value || ""
  if (!isEditable) {
    if (inputValue === "") {
      return <em>Any</em>
    }
    return <code>{inputValue || ""}</code>
  }
  return <input data-testid={testid} type="text" value={inputValue} className="form-control" onChange={(e) => onChange(e)} />
}
