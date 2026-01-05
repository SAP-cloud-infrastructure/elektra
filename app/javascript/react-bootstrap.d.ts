declare module "react-bootstrap" {
  export const Button: any
  export const Modal: any
  export const Form: any
  export const Nav: any
  export const Navbar: any
  // Add other components you use
}

declare module "react-bootstrap/lib/*" {
  const content: any
  export = content
}
