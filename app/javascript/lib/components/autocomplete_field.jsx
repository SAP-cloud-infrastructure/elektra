import React from "react"

import { AsyncTypeahead, Highlighter } from "react-bootstrap-typeahead"
import { pluginAjaxHelper } from "lib/ajax_helper"

const ajaxHelper = pluginAjaxHelper("/")

export class AutocompleteField extends React.Component {
  state = {
    isLoading: false,
    options: [],
  }

  // handleSearch calls first the elektra cache and if no results are returned it calls
  // the identity to search for groups or users (ONLY FOR groups or users)
  handleSearch = (searchTerm) => {
    let path
    switch (this.props.type) {
      case "projects":
        path = "projects"
        break
      case "users":
        path = "users"
        break
      case "groups":
        path = "groups"
        break
    }

    const params = { term: searchTerm }
    if (this.props.domainId) params["domain"] = this.props.domainId

    this.setState({ isLoading: true, options: [] })
    ajaxHelper
      .get(`/cache/${path}`, { params })
      .then((response) => response.data)
      .then((data) => {
        this.setState({ isLoading: false })
        if (!data) return []

        // convert results to options
        const options = data.map((i) => ({
          name: i.name,
          id: i.uid || i.key || i.id,
          full_name: i.full_name || "",
        }))

        this.setState({ options: options })
      })

      .catch((error) => console.info("ERROR:", error))
  }

  render() {
    let placeholder = "name or ID"
    if (this.props.type == "projects") placeholder = `Project ${placeholder}`
    else if (this.props.type == "users") placeholder = `User ${placeholder}`
    else if (this.props.type == "groups") placeholder = `Group ${placeholder}`
    return (
      <AsyncTypeahead
        id={(Math.random() + 1).toString(36).substring(7)}
        disabled={!!this.props.disabeld}
        isLoading={this.state.isLoading}
        options={this.state.options}
        clearButton={!!this.props.clearButton}
        autoFocus={true}
        allowNew={false}
        multiple={false}
        onChange={this.props.onSelected}
        onInputChange={this.props.onInputChange}
        onSearch={this.handleSearch}
        labelKey="name"
        filterBy={["id", "name", "full_name"]}
        placeholder={placeholder}
        renderMenuItemChildren={(option, props) => {
          return [
            <Highlighter key="name" search={props.text}>
              {option.full_name ? `${option.full_name} (${option.name})` : option.name}
            </Highlighter>,
            <div className="info-text" key="id">
              <small>ID: {option.id}</small>
            </div>,
          ]
        }}
      />
    )
  }
}
