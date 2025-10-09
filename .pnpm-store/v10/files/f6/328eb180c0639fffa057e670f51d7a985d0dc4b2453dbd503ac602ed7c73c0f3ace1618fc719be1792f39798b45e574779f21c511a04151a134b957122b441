"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const invariant = require("tiny-invariant");
const warning = require("tiny-warning");
const routerCore = require("@tanstack/router-core");
const history = require("@tanstack/history");
const awaited = require("./awaited.cjs");
const CatchBoundary = require("./CatchBoundary.cjs");
const ClientOnly = require("./ClientOnly.cjs");
const fileRoute = require("./fileRoute.cjs");
const lazyRouteComponent = require("./lazyRouteComponent.cjs");
const link = require("./link.cjs");
const Matches = require("./Matches.cjs");
const matchContext = require("./matchContext.cjs");
const Match = require("./Match.cjs");
const useMatch = require("./useMatch.cjs");
const useLoaderDeps = require("./useLoaderDeps.cjs");
const useLoaderData = require("./useLoaderData.cjs");
const route = require("./route.cjs");
const router = require("./router.cjs");
const RouterProvider = require("./RouterProvider.cjs");
const ScrollRestoration = require("./ScrollRestoration.cjs");
const useBlocker = require("./useBlocker.cjs");
const useNavigate = require("./useNavigate.cjs");
const useParams = require("./useParams.cjs");
const useSearch = require("./useSearch.cjs");
const routerContext = require("./routerContext.cjs");
const useRouteContext = require("./useRouteContext.cjs");
const useRouter = require("./useRouter.cjs");
const useRouterState = require("./useRouterState.cjs");
const useLocation = require("./useLocation.cjs");
const useCanGoBack = require("./useCanGoBack.cjs");
const utils = require("./utils.cjs");
const notFound = require("./not-found.cjs");
const ScriptOnce = require("./ScriptOnce.cjs");
const Asset = require("./Asset.cjs");
const HeadContent = require("./HeadContent.cjs");
const Scripts = require("./Scripts.cjs");
exports.invariant = invariant;
exports.warning = warning;
Object.defineProperty(exports, "PathParamError", {
  enumerable: true,
  get: () => routerCore.PathParamError
});
Object.defineProperty(exports, "SearchParamError", {
  enumerable: true,
  get: () => routerCore.SearchParamError
});
Object.defineProperty(exports, "TSR_DEFERRED_PROMISE", {
  enumerable: true,
  get: () => routerCore.TSR_DEFERRED_PROMISE
});
Object.defineProperty(exports, "cleanPath", {
  enumerable: true,
  get: () => routerCore.cleanPath
});
Object.defineProperty(exports, "componentTypes", {
  enumerable: true,
  get: () => routerCore.componentTypes
});
Object.defineProperty(exports, "createControlledPromise", {
  enumerable: true,
  get: () => routerCore.createControlledPromise
});
Object.defineProperty(exports, "decode", {
  enumerable: true,
  get: () => routerCore.decode
});
Object.defineProperty(exports, "deepEqual", {
  enumerable: true,
  get: () => routerCore.deepEqual
});
Object.defineProperty(exports, "defaultParseSearch", {
  enumerable: true,
  get: () => routerCore.defaultParseSearch
});
Object.defineProperty(exports, "defaultSerializeError", {
  enumerable: true,
  get: () => routerCore.defaultSerializeError
});
Object.defineProperty(exports, "defaultStringifySearch", {
  enumerable: true,
  get: () => routerCore.defaultStringifySearch
});
Object.defineProperty(exports, "defer", {
  enumerable: true,
  get: () => routerCore.defer
});
Object.defineProperty(exports, "encode", {
  enumerable: true,
  get: () => routerCore.encode
});
Object.defineProperty(exports, "escapeJSON", {
  enumerable: true,
  get: () => routerCore.escapeJSON
});
Object.defineProperty(exports, "functionalUpdate", {
  enumerable: true,
  get: () => routerCore.functionalUpdate
});
Object.defineProperty(exports, "getInitialRouterState", {
  enumerable: true,
  get: () => routerCore.getInitialRouterState
});
Object.defineProperty(exports, "interpolatePath", {
  enumerable: true,
  get: () => routerCore.interpolatePath
});
Object.defineProperty(exports, "isMatch", {
  enumerable: true,
  get: () => routerCore.isMatch
});
Object.defineProperty(exports, "isNotFound", {
  enumerable: true,
  get: () => routerCore.isNotFound
});
Object.defineProperty(exports, "isPlainArray", {
  enumerable: true,
  get: () => routerCore.isPlainArray
});
Object.defineProperty(exports, "isPlainObject", {
  enumerable: true,
  get: () => routerCore.isPlainObject
});
Object.defineProperty(exports, "isRedirect", {
  enumerable: true,
  get: () => routerCore.isRedirect
});
Object.defineProperty(exports, "joinPaths", {
  enumerable: true,
  get: () => routerCore.joinPaths
});
Object.defineProperty(exports, "lazyFn", {
  enumerable: true,
  get: () => routerCore.lazyFn
});
Object.defineProperty(exports, "matchByPath", {
  enumerable: true,
  get: () => routerCore.matchByPath
});
Object.defineProperty(exports, "matchPathname", {
  enumerable: true,
  get: () => routerCore.matchPathname
});
Object.defineProperty(exports, "notFound", {
  enumerable: true,
  get: () => routerCore.notFound
});
Object.defineProperty(exports, "parsePathname", {
  enumerable: true,
  get: () => routerCore.parsePathname
});
Object.defineProperty(exports, "parseSearchWith", {
  enumerable: true,
  get: () => routerCore.parseSearchWith
});
Object.defineProperty(exports, "redirect", {
  enumerable: true,
  get: () => routerCore.redirect
});
Object.defineProperty(exports, "removeBasepath", {
  enumerable: true,
  get: () => routerCore.removeBasepath
});
Object.defineProperty(exports, "replaceEqualDeep", {
  enumerable: true,
  get: () => routerCore.replaceEqualDeep
});
Object.defineProperty(exports, "resolvePath", {
  enumerable: true,
  get: () => routerCore.resolvePath
});
Object.defineProperty(exports, "retainSearchParams", {
  enumerable: true,
  get: () => routerCore.retainSearchParams
});
Object.defineProperty(exports, "rootRouteId", {
  enumerable: true,
  get: () => routerCore.rootRouteId
});
Object.defineProperty(exports, "shallow", {
  enumerable: true,
  get: () => routerCore.shallow
});
Object.defineProperty(exports, "stringifySearchWith", {
  enumerable: true,
  get: () => routerCore.stringifySearchWith
});
Object.defineProperty(exports, "stripSearchParams", {
  enumerable: true,
  get: () => routerCore.stripSearchParams
});
Object.defineProperty(exports, "trimPath", {
  enumerable: true,
  get: () => routerCore.trimPath
});
Object.defineProperty(exports, "trimPathLeft", {
  enumerable: true,
  get: () => routerCore.trimPathLeft
});
Object.defineProperty(exports, "trimPathRight", {
  enumerable: true,
  get: () => routerCore.trimPathRight
});
Object.defineProperty(exports, "createBrowserHistory", {
  enumerable: true,
  get: () => history.createBrowserHistory
});
Object.defineProperty(exports, "createHashHistory", {
  enumerable: true,
  get: () => history.createHashHistory
});
Object.defineProperty(exports, "createHistory", {
  enumerable: true,
  get: () => history.createHistory
});
Object.defineProperty(exports, "createMemoryHistory", {
  enumerable: true,
  get: () => history.createMemoryHistory
});
exports.Await = awaited.Await;
exports.useAwaited = awaited.useAwaited;
exports.CatchBoundary = CatchBoundary.CatchBoundary;
exports.ErrorComponent = CatchBoundary.ErrorComponent;
exports.ClientOnly = ClientOnly.ClientOnly;
exports.FileRoute = fileRoute.FileRoute;
exports.FileRouteLoader = fileRoute.FileRouteLoader;
exports.LazyRoute = fileRoute.LazyRoute;
exports.createFileRoute = fileRoute.createFileRoute;
exports.createLazyFileRoute = fileRoute.createLazyFileRoute;
exports.createLazyRoute = fileRoute.createLazyRoute;
exports.lazyRouteComponent = lazyRouteComponent.lazyRouteComponent;
exports.Link = link.Link;
exports.createLink = link.createLink;
exports.linkOptions = link.linkOptions;
exports.useLinkProps = link.useLinkProps;
exports.MatchRoute = Matches.MatchRoute;
exports.Matches = Matches.Matches;
exports.useChildMatches = Matches.useChildMatches;
exports.useMatchRoute = Matches.useMatchRoute;
exports.useMatches = Matches.useMatches;
exports.useParentMatches = Matches.useParentMatches;
exports.matchContext = matchContext.matchContext;
exports.Match = Match.Match;
exports.Outlet = Match.Outlet;
exports.useMatch = useMatch.useMatch;
exports.useLoaderDeps = useLoaderDeps.useLoaderDeps;
exports.useLoaderData = useLoaderData.useLoaderData;
exports.NotFoundRoute = route.NotFoundRoute;
exports.RootRoute = route.RootRoute;
exports.Route = route.Route;
exports.RouteApi = route.RouteApi;
exports.createRootRoute = route.createRootRoute;
exports.createRootRouteWithContext = route.createRootRouteWithContext;
exports.createRoute = route.createRoute;
exports.createRouteMask = route.createRouteMask;
exports.getRouteApi = route.getRouteApi;
exports.rootRouteWithContext = route.rootRouteWithContext;
exports.Router = router.Router;
exports.createRouter = router.createRouter;
exports.RouterContextProvider = RouterProvider.RouterContextProvider;
exports.RouterProvider = RouterProvider.RouterProvider;
exports.ScrollRestoration = ScrollRestoration.ScrollRestoration;
exports.useElementScrollRestoration = ScrollRestoration.useElementScrollRestoration;
exports.Block = useBlocker.Block;
exports.useBlocker = useBlocker.useBlocker;
exports.Navigate = useNavigate.Navigate;
exports.useNavigate = useNavigate.useNavigate;
exports.useParams = useParams.useParams;
exports.useSearch = useSearch.useSearch;
exports.getRouterContext = routerContext.getRouterContext;
exports.useRouteContext = useRouteContext.useRouteContext;
exports.useRouter = useRouter.useRouter;
exports.useRouterState = useRouterState.useRouterState;
exports.useLocation = useLocation.useLocation;
exports.useCanGoBack = useCanGoBack.useCanGoBack;
exports.useLayoutEffect = utils.useLayoutEffect;
exports.useStableCallback = utils.useStableCallback;
exports.CatchNotFound = notFound.CatchNotFound;
exports.DefaultGlobalNotFound = notFound.DefaultGlobalNotFound;
exports.ScriptOnce = ScriptOnce.ScriptOnce;
exports.Asset = Asset.Asset;
exports.HeadContent = HeadContent.HeadContent;
exports.Scripts = Scripts.Scripts;
//# sourceMappingURL=index.cjs.map
