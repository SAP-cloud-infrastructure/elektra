import { jsx } from "react/jsx-runtime";
import { defaultGetScrollRestorationKey, restoreScroll, storageKey } from "@tanstack/router-core";
import { useRouter } from "./useRouter.js";
import { ScriptOnce } from "./ScriptOnce.js";
function ScrollRestoration() {
  const router = useRouter();
  const getKey = router.options.getScrollRestorationKey || defaultGetScrollRestorationKey;
  const userKey = getKey(router.latestLocation);
  const resolvedKey = userKey !== defaultGetScrollRestorationKey(router.latestLocation) ? userKey : void 0;
  if (!router.isScrollRestoring || !router.isServer) {
    return null;
  }
  const restoreScrollOptions = {
    storageKey,
    shouldScrollRestoration: true
  };
  if (resolvedKey) {
    restoreScrollOptions.key = resolvedKey;
  }
  return /* @__PURE__ */ jsx(
    ScriptOnce,
    {
      children: `(${restoreScroll.toString()})(${JSON.stringify(restoreScrollOptions)})`
    }
  );
}
export {
  ScrollRestoration
};
//# sourceMappingURL=scroll-restoration.js.map
