import { useMatch } from "./useMatch.js";
function useRouteContext(opts) {
  return useMatch({
    ...opts,
    select: (match) => opts.select ? opts.select(match.context) : match.context
  });
}
export {
  useRouteContext
};
//# sourceMappingURL=useRouteContext.js.map
