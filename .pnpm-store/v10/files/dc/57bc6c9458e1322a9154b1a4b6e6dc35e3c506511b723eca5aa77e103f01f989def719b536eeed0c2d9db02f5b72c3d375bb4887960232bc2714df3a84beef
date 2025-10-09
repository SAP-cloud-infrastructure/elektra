"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const invariant = require("tiny-invariant");
const path = require("./path.cjs");
const notFound = require("./not-found.cjs");
const root = require("./root.cjs");
class BaseRoute {
  constructor(options) {
    this.init = (opts) => {
      var _a, _b;
      this.originalIndex = opts.originalIndex;
      const options2 = this.options;
      const isRoot = !(options2 == null ? void 0 : options2.path) && !(options2 == null ? void 0 : options2.id);
      this.parentRoute = (_b = (_a = this.options).getParentRoute) == null ? void 0 : _b.call(_a);
      if (isRoot) {
        this._path = root.rootRouteId;
      } else if (!this.parentRoute) {
        invariant(
          false,
          `Child Route instances must pass a 'getParentRoute: () => ParentRoute' option that returns a Route instance.`
        );
      }
      let path$1 = isRoot ? root.rootRouteId : options2 == null ? void 0 : options2.path;
      if (path$1 && path$1 !== "/") {
        path$1 = path.trimPathLeft(path$1);
      }
      const customId = (options2 == null ? void 0 : options2.id) || path$1;
      let id = isRoot ? root.rootRouteId : path.joinPaths([
        this.parentRoute.id === root.rootRouteId ? "" : this.parentRoute.id,
        customId
      ]);
      if (path$1 === root.rootRouteId) {
        path$1 = "/";
      }
      if (id !== root.rootRouteId) {
        id = path.joinPaths(["/", id]);
      }
      const fullPath = id === root.rootRouteId ? "/" : path.joinPaths([this.parentRoute.fullPath, path$1]);
      this._path = path$1;
      this._id = id;
      this._fullPath = fullPath;
      this._to = fullPath;
    };
    this.clone = (other) => {
      this._path = other._path;
      this._id = other._id;
      this._fullPath = other._fullPath;
      this._to = other._to;
      this.options.getParentRoute = other.options.getParentRoute;
      this.children = other.children;
    };
    this.addChildren = (children) => {
      return this._addFileChildren(children);
    };
    this._addFileChildren = (children) => {
      if (Array.isArray(children)) {
        this.children = children;
      }
      if (typeof children === "object" && children !== null) {
        this.children = Object.values(children);
      }
      return this;
    };
    this._addFileTypes = () => {
      return this;
    };
    this.updateLoader = (options2) => {
      Object.assign(this.options, options2);
      return this;
    };
    this.update = (options2) => {
      Object.assign(this.options, options2);
      return this;
    };
    this.lazy = (lazyFn) => {
      this.lazyFn = lazyFn;
      return this;
    };
    this.options = options || {};
    this.isRoot = !(options == null ? void 0 : options.getParentRoute);
    if ((options == null ? void 0 : options.id) && (options == null ? void 0 : options.path)) {
      throw new Error(`Route cannot have both an 'id' and a 'path' option.`);
    }
  }
  get to() {
    return this._to;
  }
  get id() {
    return this._id;
  }
  get path() {
    return this._path;
  }
  get fullPath() {
    return this._fullPath;
  }
}
class BaseRouteApi {
  constructor({ id }) {
    this.notFound = (opts) => {
      return notFound.notFound({ routeId: this.id, ...opts });
    };
    this.id = id;
  }
}
class BaseRootRoute extends BaseRoute {
  constructor(options) {
    super(options);
  }
}
exports.BaseRootRoute = BaseRootRoute;
exports.BaseRoute = BaseRoute;
exports.BaseRouteApi = BaseRouteApi;
//# sourceMappingURL=route.cjs.map
