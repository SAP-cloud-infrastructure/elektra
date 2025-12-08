import React from "react"

import { AsyncTypeahead, Highlighter } from "react-bootstrap-typeahead"
import { pluginAjaxHelper } from "lib/ajax_helper"

const ajaxHelper = pluginAjaxHelper("/")

export class AutocompleteField extends React.Component {
  state = {
    isLoading: false,
    options: [],
    inputValue: "",
    isValid: false,
  }

  // will set isValid to false on input change until a user was selected from the search results
  handleInputChange = (text) => {
    this.setState({ inputValue: text, isValid: false })
    if (this.props.onInputChange) {
      this.props.onInputChange(text, false)
    }
  }

  // if a user was selected from the search results the isValid flag is true
  // this is used to enable/disable the add button in the parent component
  // to prevent adding non-existing users
  handleChange = (selected) => {
    const isValid = selected && selected?.length > 0
    this.setState({ isValid })

    if (this.props.onSelected) {
      this.props.onSelected(selected, isValid)
    }
  }

  // handleSearch calls first the elektra cache and if no results are returned it calls
  // the identity to search for groups or users (ONLY FOR groups or users)
  handleSearch = (searchTerm) => {
    let path
    let skipCache = false
    switch (this.props.type) {
      case "projects":
        path = "projects"
        break
      case "users":
        path = "users"
        // Always bypass cache for user lookups (nocache=true).
        // This prevents outdated or deleted users from appearing in search results
        // and being reassigned to roles/projects. Only active users from the
        // Identity API should be selectable.
        skipCache = true
        break
      case "groups":
        path = "groups"
        break
    }

    const params = { term: searchTerm }
    if (this.props.domainId) params["domain"] = this.props.domainId
    if (skipCache) params["nocache"] = "true"

    this.setState({ isLoading: true, options: [] })
    ajaxHelper
      .get(`/cache/${path}`, { params })
      .then((response) => response.data)
      .then((data) => {
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
      .finally(() => this.setState({ isLoading: false }))
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
        onChange={this.handleChange}
        onInputChange={this.handleInputChange}
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
