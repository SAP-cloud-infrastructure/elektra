"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const reactStore = require("@tanstack/react-store");
const React = require("react");
const routerCore = require("@tanstack/router-core");
const useRouter = require("./useRouter.cjs");
function useRouterState(opts) {
  const contextRouter = useRouter.useRouter({
    warn: (opts == null ? void 0 : opts.router) === void 0
  });
  const router = (opts == null ? void 0 : opts.router) || contextRouter;
  const previousResult = React.useRef(void 0);
  return reactStore.useStore(router.__store, (state) => {
    if (opts == null ? void 0 : opts.select) {
      if (opts.structuralSharing ?? router.options.defaultStructuralSharing) {
        const newSlice = routerCore.replaceEqualDeep(
          previousResult.current,
          opts.select(state)
        );
        previousResult.current = newSlice;
        return newSlice;
      }
      return opts.select(state);
    }
    return state;
  });
}
exports.useRouterState = useRouterState;
//# sourceMappingURL=useRouterState.cjs.map
