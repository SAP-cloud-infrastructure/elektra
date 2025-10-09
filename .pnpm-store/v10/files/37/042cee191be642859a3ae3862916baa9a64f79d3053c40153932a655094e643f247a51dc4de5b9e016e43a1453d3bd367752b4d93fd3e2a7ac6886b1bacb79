"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
function ClientOnly({ children, fallback = null }) {
  return useHydrated() ? /* @__PURE__ */ jsxRuntime.jsx(React.Fragment, { children }) : /* @__PURE__ */ jsxRuntime.jsx(React.Fragment, { children: fallback });
}
function useHydrated() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
function subscribe() {
  return () => {
  };
}
exports.ClientOnly = ClientOnly;
//# sourceMappingURL=ClientOnly.cjs.map
