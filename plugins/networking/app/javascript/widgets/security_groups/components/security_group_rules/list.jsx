import { Link } from "react-router-dom"
import { DefeatableLink } from "lib/components/defeatable_link"
import { SearchField } from "lib/components/search_field"
import SecurityGroupRuleItem from "./item"
import { policy } from "lib/policy"
import React from "react"

export default class List extends React.Component {
  state = { searchTerm: "", sortByProtocol: null, sortByPort: null }

  componentDidMount() {
    // load dependencies unless already loaded
    if (!this.props.securityGroup) {
      this.props.loadSecurityGroup()
    }
    // load all security groups to build the links properly if comming per deeplink
    this.props.loadSecurityGroupsOnce()
  }

  sortBy = (name) => {
    if (name == "protocol") {
      let direction = this.state.sortByProtocol || "desc"
      direction == "asc" ? (direction = "desc") : (direction = "asc")
      this.setState({ sortByProtocol: direction, sortByPort: null })
    } else if (name == "port") {
      let direction = this.state.sortByPort || "desc"
      direction == "asc" ? (direction = "desc") : (direction = "asc")
      this.setState({ sortByPort: direction, sortByProtocol: null })
    }
  }

  filterItems = () => {
    let items = this.props.securityGroupRules || []

    if (
      this.state.searchTerm &&
      this.state.searchTerm.replace(/\s/g, "").length > 0
    ) {
      const regex = new RegExp(this.state.searchTerm.trim(), "i")

      return items.filter(
        (i) =>
          `${i.direction} ${i.protocol} ${i.port_range_min} ${i.port_range_max}`.search(
            regex
          ) >= 0
      )
    }

    if (this.state.sortByPort) {
      items.sort((a, b) => {
        if (a.port_range_min < b.port_range_min) return -1
        if (a.port_range_min > b.port_range_min) return 1
        return 0
      })
      if (this.state.sortByPort == "desc") items.reverse()
    } else if (this.state.sortByProtocol) {
      items.sort((a, b) => {
        if ((a.protocol || "Any") < (b.protocol || "Any")) return -1
        if ((a.protocol || "Any") > (b.protocol || "Any")) return 1
        return 0
      })
      if (this.state.sortByProtocol == "desc") items.reverse()
    }
    return items
  }

  renderToolbar = () => {
    return (
      <div className="toolbar toolbar-aligntop">
        {this.props.securityGroupRules &&
          this.props.securityGroupRules.length >= 10 && (
            <SearchField
              onChange={(term) => this.setState({ searchTerm: term })}
              placeholder="Direction, IP protocol or port range"
              text="Searches direction, IP protocol or port range in visible security group rule list only.
                  Entering a search term will automatically start loading the next pages
                  and filter the loaded items using the search term. Emptying the search
                  input field will show all currently loaded items."
            />
          )}

        <div className="main-buttons">
          {policy.isAllowed("networking:rule_create") && (
            <DefeatableLink
              to={`/security-groups/${this.props.securityGroupId}/rules/new`}
              className="btn btn-primary"
              disabled={!this.props.securityGroup}
            >
              Add New Rule
            </DefeatableLink>
          )}
        </div>
      </div>
    )
  }

  renderTable = () => {
    const items = this.filterItems()
    const isFetching = this.props.isFetching

    return (
      <table className="table shares">
        <thead>
          <tr>
            <th>Direction</th>
            <th>Type</th>
            <th className="u-nowrap">
              Protocol
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  this.sortBy("protocol")
                }}
              >
                <i
                  className={`fa fa-fw fa-sort${
                    !this.state.sortByProtocol
                      ? ""
                      : "-" + this.state.sortByProtocol
                  }`}
                />
              </a>
            </th>
            <th width="20%" className="u-nowrap">
              Port Range
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  this.sortBy("port")
                }}
              >
                <i
                  className={`fa fa-fw fa-sort${
                    !this.state.sortByPort ? "" : "-" + this.state.sortByPort
                  }`}
                />
              </a>
            </th>
            <th className="u-nowrap">Remote Source</th>
            <th>Description</th>
            <th className="snug"></th>
          </tr>
        </thead>
        <tbody>
          {items && items.length > 0 ? (
            items.map((rule, index) => (
              <SecurityGroupRuleItem
                key={index}
                rule={rule}
                securityGroups={this.props.securityGroups}
                handleDelete={this.props.handleDelete}
              />
            ))
          ) : (
            <tr>
              <td colSpan="4">
                {isFetching ? <span className="spinner" /> : "No rules found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )
  }

  renderGroupInfos = () => {
    const canDeleteGroup = policy.isAllowed("networking:security_group_delete")
    return (
      <div className="infobox">
        <h4 className="action-heading">
          Security Group Info
          {canDeleteGroup && (
            <div className="dropdown header-action">
              <i
                className="fa fa-cog dropdown-toggle"
                data-bs-toggle="dropdown"
                data-aria-expanded={true}
              />
              <ul className="dropdown-menu dropdown-menu-end" role="menu">
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      this.props
                        .handleGroupDelete()
                        .then((success) => this.props.history.replace(`/`))
                    }}
                  >
                    Delete Security Group
                  </a>
                </li>
              </ul>
            </div>
          )}
        </h4>

        {this.props.securityGroup ? (
          <>
            <hr />
            <p>
              <b>Name: </b>
              {this.props.securityGroup.name}
            </p>
            <p>
              <b>Description:</b>
              <br />
              {this.props.securityGroup.description}
            </p>
            <p>
              <b>ID: </b>
              <br />
              {this.props.securityGroup.id}
            </p>
            <p>
              <b>Rules: </b>
              {this.props.securityGroupRules.length}
            </p>
          </>
        ) : (
          <span className="spinner" />
        )}
      </div>
    )
  }

  render() {
    if (!policy.isAllowed("networking:rule_list")) {
      return <span>You are not allowed to see this page</span>
    }

    return (
      <div className="row">
        <div className="col-md-9">
          {this.renderToolbar()}
          {this.renderTable()}
        </div>

        <div className="col-md-3">{this.renderGroupInfos()}</div>
      </div>
    )
  }
}
