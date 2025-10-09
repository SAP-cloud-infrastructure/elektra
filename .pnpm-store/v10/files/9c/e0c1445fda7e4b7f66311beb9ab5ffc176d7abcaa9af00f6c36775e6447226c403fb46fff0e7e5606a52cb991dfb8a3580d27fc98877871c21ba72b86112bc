import { defaultGetScrollRestorationKey, getCssSelector, scrollRestorationCache, setupScrollRestoration } from "@tanstack/router-core";
import { useRouter } from "./useRouter.js";
function useScrollRestoration() {
  const router = useRouter();
  setupScrollRestoration(router, true);
}
function ScrollRestoration(_props) {
  useScrollRestoration();
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "The ScrollRestoration component is deprecated. Use createRouter's `scrollRestoration` option instead."
    );
  }
  return null;
}
function useElementScrollRestoration(options) {
  var _a, _b;
  useScrollRestoration();
  const router = useRouter();
  const getKey = options.getKey || defaultGetScrollRestorationKey;
  let elementSelector = "";
  if (options.id) {
    elementSelector = `[data-scroll-restoration-id="${options.id}"]`;
  } else {
    const element = (_a = options.getElement) == null ? void 0 : _a.call(options);
    if (!element) {
      return;
    }
    elementSelector = element instanceof Window ? "window" : getCssSelector(element);
  }
  const restoreKey = getKey(router.latestLocation);
  const byKey = (_b = scrollRestorationCache) == null ? void 0 : _b.state[restoreKey];
  return byKey == null ? void 0 : byKey[elementSelector];
}
export {
  ScrollRestoration,
  useElementScrollRestoration
};
//# sourceMappingURL=ScrollRestoration.js.map
