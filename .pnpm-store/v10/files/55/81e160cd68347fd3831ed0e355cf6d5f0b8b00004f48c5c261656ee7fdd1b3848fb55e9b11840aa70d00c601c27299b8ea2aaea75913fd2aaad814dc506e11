"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const useRouter = require("./useRouter.cjs");
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
function _resolveBlockerOpts(opts, condition) {
  if (opts === void 0) {
    return {
      shouldBlockFn: () => true,
      withResolver: false
    };
  }
  if ("shouldBlockFn" in opts) {
    return opts;
  }
  if (typeof opts === "function") {
    const shouldBlock2 = Boolean(condition ?? true);
    const _customBlockerFn2 = async () => {
      if (shouldBlock2) return await opts();
      return false;
    };
    return {
      shouldBlockFn: _customBlockerFn2,
      enableBeforeUnload: shouldBlock2,
      withResolver: false
    };
  }
  const shouldBlock = Boolean(opts.condition ?? true);
  const fn = opts.blockerFn;
  const _customBlockerFn = async () => {
    if (shouldBlock && fn !== void 0) {
      return await fn();
    }
    return shouldBlock;
  };
  return {
    shouldBlockFn: _customBlockerFn,
    enableBeforeUnload: shouldBlock,
    withResolver: fn === void 0
  };
}
function useBlocker(opts, condition) {
  const {
    shouldBlockFn,
    enableBeforeUnload = true,
    disabled = false,
    withResolver = false
  } = _resolveBlockerOpts(opts, condition);
  const router = useRouter.useRouter();
  const { history } = router;
  const [resolver, setResolver] = React__namespace.useState({
    status: "idle",
    current: void 0,
    next: void 0,
    action: void 0,
    proceed: void 0,
    reset: void 0
  });
  React__namespace.useEffect(() => {
    const blockerFnComposed = async (blockerFnArgs) => {
      function getLocation(location) {
        const parsedLocation = router.parseLocation(location);
        const matchedRoutes = router.getMatchedRoutes(
          parsedLocation.pathname,
          void 0
        );
        if (matchedRoutes.foundRoute === void 0) {
          throw new Error(`No route found for location ${location.href}`);
        }
        return {
          routeId: matchedRoutes.foundRoute.id,
          fullPath: matchedRoutes.foundRoute.fullPath,
          pathname: parsedLocation.pathname,
          params: matchedRoutes.routeParams,
          search: parsedLocation.search
        };
      }
      const current = getLocation(blockerFnArgs.currentLocation);
      const next = getLocation(blockerFnArgs.nextLocation);
      const shouldBlock = await shouldBlockFn({
        action: blockerFnArgs.action,
        current,
        next
      });
      if (!withResolver) {
        return shouldBlock;
      }
      if (!shouldBlock) {
        return false;
      }
      const promise = new Promise((resolve) => {
        setResolver({
          status: "blocked",
          current,
          next,
          action: blockerFnArgs.action,
          proceed: () => resolve(false),
          reset: () => resolve(true)
        });
      });
      const canNavigateAsync = await promise;
      setResolver({
        status: "idle",
        current: void 0,
        next: void 0,
        action: void 0,
        proceed: void 0,
        reset: void 0
      });
      return canNavigateAsync;
    };
    return disabled ? void 0 : history.block({ blockerFn: blockerFnComposed, enableBeforeUnload });
  }, [
    shouldBlockFn,
    enableBeforeUnload,
    disabled,
    withResolver,
    history,
    router
  ]);
  return resolver;
}
const _resolvePromptBlockerArgs = (props) => {
  if ("shouldBlockFn" in props) {
    return { ...props };
  }
  const shouldBlock = Boolean(props.condition ?? true);
  const fn = props.blockerFn;
  const _customBlockerFn = async () => {
    if (shouldBlock && fn !== void 0) {
      return await fn();
    }
    return shouldBlock;
  };
  return {
    shouldBlockFn: _customBlockerFn,
    enableBeforeUnload: shouldBlock,
    withResolver: fn === void 0
  };
};
function Block(opts) {
  const { children, ...rest } = opts;
  const args = _resolvePromptBlockerArgs(rest);
  const resolver = useBlocker(args);
  return children ? typeof children === "function" ? children(resolver) : children : null;
}
exports.Block = Block;
exports.useBlocker = useBlocker;
//# sourceMappingURL=useBlocker.cjs.map
