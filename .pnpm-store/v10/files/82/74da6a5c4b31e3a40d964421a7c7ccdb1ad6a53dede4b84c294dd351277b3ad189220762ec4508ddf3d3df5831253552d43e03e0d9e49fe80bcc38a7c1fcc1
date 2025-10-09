"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const Matches = require("./Matches.cjs");
const routerContext = require("./routerContext.cjs");
function RouterContextProvider({
  router,
  children,
  ...rest
}) {
  if (Object.keys(rest).length > 0) {
    router.update({
      ...router.options,
      ...rest,
      context: {
        ...router.options.context,
        ...rest.context
      }
    });
  }
  const routerContext$1 = routerContext.getRouterContext();
  const provider = /* @__PURE__ */ jsxRuntime.jsx(routerContext$1.Provider, { value: router, children });
  if (router.options.Wrap) {
    return /* @__PURE__ */ jsxRuntime.jsx(router.options.Wrap, { children: provider });
  }
  return provider;
}
function RouterProvider({ router, ...rest }) {
  return /* @__PURE__ */ jsxRuntime.jsx(RouterContextProvider, { router, ...rest, children: /* @__PURE__ */ jsxRuntime.jsx(Matches.Matches, {}) });
}
exports.RouterContextProvider = RouterContextProvider;
exports.RouterProvider = RouterProvider;
//# sourceMappingURL=RouterProvider.cjs.map
