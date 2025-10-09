import * as React from "react";
import invariant from "tiny-invariant";
import { useRouterState } from "./useRouterState.js";
import { dummyMatchContext, matchContext } from "./matchContext.js";
function useMatch(opts) {
  const nearestMatchId = React.useContext(
    opts.from ? dummyMatchContext : matchContext
  );
  const matchSelection = useRouterState({
    select: (state) => {
      const match = state.matches.find(
        (d) => opts.from ? opts.from === d.routeId : d.id === nearestMatchId
      );
      invariant(
        !((opts.shouldThrow ?? true) && !match),
        `Could not find ${opts.from ? `an active match from "${opts.from}"` : "a nearest match!"}`
      );
      if (match === void 0) {
        return void 0;
      }
      return opts.select ? opts.select(match) : match;
    },
    structuralSharing: opts.structuralSharing
  });
  return matchSelection;
}
export {
  useMatch
};
//# sourceMappingURL=useMatch.js.map
