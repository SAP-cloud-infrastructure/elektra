"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const routerCore = require("@tanstack/router-core");
const useRouter = require("./useRouter.cjs");
const ScriptOnce = require("./ScriptOnce.cjs");
function ScrollRestoration() {
  const router = useRouter.useRouter();
  const getKey = router.options.getScrollRestorationKey || routerCore.defaultGetScrollRestorationKey;
  const userKey = getKey(router.latestLocation);
  const resolvedKey = userKey !== routerCore.defaultGetScrollRestorationKey(router.latestLocation) ? userKey : void 0;
  if (!router.isScrollRestoring || !router.isServer) {
    return null;
  }
  const restoreScrollOptions = {
    storageKey: routerCore.storageKey,
    shouldScrollRestoration: true
  };
  if (resolvedKey) {
    restoreScrollOptions.key = resolvedKey;
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
    ScriptOnce.ScriptOnce,
    {
      children: `(${routerCore.restoreScroll.toString()})(${JSON.stringify(restoreScrollOptions)})`
    }
  );
}
exports.ScrollRestoration = ScrollRestoration;
//# sourceMappingURL=scroll-restoration.cjs.map
