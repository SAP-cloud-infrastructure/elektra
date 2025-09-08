declare module "*.scss" {
  const classes: Record<string, string>
  export default classes
}

declare module "*.scss?inline" {
  const content: string
  export default content
}
