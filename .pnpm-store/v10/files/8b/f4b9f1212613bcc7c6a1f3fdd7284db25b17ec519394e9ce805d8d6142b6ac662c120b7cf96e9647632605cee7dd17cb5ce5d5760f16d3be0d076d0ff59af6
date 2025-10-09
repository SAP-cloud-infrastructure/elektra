"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
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
function Asset({
  tag,
  attrs,
  children
}) {
  switch (tag) {
    case "title":
      return /* @__PURE__ */ jsxRuntime.jsx("title", { ...attrs, suppressHydrationWarning: true, children });
    case "meta":
      return /* @__PURE__ */ jsxRuntime.jsx("meta", { ...attrs, suppressHydrationWarning: true });
    case "link":
      return /* @__PURE__ */ jsxRuntime.jsx("link", { ...attrs, suppressHydrationWarning: true });
    case "style":
      return /* @__PURE__ */ jsxRuntime.jsx(
        "style",
        {
          ...attrs,
          dangerouslySetInnerHTML: { __html: children }
        }
      );
    case "script":
      return /* @__PURE__ */ jsxRuntime.jsx(Script, { attrs, children });
    default:
      return null;
  }
}
function Script({
  attrs,
  children
}) {
  React__namespace.useEffect(() => {
    if (attrs == null ? void 0 : attrs.src) {
      const script = document.createElement("script");
      for (const [key, value] of Object.entries(attrs)) {
        if (key !== "suppressHydrationWarning" && value !== void 0 && value !== false) {
          script.setAttribute(
            key,
            typeof value === "boolean" ? "" : String(value)
          );
        }
      }
      document.head.appendChild(script);
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
    if (typeof children === "string") {
      const script = document.createElement("script");
      script.textContent = children;
      if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
          if (key !== "suppressHydrationWarning" && value !== void 0 && value !== false) {
            script.setAttribute(
              key,
              typeof value === "boolean" ? "" : String(value)
            );
          }
        }
      }
      document.head.appendChild(script);
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
    return void 0;
  }, [attrs, children]);
  if ((attrs == null ? void 0 : attrs.src) && typeof attrs.src === "string") {
    return /* @__PURE__ */ jsxRuntime.jsx("script", { ...attrs, suppressHydrationWarning: true });
  }
  if (typeof children === "string") {
    return /* @__PURE__ */ jsxRuntime.jsx(
      "script",
      {
        ...attrs,
        dangerouslySetInnerHTML: { __html: children },
        suppressHydrationWarning: true
      }
    );
  }
  return null;
}
exports.Asset = Asset;
//# sourceMappingURL=Asset.cjs.map
