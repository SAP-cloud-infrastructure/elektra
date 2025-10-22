/* eslint-disable no-undef */
import React from "react"
import { createStore, applyMiddleware, compose } from "redux"
import { Provider } from "react-redux"
import ReduxThunk from "redux-thunk"
import AppReducers from "./reducers/index"
import ReactAjaxHelper from "./lib/ajax_helper"
import App from "./components/app"
import { setAjaxHelper, setBackendAjaxClient } from "./actions/ajax_helper"
import { createWidget } from "lib/widget"

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(AppReducers, composeEnhancers(applyMiddleware(ReduxThunk)))

const AppProvider = ({ permissions, authToken, kubernikusBaseUrl }) => {
  setAjaxHelper(new ReactAjaxHelper(kubernikusBaseUrl, { authToken }))
  setBackendAjaxClient(
    new ReactAjaxHelper(
      `${window.location.origin}/${window.scopedDomainFid}/${window.scopedProjectFid}`
    )
  )

  return (
    <Provider store={store}>
      <App permissions={permissions} kubernikusBaseUrl={kubernikusBaseUrl} />
    </Provider>
  )
}

createWidget()
  .then(async (widget) => {
    // get the token from the function passed in the script params
    const getTokenFunc = globalThis[widget.config.params.getTokenFunc]
    // wait for the promise to resolve
    const token = await getTokenFunc()

    // set the token in the widget config
    widget.config.params.authToken = token.authToken
    // cleanup, remove getTokenFunc from params
    delete widget.config.params.getTokenFunc

    widget.setPolicy()
    widget.render(AppProvider)
  })
  .catch((e) => console.error(e))
