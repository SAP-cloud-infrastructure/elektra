/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Custom Confirmation Dialog
$(function () {
  $.rails.allowAction = function (link) {
    // return if link has been already confirmed
    if (!link.attr("data-confirm")) {
      return true
    }
    // open custom confirmation dialog
    $.rails.showConfirmDialog(link)
    // hold on
    return false
  }

  // action has been confirmed
  $.rails.confirmed = function (link) {
    // remove confirm attribute
    link.removeAttr("data-confirm")
    // fire confirm:complete event
    $.rails.fire(link, "confirm:complete", true)
    // fire click event
    return link.trigger("click.rails")
  }

  // custom confirmation dialog
  return ($.rails.showConfirmDialog = function (link) {
    // do not show a new dialog if an existing dialog for this link is already presented
    if (link.attr("data-confirming")) {
      return false
    }
    // mark link as confirming -> means the dialog is active
    link.attr("data-confirming", "true")
    const confirmTerm = link.attr("data-confirm-term")

    let message = $("<div>").text(link.attr("data-confirm")).html()
    if (link.attr("data-icon") !== "false") {
      message = `<i class="confirm-icon fa fa-fw fa-exclamation-triangle"></i>${message}`
    }

    const html = `\
<div class="modal fade" style="padding-top:15%; overflow-y:visible;">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <a class="close" data-dismiss="modal">×</a>
        <h4>${message}</h4>
      </div>

      <div class="modal-footer">
        <a data-dismiss="modal" class="btn">${
          link.data("cancel") || "Cancel"
        }</a>
        <button data-dismiss="modal" class="btn btn-primary confirm">${
          link.data("ok") || "Ok"
        }</button>
      </div>
    </div>
  </div>
</div>\
`
    const $html = $(html)
    const $confirmButton = $html.find("button.confirm")
    $confirmButton.click(() => $.rails.confirmed(link))

    if (confirmTerm) {
      const label =
        $("<div>").text(link.attr("data-confirm-term-label")).html() ||
        `Please confirm "${confirmTerm}"`
      const $modalBody = $('<div class="modal-body"></div>')
      const $confirmSection = $(
        `<div class="confirm-term form-group string required"><label class="string required">${label} </label></div>`
      ).appendTo($modalBody)
      const $confirmField = $('<input type="text"/>').appendTo($confirmSection)

      $confirmButton.attr("disabled", true)

      $confirmField.keyup(function (e) {
        if (this.value === confirmTerm) {
          return $confirmButton.attr("disabled", false)
        } else {
          return $confirmButton.attr("disabled", true)
        }
      })

      $html.find(".modal-header").after($modalBody)
    }

    // dialog is beeing closed
    $html.on("hidden.bs.modal", function (e) {
      // remove confirming mark
      link.removeAttr("data-confirming")

      // https://github.com/twbs/bootstrap/issues/15260
      // Closing the confirm dialog when the main modal view still open removes the class "modal-open" from body which prevents the modal view to be scrolled again
      // check if the main modal view still open
      if ($("#mainModal.modal.in").length > 0) {
        // set back the class "modal-open" back to the body so the main modal view can still be used
        return $("body").addClass("modal-open")
      }
    })

    return $html.modal()
  })
})

$(() =>
  // handle confirm:complete events on links
  $("*[data-confirm]").on("confirm:complete", function (e, response) {
    try {
      if (response) {
        const link = e.currentTarget
        const confirmed_callback = __guard__(
          link != null ? link.getAttribute("data-confirmed") : undefined,
          (x) => x.replace("this", "link")
        )
        // execute confirmed callback if defined (<a data-confirmed="alert('confirmed')"/>)
        if (confirmed_callback) {
          eval(confirmed_callback)
        }
      }
    } catch (error) {
      console.info(error)
    }

    return response
  })
)

var InfoDialog = (function () {
  let loading = undefined
  let $ajaxLoader = undefined
  let html = undefined
  let $dialog = undefined
  InfoDialog = class InfoDialog {
    static initClass() {
      loading = `\
<div class="modal " data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <div class="modal-body"><div class="loading-spinner"></div><div class="loading-text">Loading...</div></div>
    </div>
  </div>
</div>\
`
      $ajaxLoader = $(loading)

      // Creating modal dialog's DOM
      html = `\
<div class="modal fade" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">
  <div class="modal-dialog modal-m">
    <div class="modal-content">
      <div class="modal-header"><h3 style="margin:0;"></h3></div>
      <div class="modal-body">

      </div>
      <div class="modal-footer">
        <button class="btn btn-default" type="button" data-dismiss="modal", aria-label="Close">Close</button>
      </div>
    </div>
  </div>
</div>\
`
      $dialog = $(html)
    }

    // class method show
    static show(title, message, options) {
      // Assigning defaults
      if (!options) {
        options = {}
      }
      if (!message) {
        message = "Loading"
      }

      const settings = $.extend(
        {
          dialogSize: "m",
          progressType: "",
          onHide: null, // This callback runs after the dialog was hidden
        },
        options
      )

      // Configuring dialog
      $dialog
        .find(".modal-dialog")
        .attr("class", "modal-dialog")
        .addClass(`modal-${settings.dialogSize}`)
      $dialog.find(".progress-bar").attr("class", "progress-bar")
      if (settings.progressType) {
        $dialog
          .find(".progress-bar")
          .addClass(`progress-bar-${settings.progressType}`)
      }
      $dialog.find("h3").text(title)

      if ($(message).find(".modal-body").length > 0) {
        $dialog.find(".modal-body").html($(message).find(".modal-body").html())
      } else {
        $dialog.find(".modal-body").html(message)
      }

      // Adding callbacks
      if (typeof settings.onHide === "function") {
        $dialog
          .off("hidden.bs.modal")
          .on("hidden.bs.modal", (e) => settings.onHide.call($dialog))
      }

      // Opening dialog
      // SPIKE (BS5): see showLoading() — detached $dialog must be in the DOM so BS5 isolates it.
      if (!$dialog[0].isConnected) $dialog.appendTo("body")
      return $dialog.modal()
    }

    // class method
    static showError(message, details = null) {
      let error_wrapper = "<div>"
      error_wrapper += `<p>${message}</p>`

      if (details) {
        error_wrapper +=
          '<p><a href="#", data-toggle="show-error-details">Show error details <i class="fa fa-caret-down"></i></a></p>'
        error_wrapper += `<div class="scrollable-text error-details-area hide">${details}</div>`
      }

      error_wrapper += "</div>"

      InfoDialog.show("Application Error", error_wrapper, { dialogSize: "lg" })
      if (details) {
        return setTimeout(init_error_details, 500)
      }
    }

    // class method
    static showNotice(message) {
      return InfoDialog.show("Notice", message)
    }

    // class method
    static showInfo(message) {
      return InfoDialog.show("Info", message)
    }

    // class method
    static hide() {
      return $dialog.modal("hide")
    }

    static showLoading() {
      // SPIKE (BS5): The loading spinner must NOT be a real BS5 modal. Under BS5, driving $ajaxLoader
      // through .modal("show")/.modal("hide") mutates the SINGLE global body state (body.modal-open +
      // the shared .modal-backdrop) and tears it down ASYNCHRONOUSLY. That async teardown races the
      // synchronous open of the real content modal (modal.js:178) and strips its backdrop/modal-open
      // right after it opens → "opens then immediately closes". Decouple the spinner entirely: show
      // it as a plain overlay (no BS5 Modal instance), so it never touches the content modal's state.
      if (!$ajaxLoader[0].isConnected) {
        $ajaxLoader
          .css({ display: "block", "z-index": 2000 })
          .addClass("show")
          .appendTo("body")
        $('<div class="modal-backdrop show bs3-loading-backdrop"></div>').appendTo("body")
        $("body").addClass("modal-open")
      }
      return $ajaxLoader
    }
    static hideLoading() {
      // Plain-overlay teardown (synchronous): remove the spinner + its own backdrop, and only clear
      // the global modal-open flag if no real modal is still open. See showLoading() for the why.
      $ajaxLoader.detach()
      $(".bs3-loading-backdrop").remove()
      if ($("#modal-holder .modal.show").length === 0) {
        $("body").removeClass("modal-open").css("padding-right", "")
      }
      return $ajaxLoader
    }
  }
  InfoDialog.initClass()
  return InfoDialog
})()

window.InfoDialog = InfoDialog
function __guard__(value, transform) {
  return typeof value !== "undefined" && value !== null
    ? transform(value)
    : undefined
}
