/* eslint no-console:0 */

import React from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { FlashMessages } from "./flashes"
import { createStore, combineReducers, applyMiddleware } from "redux"
import ReduxThunk from "redux-thunk"
import { composeWithDevTools } from "redux-devtools-extension"
import { setPolicy } from "./policy"
import { configureAjaxHelper } from "./ajax_helper"

const isIterable = (obj) => {
  // checks for null and undefined
  if (obj == null) {
    return false
  }
  return typeof obj[Symbol.iterator] === "function"
}

const getDataset = (element) => {
  const set = {}
  if (!(element && element.attributes)) return set
  for (let a of element.attributes) {
    if (a.name.indexOf("data-") == 0) set[a.name] = a.value
  }
  return set
}

const setAttributes = (element, attributes) => {
  for (let key of attributes) element.setAttribute(key, attributes[key])
}

class Widget {
  constructor(reactContainers, config) {
    // reactContainers should always be an array (support global widgets)
    this.reactContainers = isIterable(reactContainers) ? reactContainers : [reactContainers]
    this.config = config
    this.createStore = this.createStore.bind(this)
    this.render = this.render.bind(this)
    this.configureAjaxHelper = this.configureAjaxHelper.bind(this)
    this.setPolicy = this.setPolicy.bind(this)
  }

  createStore(reducers) {
    const devOptions = this.config.devOptions || {}
    const composeEnhancers = composeWithDevTools(devOptions)

    this.store = createStore(
      combineReducers(reducers),
      /* preloadedState, */ composeEnhancers(
        applyMiddleware(ReduxThunk)
        // other store enhancers if any
      )
    )
  }

  configureAjaxHelper(options) {
    options = options || {}
    const ajaxHelperOptions = Object.assign({}, this.config.ajaxHelper, options)

    configureAjaxHelper(ajaxHelperOptions)
  }

  setPolicy(policy) {
    policy = policy || this.config.policy
    setPolicy(policy)
  }

  render(container, props = {}) {
    // const Container = React.createElement(container, this.config.params)
    for (let reactContainer of this.reactContainers) {
      let dataset = getDataset(reactContainer)
      let wrappedComponent = React.createElement(container, Object.assign({}, dataset, this.config.params, props))

      if (!reactContainer) continue
      if (this.store) {
        createRoot(reactContainer).render(
          <Provider store={this.store}>
            <>
              {this.config.params.flashescontainer !== "custom" && <FlashMessages />}
              {wrappedComponent}
            </>
          </Provider>
        )
      } else {
        createRoot(reactContainer).render(
          <>
            {this.config.params.flashescontainer !== "custom" && <FlashMessages />}
            {wrappedComponent}
          </>
        )
      }
    }
  }
}

export const getWidgetName = (options = {}) => {
  if (!options || !options.pluginName || !options.widgetName) return null
  return `${options.pluginName}_${options.widgetName}_widget`
  // const name_regex = /.*plugins\/([^\/]+)\/app\/javascript\/widgets\/([^\.]+)/
  // const name_tokens = dirname.match(name_regex)
  // if (name_tokens.length < 2) return null
  // return `${name_tokens[1]}_${name_tokens[2]}`
}

const getCurrentScript = (widgetName) => {
  if (widgetName) {
    let script = document.querySelector(`script[src*="/${widgetName}"]`)
    if (script) return script
  }
  let scripts = document.getElementsByTagName("script")
  return scripts[scripts.length - 1]
}

export const createConfig = (widgetName, params) => {
  // get current url without params and bind it to baseURL
  let origin = window.location.origin
  if (!origin) {
    const originMatch = window.location.href.match(/(http(s)?:\/\/[^\/]+).*/)
    if (originMatch) origin = originMatch[1]
  }

  return {
    params,
    scriptParams: params,
    devOptions: { name: widgetName },
    ajaxHelper: {
      baseURL: `${origin}${window.location.pathname}`,
      headers: {},
    },
    policy: window.policy,
  }
}

export const createWidget = (dirname, options = {}) => {
  if (!dirname) dirname = { pluginName: null, widgetName: null }
  const widgetName = getWidgetName(dirname)
  //console.log(widgetName)
  let reactContainers = options.containers
  let params = options.params || {}

  if (!reactContainers) {
    let scriptTagContainer = getContainerFromCurrentScript(widgetName)
    //console.log(scriptTagContainer)
    reactContainers = [scriptTagContainer.reactContainer]
    params = scriptTagContainer.scriptParams
  }

  let htmlOptions = options.html || {}
  let defaultHtmlOptions = { class: "react-widget-content", style: "height: 100%;" }
  htmlOptions = Object.assign({}, defaultHtmlOptions, htmlOptions)
  for (let attr in htmlOptions) {
    for (let reactContainer of reactContainers) {
      if (reactContainer) reactContainer.setAttribute(attr, htmlOptions[attr])
    }
  }

  const loadWidget = () => new Widget(reactContainers, createConfig(widgetName, params))

  if (document.readyState === "complete") return Promise.resolve(loadWidget())

  // document is not loaded yet -> create a new Promise and resolve it as soon
  // as document is loaded.
  return new Promise((resolve, reject) => {
    document.onreadystatechange = () => {
      if (document.readyState === "complete") resolve(loadWidget())
    }

    document.addEventListener("DOMContentLoaded", () => resolve(loadWidget()))
  })
}

export const getContainerFromCurrentScript = (widgetName) => {
  const currentScript = getCurrentScript(widgetName)
  // get data attributes that are given from the javascript import tag
  const scriptParams = JSON.parse(JSON.stringify(currentScript.dataset))
  const reactContainer = window.document.createElement("div")
  currentScript.parentNode.replaceChild(reactContainer, currentScript)
  return {
    reactContainer,
    scriptParams,
  }
}

export const widgetBasePath = (widgetPathName) => {
  const regex = new RegExp(`^(.*/${widgetPathName}).*$`)
  const baseNameMatch = window.location.pathname.match(regex)
  if (baseNameMatch) return baseNameMatch[1]
  let baseNamePath = ""
  if (window.scopedDomainFid) baseNamePath += "/" + window.scopedDomainFid
  if (window.scopedProjectFid) baseNamePath += "/" + window.scopedProjectFid
  return baseNamePath
}
