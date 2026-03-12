import moment from "moment"
import * as constants from "../constants"
import { ajaxHelper } from "lib/ajax_helper"
import { confirm } from "lib/dialogs"
import { addNotice, addError } from "lib/flashes"
import { isEmpty } from "lib/tools/helpers"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import React from "react"

const buildTimeFilter = (filterStartTime, filterEndTime) => {
  let timeFilter = ""
  // get offset for local timezone
  const localOffset = moment().utcOffset()

  if (
    filterStartTime != null &&
    (moment.isMoment(filterStartTime) || !isEmpty(filterStartTime))
  )
    // subtract offset from start time to correspond to displayed time
    timeFilter += `gte:${moment(filterStartTime)
      .utc()
      .subtract(localOffset, "minutes")
      .format("YYYY-MM-DD[T]HH:mm:ss")}`

  if (
    filterEndTime != null &&
    (moment.isMoment(filterEndTime) || !isEmpty(filterEndTime))
  )
    timeFilter += `${timeFilter.length > 0 ? "," : ""}lte:${moment(
      filterEndTime
    )
      .utc()
      .subtract(localOffset, "minutes")
      .format("YYYY-MM-DD[T]HH:mm:ss")}`

  return timeFilter
}

//#################### EVENTS #########################

const requestEvents = () => ({ type: constants.REQUEST_EVENTS })

const requestEventsFailure = (error) => ({
  type: constants.REQUEST_EVENTS_FAILURE,
  error,
})

const receiveEvents = (json, total) => ({
  type: constants.RECEIVE_EVENTS,
  events: json,
  total,
})

const loadEvents = () => (dispatch, getState) => {
  const currentState = getState()
  const events = currentState.events
  const limit = events.limit
  const offset = events.offset || 0
  const isFetching = events.isFetching
  const filterType = events.filterType
  const filterTerm = events.filterTerm
  const activeFilters = events.activeFilters
  const filterStartTime = events.filterStartTime
  const filterEndTime = events.filterEndTime
  const searchTerm = events.searchTerm

  // don't fetch if we're already fetching
  if (isFetching) return
  dispatch(requestEvents())
  let params = {
    limit,
    offset,
    search: searchTerm || "",
    time: buildTimeFilter(filterStartTime, filterEndTime) || "",
  }
  // add all filters
  activeFilters.forEach((filter) => (params[filter[0]] = filter[1]))

  return ajaxHelper
    .get("/events", { params: params })
    .then((response) => {
      if (response.data.errors) {
        addError(
          React.createElement(ErrorsList, { errors: response.data.errors })
        )
      } else {
        dispatch(receiveEvents(response.data.events, response.data.total))
      }
    })
    .catch((error) => {
      dispatch(requestEventsFailure(error.message))
      addError(`Could not load events (${error.message})`)
    })
}
export const fetchEvents = (offset) =>
  function (dispatch, getState) {
    const currentState = getState()
    const events = currentState.events
    const limit = events.limit
    const currentPageCalc = offset > 0 ? offset / limit + 1 : 1

    dispatch(updateOffset(offset))
    dispatch(updateCurrentPage(currentPageCalc))
    dispatch(loadEvents())
  }

const updateOffset = (offset) => ({ type: constants.UPDATE_OFFSET, offset })

const updateCurrentPage = (page) => ({
  type: constants.UPDATE_CURRENT_PAGE,
  page: page,
})

// ----------- SEARCH -------------
const updateSearchTerm = (searchTerm) => ({
  type: constants.UPDATE_SEARCH_TERM,
  searchTerm,
})

export function searchEvents(searchTerm) {
  return (dispatch, getState) => {
    const currentSearchTerm = getState().events.searchTerm
    if (searchTerm === currentSearchTerm) return;
    dispatch(updateSearchTerm(searchTerm))
    dispatch(fetchEvents(0))
  }
  // TODO: Add else case with validation error display for user
}

// ----------- PAGINATE -----------
export function paginate(page) {
  return (dispatch, getState) => {
    const currentState = getState()
    const events = currentState.events
    const limit = events.limit
    const offsetCalc = (page - 1) * limit

    dispatch(updateOffset(offsetCalc))
    dispatch(updateCurrentPage(page))
    dispatch(loadEvents())
  }
}

// ----------- FILTERS -----------
const updateFilterStartTime = (filterStartTime) => ({
  type: constants.UPDATE_FILTER_START_TIME,
  filterStartTime,
})

export function filterEventsStartTime(filterStartTime) {
  return (dispatch) => {
    // trigger api call only if the given start time is a valid date or an empty string
    if (moment.isMoment(filterStartTime) || isEmpty(filterStartTime)) {
      dispatch(updateFilterStartTime(filterStartTime))
      dispatch(fetchEvents(0))
    }
    // TODO: Add else case with validation error display for user
  }
}

const updateFilterEndTime = (filterEndTime) => ({
  type: constants.UPDATE_FILTER_END_TIME,
  filterEndTime,
})

export function filterEventsEndTime(filterEndTime) {
  return (dispatch) => {
    // trigger api call only if the given start time is a valid date or an empty string
    if (moment.isMoment(filterEndTime) || isEmpty(filterEndTime)) {
      dispatch(updateFilterEndTime(filterEndTime))
      dispatch(fetchEvents(0))
    }
    // TODO: Add else case with validation error display for user
  }
}

export function updateFilterType(filterType) {
  return { type: constants.UPDATE_FILTER_TYPE, filterType }
}

export function changeFilterType(filterType) {
  return (dispatch) => {
    dispatch(updateFilterType(filterType))
    // reset filter term on filter type change
    dispatch(changeFilterTerm("", false))
    if (!isEmpty(filterType)) dispatch(fetchAttributeValues(filterType))
    // if filterType empty, loadEvents with empty filter
    // else
  }
}

const updateFilterTerm = (filterTerm) => ({
  type: constants.UPDATE_FILTER_TERM,
  filterTerm,
})

export function changeFilterTerm(filterTerm, withFetch) {
  return (dispatch) => {
    dispatch(updateFilterTerm(filterTerm))
    if (withFetch) {
      dispatch(addNewFilter())
    }
  }
}

const addFilter = () => ({ type: constants.ADD_FILTER })

export function addNewFilter() {
  return (dispatch) => {
    dispatch(addFilter())
    // empty inputs after add
    dispatch(updateFilterType(""))
    dispatch(updateFilterTerm(""))
    dispatch(fetchEvents(0))
  }
}

const deleteFilter = (filterType) => ({
  type: constants.DELETE_FILTER,
  filterType,
})

export function removeFilter(filterType) {
  return (dispatch) => {
    dispatch(deleteFilter(filterType))
    dispatch(fetchEvents(0))
  }
}

const clearAllFilters = () => ({ type: constants.CLEAR_ALL_FILTERS })

export const clearFilters = () => (dispatch) => {
  dispatch(updateFilterType(""))
  dispatch(updateFilterTerm(""))
  dispatch(clearAllFilters())
  dispatch(updateFilterStartTime(""))
  dispatch(updateFilterEndTime(""))
  dispatch(fetchEvents(0))
}

// ----------- ATTRIBUTE VALUES -----------

const requestAttributeValues = () => ({
  type: constants.REQUEST_ATTRIBUTE_VALUES,
})

const requestAttributeValuesFailure = (error) => ({
  type: constants.REQUEST_ATTRIBUTE_VALUES_FAILURE,
  error,
})

const requestAttributeValuesNotFound = (attribute) => ({
  type: constants.REQUEST_ATTRIBUTE_VALUES_NOT_FOUND,
  attribute,
})

const receiveAttributeValues = (attribute, json) => ({
  type: constants.RECEIVE_ATTRIBUTE_VALUES,
  values: json,
  attribute,
})

const fetchAttributeValues = (attribute) => (dispatch) =>
  dispatch(loadAttributeValues(attribute))

const loadAttributeValues = (attribute) => (dispatch, getState) => {
  const currentState = getState()
  const events = currentState.events
  const attributeValues = events.attributeValues

  // don't fetch if we already have the values
  if (attributeValues[attribute]) return
  dispatch(requestAttributeValues())

  return ajaxHelper
    .get(`/attributes/${attribute}`)
    .then((response) => {
      if (response.data.errors) {
        addError(
          React.createElement(ErrorsList, { errors: response.data.errors })
        )
      } else {
        dispatch(receiveAttributeValues(attribute, response.data))
      }
    })
    .catch((error) => {
      dispatch(requestAttributeValuesFailure(error.message))
      addError(`Could not load attributes (${error.message})`)
    })

  // constants.ajaxHelper.get "/attributes/#{attribute}",
  //   data: {}
  //   success: (data, textStatus, jqXHR) ->
  //     dispatch(receiveAttributeValues(attribute, data))
  //   error: ( jqXHR, textStatus, errorThrown) ->
  //     if jqXHR.status == 404
  //       dispatch(requestAttributeValuesNotFound(attribute))
  //     else
  //       dispatch(requestAttributeValuesFailure(jqXHR.responseText))
}

// ----------- EVENT DETAILS -----------

export const toggleEventDetails = (event) => (dispatch) => {
  dispatch(toggleEventDetailsVisible(event))
  // fetch details if we don't have them yet
  if (!event.details) {
    dispatch(loadEventDetails(event))
  }
}

const toggleEventDetailsVisible = (event) => ({
  type: constants.TOGGLE_EVENT_DETAILS_VISIBLE,
  eventId: event.id,
  detailsVisible: !event.detailsVisible,
})

const loadEventDetails = (event) => (dispatch, getState) => {
  // don't fetch if we're already fetching
  if (event.isFetchingDetails) return
  dispatch(requestEventDetails(event))

  return ajaxHelper
    .get(`/events/${event.id}`)
    .then((response) => {
      if (response.data.errors) {
        addError(
          React.createElement(ErrorsList, { errors: response.data.errors })
        )
      } else {
        dispatch(receiveEventDetails(event, response.data))
      }
    })
    .catch((error) => {
      dispatch(requestEventDetailsFailure(event, error.message))
      addError(`Could not load event details (${error.message})`)
    })
}

const requestEventDetails = (event) => ({
  type: constants.REQUEST_EVENT_DETAILS,
  eventId: event.id,
})

const requestEventDetailsFailure = (event, error) => ({
  type: constants.REQUEST_EVENT_DETAILS_FAILURE,
  error: error,
  eventId: event.id,
})

const receiveEventDetails = (event, json) => ({
  type: constants.RECEIVE_EVENT_DETAILS,
  eventDetails: json,
  eventId: event.id,
})
