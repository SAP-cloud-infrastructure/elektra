import { SearchInput } from "@cloudoperators/juno-ui-components"
import React from "react"
import { Popover } from "./Overlay"

/**
 * This component implements a serach field.
 * Usage: <SearchField placeholder='Name' text='Search by name' onChange={(term) => handleSearch}/>
 **/
export class SearchField extends React.Component {
  state = {
    searchTerm: "",
  }

  onChangeTerm = (e) => {
    const value = e.target.value || ""
    this.setState({ searchTerm: value }, () => this.props.onChange(value))
  }

  reset = (e) => {
    e.preventDefault()
    this.setState({ searchTerm: "" }, () => this.props.onChange(""))
  }

  UNSAFE_componentWillReceiveProps = (nextProps) => {
    // console.log('UNSAFE_componentWillReceiveProps',nextProps)
    if (nextProps.value != null) this.setState({ searchTerm: nextProps.value })
  }

  componentDidMount = () => {
    // console.log('componentDidMount',this.props)
    if (this.props.value) this.setState({ searchTerm: this.props.value })
  }

  render() {
    const variant = this.props.variant
    const empty = this.state.searchTerm.trim().length == 0
    const showSearchIcon = this.props.searchIcon != false
    let iconClassName = empty ? (showSearchIcon ? "fa fa-search" : "") : "fa fa-times-circle"
    if (this.props.isFetching) iconClassName = "spinner"

    return (
      <>
        {variant === "juno" ? (
          <SearchInput
            value={this.state.searchTerm}
            placeholder={this.props.placeholder}
            disabled={this.props.disabled === true}
            onChange={this.onChangeTerm}
            onClear={(e) => this.reset(e)}
          />
        ) : (
          <>
            <div className="has-feedback has-feedback-searchable">
              <input
                data-test="search"
                type="text"
                className="form-control"
                value={this.state.searchTerm}
                placeholder={this.props.placeholder}
                onChange={this.onChangeTerm}
                disabled={this.props.disabled == true}
              />
              <span
                className={`form-control-feedback ${!empty && "not-empty"}`}
                onClick={(e) => iconClassName != "spinner" && !empty && this.reset(e)}
              >
                <i className={iconClassName} />
              </span>
            </div>
            {this.props.text && (
              <div className="has-feedback-help">
                <Popover trigger="click" placement="top" rootClose content={this.props.text}>
                  <a className="help-link" href="#" onClick={(e) => e.preventDefault()}>
                    <i className="fa fa-question-circle"></i>
                  </a>
                </Popover>
              </div>
            )}
          </>
        )}
      </>
    )
  }
}
