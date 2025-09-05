import Parents from "./parents"
import Users from "./users"
import Groups from "../containers/groups"
import JsonViewer from "./jsonViewer"
import React from "react"

class ObjectDetails extends React.Component {
  state = {
    objectInfoVisible: false,
  }

  fetchObjectInfo = () => {
    const object = this.props.object.data
    const objectInfo = this.props.object.info.data
    if (!objectInfo || object.id != objectInfo.searchObjectId) {
      this.props.fetchObjectInfo(object.searchValue, object.id, object.searchBy)
    }
  }

  toggleObjectInfoShow = (event) => {
    if (this.state.objectInfoVisible) {
      this.setState({ objectInfoVisible: false })
    } else {
      this.setState({ objectInfoVisible: true })
      this.fetchObjectInfo()
    }
  }

  render() {
    const object = this.props.object.data
    const objectInfo = this.props.object.info
    const { project, domain, parents, users, groups } = this.props
    return (
      <div className="searchResults">
        <p>
          Searched by <b>{object.searchBy}</b>. Details for <b>{object.searchValue}</b>:
        </p>
        <table className="table">
          <tbody>
            <tr>
              <th>Object Info:</th>
              <td>
                {object.name}
                <small className="text-muted"> ( {object.id} )</small>
                <button
                  className="btn-xs btn-default pull-right"
                  disabled={objectInfo.isFetching}
                  onClick={(e) => this.toggleObjectInfoShow(e)}
                >
                  {objectInfo.isFetching && <i className="loading-spinner-button" />}
                  {this.state.objectInfoVisible ? "Hide details" : "Show details"}
                </button>
                {objectInfo.error && <div className="text-danger">{objectInfo.error.error}</div>}
                {objectInfo.data && this.state.objectInfoVisible && (
                  <JsonViewer details={objectInfo.data.details} title={objectInfo.data.detailsTitle} />
                )}
              </td>
            </tr>
            <tr>
              <th>Project Name:</th>
              <td>
                {project.isFetching && <span className="spinner" />}
                {project.error && <span className="text-danger">{project.error.error}</span>}
                {project.data && (
                  <>
                    {project.data.name}
                    {project.data.id && <small className="text-muted"> ( {project.data.id} )</small>}
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th>Project Domain:</th>
              <td>
                {domain.isFetching && <span className="spinner" />}
                {domain.error && <span className="text-danger">{domain.error.error}</span>}
                {domain.data && (
                  <>
                    {domain.data.name}
                    <small className="text-muted"> ( {domain.data.id} )</small>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <th>Parents:</th>
              <td>
                {parents.isFetching && <span className="spinner" />}
                {parents.error && <span className="text-danger">{parents.error.error}</span>}
                {parents.data && <Parents parents={parents.data} />}
              </td>
            </tr>
            <tr>
              <th>Admin Users:</th>
              <td>
                {users.isFetching && <span className="spinner" />}
                {users.error && <span className="text-danger">{users.error.error}</span>}
                {users.data && <Users users={users.data} />}
              </td>
            </tr>
            <tr>
              <th>Groups:</th>
              <td>
                {groups.isFetching && <span className="spinner" />}
                {groups.error && <span className="text-danger">{groups.error.error}</span>}
                {groups.data && <Groups groups={groups.data} />}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

export default ObjectDetails
