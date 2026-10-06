/* eslint no-console:0 */
import React from "react"

// render all components inside a hash router
export default class NetworkStats extends React.Component {
  state = {
    errors: null,
  }

  componentDidMount() {
    this.props
      .loadNetworkUsageStatsOnce()
      .catch((errors) => this.setState({ errors }))
  }

  filterItems = () => {
    if (!this.props.scopeType || !this.props.scopeId)
      return this.props.networkUsageStats.items

    const items = []

    for (let item of this.props.networkUsageStats.items) {
      let filteredProjects = item.projects.filter((project) => {
        if (this.props.scopeType == "project") {
          return project.id == this.props.scopeId
        } else if (this.props.scopeType == "domain") {
          return project.domain_id == this.props.scopeId
        }
      })
      if (filteredProjects.length > 0) {
        items.push(Object.assign({}, item, { projects: filteredProjects }))
      }
    }
    return items
  }

  //console.log(props)
  render() {
    if (!this.props.networkUsageStats) return null

    const items = this.filterItems()
    const isFetching = this.props.networkUsageStats.isFetching

    if (isFetching)
      return (
        <>
          <span className="spinner"></span> Loading ...
        </>
      )

    return (
      <>
        {items && (
          <table className="table">
            <thead>
              <tr>
                <th>
                  Network <span className="float-end">Floating IPs:</span>
                </th>
                <th>Available</th>
                <th>Used</th>
                <th>Approved</th>
                <th>
                  Project
                  <span className="float-end">Approved Floating IPs</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.usage.network_id}>
                  <td>
                    {item.usage.network_name}
                    <br />
                    <span className="info-text">{item.usage.network_id}</span>
                  </td>
                  <td>{item.usage.total_ips}</td>
                  <td>{item.usage.used_ips}</td>
                  <td>{item.floating_ip_quota}</td>
                  <td>
                    <table className="table no-borders">
                      <tbody>
                        {item.projects.map((project, index) => (
                          <tr key={index}>
                            <td>
                              {project.name}
                              <br />
                              <span className="info-text">{project.id}</span>
                            </td>
                            <td>{project.quota && project.quota.floatingip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    )
  }
}
