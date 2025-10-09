import { jsx } from "react/jsx-runtime";
import { BaseRouteApi, notFound, BaseRoute, BaseRootRoute } from "@tanstack/router-core";
import React__default from "react";
import { useLoaderData } from "./useLoaderData.js";
import { useLoaderDeps } from "./useLoaderDeps.js";
import { useParams } from "./useParams.js";
import { useSearch } from "./useSearch.js";
import { useNavigate } from "./useNavigate.js";
import { useMatch } from "./useMatch.js";
import { useRouter } from "./useRouter.js";
import { Link } from "./link.js";
function getRouteApi(id) {
  return new RouteApi({ id });
}
class RouteApi extends BaseRouteApi {
  /**
   * @deprecated Use the `getRouteApi` function instead.
   */
  constructor({ id }) {
    super({ id });
    this.useMatch = (opts) => {
      return useMatch({
        select: opts == null ? void 0 : opts.select,
        from: this.id,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing
      });
    };
    this.useRouteContext = (opts) => {
      return useMatch({
        from: this.id,
        select: (d) => (opts == null ? void 0 : opts.select) ? opts.select(d.context) : d.context
      });
    };
    this.useSearch = (opts) => {
      return useSearch({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useParams = (opts) => {
      return useParams({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useLoaderDeps = (opts) => {
      return useLoaderDeps({ ...opts, from: this.id, strict: false });
    };
    this.useLoaderData = (opts) => {
      return useLoaderData({ ...opts, from: this.id, strict: false });
    };
    this.useNavigate = () => {
      const router = useRouter();
      return useNavigate({ from: router.routesById[this.id].fullPath });
    };
    this.notFound = (opts) => {
      return notFound({ routeId: this.id, ...opts });
    };
    this.Link = React__default.forwardRef((props, ref) => {
      const router = useRouter();
      const fullPath = router.routesById[this.id].fullPath;
      return /* @__PURE__ */ jsx(Link, { ref, from: fullPath, ...props });
    });
  }
}
class Route extends BaseRoute {
  /**
   * @deprecated Use the `createRoute` function instead.
   */
  constructor(options) {
    super(options);
    this.useMatch = (opts) => {
      return useMatch({
        select: opts == null ? void 0 : opts.select,
        from: this.id,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing
      });
    };
    this.useRouteContext = (opts) => {
      return useMatch({
        ...opts,
        from: this.id,
        select: (d) => (opts == null ? void 0 : opts.select) ? opts.select(d.context) : d.context
      });
    };
    this.useSearch = (opts) => {
      return useSearch({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useParams = (opts) => {
      return useParams({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useLoaderDeps = (opts) => {
      return useLoaderDeps({ ...opts, from: this.id });
    };
    this.useLoaderData = (opts) => {
      return useLoaderData({ ...opts, from: this.id });
    };
    this.useNavigate = () => {
      return useNavigate({ from: this.fullPath });
    };
    this.Link = React__default.forwardRef(
      (props, ref) => {
        return /* @__PURE__ */ jsx(Link, { ref, from: this.fullPath, ...props });
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
class RootRoute extends BaseRootRoute {
  /**
   * @deprecated `RootRoute` is now an internal implementation detail. Use `createRootRoute()` instead.
   */
  constructor(options) {
    super(options);
    this.useMatch = (opts) => {
      return useMatch({
        select: opts == null ? void 0 : opts.select,
        from: this.id,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing
      });
    };
    this.useRouteContext = (opts) => {
      return useMatch({
        ...opts,
        from: this.id,
        select: (d) => (opts == null ? void 0 : opts.select) ? opts.select(d.context) : d.context
      });
    };
    this.useSearch = (opts) => {
      return useSearch({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useParams = (opts) => {
      return useParams({
        select: opts == null ? void 0 : opts.select,
        structuralSharing: opts == null ? void 0 : opts.structuralSharing,
        from: this.id
      });
    };
    this.useLoaderDeps = (opts) => {
      return useLoaderDeps({ ...opts, from: this.id });
    };
    this.useLoaderData = (opts) => {
      return useLoaderData({ ...opts, from: this.id });
    };
    this.useNavigate = () => {
      return useNavigate({ from: this.fullPath });
    };
    this.Link = React__default.forwardRef(
      (props, ref) => {
        return /* @__PURE__ */ jsx(Link, { ref, from: this.fullPath, ...props });
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
export {
  NotFoundRoute,
  RootRoute,
  Route,
  RouteApi,
  createRootRoute,
  createRootRouteWithContext,
  createRoute,
  createRouteMask,
  getRouteApi,
  rootRouteWithContext
};
//# sourceMappingURL=route.js.map
