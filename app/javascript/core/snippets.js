/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import Clipboard from "clipboard"

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
  elem.setAttribute("data-toggle", "tooltip")
  elem.setAttribute("data-placement", "bottom")
  elem.setAttribute("data-trigger", "manual")
  elem.setAttribute("title", msg)
  $(elem).tooltip("show")

  // leave tooltip for 1 sec then clean up and hide
  setTimeout(() => {
    $(elem).tooltip("hide")
    elem.setAttribute("title", "")
    return $(elem).blur()
  }, 1000)
}

$(() => $(".snippet").initSnippetCopyToClipboard())
