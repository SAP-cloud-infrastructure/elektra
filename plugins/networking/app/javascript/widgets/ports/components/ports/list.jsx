/* eslint-disable no-undef */
import { Link } from "react-router-dom"
import { DefeatableLink } from "lib/components/defeatable_link"
import { TransitionGroup, CSSTransition } from "react-transition-group"
import { SearchField } from "lib/components/search_field"
import PortItem from "./item"
import { AjaxPaginate } from "lib/components/ajax_paginate"
import React from "react"

const TableRowFadeTransition = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

export default class List extends React.Component {
  state = {
    filters: ["fixed ip ports", "other ports"],
    activeFilter: null,
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // load dependencies unless already loaded
    this.loadDependencies(nextProps)

    let index = this.state.filters.indexOf("fixed ip ports")
    if (index < 0) index = 0
    let activeFilter = this.state.activeFilter || this.state.filters[index]
    // set available filters and set active filter to the first
    this.setState({ activeFilter: activeFilter })
  }

  componentDidMount() {
    // load dependencies unless already loaded
    this.loadDependencies(this.props)
  }

  loadDependencies = (props) => {
    props.loadPortsOnce()
    props.loadNetworksOnce()
    props.loadSubnetsOnce()
    props.loadSecurityGroupsOnce()
  }

  changeActiveFilter = (name) => {
    // set active filter in state to the name
    this.setState({ activeFilter: name })
  }

  filterPorts = () => {
    let items = this.props.items.filter(
      (i) =>
        (this.state.activeFilter == "other ports" &&
          i.name != "fixed_ip_allocation") ||
        (this.state.activeFilter == "fixed ip ports" &&
          i.name == "fixed_ip_allocation")
    )

    if (!this.props.searchTerm) return items

    // filter items
    const regex = new RegExp(this.props.searchTerm.trim(), "i")

    return items.filter((i) => {
      let network = this.props.networks.items.find((n) => n.id == i.network_id)
      let values = { network: network ? network.name : "" }

      let fixed_ips = i.fixed_ips || []
      for (let index in fixed_ips) {
        let ip = fixed_ips[index]
        let subnet = this.props.subnets.items.find((s) => s.id == ip.subnet_id)
        values.subnet = `${values.subnet} ${subnet ? subnet.name : ""}`
        values.ip = `${values.ip} ${ip.ip_address}`
      }
      return (
        `${i.id} ${i.description} ${values.ip} ${values.network} ${values.subnet} ${i.network_id} ${i.status}`.search(
          regex
        ) >= 0
      )
    })
  }

  networks = () => {
    let networks = {}
    for (let i in this.props.networks.items) {
      let network = this.props.networks.items[i]
      networks[network.id] = network
    }
    return networks
  }

  subnets = () => {
    let subnets = {}
    for (let i in this.props.subnets.items) {
      let subnet = this.props.subnets.items[i]
      subnets[subnet.id] = subnet
    }
    return subnets
  }

  toolbar = () => {
    // return null if no items available
    if (this.props.items.length <= 0) return null

    return (
      <div className="toolbar">
        <SearchField
          onChange={(term) => this.props.searchPorts(term)}
          placeholder="ID, IP, network, subnet or description"
          text="Searches by ID, IP, network, subnet or description in visible IP list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
        />

        {this.state.filters.length > 1 && ( // show filter checkboxes
          <>
            <span className="toolbar-input-divider"></span>
            <label>Show:</label>
            {this.state.filters.map((name, index) => (
              <label className="radio-inline" key={index}>
                <input
                  type="radio"
                  onChange={() => this.changeActiveFilter(name)}
                  checked={this.state.activeFilter == name}
                />
                {name}
              </label>
            ))}
          </>
        )}
        {this.state.activeFilter == "fixed ip ports" && (
          <div className="main-buttons">
            <DefeatableLink to="/ports/new" className="btn btn-primary">
              Reserve new IP
            </DefeatableLink>
          </div>
        )}
      </div>
    )
  }

  renderTable = () => {
    let items = this.filterPorts()
    let networks = this.networks()
    let subnets = this.subnets()
    let securityGroups = this.props.securityGroups

    return (
      <div>
        <table className="table shares">
          <thead>
            <tr>
              <th className="snug"></th>
              <th>Port ID / Name</th>
              <th>Description</th>
              <th>Network</th>
              <th>Fixed IPs / Subnet</th>
              <th>Device Owner / ID</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <TransitionGroup component="tbody">
            {items && items.length > 0 ? (
              items.map(
                (port, index) =>
                  !port.isHidden && (
                    <TableRowFadeTransition key={index}>
                      <PortItem
                        port={port}
                        instancesPath={this.props.instancesPath}
                        handleDelete={this.props.handleDelete}
                        isFetchingNetworks={this.props.networks.isFetching}
                        isFetchingSubnets={this.props.subnets.isFetching}
                        network={networks[port.network_id]}
                        subnets={subnets}
                        securityGroups={securityGroups}
                      />
                    </TableRowFadeTransition>
                  )
              )
            ) : (
              <TableRowFadeTransition>
                <tr>
                  <td colSpan="6">
                    {this.props.isFetching ? (
                      <span className="spinner" />
                    ) : (
                      "No IPs found."
                    )}
                  </td>
                </tr>
              </TableRowFadeTransition>
            )}
          </TransitionGroup>
        </table>

        <AjaxPaginate
          hasNext={this.props.hasNext}
          isFetching={this.props.isFetching}
          onLoadNext={this.props.loadNext}
        />
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.toolbar()}
        {!policy.isAllowed("shared_filesystem_storage:share_list") ? (
          <span>You are not allowed to see this page</span>
        ) : (
          this.renderTable()
        )}
      </div>
    )
  }
}
