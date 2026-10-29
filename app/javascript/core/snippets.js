/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import Clipboard from "clipboard"
import { showTooltip as bsShowTooltip, hideTooltip as bsHideTooltip } from "./bootstrap_engine"

$.fn.initSnippetCopyToClipboard = function () {
  return this.each(function () {
    const $element = $(this)

    if ($element.find("button[data-clipboard-snippet]").length > 0) {
      return
    }

    // add copy button
    $element.prepend(
      '<button class="btn btn-secondary btn-icon-only" data-clipboard-snippet><i class="fa fa-clipboard"></i></button>'
    )
    const button = $element.find("[data-clipboard-snippet]")
    // add click event
    button.on("click", (e) => e.preventDefault())

    const clipboardSnippets = new Clipboard("[data-clipboard-snippet]", {
      target(trigger) {
        return $(trigger).siblings("code").get(0)
      },
    })

    clipboardSnippets.on("success", function (e) {
      e.clearSelection()
      showTooltip(e.trigger, "Copied!")
    })

    return clipboardSnippets.on("error", function (e) {
      showTooltip(e.trigger, fallbackMessage(e.action))
    })
  })
}

var showTooltip = function (elem, msg) {
  elem.setAttribute("data-bs-toggle", "tooltip")
  elem.setAttribute("data-bs-placement", "bottom")
  elem.setAttribute("data-bs-trigger", "manual")
  elem.setAttribute("title", msg)
  bsShowTooltip(elem)

  // leave tooltip for 1 sec then clean up and hide
  setTimeout(() => {
    bsHideTooltip(elem)
    elem.setAttribute("title", "")
    return $(elem).blur()
  }, 1000)
}

$(() => $(".snippet").initSnippetCopyToClipboard())
