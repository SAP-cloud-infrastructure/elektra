"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const web = require("solid-js/web");
const clsx = require("clsx");
const useStyles = require("./useStyles.cjs");
var _tmpl$ = /* @__PURE__ */ web.template(`<div><div></div><div>/</div><div></div><div>/</div><div>`);
function formatTime(ms) {
  const units = ["s", "min", "h", "d"];
  const values = [ms / 1e3, ms / 6e4, ms / 36e5, ms / 864e5];
  let chosenUnitIndex = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < 1) break;
    chosenUnitIndex = i;
  }
  const formatter = new Intl.NumberFormat(navigator.language, {
    compactDisplay: "short",
    notation: "compact",
    maximumFractionDigits: 0
  });
  return formatter.format(values[chosenUnitIndex]) + units[chosenUnitIndex];
}
function AgeTicker({
  match,
  router
}) {
  const styles = useStyles.useStyles();
  if (!match) {
    return null;
  }
  const route = router().looseRoutesById[match.routeId];
  if (!route.options.loader) {
    return null;
  }
  const age = Date.now() - match.updatedAt;
  const staleTime = route.options.staleTime ?? router().options.defaultStaleTime ?? 0;
  const gcTime = route.options.gcTime ?? router().options.defaultGcTime ?? 30 * 60 * 1e3;
  return (() => {
    var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling, _el$5 = _el$4.nextSibling, _el$6 = _el$5.nextSibling;
    web.insert(_el$2, () => formatTime(age));
    web.insert(_el$4, () => formatTime(staleTime));
    web.insert(_el$6, () => formatTime(gcTime));
    web.effect(() => web.className(_el$, clsx.clsx(styles().ageTicker(age > staleTime))));
    return _el$;
  })();
}
exports.AgeTicker = AgeTicker;
//# sourceMappingURL=AgeTicker.cjs.map
