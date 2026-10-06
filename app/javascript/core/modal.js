/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { isValidUrl } from "../lib/tools/helpers"

var MoModal = (function () {
  let modal_holder_selector = undefined
  let modal_selector = undefined
  let modal_is_loading = undefined
  let loading = undefined
  let showError = undefined
  let triggerUpdateEvent = undefined
  let handleAjaxSuccess = undefined
  MoModal = class MoModal {
    static initClass() {
      modal_holder_selector = "#modal-holder"
      modal_selector = ".modal"
      modal_is_loading = false

      loading = `\
<div class="modal loading-dialog" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <div class="modal-body"><div class="loading-spinner"></div><div class="loading-text">Loading...</div></div>
    </div>
  </div>
</div>\
`

      showError = function (jqXHR, textStatus, errorThrown) {
        // console.log("jqXHR",jqXHR)
        // console.log("textStatus",textStatus)
        // console.log("errorThrown",errorThrown)
        // console.log 'Loading error'
        let details, errorMessage
        InfoDialog.hideLoading()
        // restore url -> remove ?overflow=...
        window.restoreOriginStateUrl()
        // show error dialog
        try {
          errorMessage = jqXHR.statusText + " (" + jqXHR.status + ")"
          details = jqXHR.responseText
        } catch (e) {
          errorMessage = errorThrown
          details = null
        }

        return InfoDialog.showError(errorMessage, details)
      }

      triggerUpdateEvent = function () {
        const $modalHolder = $(modal_holder_selector)
        const target = {
          id: $modalHolder.prop("id"),
          class: $modalHolder.prop("class"),
        }
        // $(document).trigger('modal:contentUpdated',{id: $modalHolder.prop('id'), class: $modalHolder.prop('class')})
        return $(document).trigger({ type: "modal:contentUpdated", target })
      }

      handleAjaxSuccess = function (event, data, status, xhr) {
        const url = xhr.getResponseHeader("Location")
        const response_type = xhr.getResponseHeader("content-type") || ""

        if (url) {
          // url is presented
          // close modal window
          $("#modal-holder").find(".modal").modal("hide")
          // Redirect to url
          window.location = url
        } else if (response_type.indexOf("javascript") > -1) {
          // response is javascript
          // Commeted lines as removes the backdrop when sending ajax calls to change the modal content
          // Remove old modal backdrop
          // $('.modal-backdrop').remove()
        } else {
          // assume response is a html
          // modal has the fade effect
          if ($($(modal_holder_selector).find(modal_selector)).hasClass("fade")) {
            // replace content of old modal
            const $oldModal = $(modal_holder_selector)
            const $newContent = $(data)
            for (var selector of [".modal-body", ".modal-footer"]) {
              $oldModal.find(selector).replaceWith($newContent.find(selector))
            }
          } else {
            // Remove old modal backdrop
            $(".modal-backdrop").remove()
            // Replace old modal with new one
            $(modal_holder_selector).html(data).find(modal_selector).modal()
          }

          triggerUpdateEvent()
        }
        return false
      }
    }

    static init() {
      $(document).on("click", "a[data-modal=true]", function () {
        return MoModal.load(this)
      })
      $(document).on("click", "[data-modal-transition]", function () {
        return MoModal.replace(this)
      })
      $(document).on(
        "ajax:beforeSend",
        modal_holder_selector + ' form[data-inline!="true"]',
        (event, xhr, settings) => (settings.data += "&modal=true")
      )
      $(document).on("ajax:success", modal_holder_selector + ' form[data-inline!="true"]', handleAjaxSuccess)
      return $(document).on(
        "ajax:error",
        modal_holder_selector + ' form[data-inline!="true"]',
        (event, jqXHR, textStatus, errorThrown) => showError(jqXHR, textStatus, errorThrown)
      )
    }

    static close() {
      return $("#modal-holder").find(".modal").modal("hide")
    }

    static load(anker) {
      let location, modalSize
      if (jQuery.type(anker) === "string") {
        location = anker
      } else {
        const $button = $(anker)
        //$button.addClass('loading')
        const href = $button.attr("href")
        if (isValidUrl(href)) {
          location = $button.attr("href")
        } else {
          console.error("Invalid URL", href)
        }
        modalSize = $button.attr("data-modal-size")
      }

      // do nothing if modal is loading
      if (modal_is_loading) {
        return false
      }

      // close in case it was open
      MoModal.close()

      //Load modal dialog from server
      InfoDialog.showLoading()
      const attr = { modal: true }
      if (modalSize && modalSize.length > 0) {
        attr["modal_size"] = modalSize
      }

      modal_is_loading = true
      $.get(location, attr)
        .fail(showError)
        .done(function (data, status, xhr) {
          // console.log 'done'
          //$button.removeClass('loading')
          InfoDialog.hideLoading()

          const url = xhr.getResponseHeader("Location")

          // got a redirect response
          if (url) {
            // close modal window
            $("#modal-holder").find(".modal").modal("hide")
            return (window.location = url)
          } else {
            if ($(".modal-backdrop").length === 0) {
              // prevent multiple overlays on double click
              // open modal with content from ajax response
              $(modal_holder_selector).html(data).find(modal_selector).modal()
              // for the case the response contains a form intialize it
              return triggerUpdateEvent()
            }
          }
        })
        .always(() => (modal_is_loading = false))
      return false
    }

    static replace(anker) {
      $(modal_holder_selector)
        .find(modal_selector)
        .find(".modal-body")
        .html('<div class="loading-spinner"></div><div class="loading-text">Loading...</div>')

      const lastUrl = window.location.href
      const ankerUrl = $(anker).attr("href")

      $.ajax({
        dataType: "html",
        url: ankerUrl,
        data: { modal: true, modal_transition: true },
        error: showError,
        success(data, textStatus, jqXHR) {
          const $data = $(data)
          const $footer = $data.find(".modal-footer")
          if ($footer.length > 0) {
            // add back button to footer
            const $back = $('<a href="javascript:void(0)" class="btn btn-primary">Back</a>')
            $back.click(() => (window.location.href = lastUrl))
            $footer.prepend($back)
          }

          $(".modal-backdrop").remove()
          $(modal_holder_selector).find(modal_selector).replaceWith($data)
          $(modal_holder_selector).find(modal_selector).modal()
          //
          // $(modal_holder_selector).find(modal_selector).modal('hide')
          // $(modal_holder_selector).html($data).find(modal_selector).modal()
          return triggerUpdateEvent()
        },
      })
      return false
    }
  }
  MoModal.initClass()
  return MoModal
})()

$(() => MoModal.init())

window.MoModal = MoModal
