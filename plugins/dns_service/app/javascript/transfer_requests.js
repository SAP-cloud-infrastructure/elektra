/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
$.fn.initAcceptButtons = function () {
  const $table = this
  const itemsLength = $table.find("tbody tr").length

  $table
    .closest(".modal-content")
    .find('[data-bs-dismiss="modal"]')
    .click(function () {
      if ($table.find("tbody tr").length < itemsLength) {
        const l = window.location
        return (window.location.href = `${l.protocol}//${l.host}/${l.pathname}`)
      }
    })

  return $("form.transfer-request-accept").each(function (index, form) {
    const $button = $(form).find('button[type="submit"]')
    const $keyInput = $(form).find('input[name="key"]')
    const $keyInputContainer = $keyInput.closest(".form-group")

    $button.click(function (e) {
      if ($keyInput.val()) {
        return $keyInput.closest("tr").addClass("updating")
      } else {
        e.preventDefault()
        if ($keyInputContainer.is(":visible")) {
          return $keyInputContainer.hide("slow", () => $button.text("Accept"))
        } else {
          $button.text("Confirm")
          $button.prop("disabled", !$keyInput.val())
          return $keyInputContainer.show("slow")
        }
      }
    })

    return $keyInput.keyup(function () {
      return $button.prop("disabled", !$(this).val())
    })
  })
}
