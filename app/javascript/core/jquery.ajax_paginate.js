/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// jQuery plugin
jQuery.fn.ajaxPaginate = function (options) {
  // default values for all paginate plugins
  const defaults = {
    searchInputSelector: null,
    listSelector: null,
    loadNextButton: true,
    loadAllButton: false,
    loadNextLabel: "Load Next",
    loadAllLabel: "Load All",
    loadNextItemsCssClass: "btn btn-primary btn-sm",
    loadAllItemsCssClass: "btn btn-secondary btn-sm",
  }

  // merge defaults and options
  const settings = $.extend({}, defaults, options)

  // for each element found by selector
  return this.each(function () {
    const $container = $(this)
    // define spinner element
    const $spinner = $(
      '<div><span class="spinner"></span> Loading&hellip;</div>'
    )
      .appendTo($container)
      .hide()
    // define buttons container
    const $buttons = $('<div class="main-buttons"></div>').appendTo($container)
    // default only for the current pagination (this)
    const searchInputSelector =
      $container.data("searchInputSelector") || settings.searchInputSelector
    const listSelector =
      $container.data("listSelector") || settings.listSelector
    const loadNextButton =
      typeof $container.data("nextButton") !== "undefined"
        ? $container.data("nextButton") === true
        : settings.loadNextButton
    const loadAllButton =
      typeof $container.data("allButton") !== "undefined"
        ? $container.data("allButton") === true
        : settings.loadAllButton
    const loadNextLabel = $container.data("nextLabel") || settings.loadNextLabel
    const loadAllLabel = $container.data("allLabel") || settings.loadAllLabel
    const loadNextItemsCssClass =
      $container.data("nextCssClass") || settings.loadNextItemsCssClass
    const loadAllItemsCssClass =
      $container.data("allCssClass") || settings.loadAllItemsCssClass
    let loadAllMode = false

    const stopLoadAll = false
    let loading = false

    // initial values
    // page
    $container.data("currentPage", 1)
    // complete
    $container.data("completed", false)

    // show loading indicator (hide buttons)
    const showLoading = () =>
      $buttons.stop().fadeOut("fast", () => $spinner.stop().show())
    // hide loading indicator and show buttons
    const hideLoading = function () {
      $spinner.stop().hide()
      if (!$container.data("completed")) {
        return $buttons.stop().fadeIn("fast")
      }
    }

    const loadNext = function (callback) {
      // return if there is an ajax load running
      if (loading) {
        if (callback) {
          callback()
        }
        return
      }
      // if completed call callback and return
      if ($container.data("completed")) {
        if (callback) {
          callback()
        }
        return
      }

      // get next page from container data
      const nextPage = $container.data("currentPage") + 1
      // get last marker
      const marker = $($("*[data-marker-id]").last()).data("markerId")
      // load next items via ajax

      loading = true
      return $.get("", { page: nextPage, marker }, function (data) {
        loading = false
        // check if data is empty
        if (typeof data === "undefined" || data.trim().length === 0) {
          // data is empty -> completed
          $container.data("completed", true)
        } else {
          $container.data("completed", false)
          // update the list
          $(listSelector).append(data)
          // update the page count
          $container.data("currentPage", nextPage)
        }
        // call the callback method
        if (callback) {
          return callback(data)
        }
      })
    }

    // load recursively next items until all items are loaded or stopAllLoad is true
    var loadAll = function (callback) {
      if (stopLoadAll) {
        return
      }
      if ($container.data("completed")) {
        if (callback) {
          callback()
        }
        return
      }
      // load next items
      return loadNext((data) => loadAll(callback))
    }

    // if a search input selector is provided
    if (searchInputSelector) {
      const timer = null
      var loadAllOnSearch = function () {
        const value = $(searchInputSelector).val()
        if (typeof value !== "undefined" && value.trim().length > 0) {
          showLoading()
          return loadNext(function () {
            if ($container.data("completed")) {
              if (!loading) {
                return hideLoading()
              }
            } else {
              return setTimeout(loadAllOnSearch, 500)
            }
          })
        } else {
          if (!loading) {
            return hideLoading()
          }
        }
      }

      // get all entries once
      $(searchInputSelector).keyup(function (e) {
        if (!loadAllMode) {
          loadAllMode = true
          if (timer) {
            clearTimeout(timer)
          }
          return loadAllOnSearch()
        }
      })
    }

    // add load next items button
    if (settings.loadNextButton) {
      const $loadNextButton = $(
        `<button class='${loadNextItemsCssClass}'>${loadNextLabel}</button> `
      ).appendTo($buttons)
      $loadNextButton.click(function (e) {
        showLoading()
        return loadNext(() => hideLoading())
      })
    }

    // add load all items button
    if (loadAllButton) {
      const $loadAllButton = $(
        ` <button class='${loadAllItemsCssClass}' data-toggle='tooltip' title='This might take a while!'>${loadAllLabel}</button> `
      ).appendTo($buttons)
      $loadAllButton.tooltip()
      return $loadAllButton.click(function () {
        showLoading()
        return loadAll((data) => hideLoading())
      })
    }
  })
}
