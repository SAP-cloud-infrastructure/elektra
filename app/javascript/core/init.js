/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { hideModal, initTooltips, initPopovers } from "./bootstrap_engine"
class Dashboard {
  static hideRevealFormParts() {
    const allTargets = $(".dynamic-form-target")
    const target = allTargets.filter(`*[data-type='${$(this).val()}']`) // from all targets select the one that matches the value that's been selected with the trigger

    // find all targets, hide them, set descendants that are any kind of form input to disabled (to prevent them getting submitted when the form is posted)
    allTargets.hide().find(":input").prop("disabled", true)

    // show the target that's been selected by the trigger, enable all descendants that are inputs
    return target.show().find(":input").prop("disabled", false)
  }

  static showFormDetails() {
    const target = $(this).data("target")
    $(target).addClass("hidden")
    return $(`${target}#${this.value}`).removeClass("hidden")
  }

  static initForm() {
    // flavor details
    $("form select[data-trigger=change]").change(Dashboard.showFormDetails)
    // Dynamic Form - Hide/reveal parts of the form following a trigger event
    return $(".dynamic-form-trigger").change(Dashboard.hideRevealFormParts)
  }

  static hideModal() {
    return hideModal("#modal-holder .modal")
  }
}

window.Dashboard = Dashboard

// define console if not exists (this is a case for IE)
if (typeof window.console === "undefined" || typeof window.console.log === "undefined") {
  window.console = {
    log() {
      return {}
    },
  }
}

// -------------------------------------------------------------------------------------------------------------
// Initialize Dashboard App

// init help hint popovers
const initHelpHint = function () {
  // https://stackoverflow.com/questions/32911355/whats-the-tabindex-1-in-bootstrap-for
  $('[data-bs-toggle="popover"][data-popover-type="help-hint"]').attr("tabindex", "0")
  return initPopovers('[data-bs-toggle="popover"][data-popover-type="help-hint"]', {
    placement: "top",
    trigger: "focus",
  })
}

$(function () {
  // enter the cloud on enter key
  const $enterCloudButton = $("#enter_the_cloud_button")
  if ($enterCloudButton.length > 0) {
    $(document).keyup(function (e) {
      const code = e.which
      if (code === 13) {
        e.preventDefault()
        return (window.location = $enterCloudButton.attr("href"))
      }
    })
  }

  // Tooltips
  initTooltips("abbr[title], abbr[data-original-title]", { delay: { show: 300 } })
  // init tooltips
  initTooltips('[data-bs-toggle="tooltip"]')

  // init Form
  Dashboard.initForm()

  // update items which has the update attribute
  $("[data-update-url]").update()

  // initialize polling
  PollingService.init({ selector: "*[data-update-path]", interval: 5 })

  // initialize buttons with loading status
  $(document).on("click", "tr [data-loading-status]", function () {
    return $(this).closest("tr").addClass("updating")
  })
  $("tr [data-confirmed=loading_status]").attr("data-confirmed", "$(this).closest('tr').addClass('updating')")

  $("#accept_tos").click(function () {
    return $("#register-button").prop("disabled", !$(this).prop("checked"))
  })

  // init help hint popovers
  initHelpHint()

  // help text toggle
  $('[data-toggle="help"]').click(function (e) {
    e.preventDefault()
    return $(".plugin-help").toggleClass("visible")
  })

  // Mega dropdown (breadcrumb services menu). Its menu is a custom
  // render_navigation fancy-list, NOT a real .dropdown-menu, so Bootstrap 5's
  // dropdown JS cannot drive it. Toggle visibility manually via `.open` on the
  // `.dropdown-mega` container (BS5 .dropdown-menu.show is applied to the menu).
  $(document).on("click", '[data-mega-dropdown="true"]', function (e) {
    e.preventDefault()
    e.stopPropagation()
    const $mega = $(this).closest(".dropdown-mega")
    const isOpen = $mega.hasClass("open")
    // close any other open mega dropdowns
    $(".dropdown-mega.open").removeClass("open").find("> .fancy-nav").removeClass("show")
    if (!isOpen) {
      $mega.addClass("open").find("> .fancy-nav").addClass("show")
    }
  })
  // close the mega dropdown when clicking outside of it
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".dropdown-mega").length) {
      $(".dropdown-mega.open").removeClass("open").find("> .fancy-nav").removeClass("show")
    }
  })

  // generic visibility toggle
  $('[data-action="toggle"]').click(function (e) {
    e.preventDefault()
    const target = $(this).attr("data-target")
    return $(target).toggleClass("hidden")
  })

  // init universal search input field
  $("[data-universal-search-field]").keyup(function (event) {
    if (event.keyCode === 13) {
      $(this)
        .attr("disabled", true)
        .closest(".has-feedback")
        .find(".fa-search")
        .removeClass("fa-search")
        .addClass("spinner")

      const url = $(this).data("url") + "#/universal-search"
      window.location.href = url + "?searchTerm=" + this.value
      // the pathname didn't change -> reload page with new search term param
      if (window.location.href.indexOf(url) >= 0) {
        return window.location.reload()
      }
    }
  })
  // ---------------------------------------------
  // Expandable Tree

  $(".tree-expandable .has-children > .node-icon").click(function (e) {
    e.preventDefault()
    return $(this).parent().toggleClass("node-expanded")
  })

  // init all DOM elements found by css class '.searchable' as searchable
  $(() => $(".searchable").searchable())

  // ajax paginate
  $(() => $("*[data-ajax-paginate]").ajaxPaginate())

  // show search form for searchable
  $('[data-trigger="show-searchable-search"]').click(function (e) {
    $(this).toggleClass("active")
    return $(".searchable-input").toggleClass("expanded").find("#search-input").focus()
  })

  // $('[data-collapsable]').collapsable()
  // make tables sortable
  return $(() => $("table[data-sortable-columns]").sortableTable())
})

// use MutationObserver to make new added nodes collapsable
const observer = new MutationObserver(function (mutations) {
  return (() => {
    const result = []
    for (var mutation of Array.from(mutations)) {
      if (mutation.type === "childList") {
        var collapsable_containers = $(mutation.addedNodes).find("[data-collapsable]")
        if (collapsable_containers && collapsable_containers.length > 0) {
          collapsable_containers.collapsable()
        }

        var multiselect_boxes = $(mutation.addedNodes).find("[data-multiselect-box]")

        if (multiselect_boxes && multiselect_boxes.length > 0) {
          result.push(
            multiselect_boxes.multiselect({
              numberDisplayed: 1,
            })
          )
        } else {
          result.push(undefined)
        }
      } else {
        result.push(undefined)
      }
    }
    return result
  })()
})

observer.observe(document.documentElement, { childList: true, subtree: true })
// -------------- END

// -------------------------------------------------------------------------------------------------------------
// Initialize Modal Windows
$(document).on("modal:contentUpdated", function (e) {
  try {
    // define target selector dependent on id or class
    let selector
    if (e.target.id) {
      selector = `#${e.target.id}`
    }
    if (e.target.class) {
      selector = `.${e.target.class}`
    }
    // get form
    const $form = $(selector).find("form")
    // find triger elements
    $form.find("select[data-trigger=change]").change(Dashboard.showFormDetails)

    // $(selector).find('[data-collapsable]').collapsable()

    // Dynamic Form - Hide/reveal parts of the form following a trigger event
    $form.find(".dynamic-form-trigger").change(Dashboard.hideRevealFormParts)

    $(selector)
      .find("[data-autocomplete-url]")
      .each(function () {
        const $input = $(this)
        const valueAttr = $input.data("autocompleteValue") || "id"
        const labelAttr = $input.data("autocompleteLabel") || "name"
        const detailsAttr = $input.data("autocompleteDetails") || "id"

        return ($input
          .autocomplete({
            appendTo: $input.parent(),
            source: $input.data("autocompleteUrl"),
            select(event, ui) {
              $input.attr("data-autocomplete-value", ui.item[valueAttr])
              $input.val(ui.item.name)
              return false
            },
          })
          .data("ui-autocomplete")._renderItem = (ul, item) =>
          $("<li>")
            .attr("data-value", item[valueAttr])
            .text(item[labelAttr])
            .append(`<br/><span class='info-text'>${item[detailsAttr]}</span>`)
            .appendTo(ul))
      })
  } catch (error) {
    console.info(error)
  }

  // init all DOM elements found by css class '.searchable' as searchable
  $(`#${e.target.id} .searchable`).searchable()

  // init help hint popovers
  initHelpHint()

  // -------------
  // init tooltips
  initTooltips('[data-bs-toggle="tooltip"]')

  // generic visibility toggle
  return $('[data-action="toggle"]').click(function (e) {
    e.preventDefault()
    const target = $(this).attr("data-target")
    return $(target).toggleClass("hidden")
  })
})

// # TURBOLINKS SUPPORT ---------------------------------------------------------------------
// # React to turbolinks page load events to indicate to the user that something is happening
// $ =>
//   startPageLoadIndicator = ->
//     $("html").css "cursor", "progress"
//     return
//
//   stopPageLoadIndicator = ->
//     $("html").css "cursor", "auto"
//     return
//
//
//   $(document).on "page:fetch", startPageLoadIndicator
//   $(document).on "page:receive", stopPageLoadIndicator
