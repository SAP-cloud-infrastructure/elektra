import { KnownIcons } from "@cloudoperators/juno-ui-components/index"

type Crumb = {
  label: string
  icon?: KnownIcons
}

export type LoaderWithCrumb = {
  crumb: Crumb
}
