import { jsx } from "react/jsx-runtime";
import React__default from "react";
function ClientOnly({ children, fallback = null }) {
  return useHydrated() ? /* @__PURE__ */ jsx(React__default.Fragment, { children }) : /* @__PURE__ */ jsx(React__default.Fragment, { children: fallback });
}
function useHydrated() {
  return React__default.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
function subscribe() {
  return () => {
  };
}
export {
  ClientOnly
};
//# sourceMappingURL=ClientOnly.js.map
