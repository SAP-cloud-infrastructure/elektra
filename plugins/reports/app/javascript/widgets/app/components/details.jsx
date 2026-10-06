import { scaleOrdinal } from "d3-scale"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import ServiceDetail from "./serviceDetail"
import Numeral from "numeral"
import React from "react"

const DetailsViewFadeTransition = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={500}
    unmountOnExit
    classNames="css-transition-fade"
  >
    {children}
  </CSSTransition>
)

const DetailsViewHighlightTransition = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={300}
    unmountOnExit
    classNames="css-transition-highlight"
  >
    {children}
  </CSSTransition>
)

class Details extends React.Component {
  getColor = (service) => {
    const scale = scaleOrdinal()
      .domain(this.props.services)
      .range(this.props.colors)
    const serviceMap = this.props.serviceMap
    return scale(serviceMap[service])
  }

  onClose = (event) => {
    event.preventDefault()
    this.props.onClose()
  }

  renderTableService = (service, clickService) => {
    if (
      clickService == this.props.serviceMap[service.service] ||
      clickService == "all"
    ) {
      return (
        <DetailsViewFadeTransition
          key={service.service + service.measure + service.allocation_type}
        >
          <ServiceDetail service={service} getColor={this.getColor} />
        </DetailsViewFadeTransition>
      )
    }
  }

  total = () => {
    const data = this.props.data
    return (
      " (Total " +
      Numeral(data.total).format("0,0.00") +
      " " +
      this.currency() +
      ")"
    )
  }

  currency = () => {
    const data = this.props.data
    let currency = "EUR"
    if (data.rawData[0] && data.rawData[0].currency) {
      currency = data.rawData[0].currency
    }
    return currency
  }

  render() {
    const { data, showDetails, clickService } = this.props
    return (
      <DetailsViewFadeTransition in={showDetails}>
        <div>
          {data && data.rawData.length > 0 && (
            <h3>
              <TransitionGroup>
                Details for{" "}
                <DetailsViewHighlightTransition key={data.date}>
                  <b>
                    {data && data.date} <small>{data && this.total()}</small>
                  </b>
                </DetailsViewHighlightTransition>
              </TransitionGroup>
              <button
                aria-label="Close"
                onClick={(e) => this.onClose(e)}
                className="btn btn-secondary btn-xs reset-button"
                type="button"
              >
                Reset Selection
              </button>
            </h3>
          )}
          <TransitionGroup className="details-container flex-parent">
            {data &&
              data.rawData.map((service) =>
                this.renderTableService(service, clickService)
              )}
          </TransitionGroup>
        </div>
      </DetailsViewFadeTransition>
    )
  }
}
export default Details
