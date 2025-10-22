import { ModalDialog } from "./dialog"
import { createRoot } from "react-dom/client"
import Deferred from "lib/tools/deferred"
import React from "react"

const showDialog = function (type, message, options) {
  let cleanup
  let component
  let props
  let wrapper

  if (options == null) {
    options = { size: "large" }
  }
  switch (type) {
    case "confirm":
      options["confirmLabel"] = options["confirmLabel"] || "Yes"
      options["abortLabel"] = options["abortLabel"] || "No"
      options["showAbortButton"] = true
      break
    case "info":
      options["confirmLabel"] = options["confirmLabel"] || "OK"
      options["showAbortButton"] = options["showAbortButton"] === true
      break
    case "error":
      options["confirmLabel"] = options["confirmLabel"] || "OK"
      options["showAbortButton"] = options["showAbortButton"] === true
      break
  }

  wrapper = document.body.appendChild(document.createElement("div"))
  // props = Object.assign({ message, type, onHide: cleanup}, options);
  props = Object.assign({ message, type }, options)
  const promise = new Deferred()
  component = React.createElement(ModalDialog, {
    ...props,
    promise: promise,
  })
  createRoot(wrapper).render(component)
  return promise
}

export const confirm = function (message, options) {
  return showDialog("confirm", message, options)
}

export const showInfoModal = function (message, options) {
  return showDialog("info", message, options)
}

export const showErrorModal = function (message, options) {
  return showDialog("error", message, options)
}
