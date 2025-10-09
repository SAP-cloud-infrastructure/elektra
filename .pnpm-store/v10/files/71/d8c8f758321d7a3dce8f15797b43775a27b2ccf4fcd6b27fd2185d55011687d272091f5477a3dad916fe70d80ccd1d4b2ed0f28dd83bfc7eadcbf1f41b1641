import { jsx } from "react/jsx-runtime";
function ScriptOnce({
  children
}) {
  if (typeof document !== "undefined") {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "script",
    {
      className: "$tsr",
      dangerouslySetInnerHTML: {
        __html: [children].filter(Boolean).join("\n")
      }
    }
  );
}
export {
  ScriptOnce
};
//# sourceMappingURL=ScriptOnce.js.map
