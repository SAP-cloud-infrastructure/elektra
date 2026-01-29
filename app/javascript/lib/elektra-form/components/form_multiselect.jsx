import React from "react"
import { FormContext } from "./form_context"

export class FormMultiselect extends React.Component {
  state = {
    collapsed: true,
  }

  static defaultProps = {
    showSelectedLabel: true,
    selectedLabelLength: 4,
    showIDs: false,
  }

  toggle = () => {
    this.setState({ collapsed: !this.state.collapsed })
  }

  handleOnBlur = (e) => {
    // collapse if clicked outside the multiselect box
    if (!e.currentTarget.contains(e.relatedTarget)) {
      this.setState({ collapsed: true })
    }
  }

  onChange = (id) => {
    let values = this.context.formValues[this.props.name] || []
    const index = values.indexOf(id)
    if (index < 0) values.push(id)
    else values.splice(index, 1)
    this.context.onChange(this.props.name, values)
  }

  render() {
    const values = this.context.formValues[this.props.name] || []

    // console.log(this.context.formValues, this.props.name, values)
    const selectedIds = []
    const selectedNames = []
    let selectedLabel = ""

    if (this.props.showSelectedLabel) {
      const selected = this.props.options.filter(
        (o) => values.indexOf(o.id) >= 0
      )

      for (let i of selected) {
        selectedIds.push(i.id)
        selectedNames.push(i.name)
      }

      selectedLabel = selectedNames
        .slice(0, this.props.selectedLabelLength)
        .join(", ")
      if (selectedNames.length > this.props.selectedLabelLength)
        selectedLabel += " ..."
    }

    return (
      <>
        <div
          className={`dropdown ${this.state.collapsed ? "" : "open"}`}
          tabIndex="0"
          onBlur={this.handleOnBlur}
        >
          <button
            className="btn btn-default"
            type="button"
            onClick={this.toggle}
          >
            {this.props.showSelectedLabel && selectedNames.length > 0
              ? selectedLabel
              : "Select ..."}{" "}
            <span className="caret"></span>
          </button>
          <ul
            className="dropdown-menu"
            style={{ maxHeight: 300, overflow: "auto" }}
          >
            {this.props.options.map((i) => (
              <li key={i.id}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    this.onChange(i.id)
                  }}
                >
                  <i
                    className={`fa fa-fw fa-${
                      values.indexOf(i.id) >= 0 ? "check-" : ""
                    }square-o`}
                  ></i>
                  {i.name}{" "}
                  {this.props.showIDs && (
                    <span className="info-text">{i.id}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </>
    )
  }
}
FormMultiselect.contextType = FormContext
