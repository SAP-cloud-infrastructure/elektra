import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import invariant from "tiny-invariant";
import warning from "tiny-warning";
import { isNotFound, rootRouteId, createControlledPromise, isRedirect, getLocationChangeInfo } from "@tanstack/router-core";
import { CatchBoundary, ErrorComponent } from "./CatchBoundary.js";
import { useRouterState } from "./useRouterState.js";
import { useRouter } from "./useRouter.js";
import { CatchNotFound } from "./not-found.js";
import { matchContext } from "./matchContext.js";
import { SafeFragment } from "./SafeFragment.js";
import { renderRouteNotFound } from "./renderRouteNotFound.js";
import { ScrollRestoration } from "./scroll-restoration.js";
import { ClientOnly } from "./ClientOnly.js";
const Match = React.memo(function MatchImpl({
  matchId
}) {
  var _a, _b;
  const router = useRouter();
  const matchState = useRouterState({
    select: (s) => {
      const match = s.matches.find((d) => d.id === matchId);
      invariant(
        match,
        `Could not find match for matchId "${matchId}". Please file an issue!`
      );
      return {
        routeId: match.routeId,
        ssr: match.ssr,
        _displayPending: match._displayPending
      };
    },
    structuralSharing: true
  });
  const route = router.routesById[matchState.routeId];
  const PendingComponent = route.options.pendingComponent ?? router.options.defaultPendingComponent;
  const pendingElement = PendingComponent ? /* @__PURE__ */ jsx(PendingComponent, {}) : null;
  const routeErrorComponent = route.options.errorComponent ?? router.options.defaultErrorComponent;
  const routeOnCatch = route.options.onCatch ?? router.options.defaultOnCatch;
  const routeNotFoundComponent = route.isRoot ? (
    // If it's the root route, use the globalNotFound option, with fallback to the notFoundRoute's component
    route.options.notFoundComponent ?? ((_a = router.options.notFoundRoute) == null ? void 0 : _a.options.component)
  ) : route.options.notFoundComponent;
  const resolvedNoSsr = matchState.ssr === false || matchState.ssr === "data-only";
  const ResolvedSuspenseBoundary = (
    // If we're on the root route, allow forcefully wrapping in suspense
    (!route.isRoot || route.options.wrapInSuspense || resolvedNoSsr) && (route.options.wrapInSuspense ?? PendingComponent ?? (((_b = route.options.errorComponent) == null ? void 0 : _b.preload) || resolvedNoSsr)) ? React.Suspense : SafeFragment
  );
  const ResolvedCatchBoundary = routeErrorComponent ? CatchBoundary : SafeFragment;
  const ResolvedNotFoundBoundary = routeNotFoundComponent ? CatchNotFound : SafeFragment;
  const resetKey = useRouterState({
    select: (s) => s.loadedAt
  });
  const parentRouteId = useRouterState({
    select: (s) => {
      var _a2;
      const index = s.matches.findIndex((d) => d.id === matchId);
      return (_a2 = s.matches[index - 1]) == null ? void 0 : _a2.routeId;
    }
  });
  const ShellComponent = route.isRoot ? route.options.shellComponent ?? SafeFragment : SafeFragment;
  return /* @__PURE__ */ jsxs(ShellComponent, { children: [
    /* @__PURE__ */ jsx(matchContext.Provider, { value: matchId, children: /* @__PURE__ */ jsx(ResolvedSuspenseBoundary, { fallback: pendingElement, children: /* @__PURE__ */ jsx(
      ResolvedCatchBoundary,
      {
        getResetKey: () => resetKey,
        errorComponent: routeErrorComponent || ErrorComponent,
        onCatch: (error, errorInfo) => {
          if (isNotFound(error)) throw error;
          warning(false, `Error in route match: ${matchId}`);
          routeOnCatch == null ? void 0 : routeOnCatch(error, errorInfo);
        },
        children: /* @__PURE__ */ jsx(
          ResolvedNotFoundBoundary,
          {
            fallback: (error) => {
              if (!routeNotFoundComponent || error.routeId && error.routeId !== matchState.routeId || !error.routeId && !route.isRoot)
                throw error;
              return React.createElement(routeNotFoundComponent, error);
            },
            children: resolvedNoSsr || matchState._displayPending ? /* @__PURE__ */ jsx(ClientOnly, { fallback: pendingElement, children: /* @__PURE__ */ jsx(MatchInner, { matchId }) }) : /* @__PURE__ */ jsx(MatchInner, { matchId })
          }
        )
      }
    ) }) }),
    parentRouteId === rootRouteId && router.options.scrollRestoration ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(OnRendered, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {})
    ] }) : null
  ] });
});
function OnRendered() {
  const router = useRouter();
  const prevLocationRef = React.useRef(
    void 0
  );
  return /* @__PURE__ */ jsx(
    "script",
    {
      suppressHydrationWarning: true,
      ref: (el) => {
        if (el && (prevLocationRef.current === void 0 || prevLocationRef.current.href !== router.latestLocation.href)) {
          router.emit({
            type: "onRendered",
            ...getLocationChangeInfo(router.state)
          });
          prevLocationRef.current = router.latestLocation;
        }
      }
    },
    router.latestLocation.state.__TSR_key
  );
}
const MatchInner = React.memo(function MatchInnerImpl({
  matchId
}) {
  var _a, _b, _c, _d;
  const router = useRouter();
  const { match, key, routeId } = useRouterState({
    select: (s) => {
      const match2 = s.matches.find((d) => d.id === matchId);
      const routeId2 = match2.routeId;
      const remountFn = router.routesById[routeId2].options.remountDeps ?? router.options.defaultRemountDeps;
      const remountDeps = remountFn == null ? void 0 : remountFn({
        routeId: routeId2,
        loaderDeps: match2.loaderDeps,
        params: match2._strictParams,
        search: match2._strictSearch
      });
      const key2 = remountDeps ? JSON.stringify(remountDeps) : void 0;
      return {
        key: key2,
        routeId: routeId2,
        match: {
          id: match2.id,
          status: match2.status,
          error: match2.error,
          _forcePending: match2._forcePending,
          _displayPending: match2._displayPending
        }
      };
    },
    structuralSharing: true
  });
  const route = router.routesById[routeId];
  const out = React.useMemo(() => {
    const Comp = route.options.component ?? router.options.defaultComponent;
    if (Comp) {
      return /* @__PURE__ */ jsx(Comp, {}, key);
    }
    return /* @__PURE__ */ jsx(Outlet, {});
  }, [key, route.options.component, router.options.defaultComponent]);
  if (match._displayPending) {
    throw (_a = router.getMatch(match.id)) == null ? void 0 : _a._nonReactive.displayPendingPromise;
  }
  if (match._forcePending) {
    throw (_b = router.getMatch(match.id)) == null ? void 0 : _b._nonReactive.minPendingPromise;
  }
  if (match.status === "pending") {
    const pendingMinMs = route.options.pendingMinMs ?? router.options.defaultPendingMinMs;
    if (pendingMinMs) {
      const routerMatch = router.getMatch(match.id);
      if (routerMatch && !routerMatch._nonReactive.minPendingPromise) {
        if (!router.isServer) {
          const minPendingPromise = createControlledPromise();
          routerMatch._nonReactive.minPendingPromise = minPendingPromise;
          setTimeout(() => {
            minPendingPromise.resolve();
            routerMatch._nonReactive.minPendingPromise = void 0;
          }, pendingMinMs);
        }
      }
    }
    throw (_c = router.getMatch(match.id)) == null ? void 0 : _c._nonReactive.loadPromise;
  }
  if (match.status === "notFound") {
    invariant(isNotFound(match.error), "Expected a notFound error");
    return renderRouteNotFound(router, route, match.error);
  }
  if (match.status === "redirected") {
    invariant(isRedirect(match.error), "Expected a redirect error");
    throw (_d = router.getMatch(match.id)) == null ? void 0 : _d._nonReactive.loadPromise;
  }
  if (match.status === "error") {
    if (router.isServer) {
      const RouteErrorComponent = (route.options.errorComponent ?? router.options.defaultErrorComponent) || ErrorComponent;
      return /* @__PURE__ */ jsx(
        RouteErrorComponent,
        {
          error: match.error,
          reset: void 0,
          info: {
            componentStack: ""
          }
        }
      );
    }
    throw match.error;
  }
  return out;
});
const Outlet = React.memo(function OutletImpl() {
  const router = useRouter();
  const matchId = React.useContext(matchContext);
  const routeId = useRouterState({
    select: (s) => {
      var _a;
      return (_a = s.matches.find((d) => d.id === matchId)) == null ? void 0 : _a.routeId;
    }
  });
  const route = router.routesById[routeId];
  const parentGlobalNotFound = useRouterState({
    select: (s) => {
      const matches = s.matches;
      const parentMatch = matches.find((d) => d.id === matchId);
      invariant(
        parentMatch,
        `Could not find parent match for matchId "${matchId}"`
      );
      return parentMatch.globalNotFound;
    }
  });
  const childMatchId = useRouterState({
    select: (s) => {
      var _a;
      const matches = s.matches;
      const index = matches.findIndex((d) => d.id === matchId);
      return (_a = matches[index + 1]) == null ? void 0 : _a.id;
    }
  });
  const pendingElement = router.options.defaultPendingComponent ? /* @__PURE__ */ jsx(router.options.defaultPendingComponent, {}) : null;
  if (parentGlobalNotFound) {
    return renderRouteNotFound(router, route, void 0);
  }
  if (!childMatchId) {
    return null;
  }
  const nextMatch = /* @__PURE__ */ jsx(Match, { matchId: childMatchId });
  if (matchId === rootRouteId) {
    return /* @__PURE__ */ jsx(React.Suspense, { fallback: pendingElement, children: nextMatch });
  }
  return nextMatch;
});
export {
  Match,
  MatchInner,
  Outlet
};
//# sourceMappingURL=Match.js.map
