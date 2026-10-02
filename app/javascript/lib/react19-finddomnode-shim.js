// React 19 removed ReactDOM.findDOMNode, which legacy libraries such as
// react-bootstrap@0.33 (via react-overlays@0.9.3) still call. This shim
// reattaches a findDOMNode implementation so those libraries keep working
// until they are upgraded.
//
// It must be imported before any code that relies on findDOMNode runs
// (i.e. at the very top of the app bootstrap and in the test setup).

// Minimal fiber-based implementation compatible with React 19.
// A component instance exposes its fiber via the internal
// `_reactInternals` property; a DOM node is returned as-is.
function findHostNode(fiber) {
  let node = fiber
  while (node) {
    // HostComponent (5) or HostText (6) — the node.stateNode is a real DOM node
    if (node.tag === 5 || node.tag === 6) {
      return node.stateNode
    }
    node = node.child
  }
  return null
}

function findDOMNodePolyfill(componentOrElement) {
  if (componentOrElement == null) {
    return null
  }

  // Already a DOM node
  if (componentOrElement.nodeType === 1 || componentOrElement.nodeType === 3) {
    return componentOrElement
  }

  // Class component instance — walk its fiber tree to the first host node
  const fiber =
    componentOrElement._reactInternals || componentOrElement._reactInternalFiber
  if (fiber) {
    return findHostNode(fiber)
  }

  return null
}

// Patch the react-dom module object. We use require() (not an ESM import) so
// the binding is writable — ESM namespace imports are read-only and esbuild
// rejects assignment to them.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
  const ReactDOM = require("react-dom")
  const target = ReactDOM && ReactDOM.default ? ReactDOM.default : ReactDOM
  if (target && typeof target.findDOMNode !== "function") {
    target.findDOMNode = findDOMNodePolyfill
  }
} catch {
  // best-effort; nothing else we can safely do
}

export default findDOMNodePolyfill
