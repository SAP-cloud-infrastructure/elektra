import { jsx, Fragment } from "react/jsx-runtime";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanelCore } from "@tanstack/router-devtools-core";
import { useRef, useState, useEffect } from "react";
const TanStackRouterDevtoolsPanel = (props) => {
  const { router: propsRouter, ...rest } = props;
  const hookRouter = useRouter({ warn: false });
  const activeRouter = propsRouter ?? hookRouter;
  const activeRouterState = useRouterState({ router: activeRouter });
  const devToolRef = useRef(null);
  const [devtools] = useState(
    () => new TanStackRouterDevtoolsPanelCore({
      ...rest,
      router: activeRouter,
      routerState: activeRouterState
    })
  );
  useEffect(() => {
    devtools.setRouter(activeRouter);
  }, [devtools, activeRouter]);
  useEffect(() => {
    devtools.setRouterState(activeRouterState);
  }, [devtools, activeRouterState]);
  useEffect(() => {
    devtools.setOptions({
      className: props.className,
      style: props.style,
      shadowDOMTarget: props.shadowDOMTarget
    });
  }, [devtools, props.className, props.style, props.shadowDOMTarget]);
  useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current);
    }
    return () => {
      devtools.unmount();
    };
  }, [devtools]);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { ref: devToolRef }) });
};
export {
  TanStackRouterDevtoolsPanel
};
//# sourceMappingURL=TanStackRouterDevtoolsPanel.js.map
