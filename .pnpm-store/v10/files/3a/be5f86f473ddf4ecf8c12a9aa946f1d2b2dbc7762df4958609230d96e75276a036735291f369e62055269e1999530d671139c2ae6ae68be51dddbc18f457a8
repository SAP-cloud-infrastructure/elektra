"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const reactRouter = require("@tanstack/react-router");
const routerDevtoolsCore = require("@tanstack/router-devtools-core");
const react = require("react");
const TanStackRouterDevtoolsPanel = (props) => {
  const { router: propsRouter, ...rest } = props;
  const hookRouter = reactRouter.useRouter({ warn: false });
  const activeRouter = propsRouter ?? hookRouter;
  const activeRouterState = reactRouter.useRouterState({ router: activeRouter });
  const devToolRef = react.useRef(null);
  const [devtools] = react.useState(
    () => new routerDevtoolsCore.TanStackRouterDevtoolsPanelCore({
      ...rest,
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
      className: props.className,
      style: props.style,
      shadowDOMTarget: props.shadowDOMTarget
    });
  }, [devtools, props.className, props.style, props.shadowDOMTarget]);
  react.useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current);
    }
    return () => {
      devtools.unmount();
    };
  }, [devtools]);
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx("div", { ref: devToolRef }) });
};
exports.TanStackRouterDevtoolsPanel = TanStackRouterDevtoolsPanel;
//# sourceMappingURL=TanStackRouterDevtoolsPanel.cjs.map
