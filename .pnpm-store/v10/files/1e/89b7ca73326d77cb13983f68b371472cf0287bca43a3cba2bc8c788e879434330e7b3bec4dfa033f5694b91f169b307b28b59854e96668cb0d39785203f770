"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const template = require("@babel/template");
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
const template__namespace = /* @__PURE__ */ _interopNamespaceDefault(template);
const routeHmrStatement = template__namespace.statement(
  `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.Route && typeof newModule.Route.clone === 'function') {
      newModule.Route.clone(Route)
    }
   })
}
`
)();
exports.routeHmrStatement = routeHmrStatement;
//# sourceMappingURL=route-hmr-statement.cjs.map
