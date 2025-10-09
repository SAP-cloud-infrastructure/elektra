"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");
const Asset = require("./Asset.cjs");
const useRouter = require("./useRouter.cjs");
const useRouterState = require("./useRouterState.cjs");
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
const useTags = () => {
  const router = useRouter.useRouter();
  const routeMeta = useRouterState.useRouterState({
    select: (state) => {
      return state.matches.map((match) => match.meta).filter(Boolean);
    }
  });
  const meta = React__namespace.useMemo(() => {
    const resultMeta = [];
    const metaByAttribute = {};
    let title;
    for (let i = routeMeta.length - 1; i >= 0; i--) {
      const metas = routeMeta[i];
      for (let j = metas.length - 1; j >= 0; j--) {
        const m = metas[j];
        if (!m) continue;
        if (m.title) {
          if (!title) {
            title = {
              tag: "title",
              children: m.title
            };
          }
        } else {
          const attribute = m.name ?? m.property;
          if (attribute) {
            if (metaByAttribute[attribute]) {
              continue;
            } else {
              metaByAttribute[attribute] = true;
            }
          }
          resultMeta.push({
            tag: "meta",
            attrs: {
              ...m
            }
          });
        }
      }
    }
    if (title) {
      resultMeta.push(title);
    }
    resultMeta.reverse();
    return resultMeta;
  }, [routeMeta]);
  const links = useRouterState.useRouterState({
    select: (state) => {
      var _a;
      const constructed = state.matches.map((match) => match.links).filter(Boolean).flat(1).map((link) => ({
        tag: "link",
        attrs: {
          ...link
        }
      }));
      const manifest = (_a = router.ssr) == null ? void 0 : _a.manifest;
      const assets = state.matches.map((match) => {
        var _a2;
        return ((_a2 = manifest == null ? void 0 : manifest.routes[match.routeId]) == null ? void 0 : _a2.assets) ?? [];
      }).filter(Boolean).flat(1).filter((asset) => asset.tag === "link").map(
        (asset) => ({
          tag: "link",
          attrs: {
            ...asset.attrs,
            suppressHydrationWarning: true
          }
        })
      );
      return [...constructed, ...assets];
    },
    structuralSharing: true
  });
  const preloadMeta = useRouterState.useRouterState({
    select: (state) => {
      const preloadMeta2 = [];
      state.matches.map((match) => router.looseRoutesById[match.routeId]).forEach(
        (route) => {
          var _a, _b, _c, _d;
          return (_d = (_c = (_b = (_a = router.ssr) == null ? void 0 : _a.manifest) == null ? void 0 : _b.routes[route.id]) == null ? void 0 : _c.preloads) == null ? void 0 : _d.filter(Boolean).forEach((preload) => {
            preloadMeta2.push({
              tag: "link",
              attrs: {
                rel: "modulepreload",
                href: preload
              }
            });
          });
        }
      );
      return preloadMeta2;
    },
    structuralSharing: true
  });
  const styles = useRouterState.useRouterState({
    select: (state) => state.matches.map((match) => match.styles).flat(1).filter(Boolean).map(({ children, ...attrs }) => ({
      tag: "style",
      attrs,
      children
    })),
    structuralSharing: true
  });
  const headScripts = useRouterState.useRouterState({
    select: (state) => state.matches.map((match) => match.headScripts).flat(1).filter(Boolean).map(({ children, ...script }) => ({
      tag: "script",
      attrs: {
        ...script
      },
      children
    })),
    structuralSharing: true
  });
  return uniqBy(
    [
      ...meta,
      ...preloadMeta,
      ...links,
      ...styles,
      ...headScripts
    ],
    (d) => {
      return JSON.stringify(d);
    }
  );
};
function HeadContent() {
  const tags = useTags();
  return tags.map((tag) => /* @__PURE__ */ React.createElement(Asset.Asset, { ...tag, key: `tsr-meta-${JSON.stringify(tag)}` }));
}
function uniqBy(arr, fn) {
  const seen = /* @__PURE__ */ new Set();
  return arr.filter((item) => {
    const key = fn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
exports.HeadContent = HeadContent;
exports.useTags = useTags;
//# sourceMappingURL=HeadContent.cjs.map
