"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const routerDevtoolsCore = require("@tanstack/router-devtools-core");
const react = require("react");
const reactRouter = require("@tanstack/react-router");
function TanStackRouterDevtools(props) {
  const {
    initialIsOpen,
    panelProps,
    closeButtonProps,
    toggleButtonProps,
    position,
    containerElement,
    shadowDOMTarget,
    router: propsRouter
  } = props;
  const hookRouter = reactRouter.useRouter({ warn: false });
  const activeRouter = propsRouter ?? hookRouter;
  const activeRouterState = reactRouter.useRouterState({ router: activeRouter });
  const devToolRef = react.useRef(null);
  const [devtools] = react.useState(
    () => new routerDevtoolsCore.TanStackRouterDevtoolsCore({
      initialIsOpen,
      panelProps,
      closeButtonProps,
      toggleButtonProps,
      position,
      containerElement,
      shadowDOMTarget,
      router: activeRouter,
      routerState: activeRouterState
    })
  );
  react.useEffect(() => {
    devtools.setRouter(activeRouter);
  }, [devtools, activeRouter]);
  react.useEffect(() => {
    devtools.setRouterState(activeRouterState);
  }, [devtools, activeRouterState]);
  react.useEffect(() => {
    devtools.setOptions({
      initialIsOpen,
      panelProps,
      closeButtonProps,
      toggleButtonProps,
      position,
      containerElement,
      shadowDOMTarget
    });
  }, [
    devtools,
    initialIsOpen,
    panelProps,
    closeButtonProps,
    toggleButtonProps,
    position,
    containerElement,
    shadowDOMTarget
  ]);
  react.useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current);
    }
    return () => {
      devtools.unmount();
    };
  }, [devtools]);
  return /* @__PURE__ */ jsxRuntime.jsx(react.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx("div", { ref: devToolRef }) });
}
exports.TanStackRouterDevtools = TanStackRouterDevtools;
//# sourceMappingURL=TanStackRouterDevtools.cjs.map
