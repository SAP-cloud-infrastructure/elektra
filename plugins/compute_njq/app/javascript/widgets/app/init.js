import { createWidget } from "lib/widget"
import App from "./App"

createWidget({ pluginName: "compute_njq", widgetName: "app" }).then((widget) => {
  widget.setPolicy()
  widget.render(App)
})
