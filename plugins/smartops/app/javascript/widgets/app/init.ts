import { createWidget } from "lib/widget"
import { App } from "./App"

createWidget({ pluginName: "smartops", widgetName: "app" }).then((widget) => {
  widget.setPolicy()
  widget.render(App)
})
