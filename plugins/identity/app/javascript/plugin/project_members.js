/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const formState = function (form) {
  let state = ""
  // add 1 to state if checkbox is checked and 0 else
  $(form)
    .find("select[data-roles-select] option")
    .each(function () {
      let left
      return (state += $(this).attr("value") + ((left = $(this).is(":selected")) != null ? left : { 1: 0 }))
    })
  return state
}

const multiselect = (elementsSelector) =>
  $(elementsSelector).multiselect({
    includeSelectAllOption: true,
    buttonText(options, select) {
      // options are selected checkboxes in role select
      // select is the form select.
      const $tr = $(select).closest("tr")
      // all available labels
      const availableLabels = []
      $(select)
        .find("option")
        .each(function () {
          return availableLabels.push($(this).text())
        })
      //console.log("availableLabels ", availableLabels)

      // selected labels
      const labels = []
      // add all selected options to labels
      options.each(function () {
        return labels.push($(this).text())
      })
      const $display = $(select).closest("tr").find("[data-roles-display]")
      // current selected roles
      const currentRoles = $display.data("roles-current")

      // valuesToRemove = currentRoles - labels
      const valuesToRemove = currentRoles.filter(
        (x) =>
          //console.log(x, labels.indexOf(x),availableLabels.indexOf(x))
          //return ((labels.indexOf(x) < 0) and !(availableLabels.indexOf(x) < 0))

          availableLabels.indexOf(x) >= 0 && labels.indexOf(x) < 0
      )
      // valuesToAdd = labels - currentRoles
      const valuesToAdd = labels.filter((x) => currentRoles.indexOf(x) < 0)

      let newLabels = $(currentRoles).not(valuesToAdd).not(valuesToRemove).toArray()
      for (var value of Array.from(valuesToAdd)) {
        const label = document.createElement("b")
        label.textContent = value
        newLabels.push(label.outerHTML)
      }
      for (var value of Array.from(valuesToRemove)) {
        const label = document.createElement("s")
        label.textContent = value
        newLabels.push(label.outerHTML)
      }
      newLabels = newLabels.sort(
        (a, b) => a.replace("<b>", "").replace("<s>", "") > b.replace("<b>", "").replace("<s>", "")
      )

      if (newLabels.length === 0) {
        $display.html("No roles assigned yet!")
        $tr.addClass("danger")
      } else {
        let label = newLabels.join(", ")

        if (valuesToAdd.length === 0 && newLabels.length === valuesToRemove.length) {
          $tr.addClass("danger")
          label += " <span class='info-text'>(click save to remove this member from the list)</span>"
        } else if (valuesToAdd.length > 0 || valuesToRemove.length > 0) {
          $tr.addClass("info")
          label += " <span class='info-text'>(click save to activate the changes)</span>"
        } else {
          $tr.removeClass("danger info")
        }
        $display.html(label)
      }

      // if newLabels.length>0
      //   $display.html newLabels.join(', ')
      // else
      //   $display.html "No roles assigned yet!"

      return "Manage Roles"
    },
  })

$(document).ready(function () {
  // get form
  const $form = $("form.role_assignments")
  // initialize current state of checked and unchecked chckboxes
  $form.currentState = formState($form)

  // show or hide save button if state of checkboxes has changed.
  $form.on("change", "select[data-roles-select]", function () {
    const newState = formState($form)

    if ($form.currentState !== newState) {
      $form.find('input[type="submit"], .cancel.stash').removeClass("hidden").show("fade")
      return $(this).closest("tr").removeClass("danger")
    } else {
      return $form.find('input[type="submit"], .cancel.stash').hide("fade")
    }
  })

  // update current state if new elements are added to form
  $form.on("DOMNodeInserted", function (e) {
    if (e.target.nodeName === "TR") {
      multiselect($(e.target).find("select[data-roles-select]"))
      // console.log('DOMNodeInserted', e.target)
      $form.currentState = formState($form)
      return $form.find(".cancel.stash").removeClass("hidden stash").show("fade")
    }
  })

  // initialize current select dom elements
  return multiselect($form.find("select[data-roles-select]"))
})
