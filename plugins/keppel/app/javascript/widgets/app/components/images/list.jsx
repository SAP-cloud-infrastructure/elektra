import { Link } from "react-router-dom"
import React from "react"

import { DataTable } from "lib/components/datatable"

import { SEVERITY_ORDER } from "../../constants"
import { makeTabBar, makeHowtoOpener } from "../utils"
import Howto from "../howto"
import ImageRow from "./row"

const taggedColumns = [
  {
    key: "name",
    label: "Tag name / Canonical digest",
    sortStrategy: "text",
    searchKey: (props) => `${props.data.name || ""} ${props.data.digest || ""}`,
    sortKey: (props) => props.data.name || "",
  },
  { key: "media_type", label: "Format" },
  {
    key: "pushed_at",
    label: "Pushed",
    sortStrategy: "numeric",
    sortKey: (props) => props.data.pushed_at || 0,
  },
  {
    key: "last_pulled_at",
    label: "Last pulled",
    sortStrategy: "numeric",
    sortKey: (props) => props.data.last_pulled_at || 0,
  },
  {
    key: "size_bytes",
    label: "Size",
    sortStrategy: "numeric",
    sortKey: (props) => props.data.size_bytes || 0,
  },
  {
    key: "vuln_status",
    label: "Vulnerability Status",
    sortStrategy: "numeric",
    searchKey: (props) => props.data.vulnerability_status || "",
    sortKey: (props) => SEVERITY_ORDER[props.data.vulnerability_status || ""] || 0,
  },
  { key: "actions", label: "" },
]

const untaggedColumns = [
  {
    key: "digest",
    label: "Canonical digest",
    sortStrategy: "text",
    searchKey: (props) => props.data.digest || "",
    sortKey: (props) => props.data.digest || "",
  },
  ...taggedColumns.slice(1),
]

const maxTimestamp = (x, y) => {
  if (x === null) {
    return y
  }
  if (y === null) {
    return x
  }
  return Math.max(x, y)
}

export default class RepositoryList extends React.Component {
  state = {
    currentTab: "tagged",
    searchText: "",
    howtoVisible: false,
  }

  componentDidMount() {
    this.loadData()
  }
  componentDidUpdate() {
    this.loadData()
  }
  loadData() {
    const { name: accountName } = this.props.account || {}
    const { name: repoName } = this.props.repository || {}
    if (accountName) {
      this.props.loadManifestsOnce()
    }
  }

  selectTab(tab) {
    this.setState({ ...this.state, currentTab: tab })
  }
  setSearchText(searchText) {
    this.setState({ ...this.state, searchText })
  }
  setHowtoVisible(howtoVisible) {
    this.setState({ ...this.state, howtoVisible })
  }

  renderTaggedImagesList(forwardProps) {
    const { isFetching, data: manifests } = this.props.manifests
    if (isFetching) {
      return (
        <p>
          <span className="spinner" /> Loading tags/manifests for repository...
        </p>
      )
    }

    const tags = []
    for (const manifest of manifests || []) {
      for (const tag of manifest.tags || []) {
        tags.push({
          ...manifest,
          ...tag,
          last_pulled_at: maxTimestamp(manifest.last_pulled_at, tag.last_pulled_at),
        })
      }
    }
    tags.sort((a, b) => (a.name || a.digest).localeCompare(b.name || b.digest))
    return (
      <DataTable columns={taggedColumns} pageSize={10} searchText={this.state.searchText}>
        {tags.map((tag) => (
          <ImageRow key={tag.name} data={tag} {...forwardProps} />
        ))}
      </DataTable>
    )
  }

  renderUntaggedImagesList(forwardProps) {
    const { isFetching, data: manifests } = this.props.manifests
    if (isFetching) {
      return (
        <p>
          <span className="spinner" /> Loading tags/manifests for repository...
        </p>
      )
    }

    const untaggedManifests = (manifests || []).filter((manifest) => (manifest.tags || []).length == 0)

    return (
      <DataTable columns={untaggedColumns} pageSize={10} searchText={this.state.searchText}>
        {untaggedManifests.map((manifest) => (
          <ImageRow key={manifest.digest} data={manifest} {...forwardProps} />
        ))}
      </DataTable>
    )
  }

  render() {
    const { account, repository } = this.props
    if (!account) {
      return <p className="alert alert-error">No such account</p>
    }
    if (!repository) {
      return <p className="alert alert-error">No such repository</p>
    }

    const { currentTab, howtoVisible } = this.state
    let tabs = [
      { label: "Tags", key: "tagged" },
      { label: "Untagged images", key: "untagged" },
    ]
    const hasUntagged = (this.props.manifests.data || []).some((manifest) => (manifest.tags || []).length == 0)
    if (!hasUntagged) {
      tabs = tabs.filter((tab) => tab.key != "untagged")
    }

    const showHowto = (val) => this.setHowtoVisible(true)
    const hideHowto = (val) => this.setHowtoVisible(false)

    const { registryDomain } = this.props.dockerInfo
    const forwardProps = {
      canEdit: this.props.canEdit,
      deleteManifest: this.props.deleteManifest,
      deleteTag: this.props.deleteTag,
      accountName: account.name,
      repositoryName: repository.name,
      repositoryURL: `${registryDomain}/${account.name}/${repository.name}`,
    }

    return (
      <>
        <ol className="breadcrumb followed-by-search-box">
          <li>
            <Link to="/accounts">All accounts</Link>
          </li>
          <li>
            <Link to={`/account/${account.name}`}>Account: {account.name}</Link>
          </li>
          <li className="active">Repository: {repository.name}</li>
          {!howtoVisible && makeHowtoOpener(showHowto)}
        </ol>
        <div className="search-box">
          <input
            className="form-control"
            type="text"
            value={this.state.searchText}
            placeholder="Filter images"
            onChange={(e) => this.setSearchText(e.target.value)}
          />
        </div>
        {howtoVisible && (
          <Howto
            dockerInfo={this.props.dockerInfo}
            accountName={account.name}
            repoName={repository.name}
            handleClose={hideHowto}
          />
        )}
        {/* when there is only the "Tags" tab, skip the tablist entirely */}
        {hasUntagged && makeTabBar(tabs, currentTab, (key) => this.selectTab(key))}
        {(!hasUntagged || currentTab == "tagged") && this.renderTaggedImagesList(forwardProps)}
        {hasUntagged && currentTab == "untagged" && this.renderUntaggedImagesList(forwardProps)}
      </>
    )
  }
}
