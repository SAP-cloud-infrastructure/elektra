// SPIKE throwaway: re-expose the BS3 jQuery plugin API ($.fn.modal / .tooltip / .popover /
// .collapse) on top of Bootstrap 5's jQuery-free JS. BS5 dropped the jQuery bridge entirely, so
// Elektra's core/plugin JS (which calls $(...).modal("hide") etc.) throws
// "TypeError: $(...).modal is not a function" the moment the DOM-ready handlers run.
//
// This is NOT a migration — it's a bridge so we can see what breaks AFTER the first exception is
// gone (react-bootstrap 0.33 markup vs BS5 CSS, data-toggle dropdowns, the jQuery widgets).
//
// Must be imported AFTER "jquery" and AFTER "bootstrap" (BS5).
import jQueryBundled from "jquery"
import { Modal, Tooltip, Popover, Collapse, Dropdown, Tab } from "bootstrap"

// Bootstrap 5 ships an OPTIONAL jQuery integration: on DOMContentLoaded, if window.jQuery exists and
// <body> does NOT have `data-bs-no-jquery`, BS5 registers each component as a jQuery plugin via
// `defineJQueryPlugin` — OVERWRITING our bridge's $.fn.modal with BS5's own `jQueryInterface`. That
// native interface does init-only on a bare `$el.modal()` (BS3 did init + SHOW), so Elektra's
// `.find(".modal").modal()` just constructs the instance and never shows it → the modal stays
// hidden. We opt out of BS5's jQuery auto-registration so OUR bridge (with BS3 init+show semantics)
// stays authoritative. BS5 reads this flag at DOMContentLoaded, so set it as early as the body
// exists (the <script> runs in <head> where document.body may still be null).
function disableBs5JqueryAutoload() {
  if (document.body) {
    document.body.setAttribute("data-bs-no-jquery", "")
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.setAttribute("data-bs-no-jquery", ""), {
      once: true,
    })
  }
}
disableBs5JqueryAutoload()

// Operate on the SHARED global jQuery (set by core/jquery as window.$ = window.jQuery = jquery), NOT
// on an esbuild-bundled import. Each entrypoint (essentials.js, application.js, plugins) bundles its
// own copy of the "jquery" module; the jQuery plugins (bootstrap-select etc. in application.js) read
// $.fn off window.jQuery. If we patched the bundled import instead, bootstrap-select would see
// $.fn.dropdown === undefined and crash reading `.Constructor` (version sniffing). SPIKE.
const $ = typeof window !== "undefined" && window.jQuery ? window.jQuery : jQueryBundled

// Map BS3 string commands to BS5 instance methods. BS5 components are created per-element via
// getOrCreateInstance; string args ("show"/"hide"/"toggle"/"dispose") call the matching method,
// an options object configures the instance.
//
// Key BS3→BS5 behavior difference: in BS3, calling $el.modal() with no args (or an options object)
// BOTH initializes AND shows the component. In BS5, getOrCreateInstance only constructs it. Elektra
// relies on the BS3 "init + show" semantics (e.g. modal.js: .html(data).find(".modal").modal()), so
// a bare/options call must also .show() for modal/collapse. (Tooltip/popover in BS3 did NOT auto-
// show on init — they wait for hover/trigger — so they must only init, never auto-show.)
function bridge(name, Ctor, { autoShow = false } = {}) {
  if (!$ || !$.fn) return // jQuery missing
  const fn = function (config, ...args) {
    return this.each(function () {
      const instance = Ctor.getOrCreateInstance(this, typeof config === "object" ? config : {})
      if (typeof config === "string") {
        if (typeof instance[config] === "function") {
          instance[config](...args)
        } else {
          // eslint-disable-next-line no-console
          console.warn(`[bs3-bridge] ${name}("${config}") is not a BS5 method`)
        }
      } else if (autoShow && typeof instance.show === "function") {
        // BS3 bare/options call = init + show (modal/collapse only)
        instance.show()
      }
    })
  }
  // expose the constructor the way BS3 did ($.fn.modal.Constructor), some code sniffs it
  fn.Constructor = Ctor
  // Install, and RE-install on DOMContentLoaded: BS5 registers its own jQuery plugins
  // (defineJQueryPlugin) at DOMContentLoaded and would overwrite ours with its init-only
  // jQueryInterface. We also set data-bs-no-jquery to suppress that, but re-installing here is a
  // belt-and-suspenders guard against listener-ordering races. SPIKE.
  $.fn[name] = fn
  document.addEventListener("DOMContentLoaded", () => {
    $.fn[name] = fn
  })
}

bridge("modal", Modal, { autoShow: true })
bridge("tooltip", Tooltip)
bridge("popover", Popover)
bridge("collapse", Collapse, { autoShow: true })
bridge("dropdown", Dropdown)
bridge("tab", Tab, { autoShow: true })

// BS5 renamed every data API attribute with a `-bs-` infix (data-toggle → data-bs-toggle,
// data-dismiss → data-bs-dismiss, data-target → data-bs-target, data-parent → data-bs-parent).
// Elektra's HAML/ERB views still use the BS3 names (~146 data-toggle, ~23 data-dismiss), which are
// inert under BS5. Rather than editing every template, mirror the BS3 attrs onto their BS5 names so
// BS5's native data-API auto-init picks them up (dropdowns, collapses, modal dismiss buttons).
// SPIKE: runs on DOM-ready and again on dynamically injected modal content.
const DATA_ATTR_MAP = {
  "data-toggle": "data-bs-toggle",
  "data-dismiss": "data-bs-dismiss",
  "data-target": "data-bs-target",
  "data-parent": "data-bs-parent",
  "data-ride": "data-bs-ride",
  "data-slide": "data-bs-slide",
  "data-slide-to": "data-bs-slide-to",
}
function mirrorBs3DataAttrs(root) {
  const scope = root || document
  for (const [bs3, bs5] of Object.entries(DATA_ATTR_MAP)) {
    scope.querySelectorAll(`[${bs3}]`).forEach((el) => {
      if (el.hasAttribute(bs5)) return
      // SPIKE guard: BS5's Dropdown resolves its menu as a sibling of the toggle or inside the
      // toggle's parent (dropdown.js: SelectorEngine.next/prev/findOne SELECTOR_MENU). Elektra has
      // custom dropdowns (e.g. the breadcrumb "mega" services menu) whose markup is NOT a
      // .dropdown-menu — mirroring data-bs-toggle there makes BS5 init a dropdown with
      // this._menu === null and crash ("Cannot read properties of null (reading 'classList')").
      // Only mirror dropdown toggles that actually have a resolvable .dropdown-menu.
      if (bs3 === "data-toggle" && el.getAttribute(bs3) === "dropdown") {
        const parent = el.parentNode
        const hasMenu =
          (el.nextElementSibling && el.nextElementSibling.classList.contains("dropdown-menu")) ||
          (el.previousElementSibling && el.previousElementSibling.classList.contains("dropdown-menu")) ||
          (parent && parent.querySelector(":scope > .dropdown-menu"))
        if (!hasMenu) return // custom/mega dropdown — leave to Elektra's own handlers
      }
      el.setAttribute(bs5, el.getAttribute(bs3))
    })
  }
}

$(() => {
  mirrorBs3DataAttrs(document)
  // modal.js injects server-rendered modal markup into #modal-holder at runtime → re-mirror it
  $(document).on("modal:contentUpdated", () => mirrorBs3DataAttrs(document.getElementById("modal-holder")))
})

export default $
