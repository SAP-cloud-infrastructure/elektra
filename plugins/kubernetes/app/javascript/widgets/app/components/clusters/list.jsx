/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// import
import React from "react"
import { connect } from "react-redux"
import ClusterItem from "./item"
import { fetchClusters, openNewClusterDialog } from "../../actions"

class Clusters extends React.Component {
  componentDidMount() {
    return this.props.loadClusters()
  }

  render() {
    const {
      flashError,
      isFetching,
      clusters,
      handleNewCluster,
      error,
      kubernikusBaseUrl,
    } = this.props

    return (
      <div>
        {flashError != null || error != null ? (
          <div className="alert alert-error alert-dismissible">
            <button className="btn-close" type="button" data-bs-dismiss="alert" aria-label="Close"></button>
            {
              // &times;
              flashError
            }
            {error}
          </div>
        ) : undefined}
        {!isFetching &&
        error == null &&
        (clusters == null || !(clusters.length > 0)) ? (
          <div className="toolbar toolbar-controlcenter">
            <div className="main-control-buttons">
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault()
                  return handleNewCluster()
                }}
              >
                Create Cluster
              </button>
            </div>
          </div>
        ) : undefined}
        <table className="table">
          <thead>
            <tr>
              <th>Cluster</th>
              <th>Status</th>
              <th className="pool-info-column">Nodepools</th>
              <th className="snug" />
            </tr>
          </thead>
          {isFetching ? (
            <tbody>
              <tr>
                <td colSpan="5">
                  <span className="spinner" />
                </td>
              </tr>
            </tbody>
          ) : clusters != null && clusters.length ? (
            Array.from(clusters).map((cluster) => (
              <ClusterItem
                cluster={cluster}
                key={cluster.name}
                kubernikusBaseUrl={kubernikusBaseUrl}
              />
            ))
          ) : (
            <tbody>
              <tr>
                <td colSpan="5">
                  {error != null
                    ? "Could not retrieve clusters"
                    : "No clusters found"}
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    )
  }
}

export default connect(
  (state) => ({
    clusters: state.clusters.items,
    isFetching: state.clusters.isFetching,
    error: state.clusters.error,
    flashError: state.clusters.flashError,
  }),
  (dispatch) => ({
    handleNewCluster() {
      return dispatch(openNewClusterDialog())
    },
    loadClusters() {
      return dispatch(fetchClusters())
    },
  })
)(Clusters)
