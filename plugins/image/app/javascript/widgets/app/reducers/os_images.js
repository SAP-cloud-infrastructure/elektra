import { imageConstants } from "../constants"

//########################## IMAGES ##############################
const initialState = {
  items: [],
  receivedAt: null,
  updatedAt: null,
  isFetching: false,
  hasNext: { public: true, private: true, shared: true },
  markers: { public: null, private: null, shared: null },
  searchTerm: null,
  visibilityCounts: { public: 0, private: 0, shared: 0 },
  activeVisibilityFilter: "public",
}

const setActiveVisibilityFilter = (state, { visibility }) => ({
  ...state,
  activeVisibilityFilter: visibility,
})

const requestOsImages = (state, { requestedAt }) => ({
  ...state,
  isFetching: true,
  requestedAt,
})

const requestOsImagesFailure = (state) => ({
  ...state,
  isFetching: false,
})

const receiveOsImages = (state, { osImages, hasNext, receivedAt }) => {
  let newItems = (state.items.slice() || []).concat(osImages)
  let items = {}
  let visibilityCounts = Object.keys(state.visibilityCounts).reduce((map, key) => {
    map[key] = 0
    return map
  }, {})

  for (let i = 0; i < newItems.length; i++) {
    let osImage = newItems[i]
    items[osImage.id] = osImage
    visibilityCounts[osImage.visibility] = (visibilityCounts[osImage.visibility] || 0) + 1
  }

  const hasNextByVisibility = { ...state.hasNext }
  hasNextByVisibility[state.activeVisibilityFilter] = hasNext

  items = Object.values(items)
  let markers = { ...state.markers }
  const item = items.findLast((item) => {
    item.visibility === state.activeVisibilityFilter
  })
  markers[state.activeVisibilityFilter] = item ? item.id : null

  return {
    ...state,
    isFetching: false,
    items: Object.values(items),
    hasNext: hasNextByVisibility,
    markers,
    availableVisibilityFilters: Object.keys(visibilityCounts),
    visibilityCounts,
    receivedAt,
  }
}

const requestOsImage = function (state, { osImageId, requestedAt }) {
  const index = state.items.findIndex((item) => item.id == osImageId)
  if (index < 0) {
    return state
  }

  const newState = { ...state }
  newState.items[index].isFetching = true
  newState.items[index].requestedAt = requestedAt
  return newState
}

const requestOsImageFailure = function (state, { osImageId }) {
  const index = state.items.findIndex((item) => item.id == osImageId)
  if (index < 0) {
    return state
  }

  const newState = { ...state }
  newState.items[index].isFetching = false
  return newState
}

const receiveOsImage = function (state, { osImage }) {
  const index = state.items.findIndex((item) => item.id == osImage.id)
  const items = state.items.slice()
  const visibilityCounts = { ...state.visibilityCounts }
  const markers = { ...state.markers }
  // update or add
  if (index >= 0) {
    items[index] = osImage
  } else {
    items.unshift(osImage)
    visibilityCounts[osImage.visibility] = (visibilityCounts[osImage.visibility] || 0) + 1
    markers[state.activeVisibilityFilter] = osImage?.id
  }
  return { ...state, items, visibilityCounts }
}

const requestDeleteOsImage = function (state, { osImageId }) {
  const index = state.items.findIndex((item) => item.id == osImageId)
  if (index < 0) {
    return state
  }

  const items = state.items.slice()
  items[index].isDeleting = true
  return { ...state, items }
}

const deleteOsImageFailure = function (state, { osImageId }) {
  const index = state.items.findIndex((item) => item.id == osImageId)
  if (index < 0) {
    return state
  }

  const items = state.items.slice()
  items[index].isDeleting = false
  return { ...state, items }
}

const deleteOsImageSuccess = function (state, { osImageId }) {
  const index = state.items.findIndex((item) => item.id == osImageId)
  if (index < 0) {
    return state
  }
  const items = state.items.slice()
  const visibilityCounts = { ...state.visibilityCounts }

  items.splice(index, 1)
  if (items[index]) {
    visibilityCounts[items[index].visibility] -= 1
  }
  return { ...state, items, visibilityCounts }
}

const setSearchTerm = (state, { searchTerm }) => {
  return { ...state, searchTerm }
}

// osImages reducer
export const osImages = (type) =>
  function (state, action) {
    const constants = imageConstants(type)
    if (state == null) {
      state = initialState
    }
    switch (action.type) {
      case constants.SET_SEARCH_TERM:
        return setSearchTerm(state, action)
      case constants.RECEIVE_IMAGES:
        return receiveOsImages(state, action)
      case constants.REQUEST_IMAGES:
        return requestOsImages(state, action)
      case constants.REQUEST_IMAGES_FAILURE:
        return requestOsImagesFailure(state, action)
      case constants.REQUEST_IMAGE:
        return requestOsImage(state, action)
      case constants.REQUEST_IMAGE_FAILURE:
        return requestOsImageFailure(state, action)
      case constants.RECEIVE_IMAGE:
        return receiveOsImage(state, action)
      case constants.REQUEST_DELETE_IMAGE:
        return requestDeleteOsImage(state, action)
      case constants.DELETE_IMAGE_FAILURE:
        return deleteOsImageFailure(state, action)
      case constants.DELETE_IMAGE_SUCCESS:
        return deleteOsImageSuccess(state, action)
      case constants.SET_ACTIVE_VISIBILITY:
        return setActiveVisibilityFilter(state, action)

      default:
        return state
    }
  }
