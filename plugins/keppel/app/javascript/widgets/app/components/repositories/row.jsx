import moment from "moment"
import { Link } from "react-router-dom"
import React from "react"
import { confirm } from "lib/dialogs"
import { byteToHuman } from "lib/tools/size_formatter"
import RepositoryDeleter from "../../containers/repositories/deleter"


const numberOfThings = (number, word) => (number == 1 ? `${number} ${word}` : `${number} ${word}s`)

export default class RepositoryRow extends React.Component {
  state = {
    isDeleting: false,
  }

  handleDelete(e) {
    e.preventDefault()
    if (this.state.isDeleting) {
      return
    }
    const { name: repoName, manifest_count: manifestCount } = this.props.repo
    confirm(`Really delete the repository "${repoName}" and all ${manifestCount} images in it?`).then(() =>
      this.setState({ ...this.state, isDeleting: true })
    )
    //This causes <RepositoryDeleter/> to be mounted to perform the actual deletion.
  }

  handleDoneDeleting() {
    this.setState({ ...this.state, isDeleting: false })
  }

  render() {
    const { accountName, canEdit } = this.props
    const {
      name: repoName,
      manifest_count: manifestCount,
      tag_count: tagCount,
      size_bytes: sizeBytes,
      pushed_at: pushedAtUnix,
    } = this.props.repo
    const pushedAt = moment.unix(pushedAtUnix)

    return (
      <tr>
        <td className="col-md-4">
          <Link to={`/repo/${accountName}/${repoName}`}>{repoName}</Link>
        </td>
        <td className="col-md-3">
          {numberOfThings(manifestCount, "image")} with {numberOfThings(tagCount, "tag")}
        </td>
        <td className="col-md-3">
          {sizeBytes !== undefined ? byteToHuman(sizeBytes) : <span className="text-muted">Empty</span>}
        </td>
        <td className="col-md-2">
          {pushedAtUnix !== undefined ? (
            <span title={pushedAt.format("LLLL")}>{pushedAt.fromNow(true)} ago</span>
          ) : (
            <span className="text-muted">Empty</span>
          )}
        </td>
        {this.props.canEdit && (
          <td className="snug text-nobreak">
            {this.state.isDeleting ? (
              <RepositoryDeleter
                accountName={accountName}
                repoName={repoName}
                handleDoneDeleting={() => this.handleDoneDeleting()}
              />
            ) : (
              <div className="btn-group">
                <button
                  className="btn btn-default btn-sm dropdown-toggle"
                  disabled={false}
                  type="button"
                  data-toggle="dropdown"
                  aria-expanded={true}
                >
                  <span className="fa fa-cog"></span>
                </button>
                <ul className="dropdown-menu dropdown-menu-right" role="menu">
                  <li>
                    <a href="#" onClick={(e) => this.handleDelete(e)}>
                      Delete
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </td>
        )}
      </tr>
    )
  }
}
