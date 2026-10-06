// ***********Use React Hooks*************
import React from "react"
import { Popover } from "lib/components/Overlay"
import { useMemo, useState } from "react"

const capitalize = (string) => string[0].toUpperCase() + string.slice(1)

/**
 * This component implements a serach fform.
 * Usage: <SearchForm helpText='Help Text...' searchFor={['name','id','status']} text='Search by name' onSubmit={(searchType,searchTerm) => handleSearch}/>
 **/
const Form = ({ helpText, searchFor, onSubmit, isLoading }) => {
  searchFor = searchFor || []
  const [searchType, setSearchType] = useState(searchFor[0] || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [canClear, updateCanClear] = useState(false)

  const options = useMemo(() => {
    if (!searchFor) return null
    const result = {}
    for (let i = 0; i < searchFor.length; i++)
      result[searchFor[i]] = capitalize(searchFor[i])
    return result
  }, [searchFor])

  const search = (e) => {
    e.preventDefault()
    updateCanClear(true)
    onSubmit(searchType, searchTerm)
  }

  const clear = (e) => {
    e.preventDefault()
    setSearchType(searchFor[0] || "")
    setSearchTerm("")
    updateCanClear(false)
    onSubmit(null, null)
  }

  return (
    <form className="form-inline" onSubmit={search}>
      {options?.length > 0 && (
        <div className="mb-3">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="form-control"
          >
            {Object.keys(options).map((option, index) => (
              <option key={index} value={option}>
                {options[option]}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mb-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            placeholder={
              searchType.length > 0 ? `search for ${searchType}...` : ""
            }
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="input-group-btn">
            {canClear && !isLoading && (
              <button type="button" className="btn btn-secondary" onClick={clear}>
                <i className="fa fa-times-circle" />
              </button>
            )}
            <button
              className="btn btn-secondary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                <i className="fa fa-search"></i>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="mb-3">
        {helpText && (
          <div className="has-feedback-help">
            <Popover trigger="click" placement="top" content={helpText}>
              <button type="button" className="btn btn-link">
                <i className="fa fa-question-circle" />
              </button>
            </Popover>
          </div>
        )}
      </div>
    </form>
  )
}

const Pagination = ({
  page = 1,
  limit = 20,
  items = [],
  hasNext = false,
  all = true,
  onPageRequest,
}) => {
  const handleClick = (e, page) => {
    e.preventDefault()
    onPageRequest(page)
  }

  //Body
  if (page == 1 && items.length <= 1) return null
  return (
    <div className="pagination">
      <span className="current-window">
        {(page - 1) * limit + 1} - {page * limit}
      </span>
      {page > 1 && (
        <>
          |
          <button
            onClick={(e) => handleClick(e, page - 1)}
            className="btn btn-link"
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            Previous Page
          </button>
        </>
      )}
      {hasNext && (
        <>
          |
          <button
            onClick={(e) => handleClick(e, page + 1)}
            className="btn btn-link"
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            Next Page
          </button>
        </>
      )}
      {(page > 1 || hasNext) && all && (
        <>
          |
          <button
            onClick={(e) => handleClick(e, "all")}
            className="btn btn-link"
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            All
          </button>
        </>
      )}
    </div>
  )
}

export { Form, Pagination }
