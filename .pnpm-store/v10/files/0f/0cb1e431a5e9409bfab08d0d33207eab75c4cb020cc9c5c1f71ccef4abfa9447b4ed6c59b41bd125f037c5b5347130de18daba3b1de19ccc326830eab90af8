import { jsx, Fragment } from "react/jsx-runtime";
import { createElement } from "react";
import { Asset } from "./Asset.js";
import { useRouterState } from "./useRouterState.js";
import { useRouter } from "./useRouter.js";
const Scripts = () => {
  const router = useRouter();
  const assetScripts = useRouterState({
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
  const { scripts } = useRouterState({
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
  return /* @__PURE__ */ jsx(Fragment, { children: allScripts.map((asset, i) => /* @__PURE__ */ createElement(Asset, { ...asset, key: `tsr-scripts-${asset.tag}-${i}` })) });
};
export {
  Scripts
};
//# sourceMappingURL=Scripts.js.map
