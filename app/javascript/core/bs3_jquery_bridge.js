/* eslint-disable no-undef */
// -----------------------------------------------------------------------------
// Bootstrap 3 -> 5 jQuery bridge (temporary migration shim)
// -----------------------------------------------------------------------------
// Bootstrap 5 dropped the jQuery plugin API ($.fn.modal/.tooltip/...). Elektra's
// core JS (MoModal, InfoDialog, stateful_links, dialogs, init) and several
// plugins + server-rendered .js.erb responses still call that API pervasively.
//
// This bridge re-exposes the jQuery plugin methods on the GLOBAL jQuery
// (window.jQuery), delegating to Bootstrap 5's native JS classes, while
// preserving Bootstrap 3 semantics (a bare `.modal()` both inits AND shows).
//
// It must be imported in essentials.js immediately after `import "bootstrap"`.
//
// Two traps this file guards against (learned in the bs5-spike):
//   1. Multi-entrypoint multiple-jQuery: each esbuild bundle has its own jquery
//      copy; plugins read $.fn off window.jQuery. We therefore patch
//      window.jQuery, not the bundled import.
//   2. BS5's OPTIONAL jQuery integration (defineJQueryPlugin) re-registers its
//      own init-only $.fn.modal on DOMContentLoaded, clobbering ours. We opt out
//      by setting `data-bs-no-jquery` on <body> early, and re-install on
//      DOMContentLoaded as a belt-and-suspenders measure.
//
// This is a staging tool. It is to be removed once all call-sites use the BS5
// native API (or React components) directly.
// -----------------------------------------------------------------------------

import * as bootstrap from "bootstrap"

const $ = window.jQuery

// Opt out of Bootstrap 5's own jQuery plugin auto-registration so it does not
// overwrite our bridge with its init-only interface.
function setNoJqueryFlag() {
  if (document.body) {
    document.body.setAttribute("data-bs-no-jquery", "")
  }
}
if (document.body) {
  setNoJqueryFlag()
} else {
  document.addEventListener("DOMContentLoaded", setNoJqueryFlag, { once: true })
}

// Components that auto-show on a bare/options call in Bootstrap 3.
const AUTO_SHOW = { Modal: true, Collapse: true }
// Components that must NOT auto-show (opt-in display only).
const COMPONENT_MAP = {
  modal: bootstrap.Modal,
  tooltip: bootstrap.Tooltip,
  popover: bootstrap.Popover,
  collapse: bootstrap.Collapse,
  tab: bootstrap.Tab,
  dropdown: bootstrap.Dropdown,
}

// Methods that map BS3 string-arg calls to BS5 instance methods.
// BS3 used "destroy"; BS5 renamed it to "dispose".
function normalizeMethod(name) {
  return name === "destroy" ? "dispose" : name
}

function makeJqueryPlugin(name, Component) {
  const key = Component.name // "Modal", "Tooltip", ...
  const fn = function (configOrMethod, ...args) {
    this.each(function () {
      const el = this
      // String arg => call an instance method (hide/show/toggle/dispose/...).
      if (typeof configOrMethod === "string") {
        const method = normalizeMethod(configOrMethod)
        const instance = Component.getOrCreateInstance(el)
        if (typeof instance[method] === "function") {
          instance[method](...args)
        }
        return
      }
      // Object/undefined arg => init with options, and (BS3) show if applicable.
      const instance = Component.getOrCreateInstance(el, configOrMethod || {})
      if (AUTO_SHOW[key] && typeof instance.show === "function") {
        instance.show()
      }
    })
    return this
  }
  fn.Constructor = Component
  fn.__isBridge = true
  return fn
}

function installBridge() {
  if (!$ || !$.fn) return
  Object.keys(COMPONENT_MAP).forEach((name) => {
    const Component = COMPONENT_MAP[name]
    if (Component) {
      $.fn[name] = makeJqueryPlugin(name, Component)
    }
  })
}

// Install now (module eval) and again on DOMContentLoaded to beat BS5's own
// defineJQueryPlugin handler regardless of listener ordering.
installBridge()
document.addEventListener("DOMContentLoaded", installBridge)

// -----------------------------------------------------------------------------
// Defensive data-attribute mirror
// -----------------------------------------------------------------------------
// Bootstrap 5 renamed the declarative data API from `data-toggle`/`data-target`/
// `data-dismiss` to `data-bs-*`. Elektra's HAML/ERB views still emit the BS3
// names across ~90 files with 5 different HAML syntaxes. Rather than rewrite
// them all (and risk missing the dynamic/.js.erb cases), we mirror the old
// attributes onto their BS5 equivalents at runtime.
//
// IMPORTANT (bs5-spike FINDING #10): this must be DEFENSIVE. Some dropdowns use
// custom markup (e.g. the breadcrumb "mega" dropdown rendered by
// render_navigation) that has NO `.dropdown-menu`; BS5's dropdown JS crashes on
// those. We only promote `data-toggle="dropdown"` when a resolvable
// `.dropdown-menu` exists; such custom dropdowns are left to Elektra's own JS.
//
// Custom, non-Bootstrap `data-toggle` values (help, show-error-details,
// paginationSpinner, etc.) are never touched because we only map the known
// Bootstrap toggle values.

const BS_TOGGLE_VALUES = ["dropdown", "collapse", "tab", "pill", "modal", "tooltip", "popover", "offcanvas"]

function hasResolvableDropdownMenu(el) {
  // BS5 looks for a sibling/descendant .dropdown-menu.
  const parent = el.parentNode
  if (parent && parent.querySelector(":scope > .dropdown-menu")) return true
  if (el.nextElementSibling && el.nextElementSibling.classList.contains("dropdown-menu")) return true
  return false
}

function mirrorDataAttributes(root) {
  const scope = root && root.querySelectorAll ? root : document

  // data-toggle -> data-bs-toggle (+ data-target -> data-bs-target)
  scope.querySelectorAll("[data-toggle]:not([data-bs-toggle])").forEach((el) => {
    const value = el.getAttribute("data-toggle")
    if (!BS_TOGGLE_VALUES.includes(value)) return // leave custom toggles alone
    if (value === "dropdown" && !hasResolvableDropdownMenu(el)) return // mega-dropdown guard
    el.setAttribute("data-bs-toggle", value)
    const target = el.getAttribute("data-target")
    if (target && !el.getAttribute("data-bs-target")) {
      el.setAttribute("data-bs-target", target)
    }
  })

  // data-dismiss -> data-bs-dismiss
  scope.querySelectorAll("[data-dismiss]:not([data-bs-dismiss])").forEach((el) => {
    el.setAttribute("data-bs-dismiss", el.getAttribute("data-dismiss"))
  })
}

function runMirror() {
  mirrorDataAttributes(document)
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runMirror)
} else {
  runMirror()
}
// Re-run when modal content is injected via AJAX (MoModal triggers this event).
document.addEventListener("modal:contentUpdated", runMirror)
$(document).on("modal:contentUpdated", runMirror)
