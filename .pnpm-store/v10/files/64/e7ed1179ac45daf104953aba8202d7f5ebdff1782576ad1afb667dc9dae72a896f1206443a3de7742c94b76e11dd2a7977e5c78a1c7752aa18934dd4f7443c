"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const warning = require("tiny-warning");
const notFound = require("./not-found.cjs");
function renderRouteNotFound(router, route, data) {
  if (!route.options.notFoundComponent) {
    if (router.options.defaultNotFoundComponent) {
      return /* @__PURE__ */ jsxRuntime.jsx(router.options.defaultNotFoundComponent, { data });
    }
    if (process.env.NODE_ENV === "development") {
      warning(
        route.options.notFoundComponent,
        `A notFoundError was encountered on the route with ID "${route.id}", but a notFoundComponent option was not configured, nor was a router level defaultNotFoundComponent configured. Consider configuring at least one of these to avoid TanStack Router's overly generic defaultNotFoundComponent (<div>Not Found<div>)`
      );
    }
    return /* @__PURE__ */ jsxRuntime.jsx(notFound.DefaultGlobalNotFound, {});
  }
  return /* @__PURE__ */ jsxRuntime.jsx(route.options.notFoundComponent, { data });
}
exports.renderRouteNotFound = renderRouteNotFound;
//# sourceMappingURL=renderRouteNotFound.cjs.map
