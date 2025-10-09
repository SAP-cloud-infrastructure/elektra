import { useMatch } from "./useMatch.js";
function useParams(opts) {
  return useMatch({
    from: opts.from,
    strict: opts.strict,
    shouldThrow: opts.shouldThrow,
    structuralSharing: opts.structuralSharing,
    select: (match) => {
      return opts.select ? opts.select(match.params) : match.params;
    }
  });
}
export {
  useParams
};
//# sourceMappingURL=useParams.js.map
