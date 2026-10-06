/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const updateWizardPage = (url) =>
  $.ajax({
    url,
    method: "GET",
    dataType: "script",
  })

$(function () {
  $('*[data-wizard-action-button="true"]').click(function (e) {
    return $(this).replaceWith('<span class="spinner float-end"></span>')
  })

  const $wizardContainer = $("[data-wizard-update-url]")
  const url = $wizardContainer.data("wizardUpdateUrl")
  $("body").on("hidden.bs.modal", ":not(.modal)", () => {
    if (url) {
      updateWizardPage(url)
    }
  })
})
