/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const subnets = {}
const $loader = $('<span class="spinner"></span>')

const showSubnets = function (subnets) {
  const $select = $("#floating_ip_floating_subnet_id")
  $select.empty()

  $select.append('<option value=""></option>')
  for (var subnet of Array.from(subnets)) {
    var available_ips = subnet.total_ips - subnet.used_ips
    $select.append(
      `<option ${
        available_ips <= 0 ? 'disabled="disabled"' : undefined
      } value="${subnet.subnet_id}">${subnet.subnet_name} (${
        subnet.cidr
      }, available IPs: ${available_ips})</option>`
    )
  }
  return $("fieldset#subnets .form-group").show()
}

const loadSubnets = function (networkId) {
  if (!networkId || networkId.trim().length === 0) {
    $("fieldset#subnets .form-group").hide()
    $('form#new_floating_ip button[type="submit"]').prop("disabled", true)
    return
  }

  if (subnets[networkId]) {
    return showSubnets(subnets[networkId])
  } else {
    $('form#new_floating_ip button[type="submit"]').prop("disabled", true)
    $("fieldset#subnets .form-group").hide()
    if (policy.isAllowed("networking:ip_availability")) {
      $("fieldset#subnets").append($loader)
      return $.ajax({
        //url: "networks/#{networkId}/ip_availability"
        url: `${window.location.protocol}//${window.location.host}/${scopedDomainFid}/${scopedProjectFid}/networking/networks/${networkId}/ip_availability`,
        success(data, textStatus, jqXHR) {
          subnets[networkId] = data
          $loader.remove()
          return showSubnets(subnets[networkId])
        },
      })
    } else {
      const $select = $("#floating_ip_floating_subnet_id")
      $select.empty()
      $("fieldset#subnets .form-group").show()
      return $("#floating_ip_floating_subnet_id")
        .parent()
        .append(
          "<p class='form-text'>To see availability information for IPs you need the role network_viewer or network_admin</p>"
        )
    }
  }
}

const init = function () {
  if (
    $("#floating_ip_floating_subnet_id").length === 0 ||
    ($("#floating_ip_floating_subnet_id")[0].value || "").trim().length === 0
  ) {
    $("fieldset#subnets .form-group").hide()
    $('form#new_floating_ip button[type="submit"]').prop("disabled", true)
  }

  //loadSubnets(this.value) if $('#floating_ip_floating_network_id').trim().length>0

  $("#floating_ip_floating_network_id").change(function () {
    loadSubnets(this.value)
  })

  $("#floating_ip_floating_subnet_id").change(function () {
    if (
      this.value.trim().length > 0 ||
      $("#floating_ip_floating_ip_address").val().trim().length > 0
    ) {
      return $('form#new_floating_ip button[type="submit"]').prop(
        "disabled",
        false
      )
    } else {
      return $('form#new_floating_ip button[type="submit"]').prop(
        "disabled",
        true
      )
    }
  })

  $("#floating_ip_floating_ip_address").change(function () {
    if (
      this.value.trim().length > 0 ||
      $("#floating_ip_floating_subnet_id").val().trim().length > 0
    ) {
      return $('form#new_floating_ip button[type="submit"]').prop(
        "disabled",
        false
      )
    } else {
      return $('form#new_floating_ip button[type="submit"]').prop(
        "disabled",
        true
      )
    }
  })

  if ($("#floating_ip_floating_network_id").val()) {
    return setTimeout(
      () => loadSubnets($("#floating_ip_floating_network_id").val()),
      500
    )
  }
}

$(document).on("modal:contentUpdated", (e) => init())
