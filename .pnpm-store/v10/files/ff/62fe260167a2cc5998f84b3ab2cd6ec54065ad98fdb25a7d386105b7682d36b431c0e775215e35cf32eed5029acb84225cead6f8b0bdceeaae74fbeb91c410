"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const web = require("solid-js/web");
const useStyles = require("./useStyles.cjs");
var _tmpl$ = /* @__PURE__ */ web.template(`<button type=button>➔`);
function NavigateButton({
  to,
  params,
  search,
  router
}) {
  const styles = useStyles.useStyles();
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
    web.setAttribute(_el$, "title", `Navigate to ${to}`);
    web.effect(() => web.className(_el$, styles().navigateButton));
    return _el$;
  })();
}
web.delegateEvents(["click"]);
exports.NavigateButton = NavigateButton;
//# sourceMappingURL=NavigateButton.cjs.map
