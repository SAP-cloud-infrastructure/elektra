import { template, setAttribute, effect, className, delegateEvents } from "solid-js/web";
import { useStyles } from "./useStyles.js";
var _tmpl$ = /* @__PURE__ */ template(`<button type=button>➔`);
function NavigateButton({
  to,
  params,
  search,
  router
}) {
  const styles = useStyles();
  return (() => {
    var _el$ = _tmpl$();
    _el$.$$click = (e) => {
      e.stopPropagation();
      router().navigate({
        to,
        params,
        search
      });
    };
    setAttribute(_el$, "title", `Navigate to ${to}`);
    effect(() => className(_el$, styles().navigateButton));
    return _el$;
  })();
}
delegateEvents(["click"]);
export {
  NavigateButton
};
//# sourceMappingURL=NavigateButton.js.map
