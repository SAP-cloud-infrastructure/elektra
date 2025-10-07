/* eslint-disable no-undef */
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const errorsToStringArray = function (errors) {
  let errorsStringArray = []
  if (typeof errors === "object") {
    for (var key in errors) {
      var messages = errors[key]
      var msg = Array.isArray(messages) ? messages.join(", ") : messages
      errorsStringArray.push(key + ": " + msg)
    }
  } else {
    errorsStringArray = [errors]
  }
  return errorsStringArray
}

class SubnetForm {
  constructor(url, checkCidrRange, createCallback) {
    this.data = { name: null, cidr: null }
    this.url = url
    this.checkCidrRange = checkCidrRange
    this.createCallback = createCallback
    this.state = {
      checkCidrRange: this.checkCidrRange,
      errors: null,
      show: false,
      loading: false,
    }
  }

  submit() {
    this.state.loading = true
    this.render()
    return $.ajax({
      url: this.url,
      method: "post",
      data: { subnet: this.data },
      success: (data) => {
        this.state.loading = false
        return this.createCallback(data)
      },
      error: (jqXHR, statusText, errorThrown) => {
        const errors = jqXHR.responseJSON ? jqXHR.responseJSON["errors"] : errorThrown || statusText
        this.state.errors = errorsToStringArray(errors)

        this.state.loading = false
        return this.render()
      },
    })
  }

  reset() {
    this.state.errors = null
    this.data = {}
    return this.render()
  }

  setData(data) {
    return (() => {
      const result = []
      for (var key in data) {
        var value = data[key]
        result.push((this.data[key] = value))
      }
      return result
    })()
  }

  show() {
    this.state.show = true
    return this.render()
  }

  hide() {
    this.state.errors = null
    this.state.show = false
    return this.render()
  }

  render() {
    if (!this.$form) {
      const cidrHelpText = this.state.checkCidrRange
        ? "must be a valid cidr adress like 10.180.1./16"
        : "should be a valid cidr adress like 10.10.10.10/16"

      this.$form = $('<form class="form-inline"></form>')
      this.$form.submit((e) => {
        e.preventDefault()
        return this.submit()
      })

      this.$nameInput = $(
        '<input class="form-control string required" placeholder="Name" type="text"  style="width: 400px;">'
      )
      this.$cidrInput = $(
        `<input class="form-control string required" placeholder="CIDR (${cidrHelpText})" type="text" style="width: 600px;">`
      )

      const self = this
      this.$nameInput.keyup(function () {
        return (self.data["name"] = this.value)
      })
      this.$cidrInput.keyup(function () {
        return (self.data["cidr"] = this.value)
      })

      this.$submitButton = $('<input type="submit" class="btn btn-primary" value="Add">')

      this.$form
        .append($('<div class="form-group"></div>').append(this.$nameInput))
        .append($('<div class="form-group"></div>').append(this.$cidrInput))
        .append($('<div class="form-group"></div>').append(this.$submitButton))

      this.$error = $("<div></div>").appendTo(this.$form)

      this.$cidrInput.tooltip({ placement: "top", title: cidrHelpText })
    }

    this.$error.empty()
    this.$nameInput.val(this.data["name"])
    this.$cidrInput.val(this.data["cidr"])

    if (this.state.show) {
      this.$form.fadeIn("slow")
    } else {
      this.$form.fadeOut("slow")
    }

    if (this.state.errors) {
      this.$error.append(
        `<div class="has-error"><span class="help-block">${this.state.errors.join(" and ")}</span></div>`
      )
    }

    if (this.state.loading) {
      this.$submitButton.prop("disabled", true).val("Please wait...")
    } else {
      this.$submitButton.prop("disabled", false).val("Add")
    }
    return this.$form
  }
}

class Subnets {
  constructor(element) {
    this.element = element
    this.url = $(element).data("url")
    this.checkCidrRange = $(element).data("check-cidr-range")
    this.subnets = $(element).data("items")
    this.network = $(element).data("network")

    this.state = {
      lastItemsCount: 0,
      loading: false,
      showForm: false,
      subnets: $(element).data("items"),
      errors: null,
    }

    this.form = new SubnetForm(this.url, this.checkCidrRange, (subnet) => {
      this.state.subnets.push(subnet)
      this.state.showForm = false
      return this.render()
    })

    this.render()
    if (!this.subnets) {
      this.loadSubnets()
    }
  }

  loadSubnets() {
    this.state.loading = true
    this.render()
    return $.ajax({
      url: this.url,
      cache: false,
      success: (data) => {
        this.state.loading = false
        this.state.subnets = data
        return this.render()
      },
    })
  }

  toggleForm() {
    this.state.showForm = !this.state.showForm
    return this.render()
  }

  removeSubnet(anker, subnetId) {
    if ($(anker).data("confirm")) {
      clearTimeout(this.removeTimer)
      $(anker).closest("tr").addClass("updating")
      $(anker).hide().html('<i class="fa fa-trash"></i>')

      return $.ajax({
        url: this.url + "/" + subnetId,
        method: "delete",
        error: (jqXHR, statusText, errorThrown) => {
          $(anker).show().data("confirm", false)
          $(anker).closest("tr").removeClass("updating")
          const errors = jqXHR.responseJSON ? jqXHR.responseJSON["errors"] : errorThrown || statusText
          this.state.errors = errorsToStringArray(errors)
          return this.render()
        },
        success: () => {
          const { subnets } = this.state
          this.state.subnets = []
          for (var subnet of Array.from(subnets)) {
            if (subnet.id !== subnetId) {
              this.state.subnets.push(subnet)
            }
          }
          return this.render()
        },
      })
    } else {
      $(anker).data("confirm", true).text("Confirm Delete")
      const reset = () => $(anker).data("confirm", false).html('<i class="fa fa-trash"></i>')
      return (this.removeTimer = setTimeout(reset, 3000))
    }
  }

  loading() {
    return this.$loading || (this.$loading = $('<tr><td colspan="5"><span class="spinner"></span></td></tr>'))
  }

  render() {
    const networkType = this.network["router:external"] ? "external" : "private"

    if (!this.created) {
      this.created = true

      if (
        policy.isAllowed(`networking:network_${networkType}_update`, {
          network: this.network,
        })
      ) {
        const toolbar = $('<div class="toolbar toolbar-controlcenter"></div>').appendTo(this.element)
        const buttons = $('<div class="main-control-buttons"></div>').appendTo(toolbar)

        this.form.render().appendTo(toolbar).hide()
        this.$addButton = $('<a href="#" class="btn btn-primary">+</a>').appendTo(buttons)
        this.$addButton.click(() => this.toggleForm(this))
      }

      this.$error = $("<div></div>").appendTo(this.element)

      const $table = $(`<table class="table"> \
<thead><tr> \
<th>Name / ID</th> \
<th>CIDR</th> \
<th>Allocation Pools</th> \
<th>Host Routes</th> \
<th>Gateway IP</th> \
<th></th> \
</tr></thead></table>`).appendTo(this.element)
      this.$tbody = $("<tbody></tbody>").appendTo($table)
    }

    if (this.state.subnets && this.state.lastItemsCount !== this.state.subnets.length) {
      this.state.lastItemsCount = this.state.subnets.length

      this.$tbody.empty()
      const self = this
      for (var subnet of Array.from(this.state.subnets)) {
        var pools, routes
        for (var p of Array.from(subnet.allocation_pools)) {
          pools = `${p.start} - ${p.end}<br/>`
        }
        for (var r of Array.from(subnet.host_routes)) {
          routes = `${r.destination} -> ${r.nexthop}<br/>`
        }
        var $tr = $(
          `<tr id="${subnet.id}` +
            `"> \
<td>` +
            subnet.name +
            '<br/><span class="info-text">' +
            subnet.id +
            `</span></td> \
<td>` +
            subnet.cidr +
            `</td> \
<td>` +
            pools +
            `</td> \
<td>` +
            (routes || "") +
            `</td> \
<td>` +
            subnet.gateway_ip +
            `</td> \
</tr>`
        ).appendTo(this.$tbody)
        var $actions = $('<td class="snug"></td>').appendTo($tr)

        if (
          policy.isAllowed(`networking:network_${networkType}_update`, {
            network: this.network,
          })
        ) {
          var $deleteButton = $('<a class="btn btn-danger btn-sm" href="#"><i class="fa fa-trash"></i></a>').appendTo(
            $actions
          )
          $deleteButton.click(function () {
            const subnet_id = $(this).closest("tr").prop("id")
            return self.removeSubnet(this, subnet_id)
          })
        }
      }
    }

    if (
      policy.isAllowed(`networking:network_${networkType}_update`, {
        network: this.network,
      })
    ) {
      if (this.state.showForm) {
        this.form.show()
        this.$addButton.addClass("btn-default").removeClass("btn-primary").text("x")
      } else {
        this.form.hide()
        this.$addButton.addClass("btn-primary").removeClass("btn-default").text("+")
      }
    }

    if (this.state.loading) {
      this.loading().appendTo(this.$tbody)
    } else {
      this.loading().remove()
    }

    this.$error.empty()
    if (this.state.errors) {
      return this.$error.append(
        `<div class="has-error"><span class="help-block">${this.state.errors.join(" and ")}</span></div>`
      )
    }
  }
}

$(document).on("modal:contentUpdated", (e) =>
  $("*[data-network-subnets]").each(function () {
    return new Subnets(this)
  })
)

$(function () {
  // init the subnets also on plain pages like from object lookup and wait until policy
  if (typeof policy === "undefined") {
    return setTimeout(
      () =>
        $("*[data-network-subnets]").each(function () {
          return new Subnets(this)
        }),
      1000
    )
  }
})
