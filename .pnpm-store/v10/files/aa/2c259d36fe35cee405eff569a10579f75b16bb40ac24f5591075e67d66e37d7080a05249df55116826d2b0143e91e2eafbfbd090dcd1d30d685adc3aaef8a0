import { template, insert, effect, className } from "solid-js/web";
import { clsx } from "clsx";
import { useStyles } from "./useStyles.js";
var _tmpl$ = /* @__PURE__ */ template(`<div><div></div><div>/</div><div></div><div>/</div><div>`);
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
  const styles = useStyles();
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
    insert(_el$2, () => formatTime(age));
    insert(_el$4, () => formatTime(staleTime));
    insert(_el$6, () => formatTime(gcTime));
    effect(() => className(_el$, clsx(styles().ageTicker(age > staleTime))));
    return _el$;
  })();
}
export {
  AgeTicker
};
//# sourceMappingURL=AgeTicker.js.map
