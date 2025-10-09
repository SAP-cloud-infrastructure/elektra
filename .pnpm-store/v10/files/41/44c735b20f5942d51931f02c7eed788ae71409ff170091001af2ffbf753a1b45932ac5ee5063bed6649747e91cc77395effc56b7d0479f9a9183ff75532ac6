"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const warning = require("tiny-warning");
const CatchBoundary = require("./CatchBoundary.cjs");
const useRouterState = require("./useRouterState.cjs");
const useRouter = require("./useRouter.cjs");
const Transitioner = require("./Transitioner.cjs");
const matchContext = require("./matchContext.cjs");
const Match = require("./Match.cjs");
const SafeFragment = require("./SafeFragment.cjs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespaceDefault(React);
function Matches() {
  const router = useRouter.useRouter();
  const pendingElement = router.options.defaultPendingComponent ? /* @__PURE__ */ jsxRuntime.jsx(router.options.defaultPendingComponent, {}) : null;
  const ResolvedSuspense = router.isServer || typeof document !== "undefined" && router.ssr ? SafeFragment.SafeFragment : React__namespace.Suspense;
  const inner = /* @__PURE__ */ jsxRuntime.jsxs(ResolvedSuspense, { fallback: pendingElement, children: [
    !router.isServer && /* @__PURE__ */ jsxRuntime.jsx(Transitioner.Transitioner, {}),
    /* @__PURE__ */ jsxRuntime.jsx(MatchesInner, {})
  ] });
  return router.options.InnerWrap ? /* @__PURE__ */ jsxRuntime.jsx(router.options.InnerWrap, { children: inner }) : inner;
}
function MatchesInner() {
  const router = useRouter.useRouter();
  const matchId = useRouterState.useRouterState({
    select: (s) => {
      var _a;
      return (_a = s.matches[0]) == null ? void 0 : _a.id;
    }
  });
  const resetKey = useRouterState.useRouterState({
    select: (s) => s.loadedAt
  });
  const matchComponent = matchId ? /* @__PURE__ */ jsxRuntime.jsx(Match.Match, { matchId }) : null;
  return /* @__PURE__ */ jsxRuntime.jsx(matchContext.matchContext.Provider, { value: matchId, children: router.options.disableGlobalCatchBoundary ? matchComponent : /* @__PURE__ */ jsxRuntime.jsx(
    CatchBoundary.CatchBoundary,
    {
      getResetKey: () => resetKey,
      errorComponent: CatchBoundary.ErrorComponent,
      onCatch: (error) => {
        warning(
          false,
          `The following error wasn't caught by any route! At the very least, consider setting an 'errorComponent' in your RootRoute!`
        );
        warning(false, error.message || error.toString());
      },
      children: matchComponent
    }
  ) });
}
function useMatchRoute() {
  const router = useRouter.useRouter();
  useRouterState.useRouterState({
    select: (s) => {
      var _a;
      return [s.location.href, (_a = s.resolvedLocation) == null ? void 0 : _a.href, s.status];
    },
    structuralSharing: true
  });
  return React__namespace.useCallback(
    (opts) => {
      const { pending, caseSensitive, fuzzy, includeSearch, ...rest } = opts;
      return router.matchRoute(rest, {
        pending,
        caseSensitive,
        fuzzy,
        includeSearch
      });
    },
    [router]
  );
}
function MatchRoute(props) {
  const matchRoute = useMatchRoute();
  const params = matchRoute(props);
  if (typeof props.children === "function") {
    return props.children(params);
  }
  return params ? props.children : null;
}
function useMatches(opts) {
  return useRouterState.useRouterState({
    select: (state) => {
      const matches = state.matches;
      return (opts == null ? void 0 : opts.select) ? opts.select(matches) : matches;
    },
    structuralSharing: opts == null ? void 0 : opts.structuralSharing
  });
}
function useParentMatches(opts) {
  const contextMatchId = React__namespace.useContext(matchContext.matchContext);
  return useMatches({
    select: (matches) => {
      matches = matches.slice(
        0,
        matches.findIndex((d) => d.id === contextMatchId)
      );
      return (opts == null ? void 0 : opts.select) ? opts.select(matches) : matches;
    },
    structuralSharing: opts == null ? void 0 : opts.structuralSharing
  });
}
function useChildMatches(opts) {
  const contextMatchId = React__namespace.useContext(matchContext.matchContext);
  return useMatches({
    select: (matches) => {
      matches = matches.slice(
        matches.findIndex((d) => d.id === contextMatchId) + 1
      );
      return (opts == null ? void 0 : opts.select) ? opts.select(matches) : matches;
    },
    structuralSharing: opts == null ? void 0 : opts.structuralSharing
  });
}
exports.MatchRoute = MatchRoute;
exports.Matches = Matches;
exports.useChildMatches = useChildMatches;
exports.useMatchRoute = useMatchRoute;
exports.useMatches = useMatches;
exports.useParentMatches = useParentMatches;
//# sourceMappingURL=Matches.cjs.map
