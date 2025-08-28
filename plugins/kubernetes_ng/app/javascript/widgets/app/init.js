import { createWidget } from "lib/widget"
import App from "./components/Application"

createWidget({ pluginName: "kubernetes_ng", widgetName: "app" }).then(
  (widget) => {
    widget.setPolicy()
    widget.render(App)
  }
)
