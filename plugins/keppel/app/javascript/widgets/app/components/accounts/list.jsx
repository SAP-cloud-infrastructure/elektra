import { Link } from "react-router-dom"
import React from "react"
import { DataTable } from "lib/components/datatable"

import AccountRow from "./row"

const columns = [
  {
    key: "name",
    label: "Global account name",
    sortStrategy: "text",
    sortKey: (props) => props.account.name || "",
    searchKey: (props) => props.account.name || "",
  },
  { key: "config", label: "Configuration" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
]

const byName = (account1, account2) => {
  return account1.name.localeCompare(account2.name)
}

export default class AccountList extends React.Component {
  state = {
    searchText: "",
  }

  setSearchText(searchText) {
    this.setState({ ...this.state, searchText })
  }

  render() {
    const { isAdmin, hasExperimentalFeatures } = this.props
    const forwardProps = { isAdmin, hasExperimentalFeatures }

    return (
      <>
        {this.props.isAdmin && (
          <div className="toolbar">
            <div className="main-buttons">
              <Link to="/accounts/new" className="btn btn-primary">
                New Account
              </Link>
            </div>
          </div>
        )}
        <div className="search-box">
          <input
            className="form-control"
            type="text"
            value={this.state.searchText}
            placeholder="Filter accounts"
            onChange={(e) => this.setSearchText(e.target.value)}
          />
        </div>
        <DataTable columns={columns} pageSize={10} searchText={this.state.searchText}>
          {this.props.accounts.sort(byName).map((account) => (
            <AccountRow key={account.name} account={account} {...forwardProps} />
          ))}
        </DataTable>
      </>
    )
  }
}
