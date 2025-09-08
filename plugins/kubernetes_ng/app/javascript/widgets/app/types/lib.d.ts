declare module "lib/ajax_helper" {
  const createAjaxHelper: any
  export { createAjaxHelper }
}

declare module "lib/widget" {
  function widgetBasePath(widgetName: string): string
  export { widgetBasePath }
}
