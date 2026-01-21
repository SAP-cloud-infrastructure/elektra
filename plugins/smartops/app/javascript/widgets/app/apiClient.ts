import { createAjaxHelper } from "lib/ajax_helper"
import { widgetBasePath } from "lib/widget"

const baseURL = widgetBasePath("smartops") + "/api/"

export const apiClient = createAjaxHelper({ baseURL })

export type ApiClient = ReturnType<typeof createAjaxHelper>
