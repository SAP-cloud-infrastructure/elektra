import { createWidget } from "lib/widget"
import { setApiClient, setServiceName, setServiceEndpoint } from "./lib/apiClient"
import { createAjaxHelper } from "lib/ajax_helper"
import App from "./App"

createWidget({ pluginName: "object_storage", widgetName: "app" }).then((widget) => {
  const baseURL = widget.config.scriptParams.baseName
  // split baseURL by "/" ignoring the trailing slash
  const parts = baseURL.split("/").filter((part) => part)
  const [domain, project, plugin, serviceName] = parts
  const ajaxHelper = createAjaxHelper({
    //baseURL: widget.config.scriptParams.baseName,
    baseURL: `/${domain}/${project}/${plugin}`,
  })
  setApiClient(ajaxHelper)
  setServiceName(serviceName)
  setServiceEndpoint(widget.config.scriptParams.serviceEndpoint)
  widget.setPolicy()
  widget.render(App, { serviceName: serviceName })
})
