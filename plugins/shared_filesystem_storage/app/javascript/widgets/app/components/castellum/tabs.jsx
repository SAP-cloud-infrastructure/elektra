import CastellumConfigurationView from "../../containers/castellum/configuration/view"
import CastellumPendingOps from "../../containers/castellum/pending"
import CastellumFailedOps from "../../containers/castellum/recently_failed"
import CastellumSucceededOps from "../../containers/castellum/recently_succeeded"
import CastellumScrapingErrors from "../../containers/castellum/scraping_errors"
import React from "react"

const pages = [
  { label: "Configuration", component: CastellumConfigurationView },
  { label: "Pending operations", component: CastellumPendingOps },
  { label: "Recently succeeded", component: CastellumSucceededOps },
  { label: "Recently failed", component: CastellumFailedOps },
  { label: "Scraping errors", component: CastellumScrapingErrors },
]

export default class CastellumTabs extends React.Component {
  state = {
    active: 0,
  }

  componentDidMount() {
    this.props.loadResourceConfigOnce(this.props.projectId)
  }

  handleSelect(pageIdx, e) {
    e.preventDefault()
    this.setState({
      ...this.state,
      active: pageIdx,
    })
  }

  render() {
    const { data: config, errorMessage, isFetching, receivedAt } = this.props.config
    if (isFetching || !receivedAt) {
      return (
        <p>
          <span className="spinner" /> Loading...
        </p>
      )
    }
    if (errorMessage) {
      return <p className="alert alert-danger">Cannot load autoscaling configuration: {errorMessage}</p>
    }

    const forwardProps = { projectID: this.props.projectId }
    //when autoscaling is disabled, just show the configuration dialog
    if (Object.values(config).every((value) => !value)) {
      return <CastellumConfigurationView {...forwardProps} />
    }

    const CurrentComponent = pages[this.state.active].component

    return (
      <div>
        <div className="col-sm-2">
          <ul className="nav nav-pills nav-stacked">
            {pages.map((conf, idx) => (
              <li key={idx} role="presentation" className={idx == this.state.active ? "active" : ""}>
                <a href="#" onClick={(e) => this.handleSelect(idx, e)}>
                  {conf.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-sm-10">
          <CurrentComponent {...forwardProps} />
        </div>
      </div>
    )
  }
}
