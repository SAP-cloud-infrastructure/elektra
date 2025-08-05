import { TransitionGroup, CSSTransition } from "react-transition-group"
import { policy } from "lib/policy"
import { SearchField } from "lib/components/search_field"
import Item from "./item"
import { AjaxPaginate } from "lib/components/ajax_paginate"
import React, { useEffect, useMemo } from "react"

const TableRowFadeTransition = ({ children, ...props }) => (
  <CSSTransition {...props} timeout={200} classNames="css-transition-fade">
    {children}
  </CSSTransition>
)

const List = ({
  items,
  active,
  loadOsImagesOnce,
  searchOsImages,
  searchTerm,
  hasNext,
  isFetching,
  loadNext,
  handleAccept,
  handleReject,
  activeTab,
  visibilityCounts,
  activeVisibilityFilter,
  setActiveVisibilityFilter,
  ...otherProps
}) => {
  const availableVisibilityFilters = useMemo(() => {
    if (!visibilityCounts) return []
    // Disable public filters if the flag is set
    // disablePublicFilters comes from the domain config
    if (otherProps.disablePublicFilters) {
      if (activeVisibilityFilter === "public") setActiveVisibilityFilter("private")
      // filter out public images
      return Object.keys(visibilityCounts).filter((k) => k !== "public")
    }
    return Object.keys(visibilityCounts)
  }, [visibilityCounts])

  useEffect(() => {
    if (active) loadOsImagesOnce()
  }, [active, activeVisibilityFilter, loadOsImagesOnce])

  const filteredItems = useMemo(() => {
    // filter items dependent on the active filter
    let result = items.filter((i) => activeVisibilityFilter == i.visibility)

    if (!searchTerm) return result

    // search term is given -> filter items dependent on the search term
    const regex = new RegExp(searchTerm.trim(), "i")
    return result.filter(
      (i) => `${i.name} ${i.id} ${i.format} ${i.status}`.search(regex) >= 0
    )
  }, [items, searchTerm, activeVisibilityFilter])

  if (!active) return null
  return (
    <div>
      <div className="toolbar">
        <SearchField
          onChange={(term) => searchOsImages(term)}
          placeholder="name, ID, format or status"
          text="Searches by name, ID, format or status in visible images list only.
                Entering a search term will automatically start loading the next pages
                and filter the loaded items using the search term. Emptying the search
                input field will show all currently loaded items."
        />
        {availableVisibilityFilters?.length > 1 && ( // show filter checkboxes
          <>
            <span className="toolbar-input-divider"></span>
            <label>Show:</label>
            {availableVisibilityFilters.map((name, index) => (
              <label className="radio-inline" key={index}>
                <input
                  type="radio"
                  onChange={() => setActiveVisibilityFilter(name)}
                  checked={activeVisibilityFilter === name}
                />
                {name}
              </label>
            ))}
          </>
        )}
      </div>
      {!policy.isAllowed("image:image_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        <div>
          <table className="table shares">
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th>Name</th>
                <th>Format</th>
                <th>Size</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <TransitionGroup component="tbody">
              {filteredItems.length > 0 ? (
                filteredItems.map(
                  (image, index) =>
                    !image.isHidden && (
                      <TableRowFadeTransition key={index}>
                        <Item
                          {...otherProps}
                          image={image}
                          handleAccept={handleAccept}
                          handleReject={handleReject}
                          activeTab={activeTab}
                          number={index + 1}
                        />
                      </TableRowFadeTransition>
                    )
                )
              ) : (
                <TableRowFadeTransition>
                  <tr>
                    <td colSpan="7">
                      {isFetching ? (
                        <span className="spinner" />
                      ) : (
                        "No images found."
                      )}
                    </td>
                  </tr>
                </TableRowFadeTransition>
              )}
            </TransitionGroup>
          </table>

          <AjaxPaginate
            hasNext={hasNext}
            isFetching={isFetching}
            onLoadNext={loadNext}
          />
        </div>
      )}
    </div>
  )
}

export default List
