import React from "react"

const Pagination = ({ isLoading, items, hasNext, handleClick }) => {
  return (
    <div className="lbaas2-pagination text-end">
      {isLoading ? (
        <>
          <span>{items.length} Items</span>
          <span> | </span>
          <span className="main-buttons">
            <span className="spinner"></span> Loading...
          </span>
        </>
      ) : (
        <>
          <span>{items.length} Items</span>
          {hasNext && (
            <>
              <span> | </span>
              <button
                onClick={(e) => handleClick(e, "next")}
                className="btn btn-link"
                style={{ paddingLeft: 0, paddingRight: 0 }}
              >
                Load Next
              </button>
              <span> | </span>
              <button
                onClick={(e) => handleClick(e, "all")}
                className="btn btn-link"
                style={{ paddingLeft: 0, paddingRight: 0 }}
              >
                All
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Pagination
