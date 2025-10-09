import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
function CatchBoundary(props) {
  const errorComponent = props.errorComponent ?? ErrorComponent;
  return /* @__PURE__ */ jsx(
    CatchBoundaryImpl,
    {
      getResetKey: props.getResetKey,
      onCatch: props.onCatch,
      children: ({ error, reset }) => {
        if (error) {
          return React.createElement(errorComponent, {
            error,
            reset
          });
        }
        return props.children;
      }
    }
  );
}
class CatchBoundaryImpl extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { error: null };
  }
  static getDerivedStateFromProps(props) {
    return { resetKey: props.getResetKey() };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  reset() {
    this.setState({ error: null });
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.error && prevState.resetKey !== this.state.resetKey) {
      this.reset();
    }
  }
  componentDidCatch(error, errorInfo) {
    if (this.props.onCatch) {
      this.props.onCatch(error, errorInfo);
    }
  }
  render() {
    return this.props.children({
      error: this.state.resetKey !== this.props.getResetKey() ? null : this.state.error,
      reset: () => {
        this.reset();
      }
    });
  }
}
function ErrorComponent({ error }) {
  const [show, setShow] = React.useState(process.env.NODE_ENV !== "production");
  return /* @__PURE__ */ jsxs("div", { style: { padding: ".5rem", maxWidth: "100%" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: ".5rem" }, children: [
      /* @__PURE__ */ jsx("strong", { style: { fontSize: "1rem" }, children: "Something went wrong!" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          style: {
            appearance: "none",
            fontSize: ".6em",
            border: "1px solid currentColor",
            padding: ".1rem .2rem",
            fontWeight: "bold",
            borderRadius: ".25rem"
          },
          onClick: () => setShow((d) => !d),
          children: show ? "Hide Error" : "Show Error"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { style: { height: ".25rem" } }),
    show ? /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
      "pre",
      {
        style: {
          fontSize: ".7em",
          border: "1px solid red",
          borderRadius: ".25rem",
          padding: ".3rem",
          color: "red",
          overflow: "auto"
        },
        children: error.message ? /* @__PURE__ */ jsx("code", { children: error.message }) : null
      }
    ) }) : null
  ] });
}
export {
  CatchBoundary,
  ErrorComponent
};
//# sourceMappingURL=CatchBoundary.js.map
