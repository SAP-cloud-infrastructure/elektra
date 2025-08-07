import { Link } from "react-router-dom"
import { DataTable } from "lib/components/datatable"
import { PrettyDate } from "lib/components/pretty_date"
import React from "react"

import * as constants from "../../constants"
import ShareActions from "../shares/actions"

const sortKeyForNameOrID = (props) => {
  const name = (props.share || {}).name || ""
  const id = props.asset.id
  return name + id
}

export const columns = [
  {
    key: "id",
    label: "Share name/ID",
    sortStrategy: "text",
    sortKey: sortKeyForNameOrID,
  },
  {
    key: "scraped",
    label: "Last successful check",
    sortStrategy: "numeric",
    sortKey: (props) => props.scraped_at || 0,
  },
  {
    key: "checked",
    label: "Last failed check",
    sortStrategy: "numeric",
    sortKey: (props) => props.checked.at || 0,
  },
  { key: "actions", label: "" },
]

const AssetWithScrapingError = ({ asset, share, handleDelete, handleForceDelete }) => {
  const { id: shareID, size, usage_percent: usagePercent, scraped_at: scrapedAt, checked } = asset

  return (
    <>
      <tr>
        <td className="col-md-4">
          {share ? (
            <Link to={`/autoscaling/${share.id}/show`}>{share.name || shareID}</Link>
          ) : (
            <div>
              <span className="spinner" /> Loading share data...
            </div>
          )}
          <div className="small text-muted">{shareID}</div>
        </td>
        <td className="col-md-4">
          {scrapedAt ? <PrettyDate date={scrapedAt} /> : <span className="text-muted">Never</span>}
          {scrapedAt && (
            <div className="small text-muted">
              Reported {usagePercent}&nbsp;% usage of {size}&nbsp;GiB
            </div>
          )}
        </td>
        <td className="col-md-3">
          <PrettyDate date={checked.at} />
        </td>
        <td className="col-md-1 text-right">
          {share && (
            <ShareActions
              share={share}
              isPending={constants.isShareStatusPending(share.status)}
              parentView="autoscaling"
              handleDelete={handleDelete}
              handleForceDelete={handleForceDelete}
            />
          )}
        </td>
      </tr>
      <tr className="castellum-error-message">
        <td colSpan="4" className="text-danger">
          {checked.error}
        </td>
      </tr>
    </>
  )
}

export default class CastellumScrapingErrors extends React.Component {
  componentDidMount() {
    this.props.loadShareTypesOnce(this.props.projectID)
    const { data } = this.props.config
    if (data != null) {
      const shareTypes = Object.keys(data).filter((key) => data[key] != null)
      this.loadAssets(shareTypes)
    }
  }

  loadAssets(shareTypes) {
    this.props.loadAssetsOnce(this.props.projectID, shareTypes)
  }

  render() {
    const { errorMessage, isFetching, data } = this.props.assets
    if (isFetching || data == null) {
      return (
        <p>
          <span className="spinner" /> Loading...
        </p>
      )
    }
    if (errorMessage) {
      return <p className="alert alert-danger">Cannot load assets: {errorMessage}</p>
    }

    // flatten assets of all share types.
    const parsedAssetData = Object.values(data).flatMap((assets) => assets)
    
    //we are only interested in assets with scraping errors
    const assets = (parsedAssetData || []).filter((asset) => asset.checked && asset.checked.error)

    const shares = this.props.shares || []

    const forwardProps = {
      handleDelete: this.props.handleDelete,
      handleForceDelete: this.props.handleForceDelete,
    }

    return (
      <DataTable columns={columns} pageSize={6}>
        {assets.map((asset) => (
          <AssetWithScrapingError
            key={asset.id}
            asset={asset}
            share={shares.find((share) => share.id == asset.id)}
            {...forwardProps}
          />
        ))}
      </DataTable>
    )
  }
}
