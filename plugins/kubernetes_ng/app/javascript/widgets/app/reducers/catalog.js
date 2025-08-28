const initialState = {
  searchTerm: null,
  catalog: [],
  isFetching: false,
  error: null,
  show: false,
  loaded: false,
}

function reducer(state = initialState, action) {
  switch (action.type) {
    case "@catalog/search":
      return { ...state, searchTerm: action.value }
    case "@catalog/show":
      return { ...state, show: action.value }
    case "@catalog/request":
      return { ...state, isFetching: true, error: null }
    case "@catalog/receive":
      return {
        ...state,
        isFetching: false,
        catalog: action.catalog,
        loaded: true,
      }
    case "@catalog/error":
      return { ...state, isFetching: false, error: action.error }
    default:
      return state
  }
}

export default reducer
