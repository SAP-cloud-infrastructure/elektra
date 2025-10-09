"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const invariant = require("tiny-invariant");
const store = require("@tanstack/store");
const utils = require("../utils.cjs");
function hydrateMatch(match, deyhydratedMatch) {
  match.id = deyhydratedMatch.i;
  match.__beforeLoadContext = deyhydratedMatch.b;
  match.loaderData = deyhydratedMatch.l;
  match.status = deyhydratedMatch.s;
  match.ssr = deyhydratedMatch.ssr;
  match.updatedAt = deyhydratedMatch.u;
  match.error = deyhydratedMatch.e;
}
async function hydrate(router) {
  var _a, _b, _c;
  invariant(
    (_a = window.$_TSR) == null ? void 0 : _a.router,
    "Expected to find a dehydrated data on window.$_TSR.router, but we did not. Please file an issue!"
  );
  const { manifest, dehydratedData, lastMatchId } = window.$_TSR.router;
  router.ssr = {
    manifest
  };
  const matches = router.matchRoutes(router.state.location);
  const routeChunkPromise = Promise.all(
    matches.map((match) => {
      const route = router.looseRoutesById[match.routeId];
      return router.loadRouteChunk(route);
    })
  );
  function setMatchForcePending(match) {
    const route = router.looseRoutesById[match.routeId];
    const pendingMinMs = route.options.pendingMinMs ?? router.options.defaultPendingMinMs;
    if (pendingMinMs) {
      const minPendingPromise = utils.createControlledPromise();
      match._nonReactive.minPendingPromise = minPendingPromise;
      match._forcePending = true;
      setTimeout(() => {
        minPendingPromise.resolve();
        router.updateMatch(match.id, (prev) => {
          prev._nonReactive.minPendingPromise = void 0;
          return {
            ...prev,
            _forcePending: void 0
          };
        });
      }, pendingMinMs);
    }
  }
  let firstNonSsrMatchIndex = void 0;
  matches.forEach((match) => {
    const dehydratedMatch = window.$_TSR.router.matches.find(
      (d) => d.i === match.id
    );
    if (!dehydratedMatch) {
      match._nonReactive.dehydrated = false;
      match.ssr = false;
      return;
    }
    hydrateMatch(match, dehydratedMatch);
    match._nonReactive.dehydrated = match.ssr !== false;
    if (match.ssr === "data-only" || match.ssr === false) {
      if (firstNonSsrMatchIndex === void 0) {
        firstNonSsrMatchIndex = match.index;
        setMatchForcePending(match);
      }
    }
  });
  router.__store.setState((s) => {
    return {
      ...s,
      matches
    };
  });
  await ((_c = (_b = router.options).hydrate) == null ? void 0 : _c.call(_b, dehydratedData));
  await Promise.all(
    router.state.matches.map(async (match) => {
      var _a2, _b2, _c2, _d;
      const route = router.looseRoutesById[match.routeId];
      const parentMatch = router.state.matches[match.index - 1];
      const parentContext = (parentMatch == null ? void 0 : parentMatch.context) ?? router.options.context;
      if (route.options.context) {
        const contextFnContext = {
          deps: match.loaderDeps,
          params: match.params,
          context: parentContext ?? {},
          location: router.state.location,
          navigate: (opts) => router.navigate({ ...opts, _fromLocation: router.state.location }),
          buildLocation: router.buildLocation,
          cause: match.cause,
          abortController: match.abortController,
          preload: false,
          matches
        };
        match.__routeContext = route.options.context(contextFnContext) ?? void 0;
      }
      match.context = {
        ...parentContext,
        ...match.__routeContext,
        ...match.__beforeLoadContext
      };
      const assetContext = {
        matches: router.state.matches,
        match,
        params: match.params,
        loaderData: match.loaderData
      };
      const headFnContent = await ((_b2 = (_a2 = route.options).head) == null ? void 0 : _b2.call(_a2, assetContext));
      const scripts = await ((_d = (_c2 = route.options).scripts) == null ? void 0 : _d.call(_c2, assetContext));
      match.meta = headFnContent == null ? void 0 : headFnContent.meta;
      match.links = headFnContent == null ? void 0 : headFnContent.links;
      match.headScripts = headFnContent == null ? void 0 : headFnContent.scripts;
      match.styles = headFnContent == null ? void 0 : headFnContent.styles;
      match.scripts = scripts;
    })
  );
  const isSpaMode = matches[matches.length - 1].id !== lastMatchId;
  const hasSsrFalseMatches = matches.some((m) => m.ssr === false);
  if (!hasSsrFalseMatches && !isSpaMode) {
    matches.forEach((match) => {
      match._nonReactive.dehydrated = void 0;
    });
    return routeChunkPromise;
  }
  const loadPromise = Promise.resolve().then(() => router.load()).catch((err) => {
    console.error("Error during router hydration:", err);
  });
  if (isSpaMode) {
    const match = matches[1];
    invariant(
      match,
      "Expected to find a match below the root match in SPA mode."
    );
    setMatchForcePending(match);
    match._displayPending = true;
    match._nonReactive.displayPendingPromise = loadPromise;
    loadPromise.then(() => {
      store.batch(() => {
        if (router.__store.state.status === "pending") {
          router.__store.setState((s) => ({
            ...s,
            status: "idle",
            resolvedLocation: s.location
          }));
        }
        router.updateMatch(match.id, (prev) => {
          return {
            ...prev,
            _displayPending: void 0,
            displayPendingPromise: void 0
          };
        });
      });
    });
  }
  return routeChunkPromise;
}
exports.hydrate = hydrate;
//# sourceMappingURL=ssr-client.cjs.map
