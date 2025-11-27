import { Link } from "react-router-dom"
import React from "react"
import { DataTable } from "lib/components/datatable"

import { makeHowtoOpener } from "../utils"
import Howto from "../howto"
import RepositoryRow from "./row"

const columns = [
  {
    key: "name",
    label: "Repository name",
    sortStrategy: "text",
    searchKey: (props) => props.repo.name || "",
    sortKey: (props) => props.repo.name || "",
  },
  {
    key: "image_counts",
    label: "Contains",
    sortStrategy: "numeric",
    sortKey: (props) => (props.repo.manifest_count || 0) + 0.00001 * (props.repo.tag_count || 0),
  },
  {
    key: "size_bytes",
    label: "Total size",
    sortStrategy: "numeric",
    sortKey: (props) => props.repo.size_bytes || 0,
  },
  {
    key: "pushed_at",
    label: "Last pushed",
    sortStrategy: "numeric",
    sortKey: (props) => props.repo.pushed_at || 0,
  },
  { key: "actions", label: "" },
]

export default class RepositoryList extends React.Component {
  state = {
    searchText: "",
    //either `true` or `false` when set by user, or `null` to apply default visibility rule (see below)
    howtoVisible: null,
  }

  componentDidMount() {
    this.props.loadRepositoriesOnce()
  }
  componentDidUpdate() {
    this.props.loadRepositoriesOnce()
  }

  setSearchText(searchText) {
    this.setState({ ...this.state, searchText })
  }
  setHowtoVisible(howtoVisible) {
    this.setState({ ...this.state, howtoVisible })
  }

  render() {
    const { account } = this.props
    if (!account) {
      return <p className="alert alert-error">No such account</p>
    }
    const { isFetching, data: repos } = this.props.repos

    let howtoVisible = this.state.howtoVisible
    if (howtoVisible === null) {
      //by default, unfold the howto if the account is empty (to make sure that
      //new users see it, without cluttering the view for experienced users)
      howtoVisible = repos instanceof Array && repos.length == 0
    }

    const showHowto = (val) => this.setHowtoVisible(true)
    const hideHowto = (val) => this.setHowtoVisible(false)

    const forwardProps = {
      accountName: account.name,
      canEdit: this.props.canEdit,
    }

    return (
      <>
        <ol className="breadcrumb followed-by-search-box">
          <li>
            <Link to="/accounts">All accounts</Link>
          </li>
          <li className="active">Account: {account.name}</li>
          {!howtoVisible && makeHowtoOpener(showHowto)}
        </ol>
        <div className="search-box">
          <input
            className="form-control"
            type="text"
            value={this.state.searchText}
            placeholder="Filter repositories"
            onChange={(e) => this.setSearchText(e.target.value)}
          />
        </div>
        {howtoVisible && (
          <Howto
            dockerInfo={this.props.dockerInfo}
            accountName={account.name}
            repoName={"<repo>"}
            handleClose={hideHowto}
          />
        )}
        {isFetching ? (
          <p>
            <span className="spinner" /> Loading repositories for account...
          </p>
        ) : (
          <DataTable columns={columns} pageSize={10} searchText={this.state.searchText}>
            {(repos || []).map((repo) => (
              <RepositoryRow key={repo.name} repo={repo} {...forwardProps} />
            ))}
          </DataTable>
        )}
      </>
    )
  }
}
