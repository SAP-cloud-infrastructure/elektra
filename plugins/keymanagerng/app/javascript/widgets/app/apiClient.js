import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"

const baseURL = widgetBasePath("keymanager")
export default createAjaxHelper({ baseURL })
