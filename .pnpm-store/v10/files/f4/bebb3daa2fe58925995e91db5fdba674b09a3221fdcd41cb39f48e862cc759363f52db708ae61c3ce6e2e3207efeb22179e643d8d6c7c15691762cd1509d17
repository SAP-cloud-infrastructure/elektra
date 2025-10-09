"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const routerCore = require("@tanstack/router-core");
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
function useAwaited({
  promise: _promise
}) {
  const promise = routerCore.defer(_promise);
  if (promise[routerCore.TSR_DEFERRED_PROMISE].status === "pending") {
    throw promise;
  }
  if (promise[routerCore.TSR_DEFERRED_PROMISE].status === "error") {
    throw promise[routerCore.TSR_DEFERRED_PROMISE].error;
  }
  return [promise[routerCore.TSR_DEFERRED_PROMISE].data, promise];
}
function Await(props) {
  const inner = /* @__PURE__ */ jsxRuntime.jsx(AwaitInner, { ...props });
  if (props.fallback) {
    return /* @__PURE__ */ jsxRuntime.jsx(React__namespace.Suspense, { fallback: props.fallback, children: inner });
  }
  return inner;
}
function AwaitInner(props) {
  const [data] = useAwaited(props);
  return props.children(data);
}
exports.Await = Await;
exports.useAwaited = useAwaited;
//# sourceMappingURL=awaited.cjs.map
