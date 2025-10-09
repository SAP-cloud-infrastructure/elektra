import { useMatch } from "./useMatch.js";
function useLoaderData(opts) {
  return useMatch({
    from: opts.from,
    strict: opts.strict,
    structuralSharing: opts.structuralSharing,
    select: (s) => {
      return opts.select ? opts.select(s.loaderData) : s.loaderData;
    }
  });
}
export {
  useLoaderData
};
//# sourceMappingURL=useLoaderData.js.map
