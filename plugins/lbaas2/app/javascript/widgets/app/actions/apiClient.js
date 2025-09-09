import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"

const baseURL = widgetBasePath("lbaas2")
export default createAjaxHelper({ baseURL })
