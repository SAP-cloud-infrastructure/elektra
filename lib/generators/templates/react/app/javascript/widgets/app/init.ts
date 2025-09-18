import { createWidget } from "lib/widget"
import { App } from "./App"

createWidget({ pluginName: "%{PLUGIN_NAME}", widgetName: "app" }).then((widget) => {
  widget.setPolicy()
  widget.render(App)
})
