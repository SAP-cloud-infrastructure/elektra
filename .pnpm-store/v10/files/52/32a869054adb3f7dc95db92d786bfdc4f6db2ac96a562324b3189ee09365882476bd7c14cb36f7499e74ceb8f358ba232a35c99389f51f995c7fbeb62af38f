"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const Asset = require("./Asset.cjs");
const useRouterState = require("./useRouterState.cjs");
const useRouter = require("./useRouter.cjs");
const Scripts = () => {
  const router = useRouter.useRouter();
  const assetScripts = useRouterState.useRouterState({
    select: (state) => {
      var _a;
      const assetScripts2 = [];
      const manifest = (_a = router.ssr) == null ? void 0 : _a.manifest;
      if (!manifest) {
        return [];
      }
      state.matches.map((match) => router.looseRoutesById[match.routeId]).forEach(
        (route) => {
          var _a2, _b;
          return (_b = (_a2 = manifest.routes[route.id]) == null ? void 0 : _a2.assets) == null ? void 0 : _b.filter((d) => d.tag === "script").forEach((asset) => {
            assetScripts2.push({
              tag: "script",
              attrs: asset.attrs,
              children: asset.children
            });
          });
        }
      );
      return assetScripts2;
    },
    structuralSharing: true
  });
  const { scripts } = useRouterState.useRouterState({
    select: (state) => ({
      scripts: state.matches.map((match) => match.scripts).flat(1).filter(Boolean).map(({ children, ...script }) => ({
        tag: "script",
        attrs: {
          ...script,
          suppressHydrationWarning: true
        },
        children
      }))
    }),
    structuralSharing: true
  });
  const allScripts = [...scripts, ...assetScripts];
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: allScripts.map((asset, i) => /* @__PURE__ */ React.createElement(Asset.Asset, { ...asset, key: `tsr-scripts-${asset.tag}-${i}` })) });
};
exports.Scripts = Scripts;
//# sourceMappingURL=Scripts.cjs.map
