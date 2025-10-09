"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const routerCore = require("@tanstack/router-core");
const utils = require("./utils.cjs");
const useRouter = require("./useRouter.cjs");
const useRouterState = require("./useRouterState.cjs");
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
function Transitioner() {
  const router = useRouter.useRouter();
  const mountLoadForRouter = React__namespace.useRef({ router, mounted: false });
  const [isTransitioning, setIsTransitioning] = React__namespace.useState(false);
  const { hasPendingMatches, isLoading } = useRouterState.useRouterState({
    select: (s) => ({
      isLoading: s.isLoading,
      hasPendingMatches: s.matches.some((d) => d.status === "pending")
    }),
    structuralSharing: true
  });
  const previousIsLoading = utils.usePrevious(isLoading);
  const isAnyPending = isLoading || isTransitioning || hasPendingMatches;
  const previousIsAnyPending = utils.usePrevious(isAnyPending);
  const isPagePending = isLoading || hasPendingMatches;
  const previousIsPagePending = utils.usePrevious(isPagePending);
  router.startTransition = (fn) => {
    setIsTransitioning(true);
    React__namespace.startTransition(() => {
      fn();
      setIsTransitioning(false);
    });
  };
  React__namespace.useEffect(() => {
    const unsub = router.history.subscribe(router.load);
    const nextLocation = router.buildLocation({
      to: router.latestLocation.pathname,
      search: true,
      params: true,
      hash: true,
      state: true,
      _includeValidateSearch: true
    });
    if (routerCore.trimPathRight(router.latestLocation.href) !== routerCore.trimPathRight(nextLocation.href)) {
      router.commitLocation({ ...nextLocation, replace: true });
    }
    return () => {
      unsub();
    };
  }, [router, router.history]);
  utils.useLayoutEffect(() => {
    if (
      // if we are hydrating from SSR, loading is triggered in ssr-client
      typeof window !== "undefined" && router.ssr || mountLoadForRouter.current.router === router && mountLoadForRouter.current.mounted
    ) {
      return;
    }
    mountLoadForRouter.current = { router, mounted: true };
    const tryLoad = async () => {
      try {
        await router.load();
      } catch (err) {
        console.error(err);
      }
    };
    tryLoad();
  }, [router]);
  utils.useLayoutEffect(() => {
    if (previousIsLoading && !isLoading) {
      router.emit({
        type: "onLoad",
        // When the new URL has committed, when the new matches have been loaded into state.matches
        ...routerCore.getLocationChangeInfo(router.state)
      });
    }
  }, [previousIsLoading, router, isLoading]);
  utils.useLayoutEffect(() => {
    if (previousIsPagePending && !isPagePending) {
      router.emit({
        type: "onBeforeRouteMount",
        ...routerCore.getLocationChangeInfo(router.state)
      });
    }
  }, [isPagePending, previousIsPagePending, router]);
  utils.useLayoutEffect(() => {
    if (previousIsAnyPending && !isAnyPending) {
      router.emit({
        type: "onResolved",
        ...routerCore.getLocationChangeInfo(router.state)
      });
      router.__store.setState((s) => ({
        ...s,
        status: "idle",
        resolvedLocation: s.location
      }));
      routerCore.handleHashScroll(router);
    }
  }, [isAnyPending, previousIsAnyPending, router]);
  return null;
}
exports.Transitioner = Transitioner;
//# sourceMappingURL=Transitioner.cjs.map
