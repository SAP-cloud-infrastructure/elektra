/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
$.fn.rbacFormControl = function (options) {
  if (options == null) {
    options = {}
  }
  return this.each(function () {
    // get form control button
    const $control = $(this)
    // get form
    const $form = $($control.data("controlRbacForm"))
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

    // initialize autocomplete on form input
    $form
      .find('[name="rbac[target_tenant]"]')
      .autocomplete({
        source(req, add) {
          // projects which are already in use
          const unavailableProjects = $(
            'table#rbacs tbody tr td:nth-child(2)[class!="form_content"]'
          )
            .map(function () {
              return $(this).text()
            })
            .toArray()
          // add current project to unavailable projects
          unavailableProjects.push(options["currentProject"])
          // filter available projects (authProjects - unavailableProjects)
          const values = options["authProjects"].filter(
            (el) => unavailableProjects.indexOf(el) < 0
          )

          return add(values)
        },
        appendTo: "#suggestions",
        minLength: 0,
      })
      .click(function () {
        return $(this).autocomplete("search", "")
      })

    return this
  })
}
