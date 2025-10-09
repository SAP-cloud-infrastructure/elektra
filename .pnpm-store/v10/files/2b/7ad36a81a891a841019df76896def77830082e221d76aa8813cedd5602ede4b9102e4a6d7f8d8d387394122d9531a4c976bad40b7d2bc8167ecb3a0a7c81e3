"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
require("solid-js/web");
const solidJs = require("solid-js");
const isServer = typeof window === "undefined";
function getStatusColor(match) {
  const colorMap = {
    pending: "yellow",
    success: "green",
    error: "red",
    notFound: "purple",
    redirected: "gray"
  };
  return match.isFetching && match.status === "success" ? match.isFetching === "beforeLoad" ? "purple" : "blue" : colorMap[match.status];
}
function getRouteStatusColor(matches, route) {
  const found = matches.find((d) => d.routeId === route.id);
  if (!found) return "gray";
  return getStatusColor(found);
}
function useIsMounted() {
  const [isMounted, setIsMounted] = solidJs.createSignal(false);
  const effect = isServer ? solidJs.createEffect : solidJs.createRenderEffect;
  effect(() => {
    setIsMounted(true);
  });
  return isMounted;
}
const displayValue = (value) => {
  const name = Object.getOwnPropertyNames(Object(value));
  const newValue = typeof value === "bigint" ? `${value.toString()}n` : value;
  try {
    return JSON.stringify(newValue, name);
  } catch (e) {
    return `unable to stringify`;
  }
};
function multiSortBy(arr, accessors = [(d) => d]) {
  return arr.map((d, i) => [d, i]).sort(([a, ai], [b, bi]) => {
    for (const accessor of accessors) {
      const ao = accessor(a);
      const bo = accessor(b);
      if (typeof ao === "undefined") {
        if (typeof bo === "undefined") {
          continue;
        }
        return 1;
      }
      if (ao === bo) {
        continue;
      }
      return ao > bo ? 1 : -1;
    }
    return ai - bi;
  }).map(([d]) => d);
}
exports.displayValue = displayValue;
exports.getRouteStatusColor = getRouteStatusColor;
exports.getStatusColor = getStatusColor;
exports.isServer = isServer;
exports.multiSortBy = multiSortBy;
exports.useIsMounted = useIsMounted;
//# sourceMappingURL=utils.cjs.map
