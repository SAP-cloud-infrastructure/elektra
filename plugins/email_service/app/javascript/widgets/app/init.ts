// @ts-expect-error - lib/widget doesn't have TypeScript types
import { createWidget } from "lib/widget"
import App from "./App"

createWidget({ pluginName: "email_service", widgetName: "app" }).then((widget) => {
  widget.setPolicy()
  widget.render(App)
})
