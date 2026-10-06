// -----------------------------------------------------------------------------
// Bootstrap 5 JS engine
// -----------------------------------------------------------------------------
// Central, framework-neutral wrapper around Bootstrap 5's native JS classes.
// Bootstrap 5 dropped the jQuery plugin API ($.fn.modal/.tooltip/...), so all
// of Elektra's imperative Bootstrap JS now goes through this engine instead of
// jQuery plugin calls.
//
// Everything here uses the Bootstrap 5 vanilla API (Modal/Tooltip/Popover/Tab)
// and @popperjs/core (already a dependency) for tooltip/popover positioning.
//
// Accepts a CSS selector string, an Element, a NodeList/array of Elements, or a
// jQuery object (legacy call-sites still pass `$(...)`), and normalises to an
// array of Elements so the engine works regardless of the caller.
// -----------------------------------------------------------------------------

import { Modal, Tooltip, Popover, Tab, Collapse, Dropdown } from "bootstrap"

type Elementish = string | Element | NodeListOf<Element> | Element[] | { toArray?: () => Element[]; 0?: Element }

function toElements(target: Elementish | null | undefined): HTMLElement[] {
  if (!target) return []
  if (typeof target === "string") {
    return Array.from(document.querySelectorAll<HTMLElement>(target))
  }
  if (target instanceof Element) {
    return [target as HTMLElement]
  }
  // jQuery object
  if (typeof (target as { toArray?: () => Element[] }).toArray === "function") {
    return (target as { toArray: () => Element[] }).toArray() as HTMLElement[]
  }
  // NodeList / array
  if (typeof (target as ArrayLike<Element>).length === "number") {
    return Array.from(target as ArrayLike<HTMLElement>)
  }
  return []
}

// --- Modal -----------------------------------------------------------------

export function openModal(target: Elementish, options?: Partial<Modal.Options>): void {
  toElements(target).forEach((el) => {
    const instance = Modal.getOrCreateInstance(el, options)
    instance.show()
  })
}

export function hideModal(target: Elementish): void {
  toElements(target).forEach((el) => {
    const instance = Modal.getInstance(el) || Modal.getOrCreateInstance(el)
    instance.hide()
  })
}

export function disposeModal(target: Elementish): void {
  toElements(target).forEach((el) => Modal.getInstance(el)?.dispose())
}

// --- Tooltips --------------------------------------------------------------

// Bootstrap 5 strictly type-checks its options and rejects `null`/`undefined`
// where BS3 was lenient (e.g. `title`, `content`, `container`, `delay`). We
// normalise `title`/`content` to empty strings (they must be string|element|fn)
// and drop any other null/undefined keys so BS5 falls back to its defaults.
function sanitizeOverlayOptions<T extends Record<string, unknown>>(options: T): Partial<T> {
  const opts: Record<string, unknown> = { ...options }
  if ("title" in opts && opts.title == null) opts.title = ""
  if ("content" in opts && opts.content == null) opts.content = ""
  for (const key of Object.keys(opts)) {
    if (opts[key] == null) delete opts[key]
  }
  return opts as Partial<T>
}

export function initTooltips(target: Elementish, options?: Partial<Tooltip.Options>): void {
  toElements(target).forEach((el) => {
    Tooltip.getOrCreateInstance(el, sanitizeOverlayOptions(options || {}))
  })
}

export function showTooltip(target: Elementish): void {
  toElements(target).forEach((el) => Tooltip.getOrCreateInstance(el).show())
}

export function hideTooltip(target: Elementish): void {
  toElements(target).forEach((el) => Tooltip.getInstance(el)?.hide())
}

export function disposeTooltip(target: Elementish): void {
  toElements(target).forEach((el) => Tooltip.getInstance(el)?.dispose())
}

// --- Popovers --------------------------------------------------------------

export function initPopovers(target: Elementish, options?: Partial<Popover.Options>): void {
  toElements(target).forEach((el) => {
    Popover.getOrCreateInstance(el, sanitizeOverlayOptions(options || {}))
  })
}

export function disposePopover(target: Elementish): void {
  toElements(target).forEach((el) => Popover.getInstance(el)?.dispose())
}

// --- Tabs ------------------------------------------------------------------

export function showTab(target: Elementish): void {
  toElements(target).forEach((el) => Tab.getOrCreateInstance(el).show())
}

// --- Collapse / Dropdown (exposed for completeness) ------------------------

export function toggleCollapse(target: Elementish): void {
  toElements(target).forEach((el) => Collapse.getOrCreateInstance(el).toggle())
}

// Bootstrap 5's declarative dropdown data-API is only wired up in bundles that
// import "bootstrap" (essentials). The React widget bundles are separate esbuild
// entrypoints that do NOT import bootstrap, so `[data-bs-toggle="dropdown"]`
// buttons rendered by React have no toggle behaviour. This installs a single
// delegated click handler (once per document) that drives BS5's Dropdown for
// those buttons, matching what BS5 does globally.
let dropdownDelegationInstalled = false

export function enableDropdownDelegation(): void {
  if (dropdownDelegationInstalled || typeof document === "undefined") return
  dropdownDelegationInstalled = true

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const toggle = target.closest<HTMLElement>('[data-bs-toggle="dropdown"]')
    if (!toggle) return
    // Only handle real BS dropdowns (a resolvable .dropdown-menu sibling);
    // custom menus (e.g. mega dropdown) are left to their own handlers.
    const parent = toggle.parentElement
    const hasMenu = !!(parent && parent.querySelector(":scope > .dropdown-menu"))
    if (!hasMenu) return
    event.preventDefault()
    Dropdown.getOrCreateInstance(toggle).toggle()
  })
}

export { Modal, Tooltip, Popover, Tab, Collapse, Dropdown }

// Expose the engine globally so server-rendered inline scripts (.js.erb and
// inline <script> in HAML/ERB views) can drive Bootstrap 5 without importing.
declare global {
  interface Window {
    BootstrapEngine: {
      openModal: typeof openModal
      hideModal: typeof hideModal
      disposeModal: typeof disposeModal
      initTooltips: typeof initTooltips
      showTooltip: typeof showTooltip
      hideTooltip: typeof hideTooltip
      disposeTooltip: typeof disposeTooltip
      initPopovers: typeof initPopovers
      disposePopover: typeof disposePopover
      showTab: typeof showTab
      toggleCollapse: typeof toggleCollapse
    }
  }
}

window.BootstrapEngine = {
  openModal,
  hideModal,
  disposeModal,
  initTooltips,
  showTooltip,
  hideTooltip,
  disposeTooltip,
  initPopovers,
  disposePopover,
  showTab,
  toggleCollapse,
}
