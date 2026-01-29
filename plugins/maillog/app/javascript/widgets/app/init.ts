// @ts-expect-error - lib/widget doesn't have TypeScript types
import { createWidget } from "lib/widget"
import App from "./App"

createWidget({ pluginName: "maillog", widgetName: "app" }).then((widget) => {
  console.log("Initializing Maillog App Widget")
  widget.setPolicy()
  widget.render(App)
})
