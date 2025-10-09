"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const solidJs = require("solid-js");
const ShadowDomTargetContext = solidJs.createContext(
  void 0
);
const DevtoolsOnCloseContext = solidJs.createContext(void 0);
const useDevtoolsOnClose = () => {
  const context = solidJs.useContext(DevtoolsOnCloseContext);
  if (!context) {
    throw new Error(
      "useDevtoolsOnClose must be used within a TanStackRouterDevtools component"
    );
  }
  return context;
};
exports.DevtoolsOnCloseContext = DevtoolsOnCloseContext;
exports.ShadowDomTargetContext = ShadowDomTargetContext;
exports.useDevtoolsOnClose = useDevtoolsOnClose;
//# sourceMappingURL=context.cjs.map
