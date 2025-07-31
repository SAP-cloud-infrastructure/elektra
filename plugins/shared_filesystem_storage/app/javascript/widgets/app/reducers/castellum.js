import * as constants from "../constants"

const initialStateForPath = {
  data: null,
  errorMessage: null,
  isFetching: false,
  requestedAt: null,
  allShares: true,
  receivedAt: null,
}

const initialCastellumState = {
  "assets/nfs-shares": initialStateForPath,
  resources: initialStateForPath ,
  "resources/nfs-shares/operations/pending": initialStateForPath,
  "resources/nfs-shares/operations/recently-succeeded": initialStateForPath,
  "resources/nfs-shares/operations/recently-failed": initialStateForPath,
}

const requestData = (state, { key, requestedAt }) => ({
  ...state,
  [key]: {
    ...initialStateForPath,
    isFetching: true,
    requestedAt,
  },
})

const requestDataFailure = (state, { key, message, receivedAt }) => ({
  ...state,
  [key]: {
    ...state[key],
    data: null,
    errorMessage: message,
    isFetching: false,
    receivedAt
  },
})

const receiveData = (state, { key, data, allShares, receivedAt }) => ({
  ...state,
  [key]: {
    ...state[key],
    data,
    errorMessage: null,
    isFetching: false,
    allShares,
    receivedAt,
  },
})

export const castellum = (state, action) => {
  if (state == null) {
    state = initialCastellumState
  }

  switch (action.type) {
    case constants.REQUEST_CASTELLUM_DATA:
      return requestData(state, action)
    case constants.RECEIVE_CASTELLUM_DATA:
      return receiveData(state, action)
    case constants.REQUEST_CASTELLUM_DATA_FAILURE:
      return requestDataFailure(state, action)
    default:
      return state
  }
}
