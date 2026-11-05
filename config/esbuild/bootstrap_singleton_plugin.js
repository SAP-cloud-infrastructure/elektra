const path = require("path")

// -----------------------------------------------------------------------------
// Bootstrap singleton plugin
// -----------------------------------------------------------------------------
// esbuild builds every top-level file in app/javascript as its own bundle with
// `bundle: true` and no code splitting. Because of that, every bundle that
// imports "bootstrap" (directly, or transitively via core/bootstrap_engine.ts)
// used to embed its OWN private copy of Bootstrap 5. Each copy registers its
// own delegated `[data-bs-toggle]` data-api click listener on `document`, and
// each has its own private instance cache. So a single click on a server-
// rendered modal toggle fired N listeners, created N independent Modal
// instances for the same element, and appended N `.modal-backdrop` elements —
// which stacked and made the backdrop far too dark.
//
// Fix: load Bootstrap exactly ONCE. The `essentials` bundle (the first script
// tag on the page) imports the real Bootstrap and publishes it on
// `window.bootstrap`. Every OTHER bundle gets its `import ... from "bootstrap"`
// rewritten to a tiny shim that re-exports that single `window.bootstrap`
// instance, so there is one Bootstrap, one data-api listener, one backdrop.
//
// `essentials.js` itself imports the real module via the dedicated
// "bootstrap/real" specifier below, which this plugin resolves to the actual
// package and is NOT turned into the shim.
// -----------------------------------------------------------------------------

const REAL_SPECIFIER = "bootstrap/real"
const NAMESPACE = "bootstrap-singleton-shim"

// Named exports we re-expose from the global. Keep in sync with what the app
// imports from "bootstrap" (see core/bootstrap_engine.ts).
const NAMED_EXPORTS = ["Modal", "Tooltip", "Popover", "Tab", "Collapse", "Dropdown", "Alert", "Button", "Carousel", "Offcanvas", "ScrollSpy", "Toast"]

const bootstrapSingletonPlugin = () => ({
  name: "bootstrap-singleton",
  setup(build) {
    // 1. "bootstrap/real" -> the actual package entry (used only by essentials).
    build.onResolve({ filter: /^bootstrap\/real$/ }, () => ({
      path: require.resolve("bootstrap"),
    }))

    // 2. Every bare "bootstrap" import -> our shim in a virtual namespace.
    build.onResolve({ filter: /^bootstrap$/ }, (args) => {
      // Do not rewrite the real import coming from the resolver above.
      if (args.path === REAL_SPECIFIER) return undefined
      return { path: "bootstrap", namespace: NAMESPACE }
    })

    // 3. The shim module re-exports the single global instance via lazy getters
    //    so the lookup always resolves against the live `window.bootstrap`
    //    (set by essentials before any other bundle runs), regardless of module
    //    evaluation order.
    build.onLoad({ filter: /.*/, namespace: NAMESPACE }, () => {
      const named = NAMED_EXPORTS.map(
        (name) =>
          `Object.defineProperty(exports, "${name}", { enumerable: true, get: () => (globalThis.bootstrap || {}).${name} })`
      ).join("\n")
      const contents = `
Object.defineProperty(exports, "__esModule", { value: true })
Object.defineProperty(exports, "default", { enumerable: true, get: () => globalThis.bootstrap || {} })
${named}
`
      return { contents, loader: "js", resolveDir: path.resolve(__dirname, "../../") }
    })
  },
})

module.exports = bootstrapSingletonPlugin
