import React from "react"
import { useEffect, useMemo } from "react"
import { DefeatableLink } from "lib/components/defeatable_link"
import { policy } from "lib/policy"
import { Form, Pagination } from "lib/components/searchComponents"
import Item from "./item"
import { scope } from "lib/ajax_helper"

const VolumesList = ({
  active,
  volumes,
  fetchVolumes,
  listenToVolumes,
  loadVolumesOnce,
  reloadVolume,
  deleteVolume,
  forceDeleteVolume,
  detachVolume,
}) => {
  const [showAvailable, setShowAvailable] = React.useState(false)
  // Body
  useEffect(() => listenToVolumes(), [])
  useEffect(() => {
    if (active) loadVolumesOnce()
  }, [active])

  const canCreate = useMemo(
    () =>
      policy.isAllowed("block_storage:volume_create", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const handlePaginateClick = (page) => {
    if (page === "all") {
      fetchVolumes({
        searchType: volumes.searchType,
        searchTerm: volumes.searchTerm,
        limit: 9999,
      })
    } else {
      fetchVolumes({
        searchType: volumes.searchType,
        searchTerm: volumes.searchTerm,
        page,
      })
    }
  }

  return (
    <>
      {(volumes.items.length > 5 || canCreate) && (
        <div className="toolbar toolbar-controlcenter">
          <Form
            isLoading={volumes.isFetching}
            searchFor={["name", "description", "id", "status"]}
            onSubmit={(searchType, searchTerm) => fetchVolumes({ searchType, searchTerm })}
            helpText="Search by name, ID or status will find exact or partial matches. ID and status have to be exact matches to be found."
          />
          <input type="checkbox" checked={showAvailable} onChange={() => setShowAvailable(!showAvailable)} />
          <span style={{ paddingLeft: "5px", paddingTop: "4px" }}>Show only available volumes</span>
          {canCreate && (
            <div className="main-buttons">
              <DefeatableLink to="/volumes/new" className="btn btn-primary">
                Create New
              </DefeatableLink>
            </div>
          )}
        </div>
      )}

      <table className="table volumes">
        <thead>
          <tr>
            <th></th>
            <th>Volume Name</th>
            <th>Availability Zone</th>
            <th>Description</th>
            <th>Size(GB)</th>
            <th style={{ whiteSpace: "nowrap" }}>Attached To</th>
            <th style={{ whiteSpace: "nowrap" }}>Updated At</th>
            <th>Status</th>
            <th className="snug"></th>
          </tr>
        </thead>

        <tbody>
          {volumes.items && volumes.items.length > 0 ? (
            volumes.items
              .filter((volume) => !showAvailable || volume.status === "available")
              .map((volume, index) => (
                <Item
                  volume={volume}
                  key={index}
                  searchTerm={""}
                  reloadVolume={reloadVolume}
                  deleteVolume={deleteVolume}
                  detachVolume={detachVolume}
                  forceDeleteVolume={forceDeleteVolume}
                />
              ))
          ) : (
            <tr>
              <td colSpan="7">{volumes.isFetching ? <span className="spinner" /> : "No volumes found."}</td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination {...volumes} onPageRequest={handlePaginateClick} />
    </>
  )
}
export default VolumesList
