import { useMatch } from "./useMatch.js";
function useLoaderDeps(opts) {
  const { select, ...rest } = opts;
  return useMatch({
    ...rest,
    select: (s) => {
      return select ? select(s.loaderDeps) : s.loaderDeps;
    }
  });
}
export {
  useLoaderDeps
};
//# sourceMappingURL=useLoaderDeps.js.map
