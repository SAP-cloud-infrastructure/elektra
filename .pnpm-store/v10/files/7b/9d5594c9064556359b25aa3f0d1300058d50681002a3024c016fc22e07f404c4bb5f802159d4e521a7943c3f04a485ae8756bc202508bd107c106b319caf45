import { createContext, useContext } from "solid-js";
const ShadowDomTargetContext = createContext(
  void 0
);
const DevtoolsOnCloseContext = createContext(void 0);
const useDevtoolsOnClose = () => {
  const context = useContext(DevtoolsOnCloseContext);
  if (!context) {
    throw new Error(
      "useDevtoolsOnClose must be used within a TanStackRouterDevtools component"
    );
  }
  return context;
};
export {
  DevtoolsOnCloseContext,
  ShadowDomTargetContext,
  useDevtoolsOnClose
};
//# sourceMappingURL=context.js.map
