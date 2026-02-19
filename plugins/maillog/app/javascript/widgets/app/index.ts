import { createRoot } from "react-dom/client"
import React from "react"
import { Root } from "react-dom/client"

interface MountOptions {
  props?: Record<string, unknown>
}

interface MountFunction {
  (container: HTMLElement, options?: MountOptions): void
  root?: Root
}

// export mount and unmount functions
export const mount: MountFunction = (container, options = {}) => {
  import("./App").then((App) => {
    mount.root = createRoot(container)
    mount.root.render(React.createElement(App.default, options?.props))
  })
}

export const unmount = () => mount.root && mount.root.unmount()
