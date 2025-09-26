declare module "lib/ajax_helper" {
  type RequestOptions = RequestInit & { params?: Record<string, string> }

  export interface AjaxHelper {
    url(path: string, options?: RequestOptions): string

    head<T = unknown>(path: string, options?: RequestOptions): Promise<T>
    get<T = unknown>(path: string, options?: RequestOptions): Promise<T>
    put<T = unknown>(path: string, values?: unknown, options?: RequestOptions): Promise<T>
    post<T = unknown>(path: string, values?: unknown, options?: RequestOptions): Promise<T>
    patch<T = unknown>(path: string, values?: unknown, options?: RequestOptions): Promise<T>
    copy<T = unknown>(path: string, options?: RequestOptions): Promise<T>
    delete<T = unknown>(path: string, options?: RequestOptions): Promise<T>
  }

  export function createAjaxHelper(config: Record<string, unknown>): AjaxHelper
}

interface Widget {
  setPolicy: () => void
  render: (component: (unknown) => unknown) => void
  config?: {
    scriptParams?: Record<string, string>
  }
}
declare module "lib/widget" {
  function widgetBasePath(widgetName: string): string
  function createWidget(options: { pluginName: string; widgetName: string }): Promise<Widget>
  export { widgetBasePath, createWidget }
}
