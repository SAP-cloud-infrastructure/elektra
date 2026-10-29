import * as constants from "../constants"

//########################## PORTS ##############################
const initialState = {
  items: [],
  receivedAt: null,
  updatedAt: null,
  isFetching: false,
  hasNext: false,
  currentPage: 0,
  searchTerm: null,
}

const requestPorts = (state, { requestedAt }) => Object.assign({}, state, { isFetching: true, requestedAt })

const requestPortsFailure = function (state, ...rest) {
  const obj = rest[0]
  return Object.assign({}, state, { isFetching: false })
}

const receivePorts = (state, { ports, hasNext, receivedAt }) => {
  let newItems = (state.items.slice() || []).concat(ports)
  var items = newItems.filter((port, pos, arr) => arr.indexOf(port) == pos)

  return Object.assign({}, state, {
    isFetching: false,
    items: items,
    hasNext: hasNext,
    currentPage: state.currentPage + 1,
    receivedAt,
  })
}

const requestPort = function (state, { id, requestedAt }) {
  const index = state.items.findIndex((item) => item.id == id)
  if (index < 0) {
    return state
  }

  const newState = Object.assign(state)
  newState.items[index].isFetching = true
  newState.items[index].requestedAt = requestedAt
  return newState
}

const requestPortFailure = function (state, { id }) {
  const index = state.items.findIndex((item) => item.id == id)
  if (index < 0) {
    return state
  }

  const newState = Object.assign(state)
  newState.items[index].isFetching = false
  return newState
}

const receivePort = function (state, { port }) {
  const index = state.items.findIndex((item) => item.id == port.id)
  const items = state.items.slice()
  // update or add
  if (index >= 0) {
    items[index] = port
  } else {
    // mark freshly created ports so the row can briefly highlight itself
    items.unshift({ ...port, isNew: true })
  }
  return { ...state, items: items }
}

const requestDeletePort = function (state, { id }) {
  const index = state.items.findIndex((item) => item.id == id)
  if (index < 0) {
    return state
  }

  const items = state.items.slice()
  items[index].isDeleting = true
  return Object.assign({}, state, { items })
}

const deletePortFailure = function (state, { id }) {
  const index = state.items.findIndex((item) => item.id == id)
  if (index < 0) {
    return state
  }

  const items = state.items.slice()
  items[index].isDeleting = false
  return Object.assign({}, state, { items })
}

const deletePortSuccess = function (state, { id }) {
  const index = state.items.findIndex((item) => item.id == id)
  if (index < 0) {
    return state
  }
  const items = state.items.slice()
  items.splice(index, 1)
  let currentPage = items.length == 0 ? 0 : state.currentPage
  return Object.assign({}, state, { items, currentPage })
}

const setSearchTerm = (state, { searchTerm }) => Object.assign({}, state, { searchTerm })
export const ports = function (state, action) {
  if (state == null) {
    state = initialState
  }
  switch (action.type) {
    case constants.SET_SEARCH_TERM:
      return setSearchTerm(state, action)
    case constants.RECEIVE_PORTS:
      return receivePorts(state, action)
    case constants.REQUEST_PORTS:
      return requestPorts(state, action)
    case constants.REQUEST_PORTS_FAILURE:
      return requestPortsFailure(state, action)
    case constants.REQUEST_PORT:
      return requestPort(state, action)
    case constants.REQUEST_PORT_FAILURE:
      return requestPortFailure(state, action)
    case constants.RECEIVE_PORT:
      return receivePort(state, action)
    case constants.REQUEST_DELETE_PORT:
      return requestDeletePort(state, action)
    case constants.DELETE_PORT_FAILURE:
      return deletePortFailure(state, action)
    case constants.DELETE_PORT_SUCCESS:
      return deletePortSuccess(state, action)

    default:
      return state
  }
}
