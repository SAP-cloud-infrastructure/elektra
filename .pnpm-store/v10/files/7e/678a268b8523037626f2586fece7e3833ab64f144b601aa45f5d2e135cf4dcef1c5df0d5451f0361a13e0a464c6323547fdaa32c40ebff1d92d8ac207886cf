import { jsx } from "react/jsx-runtime";
import { TanStackRouterDevtoolsCore } from "@tanstack/router-devtools-core";
import { useRef, useState, useEffect, Fragment } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
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
  const hookRouter = useRouter({ warn: false });
  const activeRouter = propsRouter ?? hookRouter;
  const activeRouterState = useRouterState({ router: activeRouter });
  const devToolRef = useRef(null);
  const [devtools] = useState(
    () => new TanStackRouterDevtoolsCore({
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
  useEffect(() => {
    devtools.setRouter(activeRouter);
  }, [devtools, activeRouter]);
  useEffect(() => {
    devtools.setRouterState(activeRouterState);
  }, [devtools, activeRouterState]);
  useEffect(() => {
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
  useEffect(() => {
    if (devToolRef.current) {
      devtools.mount(devToolRef.current);
    }
    return () => {
      devtools.unmount();
    };
  }, [devtools]);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { ref: devToolRef }) });
}
export {
  TanStackRouterDevtools
};
//# sourceMappingURL=TanStackRouterDevtools.js.map
