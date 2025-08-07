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

export const apiStateIsDeleting = (state) => state === "deleting"
