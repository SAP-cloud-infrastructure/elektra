import React from "react"
export const makeTabBar = (tabs, currentTab, selectTab) => (
  <nav className="nav-with-buttons">
    <ul className="nav nav-tabs">
      {tabs.map((tab) => (
        <li key={tab.key} role="presentation" className={currentTab == tab.key ? "active" : ""}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              selectTab(tab.key)
            }}
          >
            {tab.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)

export const makeHowtoOpener = (show) => (
  <li className="help-link">
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        show()
      }}
    >
      <i className="fa fa-question-circle-o" /> Instructions for Docker client
    </a>
  </li>
)

export const makeGCNotice = (objectType) =>
  `${objectType} deleted. It may take a few hours for the image contents to be garbage-collected from the backing Swift container.`

export const makeSelectBox = ({ options, value, isEditable, onChange }) => {
  const current = options.find((o) => o.value == value)
  if (!isEditable) {
    return current ? trimEllipsis(current.label) : ""
  }
  return (
    <select value={value} className="form-control select" onChange={onChange}>
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

export const makeTextInput = ({value, isEditable, onChange}) => {
  value = value || ""
  if (!isEditable) {
    if (value === "") {
      return <em>Any</em>
    }
    return <code>{value || ""}</code>
  }
  return (
    <input
      type="text"
      value={value}
      className="form-control"
      onChange={(e) => onChange(e)}
    />
  )
}

const trimEllipsis = (str) => (str.substr(-3) === "..." ? str.substr(0, str.length - 3) : str)

export const apiStateIsDeleting = (state) => state === "deleting"
