/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
$.fn.dhcpFormControl = function (options) {
  if (options == null) {
    options = {}
  }
  return this.each(function () {
    // get form control button
    const $control = $(this)
    // get form
    const $form = $($control.data("controlDhcpForm"))
    // setup form
    $form.css("display", "none").removeClass("hidden")

    if (typeof options === "string") {
      if (options === "hide") {
        $(this).text("+").addClass("btn-primary").removeClass("btn-secondary")
        $form.hide("slow")
      } else if (options === "show") {
        $form.show("slow")
        $(this)
          .text("cancel")
          .removeClass("btn-primary")
          .addClass("btn-secondary")
      }
      return this
    }

    // setup control behavior
    $control.click(function () {
      if ($form.is(":visible")) {
        $(this).text("+").addClass("btn-primary").removeClass("btn-secondary")
        return $form.hide("slow")
      } else {
        $form.show("slow")
        return $(this)
          .text("cancel")
          .removeClass("btn-primary")
          .addClass("btn-secondary")
      }
    })

    return this
  })
}
