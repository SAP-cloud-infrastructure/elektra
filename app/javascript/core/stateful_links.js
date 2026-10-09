/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { hideModal } from "./bootstrap_engine"
// store current location
const current_location = window.location
// store host
const hostUrl = `${window.location.protocol}//${window.location.host}`
// store path
const current_path = window.location.pathname
const supportHistory = window.history.pushState && true

// This method returns a parameter value for a given parameter name.
const getParameterByName = function (url, name) {
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`)
  const results = regex.exec(url)

  if (results === null) {
    return ""
  } else {
    return decodeURIComponent(results[1].replace(/\+/g, " "))
  }
}

// This method checks if overlay parameter is presented and if so it tries to open the overlay.
const handleUrl = function (url) {
  // check if overlay parameter is presented
  let hidden = true

  if (url.indexOf("?overlay=") > -1 || url.indexOf("&overlay=") > -1) {
    const overlay = getParameterByName(url, "overlay")
    // build the href. If overlay value doesn't start with a "/" then
    // it is a relative url and should be extended with the current path.
    // e.g. new -> /current_path/new
    let href = overlay[0] === "/" ? overlay : `${current_path}/${overlay}`
    // replace // with /
    href = href.replace(/\/\//g, "/")
    // look fo the anker with this href

    MoModal.load(href)
    hidden = false
  }

  if (hidden) {
    return hideModal("#modal-holder .modal")
  }
}

// add overlay parameters to the current url
const buildNewStateUrl = function (href) {
  if (!href) {
    href = ""
  }
  // it is an absolute url if it contains the current path
  const isAbsolutePath = href.indexOf(current_path) === -1
  // build href which will be shown in window address bar.
  // Idea:
  //  Case 1:
  //    base url: http://localhost:3000/sap_default/d064310_sandbox/instances
  //    link url: /sap_default/d064310_sandbox/instances/new
  //    -> overlay url (href): http://localhost:3000/sap_default/d064310_sandbox/instances/?overlay=new
  //  Case 2:
  //    base url: http://localhost:3000/sap_default/d064310_sandbox/instances/23/show
  //    link url: /sap_default/d064310_sandbox/instances/new
  //    -> overlay url (href): http://localhost:3000/sap_default/d064310_sandbox/instances/23/show?overlay=/sap_default/d064310_sandbox/instances/new

  href = href.replace(hostUrl, "").replace(current_path, "").replace(/^\/+/, "").trim()
  if (isAbsolutePath) {
    href = `/${href}`
  }
  href = encodeURIComponent(href)

  if (!supportHistory) {
    return `?overlay=${href}`
  } else {
    let current_url = current_location.href
    if (current_url.indexOf("?") >= 0) {
      const overlayPos = current_url.indexOf("&overlay")
      if (overlayPos > -1) {
        current_url = current_url.substr(0, overlayPos)
      }
      if (current_url && current_url[current_url.length - 1] === "#") {
        current_url = current_url.slice(0, -1)
      }

      return `${current_url}&overlay=` + href
    } else {
      return `${current_url}?overlay=` + href
    }
  }
}

// remove overlay parameters from the current url
const restoreOriginStateUrl = function () {
  if (!supportHistory) {
    return current_path
  } else {
    let current_url = current_location.href
    let overlayPos = current_url.indexOf("?overlay")
    if (overlayPos === -1) {
      overlayPos = current_url.indexOf("&overlay")
    }
    if (overlayPos > -1) {
      current_url = current_url.substr(0, overlayPos)
    }

    return current_url
  }
}

window.restoreOriginStateUrl = function () {
  if (supportHistory) {
    return window.history.pushState(null, null, restoreOriginStateUrl())
  }
}

// initialize modal links to change the window.location url
$(document).on("click", "a[data-modal=true]", function () {
  if (supportHistory) {
    return window.history.replaceState(null, null, buildNewStateUrl(this.href))
  }
})

$(document).ready(function () {
  // try to find the overlay parameter in the url and handle it if found.
  if (supportHistory) {
    handleUrl(current_location.href)
  }

  // reset history (url in address bar) after an overlay has been closed.
  return $("#modal-holder").on("hidden.bs.modal", ".modal", function () {
    if (supportHistory) {
      return window.history.replaceState(null, null, restoreOriginStateUrl())
    }
  })
})
