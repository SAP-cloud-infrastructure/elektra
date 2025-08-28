import entries from "./entries"
import catalog from "./catalog"

// we use the react hook useReducer to provide global state
// for that we have to combine all reducers to one global reducer.
const combineReducers =
  (reducers) =>
  (state = {}, action = {}) => {
    console.log(action)
    const newState = { ...state }
    Object.keys(reducers).forEach((name) => {
      newState[name] = reducers[name](state[name], action)
    })
    return newState
  }

const rootReducer = combineReducers({ entries, catalog })
const initialState = rootReducer()

export default rootReducer
export { initialState }
