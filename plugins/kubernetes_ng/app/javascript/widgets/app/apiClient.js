import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"

const baseURL = widgetBasePath("kubernetes_ng")
export default createAjaxHelper({ baseURL })
