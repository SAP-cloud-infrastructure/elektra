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
    // get form control button ("+ Add Access" or the form's "Cancel" link)
    const $control = $(this)
    // get form
    const $form = $($control.data("controlRbacForm"))
    // the "+ Add Access" trigger (everything that is not the cancel link)
    const $addButton = $('[data-control-rbac-form]').not('[data-action="cancel"]')
    // setup form (start hidden, remove the bootstrap `hidden` class)
    $form.css("display", "none").removeClass("hidden")

    const showForm = () => {
      $form.show()
      $addButton.hide()
    }
    const hideForm = () => {
      $form.hide()
      $addButton.show()
    }

    if (typeof options === "string") {
      if (options === "hide") {
        hideForm()
      } else if (options === "show") {
        showForm()
      }
      return this
    }

    // setup control behavior. The cancel link always hides the form; the add
    // button toggles it (mirrors the "Manage Subnets" add-button behaviour).
    $control.click(function (e) {
      e.preventDefault()
      if ($control.data("action") === "cancel" || $form.is(":visible")) {
        return hideForm()
      }
      return showForm()
    })

    // Only wire up the autocomplete once, via the add button (the cancel link
    // shares the same selector but must not re-bind it to the same input).
    if ($control.data("action") === "cancel") {
      return this
    }

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

// Inline delete confirmation for RBAC rows, matching the "Manage Subnets"
// behaviour: the first click turns the trash button into a "Confirm Delete"
// label (reverting after 3s); the second click lets the native Rails-UJS
// delete request through. The listener runs in the capture phase so it fires
// before Rails-UJS' own (bubble-phase) click handler, letting us suppress the
// delete until the user confirms.
document.addEventListener(
  "click",
  function (e) {
    const btn = e.target.closest && e.target.closest("a.rbac-delete")
    if (!btn) {
      return
    }

    const $btn = $(btn)

    if ($btn.data("confirm-pending")) {
      // Confirmed: clear the timer and let Rails-UJS handle the delete.
      clearTimeout($btn.data("confirm-timer"))
      $btn.removeData("confirm-pending")
      $btn.closest("tr").addClass("updating")
      $btn.html('<i class="fa fa-trash fa-fw"></i>')
      return // do not stop the event -> UJS performs the DELETE
    }

    // First click: ask for confirmation inline, revert after 3s.
    e.preventDefault()
    e.stopImmediatePropagation()

    $btn.data("confirm-pending", true).text("Confirm Delete")
    const timer = setTimeout(() => {
      $btn.removeData("confirm-pending")
      $btn.html('<i class="fa fa-trash fa-fw"></i>')
    }, 3000)
    $btn.data("confirm-timer", timer)
  },
  true // capture phase
)
