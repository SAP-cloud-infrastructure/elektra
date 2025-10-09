import { crossSerializeStream, getCrossReferenceHeader } from "seroval";
import { ReadableStreamPlugin } from "seroval-plugins/web";
import invariant from "tiny-invariant";
import { createControlledPromise } from "../utils.js";
import minifiedTsrBootStrapScript from "./tsrScript.js";
import { ShallowErrorPlugin } from "./seroval-plugins.js";
const GLOBAL_TSR = "$_TSR";
const SCOPE_ID = "tsr";
function dehydrateMatch(match) {
  const dehydratedMatch = {
    i: match.id,
    u: match.updatedAt,
    s: match.status
  };
  const properties = [
    ["__beforeLoadContext", "b"],
    ["loaderData", "l"],
    ["error", "e"],
    ["ssr", "ssr"]
  ];
  for (const [key, shorthand] of properties) {
    if (match[key] !== void 0) {
      dehydratedMatch[shorthand] = match[key];
    }
  }
  return dehydratedMatch;
}
function attachRouterServerSsrUtils(router, manifest) {
  router.ssr = {
    manifest
  };
  const serializationRefs = /* @__PURE__ */ new Map();
  let initialScriptSent = false;
  const getInitialScript = () => {
    if (initialScriptSent) {
      return "";
    }
    initialScriptSent = true;
    return `${getCrossReferenceHeader(SCOPE_ID)};${minifiedTsrBootStrapScript};`;
  };
  let _dehydrated = false;
  const listeners = [];
  router.serverSsr = {
    injectedHtml: [],
    injectHtml: (getHtml) => {
      const promise = Promise.resolve().then(getHtml);
      router.serverSsr.injectedHtml.push(promise);
      router.emit({
        type: "onInjectedHtml",
        promise
      });
      return promise.then(() => {
      });
    },
    injectScript: (getScript) => {
      return router.serverSsr.injectHtml(async () => {
        const script = await getScript();
        return `<script class='$tsr'>${getInitialScript()}${script};if (typeof $_TSR !== 'undefined') $_TSR.c()<\/script>`;
      });
    },
    dehydrate: async () => {
      var _a, _b, _c;
      invariant(!_dehydrated, "router is already dehydrated!");
      let matchesToDehydrate = router.state.matches;
      if (router.isShell()) {
        matchesToDehydrate = matchesToDehydrate.slice(0, 1);
      }
      const matches = matchesToDehydrate.map(dehydrateMatch);
      const dehydratedRouter = {
        manifest: router.ssr.manifest,
        matches
      };
      const lastMatchId = (_a = matchesToDehydrate[matchesToDehydrate.length - 1]) == null ? void 0 : _a.id;
      if (lastMatchId) {
        dehydratedRouter.lastMatchId = lastMatchId;
      }
      dehydratedRouter.dehydratedData = await ((_c = (_b = router.options).dehydrate) == null ? void 0 : _c.call(_b));
      _dehydrated = true;
      const p = createControlledPromise();
      crossSerializeStream(dehydratedRouter, {
        refs: serializationRefs,
        // TODO make plugins configurable
        plugins: [ReadableStreamPlugin, ShallowErrorPlugin],
        onSerialize: (data, initial) => {
          const serialized = initial ? `${GLOBAL_TSR}["router"]=` + data : data;
          router.serverSsr.injectScript(() => serialized);
        },
        scopeId: SCOPE_ID,
        onDone: () => p.resolve(""),
        onError: (err) => p.reject(err)
      });
      router.serverSsr.injectHtml(() => p);
    },
    isDehydrated() {
      return _dehydrated;
    },
    onRenderFinished: (listener) => listeners.push(listener),
    setRenderFinished: () => {
      listeners.forEach((l) => l());
    }
  };
}
export {
  GLOBAL_TSR,
  attachRouterServerSsrUtils,
  dehydrateMatch
};
//# sourceMappingURL=ssr-server.js.map
