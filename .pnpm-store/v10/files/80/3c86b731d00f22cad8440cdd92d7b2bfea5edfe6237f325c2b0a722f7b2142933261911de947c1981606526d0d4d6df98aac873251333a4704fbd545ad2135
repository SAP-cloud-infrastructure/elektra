"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const routerCore = require("@tanstack/router-core");
const React = require("react");
const useLoaderData = require("./useLoaderData.cjs");
const useLoaderDeps = require("./useLoaderDeps.cjs");
const useParams = require("./useParams.cjs");
const useSearch = require("./useSearch.cjs");
const useNavigate = require("./useNavigate.cjs");
const useMatch = require("./useMatch.cjs");
const useRouter = require("./useRouter.cjs");
const link = require("./link.cjs");
function getRouteApi(id) {
  return new RouteApi({ id });
}
class RouteApi extends routerCore.BaseRouteApi {
  /**
   * @deprecated Use the `getRouteApi` function instead.
   */
  constructor({ id }) {
    super({ id });
    this.useMatch = (opts) => {
      return useMatch.useMatch({
        select: opts == null ? void 0 : opts.select,
        from: this.id,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing
      });
    };
    this.useRouteContext = (opts) => {
      return useMatch.useMatch({
        from: this.id,
        select: (d) => (opts == null ? void 0 : opts.select) ? opts.select(d.context) : d.context
      });
    };
    this.useSearch = (opts) => {
      return useSearch.useSearch({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useParams = (opts) => {
      return useParams.useParams({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useLoaderDeps = (opts) => {
      return useLoaderDeps.useLoaderDeps({ ...opts, from: this.id, strict: false });
    };
    this.useLoaderData = (opts) => {
      return useLoaderData.useLoaderData({ ...opts, from: this.id, strict: false });
    };
    this.useNavigate = () => {
      const router = useRouter.useRouter();
      return useNavigate.useNavigate({ from: router.routesById[this.id].fullPath });
    };
    this.notFound = (opts) => {
      return routerCore.notFound({ routeId: this.id, ...opts });
    };
    this.Link = React.forwardRef((props, ref) => {
      const router = useRouter.useRouter();
      const fullPath = router.routesById[this.id].fullPath;
      return /* @__PURE__ */ jsxRuntime.jsx(link.Link, { ref, from: fullPath, ...props });
    });
  }
}
class Route extends routerCore.BaseRoute {
  /**
   * @deprecated Use the `createRoute` function instead.
   */
  constructor(options) {
    super(options);
    this.useMatch = (opts) => {
      return useMatch.useMatch({
        select: opts == null ? void 0 : opts.select,
        from: this.id,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing
      });
    };
    this.useRouteContext = (opts) => {
      return useMatch.useMatch({
        ...opts,
        from: this.id,
        select: (d) => (opts == null ? void 0 : opts.select) ? opts.select(d.context) : d.context
      });
    };
    this.useSearch = (opts) => {
      return useSearch.useSearch({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useParams = (opts) => {
      return useParams.useParams({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useLoaderDeps = (opts) => {
      return useLoaderDeps.useLoaderDeps({ ...opts, from: this.id });
    };
    this.useLoaderData = (opts) => {
      return useLoaderData.useLoaderData({ ...opts, from: this.id });
    };
    this.useNavigate = () => {
      return useNavigate.useNavigate({ from: this.fullPath });
    };
    this.Link = React.forwardRef(
      (props, ref) => {
        return /* @__PURE__ */ jsxRuntime.jsx(link.Link, { ref, from: this.fullPath, ...props });
      }
    );
    this.$$typeof = Symbol.for("react.memo");
  }
}
function createRoute(options) {
  return new Route(options);
}
function createRootRouteWithContext() {
  return (options) => {
    return createRootRoute(options);
  };
}
const rootRouteWithContext = createRootRouteWithContext;
class RootRoute extends routerCore.BaseRootRoute {
  /**
   * @deprecated `RootRoute` is now an internal implementation detail. Use `createRootRoute()` instead.
   */
  constructor(options) {
    super(options);
    this.useMatch = (opts) => {
      return useMatch.useMatch({
        select: opts == null ? void 0 : opts.select,
        from: this.id,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing
      });
    };
    this.useRouteContext = (opts) => {
      return useMatch.useMatch({
        ...opts,
        from: this.id,
        select: (d) => (opts == null ? void 0 : opts.select) ? opts.select(d.context) : d.context
      });
    };
    this.useSearch = (opts) => {
      return useSearch.useSearch({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useParams = (opts) => {
      return useParams.useParams({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useLoaderDeps = (opts) => {
      return useLoaderDeps.useLoaderDeps({ ...opts, from: this.id });
    };
    this.useLoaderData = (opts) => {
      return useLoaderData.useLoaderData({ ...opts, from: this.id });
    };
    this.useNavigate = () => {
      return useNavigate.useNavigate({ from: this.fullPath });
    };
    this.Link = React.forwardRef(
      (props, ref) => {
        return /* @__PURE__ */ jsxRuntime.jsx(link.Link, { ref, from: this.fullPath, ...props });
      }
    );
    this.$$typeof = Symbol.for("react.memo");
  }
}
function createRootRoute(options) {
  return new RootRoute(options);
}
function createRouteMask(opts) {
  return opts;
}
class NotFoundRoute extends Route {
  constructor(options) {
    super({
      ...options,
      id: "404"
    });
  }
}
exports.NotFoundRoute = NotFoundRoute;
exports.RootRoute = RootRoute;
exports.Route = Route;
exports.RouteApi = RouteApi;
exports.createRootRoute = createRootRoute;
exports.createRootRouteWithContext = createRootRouteWithContext;
exports.createRoute = createRoute;
exports.createRouteMask = createRouteMask;
exports.getRouteApi = getRouteApi;
exports.rootRouteWithContext = rootRouteWithContext;
//# sourceMappingURL=route.cjs.map
