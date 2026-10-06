import React from "react"
/**
 * This component implements a pagination based on AJAX. It creates a
 * "Load Next" button which calls a given callback method on click.
 * Usage: <AjaxPaginate hasNext={true} onLoadNext={() => handleLoadNext()}/>
 **/
export const AjaxPaginate = ({
  hasNext,
  text,
  isFetching,
  onLoadNext,
  onLoadAll,
  loadNextButton = true,
  loadAllButton = false,
  loadNextLabel = "Load Next",
  loadAllLabel = "Load All",
  loadNextItemsCssClass = "btn btn-primary btn-sm",
  loadAllItemsCssClass = "btn btn-secondary btn-sm",
}) => {
  return (
    <div className="ajax-paginate">
      {isFetching ? (
        <div className="main-buttons">
          <span className="spinner"></span> Loading...
        </div>
      ) : (
        hasNext && (
          <div className="main-buttons">
            {text}
            {loadNextButton && (
              <button
                className={loadNextItemsCssClass}
                onClick={(e) => onLoadNext()}
              >
                {loadNextLabel}
              </button>
            )}
            {loadAllButton && (
              <button
                className={loadAllItemsCssClass}
                onClick={(e) => onLoadAll()}
              >
                {loadAllLabel}
              </button>
            )}
          </div>
        )
      )}
    </div>
  )
}
