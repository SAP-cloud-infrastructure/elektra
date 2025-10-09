"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const warning = require("tiny-warning");
const routerContext = require("./routerContext.cjs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespaceDefault(React);
function useRouter(opts) {
  const value = React__namespace.useContext(routerContext.getRouterContext());
  warning(
    !(((opts == null ? void 0 : opts.warn) ?? true) && !value),
    "useRouter must be used inside a <RouterProvider> component!"
  );
  return value;
}
exports.useRouter = useRouter;
//# sourceMappingURL=useRouter.cjs.map
