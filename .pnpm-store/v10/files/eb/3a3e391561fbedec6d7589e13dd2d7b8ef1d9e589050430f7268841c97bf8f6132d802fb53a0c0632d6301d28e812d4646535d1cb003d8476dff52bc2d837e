import { useStore } from "@tanstack/react-store";
import { useRef } from "react";
import { replaceEqualDeep } from "@tanstack/router-core";
import { useRouter } from "./useRouter.js";
function useRouterState(opts) {
  const contextRouter = useRouter({
    warn: (opts == null ? void 0 : opts.router) === void 0
  });
  const router = (opts == null ? void 0 : opts.router) || contextRouter;
  const previousResult = useRef(void 0);
  return useStore(router.__store, (state) => {
    if (opts == null ? void 0 : opts.select) {
      if (opts.structuralSharing ?? router.options.defaultStructuralSharing) {
        const newSlice = replaceEqualDeep(
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
export {
  useRouterState
};
//# sourceMappingURL=useRouterState.js.map
