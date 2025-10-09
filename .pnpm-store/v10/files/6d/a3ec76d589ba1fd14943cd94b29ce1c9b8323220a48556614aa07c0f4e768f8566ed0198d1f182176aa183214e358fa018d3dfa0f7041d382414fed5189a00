"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const warning = require("tiny-warning");
const route = require("./route.cjs");
const useMatch = require("./useMatch.cjs");
const useLoaderDeps = require("./useLoaderDeps.cjs");
const useLoaderData = require("./useLoaderData.cjs");
const useSearch = require("./useSearch.cjs");
const useParams = require("./useParams.cjs");
const useNavigate = require("./useNavigate.cjs");
const useRouter = require("./useRouter.cjs");
function createFileRoute(path) {
  if (typeof path === "object") {
    return new FileRoute(path, {
      silent: true
    }).createRoute(path);
  }
  return new FileRoute(path, {
    silent: true
  }).createRoute;
}
class FileRoute {
  constructor(path, _opts) {
    this.path = path;
    this.createRoute = (options) => {
      warning(
        this.silent,
        "FileRoute is deprecated and will be removed in the next major version. Use the createFileRoute(path)(options) function instead."
      );
      const route$1 = route.createRoute(options);
      route$1.isRoot = false;
      return route$1;
    };
    this.silent = _opts == null ? void 0 : _opts.silent;
  }
}
function FileRouteLoader(_path) {
  warning(
    false,
    `FileRouteLoader is deprecated and will be removed in the next major version. Please place the loader function in the the main route file, inside the \`createFileRoute('/path/to/file')(options)\` options`
  );
  return (loaderFn) => loaderFn;
}
class LazyRoute {
  constructor(opts) {
    this.useMatch = (opts2) => {
      return useMatch.useMatch({
        select: opts2 == null ? void 0 : opts2.select,
        from: this.options.id,
        structuralSharing: opts2 == null ? void 0 : opts2.structuralSharing
      });
    };
    this.useRouteContext = (opts2) => {
      return useMatch.useMatch({
        from: this.options.id,
        select: (d) => (opts2 == null ? void 0 : opts2.select) ? opts2.select(d.context) : d.context
      });
    };
    this.useSearch = (opts2) => {
      return useSearch.useSearch({
        select: opts2 == null ? void 0 : opts2.select,
        structuralSharing: opts2 == null ? void 0 : opts2.structuralSharing,
        from: this.options.id
      });
    };
    this.useParams = (opts2) => {
      return useParams.useParams({
        select: opts2 == null ? void 0 : opts2.select,
        structuralSharing: opts2 == null ? void 0 : opts2.structuralSharing,
        from: this.options.id
      });
    };
    this.useLoaderDeps = (opts2) => {
      return useLoaderDeps.useLoaderDeps({ ...opts2, from: this.options.id });
    };
    this.useLoaderData = (opts2) => {
      return useLoaderData.useLoaderData({ ...opts2, from: this.options.id });
    };
    this.useNavigate = () => {
      const router = useRouter.useRouter();
      return useNavigate.useNavigate({ from: router.routesById[this.options.id].fullPath });
    };
    this.options = opts;
    this.$$typeof = Symbol.for("react.memo");
  }
}
function createLazyRoute(id) {
  return (opts) => {
    return new LazyRoute({
      id,
      ...opts
    });
  };
}
function createLazyFileRoute(id) {
  if (typeof id === "object") {
    return new LazyRoute(id);
  }
  return (opts) => new LazyRoute({ id, ...opts });
}
exports.FileRoute = FileRoute;
exports.FileRouteLoader = FileRouteLoader;
exports.LazyRoute = LazyRoute;
exports.createFileRoute = createFileRoute;
exports.createLazyFileRoute = createLazyFileRoute;
exports.createLazyRoute = createLazyRoute;
//# sourceMappingURL=fileRoute.cjs.map
