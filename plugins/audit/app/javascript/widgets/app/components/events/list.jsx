//export default (props) => <div>TEST</div>

import React from "react"
import Datetime from "react-datetime"
import moment from "moment"
import EventItem from "../../containers/events/item"
import EventItemDetail from "./item_details"
import Pagination from "../../containers/shared/pagination"
import { isEmpty } from "lib/tools/helpers"
import { Alert } from "lib/flashes/alert"
import { Form as Search } from "lib/components/searchComponents"

const isValidDate = (date) =>
  // do not allow dates that are in the future
  !moment(date).isAfter()

const ATTRIBUTES = [
  { key: "observer_type", name: "Observer Type" },
  { key: "action", name: "Action" },
  { key: "target_type", name: "Target Type" },
  { key: "target_id", name: "Target ID" },
  { key: "initiator_id", name: "Initiator ID" },
  { key: "initiator_name", name: "Initiator Name" },
  { key: "initiator_type", name: "Initiator Type" },
  { key: "outcome", name: "Outcome" },
]

const EventList = ({
  events,
  isFetching,
  loadEvents,
  handleStartTimeChange,
  handleEndTimeChange,
  handleFilterTypeChange,
  handleFilterTermChange,
  addNewFilter,
  handleRemoveFilter,
  handleClearFilters,
  handleSearch,
  filterStartTime,
  filterEndTime,
  filterType,
  filterTerm,
  activeFilters,
  attributeValues,
  isFetchingAttributeValues,
  offset,
  limit,
  total,
  error,
}) => (
  <div>
    {error && (
      <Alert
        message={{
          type: "error",
          text: typeof error === "string" ? error : error?.message,
        }}
      />
    )}

    <div className="search-bar">
      <Search
        isLoading={false}
        onSubmit={(_searchType, searchTerm) => handleSearch(searchTerm)}
        //helpText="This search field enables a comprehensive full-text search across events. To initiate the search, enter keywords of three characters or more. The system will then scan through all event data, delivering results that match your query."
      />
    </div>

    <div className="toolbar toolbar-controlcenter audit">
      <span className="tool">
        <label>Filter:</label>
        <div className="inputwrapper">
          <select
            name="filterType"
            className="form-control"
            value={filterType}
            onChange={(e) => handleFilterTypeChange(e.target.value)}
          >
            <option value="">Select attribute</option>
            {
              // filter attributes list. Show only those that haven't already been selected as a filter type
              ATTRIBUTES.filter((att) => activeFilters.findIndex((filter) => filter[0] == att.key) < 0).map((att) => (
                <option value={att.key} key={att.key}>
                  {att.name}
                </option>
              ))
            }
          </select>
        </div>
        <div className="inputwrapper">
          {!/target_id|initiator_id/.test(filterType) &&
          attributeValues[filterType] &&
          attributeValues[filterType].length > 0 ? (
            <select
              name="filterTerm"
              className="form-control filter-term"
              value={filterTerm}
              onChange={(e) => handleFilterTermChange(e.target.value, true)}
            >
              <option value="">Select</option>
              {attributeValues[filterType].sort().map((attribute) => (
                <option value={attribute} key={`filterTerm_${attribute}`}>
                  {attribute}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="filterTerm"
              className="form-control filter-term"
              value={filterTerm}
              placeholder="Enter lookup value"
              disabled={isEmpty(filterType) || isFetchingAttributeValues}
              onChange={(e) => handleFilterTermChange(e.target.value, false)}
            />
          )}

          {/target_id|initiator_id/.test(filterType) && (
            <button
              className="btn btn-primary btn-xs"
              onClick={(e) => {
                e.preventDefault()
                addNewFilter()
              }}
            >
              Add
            </button>
          )}
        </div>
      </span>

      <span className="tool">
        <label>Time range:</label>
        <div className="date-picker">
          <Datetime
            value={filterStartTime}
            inputProps={{ placeholder: "Select start time" }}
            isValidDate={isValidDate}
            timeFormat="HH:mm"
            utc
            onChange={(e) => handleStartTimeChange(e)}
          />
        </div>
        <span className="toolbar-input-divider">&ndash;</span>
        <div className="date-picker">
          <Datetime
            value={filterEndTime}
            inputProps={{ placeholder: "Select end time" }}
            timeFormat="HH:mm"
            utc
            isValidDate={isValidDate}
            onChange={(e) => handleEndTimeChange(e)}
          />
        </div>
      </span>
    </div>

    {activeFilters?.length > 0 && (
      <div className="toolbar-secondary wrapable audit">
        <div>
          {activeFilters.map((filter) => (
            <div
              className="active-filter"
              key={filter[0]}
              onClick={(e) => {
                handleRemoveFilter(filter[0])
              }}
            >
              {ATTRIBUTES.find((att) => att.key == filter[0]).name} = {filter[1]}
              <i className="fa fa-times-circle"></i>
            </div>
          ))}
        </div>
        <div>
          <a
            className="clear-all"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleClearFilters()
            }}
          >
            <i className="fa fa-times-circle"></i>Clear filters
          </a>
        </div>
      </div>
    )}

    {/* No events found */}
    <div className="loading-container">
      <table className="table">
        <thead>
          <tr>
            <th className="icon-cell"></th>
            <th>Time</th>
            <th>Observer Type</th>
            <th>Action</th>
            <th>Target Type</th>
            <th>Initiator Name</th>
          </tr>
        </thead>
        <tbody>
          {!isFetching && (!events || events.length === 0) && (
            <tr>
              <td colSpan={6} className="text-center">
                No audit events found for the selected filters.
              </td>
            </tr>
          )}
          {events &&
            events.map((event, i) => (
              <React.Fragment key={i}>
                <EventItem event={event} />
                {event.detailsVisible && <EventItemDetail event={event} />}
              </React.Fragment>
            ))}
        </tbody>
      </table>
      {isFetching && (
        <div className="loading-overlay">
          <div className="spinner-container">
            <span className="spinner" />
            Loading...
          </div>
        </div>
      )}
    </div>
    <Pagination offset={offset} limit={limit} total={total} />
  </div>
)

export default EventList
