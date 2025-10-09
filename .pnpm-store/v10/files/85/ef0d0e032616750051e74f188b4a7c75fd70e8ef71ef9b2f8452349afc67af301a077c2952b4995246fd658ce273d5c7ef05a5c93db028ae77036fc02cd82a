import { useRouterState } from "./useRouterState.js";
function useLocation(opts) {
  return useRouterState({
    select: (state) => (opts == null ? void 0 : opts.select) ? opts.select(state.location) : state.location
  });
}
export {
  useLocation
};
//# sourceMappingURL=useLocation.js.map
