import { jsx } from "react/jsx-runtime";
import { Matches } from "./Matches.js";
import { getRouterContext } from "./routerContext.js";
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
  const routerContext = getRouterContext();
  const provider = /* @__PURE__ */ jsx(routerContext.Provider, { value: router, children });
  if (router.options.Wrap) {
    return /* @__PURE__ */ jsx(router.options.Wrap, { children: provider });
  }
  return provider;
}
function RouterProvider({ router, ...rest }) {
  return /* @__PURE__ */ jsx(RouterContextProvider, { router, ...rest, children: /* @__PURE__ */ jsx(Matches, {}) });
}
export {
  RouterContextProvider,
  RouterProvider
};
//# sourceMappingURL=RouterProvider.js.map
