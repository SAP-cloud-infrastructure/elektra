"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const routerCore = require("@tanstack/router-core");
const CatchBoundary = require("./CatchBoundary.cjs");
const useRouterState = require("./useRouterState.cjs");
function CatchNotFound(props) {
  const resetKey = useRouterState.useRouterState({
    select: (s) => `not-found-${s.location.pathname}-${s.status}`
  });
  return /* @__PURE__ */ jsxRuntime.jsx(
    CatchBoundary.CatchBoundary,
    {
      getResetKey: () => resetKey,
      onCatch: (error, errorInfo) => {
        var _a;
        if (routerCore.isNotFound(error)) {
          (_a = props.onCatch) == null ? void 0 : _a.call(props, error, errorInfo);
        } else {
          throw error;
        }
      },
      errorComponent: ({ error }) => {
        var _a;
        if (routerCore.isNotFound(error)) {
          return (_a = props.fallback) == null ? void 0 : _a.call(props, error);
        } else {
          throw error;
        }
      },
      children: props.children
    }
  );
}
function DefaultGlobalNotFound() {
  return /* @__PURE__ */ jsxRuntime.jsx("p", { children: "Not Found" });
}
exports.CatchNotFound = CatchNotFound;
exports.DefaultGlobalNotFound = DefaultGlobalNotFound;
//# sourceMappingURL=not-found.cjs.map
