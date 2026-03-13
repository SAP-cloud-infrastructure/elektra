import { connect } from "react-redux"
import EventList from "../../components/events/list"
import {
  filterEventsStartTime,
  filterEventsEndTime,
  changeFilterType,
  changeFilterTerm,
  addNewFilter,
  removeFilter,
  clearFilters,
  searchEvents,
} from "../../actions/events"

export default connect(
  (state) => ({
    filterStartTime: state.events.filterStartTime,
    filterEndTime: state.events.filterEndTime,
    filterType: state.events.filterType,
    filterTerm: state.events.filterTerm,
    activeFilters: state.events.activeFilters,
    attributeValues: state.events.attributeValues,
    isFetchingAttributeValues: state.events.isFetchingAttributeValues,
    offset: state.events.offset,
    limit: state.events.limit,
    total: state.events.total,
    error: state.events.error,
    isFetching: state.events.isFetching,
  }),
  (dispatch) => ({
    handleStartTimeChange: (filterStartTime) =>
      dispatch(filterEventsStartTime(filterStartTime)),
    handleEndTimeChange: (filterEndTime) =>
      dispatch(filterEventsEndTime(filterEndTime)),
    handleFilterTypeChange: (filterType) =>
      dispatch(changeFilterType(filterType)),
    handleFilterTermChange: (filterTerm, withFetch) =>
      dispatch(changeFilterTerm(filterTerm, withFetch)),
    handleClearFilters: () => dispatch(clearFilters()),
    addNewFilter: () => dispatch(addNewFilter()),
    handleRemoveFilter: (filterType) => dispatch(removeFilter(filterType)),
    handleSearch: (searchTerm) => dispatch(searchEvents(searchTerm || "")),
  })
)(EventList)
