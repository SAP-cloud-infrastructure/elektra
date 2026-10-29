/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react"
const ReactTabs = function ({ tabsConfig, activeTabUid, onSelect }) {
  if (!tabsConfig || !tabsConfig.length) {
    return null
  }

  if (tabsConfig.length === 1) {
    return <div>{tabsConfig[0].content}</div>
  } else {
    if (!activeTabUid) {
      activeTabUid = tabsConfig[0].uid
    }
    const tabs = []
    const panels = []
    for (var tab of Array.from(tabsConfig)) {
      tabs.push(
        <li key={`${tab.uid}_tab`} role="presentation" className="nav-item">
          <a
            href={`#${tab.uid}`}
            aria-controls="home"
            role="tab"
            data-bs-toggle="tab"
            className={`nav-link ${activeTabUid === tab.uid ? "active" : ""}`}
            onClick={(function () {
              const { uid } = tab
              return function (e) {
                if (onSelect) {
                  return onSelect(uid)
                }
              }
            })()}
          >
            {tab.name}
          </a>
        </li>
      )

      panels.push(
        <div
          key={`${tab.uid}_panel`}
          role="tabpanel"
          className={`tab-pane ${
            activeTabUid === tab.uid ? "active" : undefined
          }`}
          id={tab.uid}
        >
          {tab.content}
        </div>
      )
    }

    return (
      <div>
        <ul className="nav nav-tabs" role="tablist">
          {tabs}
        </ul>
        <div className="tab-content">{panels}</div>
      </div>
    )
  }
}

export default ReactTabs
