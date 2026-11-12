import { CSSTransition, TransitionGroup } from "react-transition-group"
import Numeral from "numeral"
import React from "react"

const DetailsViewHighlightTransition = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={300} unmountOnExit classNames="css-transition-highlight">
    {children}
  </CSSTransition>
)

const keysNotPrinted = ["region", "year", "month", "project_id", "price_sec"]
const keysNotFormatted = ["cost_object", "object_id", "allocation_type"]

const renderValue = (props, key) => {
  if (!keysNotFormatted.includes(key) && Numeral(props.service[key]).value()) {
    return Numeral(props.service[key]).format("0,0[.]00")
  } else {
    return props.service[key]
  }
}

const ServiceDetail = (props) => (
  <div className="service-details flex-item">
    <table className="table datatable">
      <thead>
        <tr>
          <th colSpan="2">
            <i className="fa fa-square header-square" style={{ color: props.getColor(props.service.service) }} />
            <span>
              {props.service.service} - {props.service.measure}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(props.service).map(
          (key) =>
            !keysNotPrinted.includes(key) && (
              <tr className={key == "price_loc" ? "highlight" : ""} key={props.service + key}>
                <th>{key}</th>
                <td>
                  <TransitionGroup>
                    <DetailsViewHighlightTransition key={props.service + key + props.service[key]}>
                      <span>{renderValue(props, key)}</span>
                    </DetailsViewHighlightTransition>
                  </TransitionGroup>
                </td>
              </tr>
            )
        )}
      </tbody>
    </table>
  </div>
)

export default ServiceDetail
