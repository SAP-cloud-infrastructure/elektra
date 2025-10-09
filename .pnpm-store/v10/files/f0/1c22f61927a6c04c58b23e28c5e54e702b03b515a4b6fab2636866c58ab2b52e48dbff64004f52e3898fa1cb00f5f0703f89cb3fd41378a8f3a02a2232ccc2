import { batch } from "@tanstack/store";
import invariant from "tiny-invariant";
import { isPromise, createControlledPromise } from "./utils.js";
import { isNotFound } from "./not-found.js";
import { rootRouteId } from "./root.js";
import { isRedirect } from "./redirect.js";
const triggerOnReady = (inner) => {
  var _a;
  if (!inner.rendered) {
    inner.rendered = true;
    return (_a = inner.onReady) == null ? void 0 : _a.call(inner);
  }
};
const resolvePreload = (inner, matchId) => {
  return !!(inner.preload && !inner.router.state.matches.some((d) => d.id === matchId));
};
const _handleNotFound = (inner, err) => {
  var _a;
  const routeCursor = inner.router.routesById[err.routeId ?? ""] ?? inner.router.routeTree;
  if (!routeCursor.options.notFoundComponent && ((_a = inner.router.options) == null ? void 0 : _a.defaultNotFoundComponent)) {
    routeCursor.options.notFoundComponent = inner.router.options.defaultNotFoundComponent;
  }
  invariant(
    routeCursor.options.notFoundComponent,
    "No notFoundComponent found. Please set a notFoundComponent on your route or provide a defaultNotFoundComponent to the router."
  );
  const matchForRoute = inner.matches.find((m) => m.routeId === routeCursor.id);
  invariant(matchForRoute, "Could not find match for route: " + routeCursor.id);
  inner.updateMatch(matchForRoute.id, (prev) => ({
    ...prev,
    status: "notFound",
    error: err,
    isFetching: false
  }));
  if (err.routerCode === "BEFORE_LOAD" && routeCursor.parentRoute) {
    err.routeId = routeCursor.parentRoute.id;
    _handleNotFound(inner, err);
  }
};
const handleRedirectAndNotFound = (inner, match, err) => {
  var _a, _b, _c;
  if (!isRedirect(err) && !isNotFound(err)) return;
  if (isRedirect(err) && err.redirectHandled && !err.options.reloadDocument) {
    throw err;
  }
  if (match) {
    (_a = match._nonReactive.beforeLoadPromise) == null ? void 0 : _a.resolve();
    (_b = match._nonReactive.loaderPromise) == null ? void 0 : _b.resolve();
    match._nonReactive.beforeLoadPromise = void 0;
    match._nonReactive.loaderPromise = void 0;
    const status = isRedirect(err) ? "redirected" : "notFound";
    inner.updateMatch(match.id, (prev) => ({
      ...prev,
      status,
      isFetching: false,
      error: err
    }));
    if (isNotFound(err) && !err.routeId) {
      err.routeId = match.routeId;
    }
    (_c = match._nonReactive.loadPromise) == null ? void 0 : _c.resolve();
  }
  if (isRedirect(err)) {
    inner.rendered = true;
    err.options._fromLocation = inner.location;
    err.redirectHandled = true;
    err = inner.router.resolveRedirect(err);
    throw err;
  } else {
    _handleNotFound(inner, err);
    throw err;
  }
};
const shouldSkipLoader = (inner, matchId) => {
  const match = inner.router.getMatch(matchId);
  if (!inner.router.isServer && match._nonReactive.dehydrated) {
    return true;
  }
  if (inner.router.isServer) {
    if (match.ssr === false) {
      return true;
    }
  }
  return false;
};
const handleSerialError = (inner, index, err, routerCode) => {
  var _a, _b;
  const { id: matchId, routeId } = inner.matches[index];
  const route = inner.router.looseRoutesById[routeId];
  if (err instanceof Promise) {
    throw err;
  }
  err.routerCode = routerCode;
  inner.firstBadMatchIndex ?? (inner.firstBadMatchIndex = index);
  handleRedirectAndNotFound(inner, inner.router.getMatch(matchId), err);
  try {
    (_b = (_a = route.options).onError) == null ? void 0 : _b.call(_a, err);
  } catch (errorHandlerErr) {
    err = errorHandlerErr;
    handleRedirectAndNotFound(inner, inner.router.getMatch(matchId), err);
  }
  inner.updateMatch(matchId, (prev) => {
    var _a2, _b2;
    (_a2 = prev._nonReactive.beforeLoadPromise) == null ? void 0 : _a2.resolve();
    prev._nonReactive.beforeLoadPromise = void 0;
    (_b2 = prev._nonReactive.loadPromise) == null ? void 0 : _b2.resolve();
    return {
      ...prev,
      error: err,
      status: "error",
      isFetching: false,
      updatedAt: Date.now(),
      abortController: new AbortController()
    };
  });
};
const isBeforeLoadSsr = (inner, matchId, index, route) => {
  var _a;
  const existingMatch = inner.router.getMatch(matchId);
  const parentMatchId = (_a = inner.matches[index - 1]) == null ? void 0 : _a.id;
  const parentMatch = parentMatchId ? inner.router.getMatch(parentMatchId) : void 0;
  if (inner.router.isShell()) {
    existingMatch.ssr = matchId === rootRouteId;
    return;
  }
  if ((parentMatch == null ? void 0 : parentMatch.ssr) === false) {
    existingMatch.ssr = false;
    return;
  }
  const parentOverride = (tempSsr2) => {
    if (tempSsr2 === true && (parentMatch == null ? void 0 : parentMatch.ssr) === "data-only") {
      return "data-only";
    }
    return tempSsr2;
  };
  const defaultSsr = inner.router.options.defaultSsr ?? true;
  if (route.options.ssr === void 0) {
    existingMatch.ssr = parentOverride(defaultSsr);
    return;
  }
  if (typeof route.options.ssr !== "function") {
    existingMatch.ssr = parentOverride(route.options.ssr);
    return;
  }
  const { search, params } = existingMatch;
  const ssrFnContext = {
    search: makeMaybe(search, existingMatch.searchError),
    params: makeMaybe(params, existingMatch.paramsError),
    location: inner.location,
    matches: inner.matches.map((match) => ({
      index: match.index,
      pathname: match.pathname,
      fullPath: match.fullPath,
      staticData: match.staticData,
      id: match.id,
      routeId: match.routeId,
      search: makeMaybe(match.search, match.searchError),
      params: makeMaybe(match.params, match.paramsError),
      ssr: match.ssr
    }))
  };
  const tempSsr = route.options.ssr(ssrFnContext);
  if (isPromise(tempSsr)) {
    return tempSsr.then((ssr) => {
      existingMatch.ssr = parentOverride(ssr ?? defaultSsr);
    });
  }
  existingMatch.ssr = parentOverride(tempSsr ?? defaultSsr);
  return;
};
const setupPendingTimeout = (inner, matchId, route, match) => {
  var _a;
  if (match._nonReactive.pendingTimeout !== void 0) return;
  const pendingMs = route.options.pendingMs ?? inner.router.options.defaultPendingMs;
  const shouldPending = !!(inner.onReady && !inner.router.isServer && !resolvePreload(inner, matchId) && (route.options.loader || route.options.beforeLoad || routeNeedsPreload(route)) && typeof pendingMs === "number" && pendingMs !== Infinity && (route.options.pendingComponent ?? ((_a = inner.router.options) == null ? void 0 : _a.defaultPendingComponent)));
  if (shouldPending) {
    const pendingTimeout = setTimeout(() => {
      triggerOnReady(inner);
    }, pendingMs);
    match._nonReactive.pendingTimeout = pendingTimeout;
  }
};
const shouldExecuteBeforeLoad = (inner, matchId, route) => {
  const existingMatch = inner.router.getMatch(matchId);
  if (!existingMatch._nonReactive.beforeLoadPromise && !existingMatch._nonReactive.loaderPromise)
    return true;
  setupPendingTimeout(inner, matchId, route, existingMatch);
  const then = () => {
    let result = true;
    const match = inner.router.getMatch(matchId);
    if (match.status === "error") {
      result = true;
    } else if (match.preload && (match.status === "redirected" || match.status === "notFound")) {
      handleRedirectAndNotFound(inner, match, match.error);
    }
    return result;
  };
  return existingMatch._nonReactive.beforeLoadPromise ? existingMatch._nonReactive.beforeLoadPromise.then(then) : then();
};
const executeBeforeLoad = (inner, matchId, index, route) => {
  var _a;
  const match = inner.router.getMatch(matchId);
  const prevLoadPromise = match._nonReactive.loadPromise;
  match._nonReactive.loadPromise = createControlledPromise(() => {
    prevLoadPromise == null ? void 0 : prevLoadPromise.resolve();
  });
  const { paramsError, searchError } = match;
  if (paramsError) {
    handleSerialError(inner, index, paramsError, "PARSE_PARAMS");
  }
  if (searchError) {
    handleSerialError(inner, index, searchError, "VALIDATE_SEARCH");
  }
  setupPendingTimeout(inner, matchId, route, match);
  const abortController = new AbortController();
  const parentMatchId = (_a = inner.matches[index - 1]) == null ? void 0 : _a.id;
  const parentMatch = parentMatchId ? inner.router.getMatch(parentMatchId) : void 0;
  const parentMatchContext = (parentMatch == null ? void 0 : parentMatch.context) ?? inner.router.options.context ?? void 0;
  const context = { ...parentMatchContext, ...match.__routeContext };
  let isPending = false;
  const pending = () => {
    if (isPending) return;
    isPending = true;
    inner.updateMatch(matchId, (prev) => ({
      ...prev,
      isFetching: "beforeLoad",
      fetchCount: prev.fetchCount + 1,
      abortController,
      context
    }));
  };
  const resolve = () => {
    var _a2;
    (_a2 = match._nonReactive.beforeLoadPromise) == null ? void 0 : _a2.resolve();
    match._nonReactive.beforeLoadPromise = void 0;
    inner.updateMatch(matchId, (prev) => ({
      ...prev,
      isFetching: false
    }));
  };
  if (!route.options.beforeLoad) {
    batch(() => {
      pending();
      resolve();
    });
    return;
  }
  match._nonReactive.beforeLoadPromise = createControlledPromise();
  const { search, params, cause } = match;
  const preload = resolvePreload(inner, matchId);
  const beforeLoadFnContext = {
    search,
    abortController,
    params,
    preload,
    context,
    location: inner.location,
    navigate: (opts) => inner.router.navigate({
      ...opts,
      _fromLocation: inner.location
    }),
    buildLocation: inner.router.buildLocation,
    cause: preload ? "preload" : cause,
    matches: inner.matches
  };
  const updateContext = (beforeLoadContext2) => {
    if (beforeLoadContext2 === void 0) {
      batch(() => {
        pending();
        resolve();
      });
      return;
    }
    if (isRedirect(beforeLoadContext2) || isNotFound(beforeLoadContext2)) {
      pending();
      handleSerialError(inner, index, beforeLoadContext2, "BEFORE_LOAD");
    }
    batch(() => {
      pending();
      inner.updateMatch(matchId, (prev) => ({
        ...prev,
        __beforeLoadContext: beforeLoadContext2,
        context: {
          ...prev.context,
          ...beforeLoadContext2
        }
      }));
      resolve();
    });
  };
  let beforeLoadContext;
  try {
    beforeLoadContext = route.options.beforeLoad(beforeLoadFnContext);
    if (isPromise(beforeLoadContext)) {
      pending();
      return beforeLoadContext.catch((err) => {
        handleSerialError(inner, index, err, "BEFORE_LOAD");
      }).then(updateContext);
    }
  } catch (err) {
    pending();
    handleSerialError(inner, index, err, "BEFORE_LOAD");
  }
  updateContext(beforeLoadContext);
  return;
};
const handleBeforeLoad = (inner, index) => {
  const { id: matchId, routeId } = inner.matches[index];
  const route = inner.router.looseRoutesById[routeId];
  const serverSsr = () => {
    if (inner.router.isServer) {
      const maybePromise = isBeforeLoadSsr(inner, matchId, index, route);
      if (isPromise(maybePromise)) return maybePromise.then(queueExecution);
    }
    return queueExecution();
  };
  const queueExecution = () => {
    if (shouldSkipLoader(inner, matchId)) return;
    const shouldExecuteBeforeLoadResult = shouldExecuteBeforeLoad(
      inner,
      matchId,
      route
    );
    return isPromise(shouldExecuteBeforeLoadResult) ? shouldExecuteBeforeLoadResult.then(execute) : execute(shouldExecuteBeforeLoadResult);
  };
  const execute = (shouldExec) => {
    if (shouldExec) {
      return executeBeforeLoad(inner, matchId, index, route);
    }
    return;
  };
  return serverSsr();
};
const executeHead = (inner, matchId, route) => {
  var _a, _b, _c, _d, _e, _f;
  const match = inner.router.getMatch(matchId);
  if (!match) {
    return;
  }
  if (!route.options.head && !route.options.scripts && !route.options.headers) {
    return;
  }
  const assetContext = {
    matches: inner.matches,
    match,
    params: match.params,
    loaderData: match.loaderData
  };
  return Promise.all([
    (_b = (_a = route.options).head) == null ? void 0 : _b.call(_a, assetContext),
    (_d = (_c = route.options).scripts) == null ? void 0 : _d.call(_c, assetContext),
    (_f = (_e = route.options).headers) == null ? void 0 : _f.call(_e, assetContext)
  ]).then(([headFnContent, scripts, headers]) => {
    const meta = headFnContent == null ? void 0 : headFnContent.meta;
    const links = headFnContent == null ? void 0 : headFnContent.links;
    const headScripts = headFnContent == null ? void 0 : headFnContent.scripts;
    const styles = headFnContent == null ? void 0 : headFnContent.styles;
    return {
      meta,
      links,
      headScripts,
      headers,
      scripts,
      styles
    };
  });
};
const getLoaderContext = (inner, matchId, index, route) => {
  const parentMatchPromise = inner.matchPromises[index - 1];
  const { params, loaderDeps, abortController, context, cause } = inner.router.getMatch(matchId);
  const preload = resolvePreload(inner, matchId);
  return {
    params,
    deps: loaderDeps,
    preload: !!preload,
    parentMatchPromise,
    abortController,
    context,
    location: inner.location,
    navigate: (opts) => inner.router.navigate({
      ...opts,
      _fromLocation: inner.location
    }),
    cause: preload ? "preload" : cause,
    route
  };
};
const runLoader = async (inner, matchId, index, route) => {
  var _a, _b, _c, _d;
  try {
    const match = inner.router.getMatch(matchId);
    try {
      if (!inner.router.isServer || match.ssr === true) {
        loadRouteChunk(route);
      }
      const loaderResult = (_b = (_a = route.options).loader) == null ? void 0 : _b.call(
        _a,
        getLoaderContext(inner, matchId, index, route)
      );
      const loaderResultIsPromise = route.options.loader && isPromise(loaderResult);
      const willLoadSomething = !!(loaderResultIsPromise || route._lazyPromise || route._componentsPromise || route.options.head || route.options.scripts || route.options.headers || match._nonReactive.minPendingPromise);
      if (willLoadSomething) {
        inner.updateMatch(matchId, (prev) => ({
          ...prev,
          isFetching: "loader"
        }));
      }
      if (route.options.loader) {
        const loaderData = loaderResultIsPromise ? await loaderResult : loaderResult;
        handleRedirectAndNotFound(
          inner,
          inner.router.getMatch(matchId),
          loaderData
        );
        if (loaderData !== void 0) {
          inner.updateMatch(matchId, (prev) => ({
            ...prev,
            loaderData
          }));
        }
      }
      if (route._lazyPromise) await route._lazyPromise;
      const headResult = executeHead(inner, matchId, route);
      const head = headResult ? await headResult : void 0;
      const pendingPromise = match._nonReactive.minPendingPromise;
      if (pendingPromise) await pendingPromise;
      if (route._componentsPromise) await route._componentsPromise;
      inner.updateMatch(matchId, (prev) => ({
        ...prev,
        error: void 0,
        status: "success",
        isFetching: false,
        updatedAt: Date.now(),
        ...head
      }));
    } catch (e) {
      let error = e;
      const pendingPromise = match._nonReactive.minPendingPromise;
      if (pendingPromise) await pendingPromise;
      handleRedirectAndNotFound(inner, inner.router.getMatch(matchId), e);
      try {
        (_d = (_c = route.options).onError) == null ? void 0 : _d.call(_c, e);
      } catch (onErrorError) {
        error = onErrorError;
        handleRedirectAndNotFound(
          inner,
          inner.router.getMatch(matchId),
          onErrorError
        );
      }
      const headResult = executeHead(inner, matchId, route);
      const head = headResult ? await headResult : void 0;
      inner.updateMatch(matchId, (prev) => ({
        ...prev,
        error,
        status: "error",
        isFetching: false,
        ...head
      }));
    }
  } catch (err) {
    const match = inner.router.getMatch(matchId);
    if (match) {
      const headResult = executeHead(inner, matchId, route);
      if (headResult) {
        const head = await headResult;
        inner.updateMatch(matchId, (prev) => ({
          ...prev,
          ...head
        }));
      }
      match._nonReactive.loaderPromise = void 0;
    }
    handleRedirectAndNotFound(inner, match, err);
  }
};
const loadRouteMatch = async (inner, index) => {
  var _a, _b;
  const { id: matchId, routeId } = inner.matches[index];
  let loaderShouldRunAsync = false;
  let loaderIsRunningAsync = false;
  const route = inner.router.looseRoutesById[routeId];
  if (shouldSkipLoader(inner, matchId)) {
    if (inner.router.isServer) {
      const headResult = executeHead(inner, matchId, route);
      if (headResult) {
        const head = await headResult;
        inner.updateMatch(matchId, (prev) => ({
          ...prev,
          ...head
        }));
      }
      return inner.router.getMatch(matchId);
    }
  } else {
    const prevMatch = inner.router.getMatch(matchId);
    if (prevMatch._nonReactive.loaderPromise) {
      if (prevMatch.status === "success" && !inner.sync && !prevMatch.preload) {
        return prevMatch;
      }
      await prevMatch._nonReactive.loaderPromise;
      const match2 = inner.router.getMatch(matchId);
      if (match2.error) {
        handleRedirectAndNotFound(inner, match2, match2.error);
      }
    } else {
      const age = Date.now() - prevMatch.updatedAt;
      const preload = resolvePreload(inner, matchId);
      const staleAge = preload ? route.options.preloadStaleTime ?? inner.router.options.defaultPreloadStaleTime ?? 3e4 : route.options.staleTime ?? inner.router.options.defaultStaleTime ?? 0;
      const shouldReloadOption = route.options.shouldReload;
      const shouldReload = typeof shouldReloadOption === "function" ? shouldReloadOption(getLoaderContext(inner, matchId, index, route)) : shouldReloadOption;
      const nextPreload = !!preload && !inner.router.state.matches.some((d) => d.id === matchId);
      const match2 = inner.router.getMatch(matchId);
      match2._nonReactive.loaderPromise = createControlledPromise();
      if (nextPreload !== match2.preload) {
        inner.updateMatch(matchId, (prev) => ({
          ...prev,
          preload: nextPreload
        }));
      }
      const { status, invalid } = match2;
      loaderShouldRunAsync = status === "success" && (invalid || (shouldReload ?? age > staleAge));
      if (preload && route.options.preload === false) ;
      else if (loaderShouldRunAsync && !inner.sync) {
        loaderIsRunningAsync = true;
        (async () => {
          var _a2, _b2;
          try {
            await runLoader(inner, matchId, index, route);
            const match3 = inner.router.getMatch(matchId);
            (_a2 = match3._nonReactive.loaderPromise) == null ? void 0 : _a2.resolve();
            (_b2 = match3._nonReactive.loadPromise) == null ? void 0 : _b2.resolve();
            match3._nonReactive.loaderPromise = void 0;
          } catch (err) {
            if (isRedirect(err)) {
              await inner.router.navigate(err.options);
            }
          }
        })();
      } else if (status !== "success" || loaderShouldRunAsync && inner.sync) {
        await runLoader(inner, matchId, index, route);
      } else {
        const headResult = executeHead(inner, matchId, route);
        if (headResult) {
          const head = await headResult;
          inner.updateMatch(matchId, (prev) => ({
            ...prev,
            ...head
          }));
        }
      }
    }
  }
  const match = inner.router.getMatch(matchId);
  if (!loaderIsRunningAsync) {
    (_a = match._nonReactive.loaderPromise) == null ? void 0 : _a.resolve();
    (_b = match._nonReactive.loadPromise) == null ? void 0 : _b.resolve();
  }
  clearTimeout(match._nonReactive.pendingTimeout);
  match._nonReactive.pendingTimeout = void 0;
  if (!loaderIsRunningAsync) match._nonReactive.loaderPromise = void 0;
  match._nonReactive.dehydrated = void 0;
  const nextIsFetching = loaderIsRunningAsync ? match.isFetching : false;
  if (nextIsFetching !== match.isFetching || match.invalid !== false) {
    inner.updateMatch(matchId, (prev) => ({
      ...prev,
      isFetching: nextIsFetching,
      invalid: false
    }));
    return inner.router.getMatch(matchId);
  } else {
    return match;
  }
};
async function loadMatches(arg) {
  const inner = Object.assign(arg, {
    matchPromises: []
  });
  if (!inner.router.isServer && inner.router.state.matches.some((d) => d._forcePending)) {
    triggerOnReady(inner);
  }
  try {
    for (let i = 0; i < inner.matches.length; i++) {
      const beforeLoad = handleBeforeLoad(inner, i);
      if (isPromise(beforeLoad)) await beforeLoad;
    }
    const max = inner.firstBadMatchIndex ?? inner.matches.length;
    for (let i = 0; i < max; i++) {
      inner.matchPromises.push(loadRouteMatch(inner, i));
    }
    await Promise.all(inner.matchPromises);
    const readyPromise = triggerOnReady(inner);
    if (isPromise(readyPromise)) await readyPromise;
  } catch (err) {
    if (isNotFound(err) && !inner.preload) {
      const readyPromise = triggerOnReady(inner);
      if (isPromise(readyPromise)) await readyPromise;
      throw err;
    }
    if (isRedirect(err)) {
      throw err;
    }
  }
  return inner.matches;
}
async function loadRouteChunk(route) {
  if (!route._lazyLoaded && route._lazyPromise === void 0) {
    if (route.lazyFn) {
      route._lazyPromise = route.lazyFn().then((lazyRoute) => {
        const { id: _id, ...options } = lazyRoute.options;
        Object.assign(route.options, options);
        route._lazyLoaded = true;
        route._lazyPromise = void 0;
      });
    } else {
      route._lazyLoaded = true;
    }
  }
  if (!route._componentsLoaded && route._componentsPromise === void 0) {
    const loadComponents = () => {
      var _a;
      const preloads = [];
      for (const type of componentTypes) {
        const preload = (_a = route.options[type]) == null ? void 0 : _a.preload;
        if (preload) preloads.push(preload());
      }
      if (preloads.length)
        return Promise.all(preloads).then(() => {
          route._componentsLoaded = true;
          route._componentsPromise = void 0;
        });
      route._componentsLoaded = true;
      route._componentsPromise = void 0;
      return;
    };
    route._componentsPromise = route._lazyPromise ? route._lazyPromise.then(loadComponents) : loadComponents();
  }
  return route._componentsPromise;
}
function makeMaybe(value, error) {
  if (error) {
    return { status: "error", error };
  }
  return { status: "success", value };
}
function routeNeedsPreload(route) {
  var _a;
  for (const componentType of componentTypes) {
    if ((_a = route.options[componentType]) == null ? void 0 : _a.preload) {
      return true;
    }
  }
  return false;
}
const componentTypes = [
  "component",
  "errorComponent",
  "pendingComponent",
  "notFoundComponent"
];
export {
  componentTypes,
  loadMatches,
  loadRouteChunk,
  routeNeedsPreload
};
//# sourceMappingURL=load-matches.js.map
